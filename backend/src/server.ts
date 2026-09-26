import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import mongoose, { Schema } from 'mongoose'
import { z } from 'zod'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET ?? 'development-only-change-me'
const cookieName = 'carely_token'
const isProduction = process.env.NODE_ENV === 'production'
const secureCookie = process.env.COOKIE_SECURE === 'true' || isProduction
const cookieSameSite = (process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') || (secureCookie ? 'none' : 'lax')

if (isProduction) {
  app.set('trust proxy', 1)
}

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://ai-medical-assistance-frontend.vercel.app',
]

const envOrigins = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

function isAllowedOrigin(origin: string): boolean {
  const clean = origin.replace(/\/$/, '')
  if (allowedOrigins.includes(clean)) return true
  if (/^https:\/\/([a-z0-9-]+)\.vercel\.app$/i.test(clean)) return true
  if (/^http:\/\/localhost(:\d+)?$/i.test(clean)) return true
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(clean)) return true
  return false
}

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }))

type Role = 'patient' | 'doctor' | 'admin'
type User = { id: string; name: string; email: string; password: string; role: Role; createdAt: Date }
type Appointment = { id: string; patientId: string; doctorId: string; date: string; slot: string; status: 'scheduled' | 'cancelled' | 'completed'; notes?: string }
type Reminder = { id: string; patientId: string; medicineName: string; dosage: string; schedule: string; active: boolean }
type MedicalRecord = { id: string; patientId: string; title: string; reportType: string; fileUrl?: string; summary?: string; uploadDate: Date }
type Prescription = { id: string; doctorId: string; doctorName: string; patientId: string; patientName: string; medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string; date: string; status: 'active' | 'completed' }
type Notification = { id: string; userId: string; title: string; message: string; type: 'appointment' | 'medication' | 'system'; read: boolean; createdAt: Date }

const UserModel = mongoose.model('User', new Schema({ name: String, email: { type: String, unique: true }, password: String, role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' } }, { timestamps: true }))
const AppointmentModel = mongoose.model('Appointment', new Schema({ patientId: Schema.Types.ObjectId, doctorId: Schema.Types.ObjectId, date: String, slot: String, status: String, notes: String }, { timestamps: true }))

const memory = {
  users: [] as User[],
  appointments: [] as Appointment[],
  reminders: [] as Reminder[],
  records: [] as MedicalRecord[],
  prescriptions: [] as Prescription[],
  notifications: [] as Notification[],
}

const id = () => new mongoose.Types.ObjectId().toString()
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next)

declare global {
  namespace Express { interface Request { user?: { id: string; role: Role } } }
}

function tokenFor(user: Pick<User, 'id' | 'role'>) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' })
}

function auth(requiredRoles?: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[cookieName]
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    try {
      const payload = jwt.verify(token, jwtSecret) as { sub: string; role: Role }
      if (requiredRoles && !requiredRoles.includes(payload.role)) return res.status(403).json({ message: 'Insufficient permissions' })
      req.user = { id: payload.sub, role: payload.role }
      next()
    } catch { return res.status(401).json({ message: 'Session expired' }) }
  }
}

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(8).max(72), role: z.enum(['patient', 'doctor', 'admin']).optional() })
const loginSchema = z.object({ email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(1) })
const appointmentSchema = z.object({ doctorId: z.string().min(1), date: z.string().min(1), slot: z.string().min(1), notes: z.string().max(500).optional() })
const reminderSchema = z.object({ medicineName: z.string().min(1).max(120), dosage: z.string().min(1).max(80), schedule: z.string().min(1).max(80) })
const prescriptionSchema = z.object({
  patientId: z.string().min(1),
  medicineName: z.string().min(1).max(120),
  dosage: z.string().min(1).max(80),
  frequency: z.string().min(1).max(80),
  duration: z.string().min(1).max(80),
  instructions: z.string().max(500).optional(),
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'carely-api', database: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory' }))

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body)
  const exists = memory.users.find(user => user.email === input.email)
  if (exists) return res.status(409).json({ message: 'An account with that email already exists' })
  const user: User = { id: id(), name: input.name, email: input.email, role: input.role || 'patient', password: await bcrypt.hash(input.password, 12), createdAt: new Date() }
  memory.users.push(user)
  
  // Create welcome notification
  memory.notifications.push({
    id: id(),
    userId: user.id,
    title: 'Welcome to Carely',
    message: 'Your account is ready. Explore our calm health tools, reminders, and appointments.',
    type: 'system',
    read: false,
    createdAt: new Date(),
  })

  res.cookie(cookieName, tokenFor(user), { httpOnly: true, sameSite: cookieSameSite, secure: secureCookie, maxAge: 7 * 24 * 60 * 60 * 1000 })
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body)
  const user = memory.users.find(item => item.email === input.email)
  if (!user || !(await bcrypt.compare(input.password, user.password))) return res.status(401).json({ message: 'Invalid email or password' })
  res.cookie(cookieName, tokenFor(user), { httpOnly: true, sameSite: cookieSameSite, secure: secureCookie, maxAge: 7 * 24 * 60 * 60 * 1000 })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}))

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(cookieName, { httpOnly: true, sameSite: cookieSameSite, secure: secureCookie })
  res.status(204).end()
})

app.get('/api/auth/me', auth(), (req, res) => {
  const user = memory.users.find(item => item.id === req.user!.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

app.get('/api/doctors', (_req, res) => res.json({ doctors: memory.users.filter(user => user.role === 'doctor').map(({ password, ...doctor }) => doctor) }))

app.get('/api/appointments', auth(), (req, res) => {
  const appointments = memory.appointments.filter(item => req.user!.role === 'doctor' ? item.doctorId === req.user!.id : item.patientId === req.user!.id)
  res.json({ appointments })
})

app.post('/api/appointments', auth(['patient']), (req, res) => {
  const input = appointmentSchema.parse(req.body)
  const appointment: Appointment = { id: id(), patientId: req.user!.id, ...input, status: 'scheduled' }
  memory.appointments.push(appointment)
  
  // Add notification to patient and doctor
  memory.notifications.push({
    id: id(),
    userId: req.user!.id,
    title: 'Appointment Requested',
    message: `Your visit for ${appointment.date} at ${appointment.slot} has been requested.`,
    type: 'appointment',
    read: false,
    createdAt: new Date(),
  })
  
  memory.notifications.push({
    id: id(),
    userId: appointment.doctorId,
    title: 'New Patient Booking',
    message: `A new consultation has been booked for ${appointment.date} at ${appointment.slot}.`,
    type: 'appointment',
    read: false,
    createdAt: new Date(),
  })

  res.status(201).json({ appointment })
})

app.patch('/api/appointments/:id/cancel', auth(), (req, res) => {
  const appointment = memory.appointments.find(item => item.id === req.params.id && (item.patientId === req.user!.id || item.doctorId === req.user!.id))
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
  appointment.status = 'cancelled'
  
  memory.notifications.push({
    id: id(),
    userId: appointment.patientId,
    title: 'Appointment Cancelled',
    message: `Your visit scheduled on ${appointment.date} at ${appointment.slot} has been cancelled.`,
    type: 'appointment',
    read: false,
    createdAt: new Date(),
  })

  res.json({ appointment })
})

app.get('/api/reminders', auth(['patient']), (req, res) => res.json({ reminders: memory.reminders.filter(item => item.patientId === req.user!.id) }))

app.post('/api/reminders', auth(['patient']), (req, res) => {
  const input = reminderSchema.parse(req.body)
  const reminder: Reminder = { id: id(), patientId: req.user!.id, ...input, active: true }
  memory.reminders.push(reminder)
  res.status(201).json({ reminder })
})

app.patch('/api/reminders/:id', auth(['patient']), (req, res) => {
  const reminder = memory.reminders.find(item => item.id === req.params.id && item.patientId === req.user!.id)
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' })
  reminder.active = Boolean(req.body.active)
  res.json({ reminder })
})

app.get('/api/records', auth(['patient', 'doctor']), (req, res) => {
  const records = req.user!.role === 'patient' ? memory.records.filter(item => item.patientId === req.user!.id) : memory.records
  res.json({ records })
})

app.post('/api/records', auth(['patient']), (req, res) => {
  const body = z.object({ title: z.string().min(1).max(120), reportType: z.string().min(1).max(80), fileUrl: z.string().url().optional() }).parse(req.body)
  const record: MedicalRecord = { id: id(), patientId: req.user!.id, ...body, uploadDate: new Date() }
  memory.records.push(record)
  res.status(201).json({ record })
})

// Prescriptions endpoints
app.get('/api/prescriptions', auth(), (req, res) => {
  const prescriptions = req.user!.role === 'patient'
    ? memory.prescriptions.filter(p => p.patientId === req.user!.id)
    : memory.prescriptions
  res.json({ prescriptions })
})

app.post('/api/prescriptions', auth(['doctor', 'admin']), (req, res) => {
  const input = prescriptionSchema.parse(req.body)
  const doctor = memory.users.find(u => u.id === req.user!.id)
  const patient = memory.users.find(u => u.id === input.patientId)
  if (!patient) return res.status(404).json({ message: 'Patient not found' })

  const prescription: Prescription = {
    id: id(),
    doctorId: req.user!.id,
    doctorName: doctor?.name || 'Dr. Carely',
    patientId: patient.id,
    patientName: patient.name,
    medicineName: input.medicineName,
    dosage: input.dosage,
    frequency: input.frequency,
    duration: input.duration,
    instructions: input.instructions,
    date: new Date().toISOString().split('T')[0],
    status: 'active',
  }
  memory.prescriptions.push(prescription)

  // Notify patient
  memory.notifications.push({
    id: id(),
    userId: patient.id,
    title: 'New Prescription Added',
    message: `${prescription.doctorName} prescribed ${prescription.medicineName} (${prescription.dosage}).`,
    type: 'medication',
    read: false,
    createdAt: new Date(),
  })

  res.status(201).json({ prescription })
})

app.patch('/api/prescriptions/:id', auth(['doctor', 'patient', 'admin']), (req, res) => {
  const prescription = memory.prescriptions.find(p => p.id === req.params.id)
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' })
  if (req.body.status && ['active', 'completed'].includes(req.body.status)) {
    prescription.status = req.body.status
  }
  res.json({ prescription })
})

// Patients directory endpoint (for doctors and admins)
app.get('/api/patients', auth(['doctor', 'admin']), (_req, res) => {
  const patients = memory.users
    .filter(u => u.role === 'patient')
    .map(p => {
      const patientAppointments = memory.appointments.filter(a => a.patientId === p.id)
      const patientRecords = memory.records.filter(r => r.patientId === p.id)
      const patientPrescriptions = memory.prescriptions.filter(pr => pr.patientId === p.id)
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        createdAt: p.createdAt,
        totalAppointments: patientAppointments.length,
        totalRecords: patientRecords.length,
        totalPrescriptions: patientPrescriptions.length,
        lastAppointment: patientAppointments[patientAppointments.length - 1]?.date || 'None',
      }
    })
  res.json({ patients })
})

// User management endpoints (Admin)
app.get('/api/users', auth(['admin']), (_req, res) => {
  const users = memory.users.map(({ password, ...u }) => u)
  res.json({ users })
})

app.patch('/api/users/:id/role', auth(['admin']), (req, res) => {
  const role = z.enum(['patient', 'doctor', 'admin']).parse(req.body.role)
  const user = memory.users.find(u => u.id === req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  user.role = role
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.delete('/api/users/:id', auth(['admin']), (req, res) => {
  const index = memory.users.findIndex(u => u.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'User not found' })
  if (memory.users[index].id === req.user!.id) {
    return res.status(400).json({ message: 'Cannot delete your own admin account' })
  }
  memory.users.splice(index, 1)
  res.status(204).end()
})

// Notifications endpoints
app.get('/api/notifications', auth(), (req, res) => {
  const userNotifications = memory.notifications
    .filter(n => n.userId === req.user!.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json({ notifications: userNotifications })
})

app.patch('/api/notifications/:id/read', auth(), (req, res) => {
  const notification = memory.notifications.find(n => n.id === req.params.id && n.userId === req.user!.id)
  if (!notification) return res.status(404).json({ message: 'Notification not found' })
  notification.read = true
  res.json({ notification })
})

app.patch('/api/notifications/read-all', auth(), (req, res) => {
  memory.notifications.forEach(n => {
    if (n.userId === req.user!.id) n.read = true
  })
  res.json({ success: true })
})

// Doctor specific dashboard stats
app.get('/api/doctor/stats', auth(['doctor', 'admin']), (req, res) => {
  const doctorId = req.user!.id
  const doctorAppointments = memory.appointments.filter(a => a.doctorId === doctorId)
  const uniquePatientIds = new Set(doctorAppointments.map(a => a.patientId))
  const doctorPrescriptions = memory.prescriptions.filter(p => p.doctorId === doctorId)
  const scheduledCount = doctorAppointments.filter(a => a.status === 'scheduled').length

  res.json({
    stats: {
      appointments: doctorAppointments.length,
      scheduledAppointments: scheduledCount,
      patientsCount: uniquePatientIds.size || memory.users.filter(u => u.role === 'patient').length,
      prescriptionsCount: doctorPrescriptions.length,
      followUpsCount: Math.max(0, doctorAppointments.filter(a => a.status === 'completed').length),
    }
  })
})

// AI Assistant endpoint with enhanced medical education prompt and structured insights
app.post('/api/ai/chat', auth(), (req, res) => {
  const message = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body).message
  const queryLower = message.toLowerCase()

  let topicHint = 'general health guidance'
  if (queryLower.includes('headache') || queryLower.includes('migraine')) topicHint = 'headaches and symptom tracking'
  else if (queryLower.includes('blood') || queryLower.includes('lab') || queryLower.includes('test')) topicHint = 'understanding laboratory test indicators'
  else if (queryLower.includes('pressure') || queryLower.includes('hypertension')) topicHint = 'blood pressure monitoring'
  else if (queryLower.includes('vitamin') || queryLower.includes('supplement') || queryLower.includes('medicine')) topicHint = 'medication schedules and adherence'
  else if (queryLower.includes('fever') || queryLower.includes('cold') || queryLower.includes('cough')) topicHint = 'respiratory and seasonal symptom care'

  const structuredResponse = `💡 **Overview regarding ${topicHint}:**
When preparing to speak with your care team about "${message.slice(0, 100)}":

1. **What to Observe & Track:**
   • Note exactly when symptoms began and their frequency.
   • Record triggers, severity on a 1–10 scale, and anything that brings relief.
   • Keep an up-to-date list of your current medicines, supplements, and allergies.

2. **Suggested Questions for Your Doctor:**
   • "What potential underlying causes should we evaluate?"
   • "Are there specific lifestyle changes or tests that could give us clearer insight?"
   • "What signs indicate I should follow up sooner or seek urgent evaluation?"

3. **Important Safety Reminder:**
   Carely provides health education and visit preparation only; it is not a medical diagnosis or treatment plan. For severe, acute, or rapidly worsening symptoms (chest pain, shortness of breath, sudden numbness), please seek emergency medical attention immediately.`

  res.json({ reply: structuredResponse })
})

app.get('/api/admin/stats', auth(['admin']), (_req, res) => res.json({
  stats: {
    users: memory.users.length,
    doctors: memory.users.filter(user => user.role === 'doctor').length,
    appointments: memory.appointments.length,
    records: memory.records.length,
    prescriptions: memory.prescriptions.length,
    patients: memory.users.filter(user => user.role === 'patient').length,
  }
}))

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.issues })
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error' })
})

async function start() {
  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must be set to at least 32 characters in production')
  if (isProduction && !process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured in production')
  if (process.env.MONGODB_URI) {
    try { await mongoose.connect(process.env.MONGODB_URI); console.log('Connected to MongoDB') }
    catch (error) { console.error('MongoDB connection failed; using memory store', error) }
  }

  // Pre-seed mock data if in memory mode
  if (memory.users.length === 0) {
    const passwordHash = await bcrypt.hash('development-only-password', 12)
    const demoDoctor: User = { id: id(), name: 'Dr. Amara Patel', email: 'amara.patel@carely.example', password: passwordHash, role: 'doctor', createdAt: new Date() }
    const demoDoctor2: User = { id: id(), name: 'Dr. Marcus Vance', email: 'marcus.vance@carely.example', password: passwordHash, role: 'doctor', createdAt: new Date() }
    const demoPatient: User = { id: id(), name: 'Maya Reynolds', email: 'maya@carely.example', password: passwordHash, role: 'patient', createdAt: new Date() }
    const demoAdmin: User = { id: id(), name: 'Platform Admin', email: 'admin@carely.example', password: passwordHash, role: 'admin', createdAt: new Date() }
    
    memory.users.push(demoDoctor, demoDoctor2, demoPatient, demoAdmin)

    memory.appointments.push({
      id: id(),
      patientId: demoPatient.id,
      doctorId: demoDoctor.id,
      date: '2025-04-12',
      slot: '10:00 AM',
      status: 'scheduled',
      notes: 'Routine health check-up and vitals review.',
    })

    memory.reminders.push(
      { id: id(), patientId: demoPatient.id, medicineName: 'Vitamin D3', dosage: '1000 IU', schedule: '8:00 AM', active: true },
      { id: id(), patientId: demoPatient.id, medicineName: 'Omega-3', dosage: '500 mg', schedule: '1:00 PM', active: true },
      { id: id(), patientId: demoPatient.id, medicineName: 'Magnesium Glycinate', dosage: '200 mg', schedule: '9:30 PM', active: false }
    )

    memory.records.push(
      { id: id(), patientId: demoPatient.id, title: 'Annual Comprehensive Metabolic Panel', reportType: 'Lab result', uploadDate: new Date() },
      { id: id(), patientId: demoPatient.id, title: 'Cardiology Consultation Note', reportType: 'Visit note', uploadDate: new Date() }
    )

    memory.prescriptions.push(
      {
        id: id(),
        doctorId: demoDoctor.id,
        doctorName: demoDoctor.name,
        patientId: demoPatient.id,
        patientName: demoPatient.name,
        medicineName: 'Amoxicillin',
        dosage: '500 mg',
        frequency: 'Three times daily with meals',
        duration: '7 days',
        instructions: 'Complete full course of antibiotics even if feeling better.',
        date: '2025-04-01',
        status: 'active',
      }
    )

    memory.notifications.push(
      {
        id: id(),
        userId: demoPatient.id,
        title: 'Appointment Confirmed',
        message: 'Your appointment with Dr. Amara Patel on 2025-04-12 at 10:00 AM is confirmed.',
        type: 'appointment',
        read: false,
        createdAt: new Date(),
      },
      {
        id: id(),
        userId: demoPatient.id,
        title: 'Medication Routine',
        message: 'Remember to take Vitamin D3 (1000 IU) this morning.',
        type: 'medication',
        read: true,
        createdAt: new Date(),
      }
    )
    console.log('Seeded demo users: Dr. Amara Patel, Maya Reynolds, Platform Admin')
  }

  app.listen(port, () => console.log(`Carely API listening on http://localhost:${port}`))
}

start().catch(error => { console.error(error); process.exit(1) })

