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
const cookieSameSite = (process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') || (isProduction ? 'none' : 'lax')

if (isProduction) {
  app.set('trust proxy', 1)
}

const clientOriginEnv = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
const allowedOrigins = clientOriginEnv.split(',').map(s => s.trim())

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
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

const UserModel = mongoose.model('User', new Schema({ name: String, email: { type: String, unique: true }, password: String, role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' } }, { timestamps: true }))
const AppointmentModel = mongoose.model('Appointment', new Schema({ patientId: Schema.Types.ObjectId, doctorId: Schema.Types.ObjectId, date: String, slot: String, status: String, notes: String }, { timestamps: true }))

const memory = {
  users: [] as User[],
  appointments: [] as Appointment[],
  reminders: [] as Reminder[],
  records: [] as MedicalRecord[],
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

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(8).max(72) })
const loginSchema = z.object({ email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(1) })
const appointmentSchema = z.object({ doctorId: z.string().min(1), date: z.string().min(1), slot: z.string().min(1), notes: z.string().max(500).optional() })
const reminderSchema = z.object({ medicineName: z.string().min(1).max(120), dosage: z.string().min(1).max(80), schedule: z.string().min(1).max(80) })

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'carely-api', database: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory' }))

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body)
  const exists = memory.users.find(user => user.email === input.email)
  if (exists) return res.status(409).json({ message: 'An account with that email already exists' })
  const user: User = { id: id(), ...input, role: 'patient', password: await bcrypt.hash(input.password, 12), createdAt: new Date() }
  memory.users.push(user)
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
  res.status(201).json({ appointment })
})
app.patch('/api/appointments/:id/cancel', auth(), (req, res) => {
  const appointment = memory.appointments.find(item => item.id === req.params.id && (item.patientId === req.user!.id || item.doctorId === req.user!.id))
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
  appointment.status = 'cancelled'
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

app.post('/api/ai/chat', auth(), (req, res) => {
  const message = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body).message
  res.json({ reply: `I can help you understand health information, but I cannot diagnose or prescribe. For your question about “${message.slice(0, 120)}”, consider writing down your symptoms, when they started, and any medicines you take, then discuss them with a qualified clinician. Seek urgent care for severe or rapidly worsening symptoms.` })
})

app.get('/api/admin/stats', auth(['admin']), (_req, res) => res.json({ stats: { users: memory.users.length, doctors: memory.users.filter(user => user.role === 'doctor').length, appointments: memory.appointments.length, records: memory.records.length } }))

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
  } else {
    const demoDoctor: User = { id: id(), name: 'Dr. Amara Patel', email: 'amara.patel@carely.example', password: await bcrypt.hash('development-only-password', 12), role: 'doctor', createdAt: new Date() }
    memory.users.push(demoDoctor)
    console.warn('MONGODB_URI is not set; using memory store with a development-only demo doctor')
  }
  app.listen(port, () => console.log(`Carely API listening on http://localhost:${port}`))
}

start().catch(error => { console.error(error); process.exit(1) })
