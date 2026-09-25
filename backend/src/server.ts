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
interface UserDocument extends Document { name: string; email: string; password: string; role: Role; specialty?: string; avatarUrl?: string }
interface AppointmentDocument extends Document { patientId: Types.ObjectId; doctorId: Types.ObjectId; date: string; slot: string; status: AppointmentStatus; notes?: string; updatedAt: Date }
interface ReminderDocument extends Document { patientId: Types.ObjectId; medicineName: string; dosage: string; schedule: string; active: boolean; updatedAt: Date }
interface RecordDocument extends Document { patientId: Types.ObjectId; title: string; reportType: string; fileUrl?: string; summary?: string; uploadDate: Date; updatedAt: Date }

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

const UserModel = mongoose.model<UserDocument>('User', userSchema)
const AppointmentModel = mongoose.model<AppointmentDocument>('Appointment', appointmentSchema)
const ReminderModel = mongoose.model<ReminderDocument>('Reminder', reminderSchema)
const MedicalRecordModel = mongoose.model<RecordDocument>('MedicalRecord', recordSchema)
const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET ?? 'development-only-change-me'
const cookieName = 'carely_token'
const isProduction = process.env.NODE_ENV === 'production'
const secureCookie = process.env.COOKIE_SECURE === 'true' || isProduction
const sameSite = (process.env.COOKIE_SAMESITE as 'none' | 'lax' | 'strict') ?? (secureCookie ? 'none' : 'lax')
if (isProduction) app.set('trust proxy', 1)
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:3000').split(',').map(value => value.trim().replace(/\/$/, ''))
app.use(helmet())
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin.replace(/\/$/, '')) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)), credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true }))

declare global { namespace Express { interface Request { user?: AuthUser } } }
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next)
const objectId = (value: string) => Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null
const publicUser = (user: UserDocument) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, specialty: user.specialty, avatarUrl: user.avatarUrl })
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

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(8).max(72), role: z.enum(['patient', 'doctor', 'admin']).default('patient'), specialty: z.string().max(100).optional() })
const loginSchema = z.object({ email: z.string().email().transform(value => value.toLowerCase()), password: z.string().min(1) })
const appointmentInputSchema = z.object({ doctorId: z.string().refine(value => Types.ObjectId.isValid(value)), date: z.string().min(1), slot: z.string().min(1), notes: z.string().max(1000).optional() })
const reminderInputSchema = z.object({ medicineName: z.string().min(1).max(120), dosage: z.string().min(1).max(80), schedule: z.string().min(1).max(80) })
const recordInputSchema = z.object({ title: z.string().min(1).max(120), reportType: z.enum(['Lab result', 'Imaging', 'Prescription', 'Visit note']), fileUrl: z.string().url().optional(), summary: z.string().max(5000).optional() })

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'carely-api', database: mongoose.connection.readyState === 1 ? 'mongodb' : 'unavailable' }))
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const input = registerSchema.parse(req.body)
  if (await UserModel.exists({ email: input.email })) return res.status(409).json({ message: 'An account with that email already exists' })
  const user = await UserModel.create({ ...input, password: await bcrypt.hash(input.password, 12) })
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

app.get('/api/doctors', asyncHandler(async (_req, res) => {
  if (!requireDatabase(res)) return
  const doctors = await UserModel.find({ role: 'doctor' }).sort({ name: 1 })
  res.json({ doctors: doctors.map(publicUser) })
}))
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

app.get('/api/reminders', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reminders = await ReminderModel.find({ patientId: req.user!.id }).sort({ createdAt: -1 }); res.json({ reminders: reminders.map(serialize) }) }))
app.post('/api/reminders', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reminder = await ReminderModel.create({ ...reminderInputSchema.parse(req.body), patientId: req.user!.id }); res.status(201).json({ reminder: serialize(reminder) }) }))
app.patch('/api/reminders/:id', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const id = objectId(String(req.params.id)); if (!id) return res.status(400).json({ message: 'Invalid reminder id' }); const reminder = await ReminderModel.findOneAndUpdate({ _id: id, patientId: req.user!.id }, { active: z.boolean().parse(req.body.active) }, { new: true }); if (!reminder) return res.status(404).json({ message: 'Reminder not found' }); res.json({ reminder: serialize(reminder) }) }))
app.delete('/api/reminders/:id', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const id = objectId(String(req.params.id)); if (!id) return res.status(400).json({ message: 'Invalid reminder id' }); const result = await ReminderModel.deleteOne({ _id: id, patientId: req.user!.id }); if (!result.deletedCount) return res.status(404).json({ message: 'Reminder not found' }); res.status(204).end() }))

app.get('/api/records', auth(['patient', 'doctor', 'admin']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const reportType = typeof req.query.type === 'string' ? req.query.type : undefined; const filter = req.user!.role === 'patient' ? { patientId: req.user!.id } : {}; const records = await MedicalRecordModel.find({ ...filter, ...(reportType ? { reportType } : {}) }).sort({ uploadDate: -1 }); res.json({ records: records.map(serialize) }) }))
app.post('/api/records', auth(['patient', 'doctor']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const input = recordInputSchema.parse(req.body); const patientId = req.user!.role === 'patient' ? req.user!.id : z.string().refine(value => Types.ObjectId.isValid(value)).parse(req.body.patientId); const record = await MedicalRecordModel.create({ ...input, patientId }); res.status(201).json({ record: serialize(record) }) }))
app.post('/api/records/upload', auth(['patient']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const input = z.object({ title: z.string().min(1).max(120), reportType: z.enum(['Lab result', 'Imaging', 'Prescription', 'Visit note']), filename: z.string().min(1).max(200), summary: z.string().max(5000).optional() }).parse(req.body); const record = await MedicalRecordModel.create({ ...input, fileUrl: `upload://${encodeURIComponent(input.filename)}`, patientId: req.user!.id }); res.status(201).json({ record: serialize(record), upload: 'cloud-storage-ready' }) }))

app.post('/api/ai/chat', auth(), asyncHandler(async (req, res) => {
  const message = z.object({ message: z.string().trim().min(1).max(2000) }).parse(req.body).message
  const system = 'You are Carely, a compassionate health education assistant. Explain health information clearly without diagnosing, prescribing, or replacing a clinician. Ask clarifying questions when useful. Always recommend professional care for concerning symptoms and emergency services for life-threatening symptoms. Use short headings and bullet points.'
  if (process.env.GEMINI_API_KEY) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: message }] }] }) })
    if (!response.ok) throw new Error('AI provider unavailable')
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return res.json({ reply: data.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('') || 'Please try again or speak with a clinician.', provider: 'gemini' })
  }
  res.json({ reply: `I can help explain health information, but I cannot diagnose or prescribe. For “${message.slice(0, 120)}”, note when it started, what changes it, and any medicines you take, then discuss it with a qualified clinician. Seek urgent care for severe or rapidly worsening symptoms.`, provider: 'safe-fallback' })
}))
app.get('/api/notifications', auth(), asyncHandler(async (req, res) => {
  if (!requireDatabase(res)) return
  const appointments = await AppointmentModel.find(req.user!.role === 'doctor' ? { doctorId: req.user!.id } : { patientId: req.user!.id }).sort({ updatedAt: -1 }).limit(20).lean()
  const reminders = req.user!.role === 'patient' ? await ReminderModel.find({ patientId: req.user!.id, active: true }).sort({ updatedAt: -1 }).limit(20).lean() : []
  res.json({ notifications: [...appointments.map(item => ({ id: item._id.toString(), type: 'appointment', title: `Appointment ${item.status}`, body: `${item.date} · ${item.slot}`, createdAt: item.updatedAt })), ...reminders.map(item => ({ id: item._id.toString(), type: 'reminder', title: item.medicineName, body: `${item.dosage} · ${item.schedule}`, createdAt: item.updatedAt }))] })
}))

app.get('/api/doctor/patients', auth(['doctor']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const ids = await AppointmentModel.find({ doctorId: req.user!.id }).distinct('patientId'); const patients = await UserModel.find({ _id: { $in: ids }, role: 'patient' }); res.json({ patients: patients.map(publicUser) }) }))
app.post('/api/doctor/prescriptions', auth(['doctor']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const input = z.object({ patientId: z.string().refine(value => Types.ObjectId.isValid(value)), title: z.string().min(1).max(120), summary: z.string().min(1).max(5000) }).parse(req.body); const record = await MedicalRecordModel.create({ patientId: input.patientId, title: input.title, reportType: 'Prescription', summary: input.summary }); res.status(201).json({ record: serialize(record) }) }))
app.get('/api/admin/users', auth(['admin']), asyncHandler(async (_req, res) => { if (!requireDatabase(res)) return; const users = await UserModel.find().sort({ createdAt: -1 }); res.json({ users: users.map(publicUser) }) }))
app.patch('/api/admin/users/:id/role', auth(['admin']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const role = z.object({ role: z.enum(['patient', 'doctor', 'admin']) }).parse(req.body).role; const id = objectId(String(req.params.id)); if (!id) return res.status(400).json({ message: 'Invalid user id' }); const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true }); if (!user) return res.status(404).json({ message: 'User not found' }); res.json({ user: publicUser(user) }) }))
app.delete('/api/admin/users/:id', auth(['admin']), asyncHandler(async (req, res) => { if (!requireDatabase(res)) return; const id = objectId(String(req.params.id)); if (!id || id.toString() === req.user!.id) return res.status(400).json({ message: 'Invalid user or self-delete is not allowed' }); const result = await UserModel.deleteOne({ _id: id }); if (!result.deletedCount) return res.status(404).json({ message: 'User not found' }); await Promise.all([AppointmentModel.deleteMany({ $or: [{ patientId: id }, { doctorId: id }] }), ReminderModel.deleteMany({ patientId: id }), MedicalRecordModel.deleteMany({ patientId: id })]); res.status(204).end() }))
app.get('/api/admin/stats', auth(['admin']), asyncHandler(async (_req, res) => { if (!requireDatabase(res)) return; const [users, doctors, appointments, records] = await Promise.all([UserModel.countDocuments(), UserModel.countDocuments({ role: 'doctor' }), AppointmentModel.countDocuments(), MedicalRecordModel.countDocuments()]); res.json({ stats: { users, doctors, appointments, records } }) }))

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation failed', issues: error.issues }); console.error(error); res.status(500).json({ message: 'Unexpected server error' }) })
async function seed() {
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD ?? 'CarelyDemo123!', 12)
  for (const doctor of [{ name: 'Dr. Amara Patel', email: 'doctor@carely.com', specialty: 'General medicine' }, { name: 'Dr. Noah Chen', email: 'specialist@carely.com', specialty: 'Cardiology' }]) await UserModel.updateOne({ email: doctor.email }, { $setOnInsert: { ...doctor, password, role: 'doctor' } }, { upsert: true })
  await UserModel.updateOne({ email: 'admin@carely.com' }, { $setOnInsert: { name: 'Carely Admin', email: 'admin@carely.com', password, role: 'admin' } }, { upsert: true })
}
async function start() {
  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must be set to at least 32 characters in production')
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured; Carely no longer uses an in-memory data store')
  await mongoose.connect(process.env.MONGODB_URI)
  await seed()
  app.listen(port, () => console.log(`Carely API listening on http://localhost:${port}`))
}
start().catch(error => { console.error(error); process.exit(1) })
