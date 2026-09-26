import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import mongoose, { Document, Schema, Types } from 'mongoose'
import { z } from 'zod'

type Role = 'patient' | 'doctor' | 'admin'
type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed'
type AuthUser = { id: string; role: Role }

interface UserDocument extends Document { _id: Types.ObjectId; name: string; email: string; password: string; role: Role; specialty?: string; avatarUrl?: string; createdAt: Date }
interface AppointmentDocument extends Document { _id: Types.ObjectId; patientId: Types.ObjectId; doctorId: Types.ObjectId; date: string; slot: string; status: AppointmentStatus; notes?: string; createdAt: Date; updatedAt: Date }
interface ReminderDocument extends Document { _id: Types.ObjectId; patientId: Types.ObjectId; medicineName: string; dosage: string; schedule: string; active: boolean; createdAt: Date; updatedAt: Date }
interface RecordDocument extends Document { _id: Types.ObjectId; patientId: Types.ObjectId; title: string; reportType: string; fileUrl?: string; summary?: string; uploadDate: Date; createdAt: Date; updatedAt: Date }
interface PrescriptionDocument extends Document { _id: Types.ObjectId; doctorId: Types.ObjectId; doctorName: string; patientId: Types.ObjectId; patientName: string; medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string; date: string; status: 'active' | 'completed'; createdAt: Date; updatedAt: Date }
interface NotificationDocument extends Document { _id: Types.ObjectId; userId: Types.ObjectId; title: string; message: string; type: 'appointment' | 'medication' | 'system'; read: boolean; createdAt: Date; updatedAt: Date }

const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true, default: 'patient', index: true },
  specialty: { type: String, trim: true, maxlength: 100 },
  avatarUrl: { type: String, trim: true },
}, { timestamps: true })

const appointmentSchema = new Schema<AppointmentDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, index: true },
  slot: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], required: true, default: 'scheduled', index: true },
  notes: { type: String, maxlength: 1000 },
}, { timestamps: true })

const reminderSchema = new Schema<ReminderDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicineName: { type: String, required: true, maxlength: 120 },
  dosage: { type: String, required: true, maxlength: 80 },
  schedule: { type: String, required: true, maxlength: 80 },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true })

const recordSchema = new Schema<RecordDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 120 },
  reportType: { type: String, required: true, index: true },
  fileUrl: String,
  summary: { type: String, maxlength: 5000 },
  uploadDate: { type: Date, default: Date.now },
}, { timestamps: true })

const prescriptionSchema = new Schema<PrescriptionDocument>({
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorName: { type: String, required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patientName: { type: String, required: true },
  medicineName: { type: String, required: true, maxlength: 120 },
  dosage: { type: String, required: true, maxlength: 80 },
  frequency: { type: String, required: true, maxlength: 80 },
  duration: { type: String, required: true, maxlength: 80 },
  instructions: { type: String, maxlength: 500 },
  date: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
}, { timestamps: true })

const notificationSchema = new Schema<NotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['appointment', 'medication', 'system'], default: 'system', index: true },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true })

const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema)
const AppointmentModel = mongoose.models.Appointment || mongoose.model<AppointmentDocument>('Appointment', appointmentSchema)
const ReminderModel = mongoose.models.Reminder || mongoose.model<ReminderDocument>('Reminder', reminderSchema)
const MedicalRecordModel = mongoose.models.MedicalRecord || mongoose.model<RecordDocument>('MedicalRecord', recordSchema)
const PrescriptionModel = mongoose.models.Prescription || mongoose.model<PrescriptionDocument>('Prescription', prescriptionSchema)
const NotificationModel = mongoose.models.Notification || mongoose.model<NotificationDocument>('Notification', notificationSchema)

const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET ?? 'development-only-change-me'
const cookieName = 'carely_token'
const isProduction = process.env.NODE_ENV === 'production'
const secureCookie = process.env.COOKIE_SECURE === 'true' || isProduction
const sameSite = (process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') ?? (secureCookie ? 'none' : 'lax')

if (isProduction) app.set('trust proxy', 1)

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://ai-medical-assistance-frontend.vercel.app',
]
const envOrigins = (process.env.CLIENT_ORIGIN ?? '').split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean)
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const clean = origin.replace(/\/$/, '')
      if (allowedOrigins.includes(clean) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(clean) || /^http:\/\/localhost(:\d+)?$/i.test(clean) || /^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(clean)) {
        return callback(null, true)
      }
      callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }))

declare global { namespace Express { interface Request { user?: AuthUser } } }
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next)
const objectId = (value: string) => Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null
const publicUser = (user: UserDocument) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, specialty: user.specialty, avatarUrl: user.avatarUrl, createdAt: user.createdAt })
const serialize = (value: Document & { _id: Types.ObjectId }) => ({ ...value.toObject(), id: value._id.toString(), _id: undefined })

function auth(roles?: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[cookieName]
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    try {
      const payload = jwt.verify(token, jwtSecret) as { sub: string; role: Role }
      if (roles && !roles.includes(payload.role)) return res.status(403).json({ message: 'Insufficient permissions' })
      req.user = { id: payload.sub, role: payload.role }
      next()
    } catch { res.status(401).json({ message: 'Session expired' }) }
  }
}

function setSession(res: Response, user: UserDocument) {
  res.cookie(cookieName, jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: '7d' }), { httpOnly: true, sameSite, secure: secureCookie, maxAge: 7 * 24 * 60 * 60 * 1000 })
}

function requireDatabase(res: Response) {
  if (mongoose.connection.readyState !== 1) { res.status(503).json({ message: 'Database is unavailable. Configure MONGODB_URI and try again.' }); return false }
  return true
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72),
  role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
  specialty: z.string().max(100).optional(),
})
const loginSchema = z.object({ email: z.string().email().transform(v => v.toLowerCase()), password: z.string().min(1) })
const appointmentInputSchema = z.object({ doctorId: z.string().refine(v => Types.ObjectId.isValid(v)), date: z.string().min(1), slot: z.string().min(1), notes: z.string().max(1000).optional() })
const reminderInputSchema = z.object({ medicineName: z.string().min(1).max(120), dosage: z.string().min(1).max(80), schedule: z.string().min(1).max(80) })
const recordInputSchema = z.object({ title: z.string().min(1).max(120), reportType: z.enum(['Lab result', 'Imaging', 'Prescription', 'Visit note']), fileUrl: z.string().url().optional(), summary: z.string().max(5000).optional() })
const prescriptionInputSchema = z.object({
  patientId: z.string().refine(v => Types.ObjectId.isValid(v)),
  medicineName: z.string().min(1).max(120),
  dosage: z.string().min(1).max(80),
  frequency: z.string().min(1).max(80),
  duration: z.string().min(1).max(80),
  instructions: z.string().max(500).optional(),
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'carely-api', database: mongoose.connection.readyState === 1 ? 'mongodb' : 'unavailable' }))

// Auth
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = registerSchema.parse(req.body)
  if (await UserModel.exists({ email: input.email })) return res.status(409).json({ message: 'An account with that email already exists' })
  const user = await UserModel.create({ ...input, password: await bcrypt.hash(input.password, 12) })
  
  await NotificationModel.create({
    userId: user._id,
    title: 'Welcome to Carely',
    message: 'Your account is ready. Explore our calm health tools, reminders, and appointments.',
    type: 'system',
    read: false,
  })

  setSession(res, user)
  res.status(201).json({ user: publicUser(user) })
}))

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = loginSchema.parse(req.body)
  const user = await UserModel.findOne({ email: input.email }).select('+password')
  if (!user || !(await bcrypt.compare(input.password, user.password))) return res.status(401).json({ message: 'Invalid email or password' })
  setSession(res, user)
  res.json({ user: publicUser(user) })
}))

app.post('/api/auth/logout', (_req, res) => { res.clearCookie(cookieName, { httpOnly: true, sameSite, secure: secureCookie }); res.status(204).end() })

app.get('/api/auth/me', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const user = await UserModel.findById(req.user!.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json(publicUser(user))
}))

// Doctors
app.get('/api/doctors', asyncHandler(async (_req, res) => {
  if (!requireDatabase(res)) return
  const doctors = await UserModel.find({ role: 'doctor' }).sort({ name: 1 })
  res.json({ doctors: doctors.map(publicUser) })
}))

// Appointments
app.get('/api/appointments', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const filter = req.user!.role === 'doctor' ? { doctorId: req.user!.id } : { patientId: req.user!.id }
  const appointments = await AppointmentModel.find(filter).populate('patientId', 'name email').populate('doctorId', 'name email specialty').sort({ date: 1 })
  res.json({ appointments: appointments.map(serialize) })
}))

app.post('/api/appointments', auth(['patient']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = appointmentInputSchema.parse(req.body)
  if (!await UserModel.exists({ _id: input.doctorId, role: 'doctor' })) return res.status(404).json({ message: 'Doctor not found' })
  if (await AppointmentModel.exists({ doctorId: input.doctorId, date: input.date, slot: input.slot, status: 'scheduled' })) return res.status(409).json({ message: 'That time is already booked' })
  const appointment = await AppointmentModel.create({ ...input, patientId: req.user!.id })
  
  // Create notifications
  await NotificationModel.create([
    {
      userId: req.user!.id,
      title: 'Appointment Requested',
      message: `Your visit for ${appointment.date} at ${appointment.slot} has been requested.`,
      type: 'appointment',
      read: false,
    },
    {
      userId: input.doctorId,
      title: 'New Patient Booking',
      message: `A new consultation has been booked for ${appointment.date} at ${appointment.slot}.`,
      type: 'appointment',
      read: false,
    }
  ])

  res.status(201).json({ appointment: serialize(appointment) })
}))

app.patch('/api/appointments/:id/cancel', auth(), asyncHandler(async (req, res) => updateAppointmentStatus(req, res, 'cancelled')))
app.patch('/api/appointments/:id/status', auth(['doctor', 'admin']), asyncHandler(async (req, res) => updateAppointmentStatus(req, res, z.object({ status: z.enum(['scheduled', 'cancelled', 'completed']) }).parse(req.body).status)))

async function updateAppointmentStatus(req: Request, res: Response, status: AppointmentStatus) {
  if (!requireDatabase(res)) return
  const id = objectId(String(req.params.id))
  if (!id) return res.status(400).json({ message: 'Invalid appointment id' })
  const filter = req.user!.role === 'patient' ? { _id: id, patientId: req.user!.id } : { _id: id, ...(req.user!.role === 'doctor' ? { doctorId: req.user!.id } : {}) }
  const appointment = await AppointmentModel.findOneAndUpdate(filter, { status }, { new: true })
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
  res.json({ appointment: serialize(appointment) })
}

// Reminders
app.get('/api/reminders', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reminders = await ReminderModel.find({ patientId: req.user!.id }).sort({ createdAt: -1 }); res.json({ reminders: reminders.map(serialize) }) }))
app.post('/api/reminders', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reminder = await ReminderModel.create({ ...reminderInputSchema.parse(req.body), patientId: req.user!.id }); res.status(201).json({ reminder: serialize(reminder) }) }))
app.patch('/api/reminders/:id', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const id = objectId(String(req.params.id)); if (!id) return res.status(400).json({ message: 'Invalid reminder id' }); const reminder = await ReminderModel.findOneAndUpdate({ _id: id, patientId: req.user!.id }, { active: z.boolean().parse(req.body.active) }, { new: true }); if (!reminder) return res.status(404).json({ message: 'Reminder not found' }); res.json({ reminder: serialize(reminder) }) }))
app.delete('/api/reminders/:id', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const id = objectId(String(req.params.id)); if (!id) return res.status(400).json({ message: 'Invalid reminder id' }); const result = await ReminderModel.deleteOne({ _id: id, patientId: req.user!.id }); if (!result.deletedCount) return res.status(404).json({ message: 'Reminder not found' }); res.status(204).end() }))

// Medical records
app.get('/api/records', auth(['patient', 'doctor', 'admin']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reportType = typeof req.query.type === 'string' ? req.query.type : undefined; const filter = req.user!.role === 'patient' ? { patientId: req.user!.id } : {}; const records = await MedicalRecordModel.find({ ...filter, ...(reportType ? { reportType } : {}) }).sort({ uploadDate: -1 }); res.json({ records: records.map(serialize) }) }))
app.post('/api/records', auth(['patient', 'doctor']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const input = recordInputSchema.parse(req.body); const patientId = req.user!.role === 'patient' ? req.user!.id : z.string().refine(value => Types.ObjectId.isValid(value)).parse(req.body.patientId); const record = await MedicalRecordModel.create({ ...input, patientId }); res.status(201).json({ record: serialize(record) }) }))
app.post('/api/records/upload', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const input = z.object({ title: z.string().min(1).max(120), reportType: z.enum(['Lab result', 'Imaging', 'Prescription', 'Visit note']), filename: z.string().min(1).max(200), summary: z.string().max(5000).optional() }).parse(req.body); const record = await MedicalRecordModel.create({ ...input, fileUrl: `upload://${encodeURIComponent(input.filename)}`, patientId: req.user!.id }); res.status(201).json({ record: serialize(record), upload: 'cloud-storage-ready' }) }))

// Prescriptions
app.get('/api/prescriptions', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const filter = req.user!.role === 'patient' ? { patientId: req.user!.id } : req.user!.role === 'doctor' ? { doctorId: req.user!.id } : {}
  const prescriptions = await PrescriptionModel.find(filter).sort({ createdAt: -1 })
  res.json({ prescriptions: prescriptions.map(serialize) })
}))

app.post('/api/prescriptions', auth(['doctor', 'admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = prescriptionInputSchema.parse(req.body)
  const doctor = await UserModel.findById(req.user!.id)
  const patient = await UserModel.findById(input.patientId)
  if (!patient) return res.status(404).json({ message: 'Patient not found' })

  const prescription = await PrescriptionModel.create({
    doctorId: req.user!.id,
    doctorName: doctor?.name || 'Dr. Carely',
    patientId: patient._id,
    patientName: patient.name,
    medicineName: input.medicineName,
    dosage: input.dosage,
    frequency: input.frequency,
    duration: input.duration,
    instructions: input.instructions,
    date: new Date().toISOString().split('T')[0],
    status: 'active',
  })

  // Create patient notification
  await NotificationModel.create({
    userId: patient._id,
    title: 'New Prescription Added',
    message: `${prescription.doctorName} prescribed ${prescription.medicineName} (${prescription.dosage}).`,
    type: 'medication',
    read: false,
  })

  res.status(201).json({ prescription: serialize(prescription) })
}))

app.post('/api/doctor/prescriptions', auth(['doctor']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = z.object({ patientId: z.string().refine(value => Types.ObjectId.isValid(value)), title: z.string().min(1).max(120), summary: z.string().min(1).max(5000) }).parse(req.body)
  const record = await MedicalRecordModel.create({ patientId: input.patientId, title: input.title, reportType: 'Prescription', summary: input.summary })
  res.status(201).json({ record: serialize(record) })
}))

app.patch('/api/prescriptions/:id', auth(['doctor', 'patient', 'admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const id = objectId(String(req.params.id))
  if (!id) return res.status(400).json({ message: 'Invalid prescription id' })
  const status = z.enum(['active', 'completed']).parse(req.body.status)
  const prescription = await PrescriptionModel.findByIdAndUpdate(id, { status }, { new: true })
  if (!prescription) return res.status(404).json({ message: 'Prescription not found' })
  res.json({ prescription: serialize(prescription) })
}))

// Patients directory
app.get(['/api/patients', '/api/doctor/patients'], auth(['doctor', 'admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const patients = await UserModel.find({ role: 'patient' }).sort({ createdAt: -1 })
  const summaries = await Promise.all(patients.map(async p => {
    const [appointments, records, prescriptions] = await Promise.all([
      AppointmentModel.find({ patientId: p._id }),
      MedicalRecordModel.countDocuments({ patientId: p._id }),
      PrescriptionModel.countDocuments({ patientId: p._id }),
    ])
    return {
      id: p._id.toString(),
      name: p.name,
      email: p.email,
      createdAt: p.createdAt.toISOString(),
      totalAppointments: appointments.length,
      totalRecords: records,
      totalPrescriptions: prescriptions,
      lastAppointment: appointments[appointments.length - 1]?.date || 'None',
    }
  }))
  res.json({ patients: summaries })
}))

// Admin user management
app.get(['/api/users', '/api/admin/users'], auth(['admin']), asyncHandler(async (_req, res) => {
  if (!requireDatabase(res)) return
  const users = await UserModel.find().sort({ createdAt: -1 })
  res.json({ users: users.map(publicUser) })
}))

app.patch(['/api/users/:id/role', '/api/admin/users/:id/role'], auth(['admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const role = z.object({ role: z.enum(['patient', 'doctor', 'admin']) }).parse(req.body).role
  const id = objectId(String(req.params.id))
  if (!id) return res.status(400).json({ message: 'Invalid user id' })
  const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true })
  if (!user) return res.status(404).json({ message: 'User not found' })
  res.json({ user: publicUser(user) })
}))

app.delete(['/api/users/:id', '/api/admin/users/:id'], auth(['admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const id = objectId(String(req.params.id))
  if (!id || id.toString() === req.user!.id) return res.status(400).json({ message: 'Invalid user or self-delete is not allowed' })
  const result = await UserModel.deleteOne({ _id: id })
  if (!result.deletedCount) return res.status(404).json({ message: 'User not found' })
  await Promise.all([
    AppointmentModel.deleteMany({ $or: [{ patientId: id }, { doctorId: id }] }),
    ReminderModel.deleteMany({ patientId: id }),
    MedicalRecordModel.deleteMany({ patientId: id }),
    PrescriptionModel.deleteMany({ $or: [{ patientId: id }, { doctorId: id }] }),
    NotificationModel.deleteMany({ userId: id }),
  ])
  res.status(204).end()
}))

// Notifications
app.get('/api/notifications', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const notifications = await NotificationModel.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(30)
  res.json({ notifications: notifications.map(serialize) })
}))

app.patch('/api/notifications/:id/read', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const id = objectId(String(req.params.id))
  if (!id) return res.status(400).json({ message: 'Invalid notification id' })
  const notification = await NotificationModel.findOneAndUpdate({ _id: id, userId: req.user!.id }, { read: true }, { new: true })
  if (!notification) return res.status(404).json({ message: 'Notification not found' })
  res.json({ notification: serialize(notification) })
}))

app.patch('/api/notifications/read-all', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  await NotificationModel.updateMany({ userId: req.user!.id, read: false }, { read: true })
  res.json({ success: true })
}))

// Doctor Stats
app.get('/api/doctor/stats', auth(['doctor', 'admin']), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const doctorId = objectId(req.user!.id)
  const [totalAppointments, scheduledAppointments, completedAppointments, prescriptionsCount] = await Promise.all([
    AppointmentModel.countDocuments({ doctorId }),
    AppointmentModel.countDocuments({ doctorId, status: 'scheduled' }),
    AppointmentModel.countDocuments({ doctorId, status: 'completed' }),
    PrescriptionModel.countDocuments({ doctorId }),
  ])
  const uniquePatients = await AppointmentModel.find({ doctorId }).distinct('patientId')

  res.json({
    stats: {
      appointments: totalAppointments,
      scheduledAppointments,
      patientsCount: uniquePatients.length,
      prescriptionsCount,
      followUpsCount: completedAppointments,
    }
  })
}))

// Admin Stats
app.get('/api/admin/stats', auth(['admin']), asyncHandler(async (_req, res) => {
  if (!requireDatabase(res)) return
  const [users, doctors, patients, appointments, records, prescriptions] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: 'doctor' }),
    UserModel.countDocuments({ role: 'patient' }),
    AppointmentModel.countDocuments(),
    MedicalRecordModel.countDocuments(),
    PrescriptionModel.countDocuments(),
  ])
  res.json({ stats: { users, doctors, patients, appointments, records, prescriptions } })
}))

// AI Chat
app.post('/api/ai/chat', auth(), asyncHandler(async (req, res) => {
  const message = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body).message
  const system = 'You are Carely, a compassionate health education assistant. Explain health information clearly without diagnosing, prescribing, or replacing a clinician. Ask clarifying questions when useful. Always recommend professional care for concerning symptoms and emergency services for life-threatening symptoms. Use short headings and bullet points.'
  
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: message }] }] })
      })
      if (response.ok) {
        const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
        const reply = data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('')
        if (reply) return res.json({ reply, provider: 'gemini' })
      }
    } catch (e) {
      console.error('Gemini API call failed, using safe fallback', e)
    }
  }

  const queryLower = message.toLowerCase()
  let topicHint = 'general health guidance'
  if (queryLower.includes('headache') || queryLower.includes('migraine')) topicHint = 'headaches and symptom tracking'
  else if (queryLower.includes('blood') || queryLower.includes('lab') || queryLower.includes('test')) topicHint = 'understanding laboratory test indicators'
  else if (queryLower.includes('pressure') || queryLower.includes('hypertension')) topicHint = 'blood pressure monitoring'
  else if (queryLower.includes('vitamin') || queryLower.includes('supplement') || queryLower.includes('medicine')) topicHint = 'medication schedules and adherence'
  else if (queryLower.includes('fever') || queryLower.includes('cold') || queryLower.includes('cough')) topicHint = 'respiratory and seasonal symptom care'

  const structuredResponse = `💡 Overview regarding ${topicHint}:
When preparing to speak with your care team about "${message.slice(0, 100)}":

1. What to Observe & Track:
   • Note exactly when symptoms began and their frequency.
   • Record triggers, severity on a 1–10 scale, and anything that brings relief.
   • Keep an up-to-date list of your current medicines, supplements, and allergies.

2. Suggested Questions for Your Doctor:
   • "What potential underlying causes should we evaluate?"
   • "Are there specific lifestyle changes or tests that could give us clearer insight?"
   • "What signs indicate I should follow up sooner or seek urgent evaluation?"

3. Important Safety Reminder:
   Carely provides health education and visit preparation only; it is not a medical diagnosis or treatment plan. For severe, acute, or rapidly worsening symptoms (chest pain, shortness of breath, sudden numbness), please seek emergency medical attention immediately.`

  res.json({ reply: structuredResponse, provider: 'safe-fallback' })
}))

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.issues })
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error' })
})

async function seed() {
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD ?? 'CarelyDemo123!', 12)
  for (const doctor of [
    { name: 'Dr. Amara Patel', email: 'doctor@carely.com', specialty: 'General medicine' },
    { name: 'Dr. Noah Chen', email: 'specialist@carely.com', specialty: 'Cardiology' }
  ]) {
    await UserModel.updateOne({ email: doctor.email }, { $setOnInsert: { ...doctor, password, role: 'doctor' } }, { upsert: true })
  }
  await UserModel.updateOne({ email: 'admin@carely.com' }, { $setOnInsert: { name: 'Carely Admin', email: 'admin@carely.com', password, role: 'admin' } }, { upsert: true })
}

async function start() {
  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must be set to at least 32 characters in production')
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured; Carely requires a database connection')
  await mongoose.connect(process.env.MONGODB_URI)
  await seed()
  app.listen(port, () => console.log(`Carely API listening on http://localhost:${port}`))
}

start().catch(error => { console.error(error); process.exit(1) })
