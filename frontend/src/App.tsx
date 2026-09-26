import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  HeartPulse,
  Info,
  Menu,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import {
  api,
  type Appointment,
  type Doctor,
  type MedicalRecord,
  type NotificationItem,
  type PatientSummary,
  type Prescription,
  type Reminder,
  type SessionUser,
  type UserSummary,
} from './services/api'

type Role = 'patient' | 'doctor' | 'admin'

const features = [
  { icon: Brain, title: 'Your calm AI guide', copy: 'Understand symptoms, reports, and medications in plain language — never a diagnosis.' },
  { icon: CalendarDays, title: 'Care that fits your life', copy: 'Find the right clinician, book a time, and keep every follow-up in one place.' },
  { icon: ShieldCheck, title: 'Private by design', copy: 'Your health information is protected with thoughtful access controls and secure storage.' },
]

function Logo() {
  return <Link className="logo" to="/"><span className="logo-mark"><HeartPulse size={18} /></span><span>carely</span></Link>
}

function Navigation() {
  const [open, setOpen] = useState(false)
  return <header className="site-header container">
    <Logo />
    <nav className={open ? 'nav-links open' : 'nav-links'}>
      <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
      <a href="#care" onClick={() => setOpen(false)}>Our care</a>
      <a href="#stories" onClick={() => setOpen(false)}>Stories</a>
      <Link className="mobile-login" to="/login">Log in</Link>
    </nav>
    <div className="header-actions"><Link className="text-link" to="/login">Log in</Link><Link className="button button-small" to="/register">Get started <ArrowRight size={15} /></Link></div>
    <button className="menu-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>
}

function Landing() {
  return <div className="page">
    <Navigation />
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" />A softer way to navigate health</div>
          <h1>Feel more <em>informed.</em><br />Care more <span className="scribble">confidently.</span></h1>
          <p className="hero-lede">Carely brings trusted guidance, your care team, and your health story together — so every next step feels a little clearer.</p>
          <div className="hero-actions"><Link className="button" to="/register">Start your care journey <ArrowRight size={17} /></Link><a className="play-link" href="#how-it-works"><span className="play">▶</span> See how it works</a></div>
          <div className="trust-row"><div className="avatar-stack"><span>MK</span><span>AS</span><span>JL</span></div><span><strong>12,000+</strong> people feel better supported</span></div>
        </div>
        <div className="hero-art" aria-label="Care dashboard preview">
          <div className="blob blob-back" /><div className="blob blob-front" />
          <motion.div className="floating-card ai-card" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}><span className="icon-bubble purple"><Sparkles size={17} /></span><div><strong>Good morning, Maya</strong><small>How can I support you today?</small></div><span className="online" /></motion.div>
          <motion.div className="floating-card reminder-card" animate={{ y: [0, 7, 0] }} transition={{ duration: 5, repeat: Infinity }}><span className="icon-bubble peach"><Clock3 size={17} /></span><div><strong>Medication reminder</strong><small>Vitamin D · due in 20 min</small></div><Check className="check" size={17} /></motion.div>
          <div className="phone-card"><div className="phone-top"><span>9:41</span><span>•••</span></div><div className="mini-greeting">Your health<br /><strong>in one view.</strong></div><div className="health-ring"><div><strong>84</strong><small>wellness score</small></div></div><div className="mini-stats"><span><HeartPulse size={14} /> Heart rate<strong>72 bpm</strong></span><span><CalendarDays size={14} /> Next visit<strong>Tomorrow</strong></span></div><div className="mini-button">Ask Carely <ArrowRight size={14} /></div></div>
        </div>
      </section>

      <section className="logo-strip"><div className="container"><span>Trusted care, thoughtfully connected</span><div><strong>luma</strong><strong>wellnest</strong><strong>northstar health</strong><strong>arcwell</strong></div></div></section>
      <section id="care" className="section container"><div className="section-heading"><div><div className="eyebrow">Everything in one gentle place</div><h2>Healthcare that<br /><em>meets you where you are.</em></h2></div><p>Less searching. Less second-guessing. More space to focus on feeling like yourself.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, copy }, index) => <motion.article className="feature-card" key={title} whileHover={{ y: -6 }} transition={{ duration: .2 }}><span className={`feature-icon feature-${index}`}><Icon size={22} /></span><span className="feature-number">0{index + 1}</span><h3>{title}</h3><p>{copy}</p><a href="#how-it-works">Explore <ArrowRight size={14} /></a></motion.article>)}</div></section>
      <section id="how-it-works" className="split-section container"><div className="steps-art"><div className="steps-orb"><Stethoscope size={44} /></div><div className="note-card"><span className="icon-bubble yellow"><FileText size={16} /></span><div><strong>Report explained</strong><small>In simple terms, for you</small></div></div></div><div className="steps-copy"><div className="eyebrow">Simple by intention</div><h2>A little more clarity, <em>every day.</em></h2><p>From your first question to your next appointment, Carely turns scattered health tasks into small, manageable moments.</p><ol>{['Tell us what you need', 'Get guidance that makes sense', 'Take your next best step'].map((step, i) => <li key={step}><span>{i + 1}</span><div><strong>{step}</strong><small>{['Share what is on your mind, in your own words.', 'Receive thoughtful information tailored to you.', 'Book, track, and stay connected with your care team.'][i]}</small></div></li>)}</ol></div></section>
      <section id="stories" className="quote-section"><div className="container quote-inner"><div className="quote-mark">“</div><blockquote>For the first time, my health information feels like it belongs to <em>me</em> — not a filing cabinet.</blockquote><p>— Maya R. · Carely member since 2024</p><div className="quote-dots"><span className="active" /><span /><span /></div></div></section>
      <section className="cta-section container"><div><div className="eyebrow">Your next step starts here</div><h2>Feel good about<br /><em>feeling better.</em></h2></div><Link className="button button-light" to="/register">Create your free account <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="footer container"><Logo /><span>Thoughtful technology for better care.</span><div><a href="#care">Privacy</a><a href="#care">Security</a><a href="#care">Contact</a></div><small>© 2025 Carely</small></footer>
  </div>
}

function Auth({ register = false }: { register?: boolean }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (register) await api.register({ name, email, password, role })
      else await api.login({ email, password })
      navigate('/patient')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally { setLoading(false) }
  }

  function handleGoogleLogin() {
    setInfo('Google Sign-In is configured for Google Workspace. For instant access, use email registration or the demo accounts below.')
  }

  function handleForgotPassword() {
    setInfo('In development mode: demo doctor is "amara.patel@carely.example" / "development-only-password". For patient, create any new account.')
  }

  return <div className="auth-page"><div className="auth-brand"><Logo /><div className="auth-quote"><h2>Care that feels<br /><em>human.</em></h2><p>“The best healthcare experience I have ever had. Everything feels calm, clear, and genuinely made for me.”</p><small>— Jordan Lee, Carely member</small></div></div><div className="auth-panel"><Link className="back-link" to="/">← Back to home</Link><div className="auth-form"><div className="eyebrow">{register ? 'Welcome to Carely' : 'Welcome back'}</div><h1>{register ? 'Start feeling supported.' : 'Good to see you again.'}</h1><p>{register ? 'Create your account in less than a minute.' : 'Log in to pick up where you left off.'}</p>{register && <label>Full name<input value={name} onChange={event => setName(event.target.value)} placeholder="Alex Morgan" required /></label>}{register && <label>Account Role<select value={role} onChange={event => setRole(event.target.value as Role)} className="role-badge-select" style={{ display: 'block', width: '100%', padding: '12px', marginTop: '7px', borderRadius: '9px', border: '1px solid #dce5df' }}><option value="patient">Patient (Health Companion)</option><option value="doctor">Clinician / Doctor (Care Workspace)</option><option value="admin">System Administrator (Operations)</option></select></label>}<label>Email address<input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="you@example.com" required /></label><label>Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="••••••••" required /></label>{!register && <button type="button" className="forgot text-button" onClick={handleForgotPassword}>Forgot password or use demo?</button>}{error && <p className="form-error">{error}</p>}{info && <p className="success-message" style={{ background: '#f0f7f3', padding: '10px', borderRadius: '8px', border: '1px solid #cfe5d7' }}>{info}</p>}<button className="button auth-submit" disabled={loading} onClick={submit}>{loading ? 'Please wait…' : register ? 'Create my account' : 'Log in'} {!loading && <ArrowRight size={17} />}</button><div className="divider"><span>or continue with</span></div><button type="button" className="social-button" onClick={handleGoogleLogin}>◎ Continue with Google</button><p className="switch-auth">{register ? 'Already have an account?' : 'New to Carely?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div></div></div>
}

const nav = [
  { label: 'Overview', path: '/patient', icon: HeartPulse },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Medical records', path: '/patient/records', icon: FileText },
  { label: 'Reminders', path: '/patient/reminders', icon: Clock3 },
  { label: 'AI assistant', path: '/patient/assistant', icon: Sparkles },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
]

function ErrorMessage({ error }: { error: string }) {
  return error ? <p className="form-error" role="alert">{error}</p> : null
}

function DashboardLayout({ children, user }: { children: ReactNode; user: SessionUser }) {
  const location = window.location.pathname
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.notifications()
      .then(res => setUnreadCount(res.notifications.filter(n => !n.read).length))
      .catch(() => undefined)
  }, [location])

  async function logout() { await api.logout(); navigate('/login') }
  
  const links = user.role === 'patient' 
    ? nav 
    : user.role === 'doctor' 
    ? [
        { label: 'Overview', path: '/patient', icon: HeartPulse },
        { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
        { label: 'Patients Directory', path: '/patient/patients', icon: Users },
        { label: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
        { label: 'Medical Records', path: '/patient/records', icon: FileText },
      ] 
    : [
        { label: 'Overview', path: '/patient', icon: HeartPulse },
        { label: 'User Accounts', path: '/patient/users', icon: Users },
        { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
        { label: 'Medical Records', path: '/patient/records', icon: FileText },
      ]

  return <div className="dashboard"><aside className="sidebar"><Logo /><nav>{links.map(({ label, path, icon: Icon }) => <Link className={location === path ? 'active' : ''} to={path} key={path}><Icon size={17} />{label}</Link>)}</nav><div className="sidebar-bottom"><Link to="/patient/help"><ShieldCheck size={17} /> Help & privacy</Link><button className="sidebar-account" onClick={logout}><span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span><span>{user.name}<small>{user.role}</small></span><ChevronDown size={15} /></button></div></aside><main className="dashboard-main"><header className="dashboard-header"><div><span className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>Good morning, {user.name.split(' ')[0]} <span>✦</span></h1></div><div className="dashboard-actions"><Link className="notification notification-badge" to="/patient/notifications" aria-label="Notifications"><Bell size={19} color="#52645c" />{unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}</Link><span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span></div></header>{children}</main></div>
}

function DashboardHome() {
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  useEffect(() => { api.reminders().then(result => setReminders(result.reminders)).catch(() => undefined) }, [])
  return <div className="dashboard-grid"><section className="welcome-card"><div><span className="eyebrow">Your wellness snapshot</span><h2>Small steps add up<br />to <em>feeling better.</em></h2><p>You are doing well this week. Keep taking it one day at a time.</p><Link to="/patient/records">View health summary <ArrowRight size={15} /></Link></div><div className="dashboard-ring"><strong>84</strong><small>wellness<br />score</small></div></section><section className="appointment-card"><div className="card-title"><div><span className="eyebrow">Care planning</span><h3>Book your next visit</h3></div><span className="feature-icon feature-1"><Stethoscope size={19} /></span></div><p>Find a clinician and choose a time that works for you.</p><button className="outline-button" onClick={() => navigate('/patient/appointments')}>Find an appointment <ArrowRight size={15} /></button></section><section className="dashboard-card activity-card"><div className="card-title"><div><span className="eyebrow">This week</span><h3>Your activity</h3></div></div><div className="chart"><div className="chart-line" /><div className="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div></section><section className="dashboard-card reminders"><div className="card-title"><div><span className="eyebrow">Stay on track</span><h3>Today’s reminders</h3></div><Link to="/patient/reminders">Manage</Link></div>{reminders.slice(0, 3).map(reminder => <div className="reminder-row" key={reminder.id}><span className={reminder.active ? 'reminder-check done' : 'reminder-check'}>{reminder.active && <Check size={12} />}</span><span>{reminder.medicineName} · {reminder.dosage}</span><small>{reminder.schedule}</small></div>)}{reminders.length === 0 && <p className="empty-state">No reminders yet. Add one to stay on track.</p>}</section><section className="ai-prompt"><div className="icon-bubble purple"><Sparkles size={18} /></div><div><strong>Have a health question?</strong><p>Ask Carely for a safe, plain-language explanation.</p></div><button className="round-arrow" onClick={() => navigate('/patient/assistant')}>→</button></section></div>
}

function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('10:00 AM')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = () => Promise.all([api.appointments(), api.doctors()]).then(([a, d]) => { setAppointments(a.appointments); setDoctors(d.doctors) }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load appointments'))
  useEffect(() => { void load() }, [])
  async function book(event: React.FormEvent) { event.preventDefault(); setError(''); setNotice(''); try { await api.createAppointment({ doctorId, date, slot, notes: notes || undefined }); setNotice('Appointment requested successfully'); setDate(''); setNotes(''); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to book appointment') } }
  async function cancel(id: string) { await api.cancelAppointment(id); await load() }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Care planning</span><h2>Appointments</h2><p>Book and manage your visits with your care team.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={book}><h3>Book a visit</h3><label>Clinician<select value={doctorId} onChange={event => setDoctorId(event.target.value)} required><option value="">Choose a clinician</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></label><label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label>Time<select value={slot} onChange={event => setSlot(event.target.value)}><option>10:00 AM</option><option>2:00 PM</option><option>4:30 PM</option></select></label><label>Reason / Notes <span className="optional">(optional)</span><input value={notes} onChange={event => setNotes(event.target.value)} placeholder="e.g. Check blood work, follow-up" /></label><ErrorMessage error={error} />{notice && <p className="success-message">{notice}</p>}<button className="button" type="submit">Request appointment <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Your appointments</h3><span>{appointments.length} total</span></div>{appointments.map(item => <div className="list-row" key={item.id}><div><strong>{doctors.find(doctor => doctor.id === item.doctorId)?.name ?? 'Care team member'}</strong><small>{item.date} · {item.slot}{item.notes ? ` · ${item.notes}` : ''}</small></div><button className="text-button" onClick={() => cancel(item.id)} disabled={item.status !== 'scheduled'}>{item.status === 'scheduled' ? 'Cancel' : item.status}</button></div>)}{appointments.length === 0 && <p className="empty-state">No appointments yet.</p>}</section></div></div>
}

function Reminders() {
  const [items, setItems] = useState<Reminder[]>([])
  const [form, setForm] = useState({ medicineName: '', dosage: '', schedule: '8:00 AM' })
  const [error, setError] = useState('')
  const load = () => api.reminders().then(result => setItems(result.reminders)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load reminders'))
  useEffect(() => { void load() }, [])
  async function add(event: React.FormEvent) { event.preventDefault(); try { await api.createReminder(form); setForm({ medicineName: '', dosage: '', schedule: '8:00 AM' }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to add reminder') } }
  async function toggle(item: Reminder) { await api.toggleReminder(item.id, !item.active); await load() }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Medication adherence</span><h2>Reminders</h2><p>Keep important routines visible without adding mental load.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={add}><h3>Add a reminder</h3><label>Medicine or habit<input value={form.medicineName} onChange={event => setForm({ ...form, medicineName: event.target.value })} placeholder="Vitamin D" required /></label><label>Dosage or detail<input value={form.dosage} onChange={event => setForm({ ...form, dosage: event.target.value })} placeholder="1000 IU" required /></label><label>Schedule<input value={form.schedule} onChange={event => setForm({ ...form, schedule: event.target.value })} placeholder="8:00 AM" required /></label><ErrorMessage error={error} /><button className="button" type="submit">Add reminder <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Your reminders</h3><span>{items.length} saved</span></div>{items.map(item => <div className="list-row" key={item.id}><div><strong>{item.medicineName}</strong><small>{item.dosage} · {item.schedule}</small></div><button className={item.active ? 'toggle active' : 'toggle'} onClick={() => toggle(item)}>{item.active ? 'Active' : 'Paused'}</button></div>)}{items.length === 0 && <p className="empty-state">Add your first medication or wellbeing reminder.</p>}</section></div></div>
}

function Records() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [form, setForm] = useState({ title: '', reportType: 'Lab result', fileUrl: '' })
  const [error, setError] = useState('')
  const load = () => api.records().then(result => setRecords(result.records)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load records'))
  useEffect(() => { void load() }, [])
  async function add(event: React.FormEvent) { event.preventDefault(); try { await api.createRecord({ ...form, fileUrl: form.fileUrl || undefined }); setForm({ title: '', reportType: 'Lab result', fileUrl: '' }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save record') } }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Your health story</span><h2>Medical records</h2><p>Keep reports and notes available for the right conversation.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={add}><h3>Add a record</h3><label>Title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Annual blood work" required /></label><label>Type<select value={form.reportType} onChange={event => setForm({ ...form, reportType: event.target.value })}><option>Lab result</option><option>Imaging</option><option>Prescription</option><option>Visit note</option></select></label><label>Secure file URL <span className="optional">(optional)</span><input type="url" value={form.fileUrl} onChange={event => setForm({ ...form, fileUrl: event.target.value })} placeholder="https://..." /></label><ErrorMessage error={error} /><button className="button" type="submit">Save record <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Saved records</h3><span>{records.length} total</span></div>{records.map(record => <div className="list-row" key={record.id}><div><strong>{record.title}</strong><small>{record.reportType} · {new Date(record.uploadDate).toLocaleDateString()}</small></div>{record.fileUrl ? <a className="text-button" href={record.fileUrl} target="_blank" rel="noreferrer">Open</a> : <span className="muted-label">Saved</span>}</div>)}{records.length === 0 && <p className="empty-state">No records yet. Add a report or visit note.</p>}</section></div></div>
}

function PrescriptionsView({ userRole }: { userRole: Role }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [patientId, setPatientId] = useState('')
  const [medicineName, setMedicineName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('Once daily with food')
  const [duration, setDuration] = useState('7 days')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () => {
    api.prescriptions().then(res => setPrescriptions(res.prescriptions)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load prescriptions'))
    if (userRole === 'doctor' || userRole === 'admin') {
      api.patients().then(res => setPatients(res.patients)).catch(() => undefined)
    }
  }

  useEffect(() => { load() }, [userRole])

  async function prescribe(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api.createPrescription({ patientId, medicineName, dosage, frequency, duration, instructions })
      setNotice('Prescription issued successfully')
      setMedicineName('')
      setDosage('')
      setInstructions('')
      load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to issue prescription')
    }
  }

  async function toggleStatus(p: Prescription) {
    const nextStatus = p.status === 'active' ? 'completed' : 'active'
    await api.togglePrescription(p.id, nextStatus)
    load()
  }

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Medication management</span><h2>Prescriptions</h2><p>{userRole === 'doctor' ? 'Issue and review digital prescriptions for your patients.' : 'Review current prescriptions prescribed by your clinicians.'}</p></div></div>
    <div className={userRole === 'patient' ? 'dashboard-card' : 'content-columns'}>
      {(userRole === 'doctor' || userRole === 'admin') && (
        <form className="dashboard-card form-card" onSubmit={prescribe}>
          <h3>Issue Prescription</h3>
          <label>Select Patient
            <select value={patientId} onChange={e => setPatientId(e.target.value)} required>
              <option value="">Choose patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
            </select>
          </label>
          <label>Medicine Name<input value={medicineName} onChange={e => setMedicineName(e.target.value)} placeholder="e.g. Amoxicillin" required /></label>
          <label>Dosage<input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500 mg" required /></label>
          <label>Frequency<input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. Twice daily" required /></label>
          <label>Duration<input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 10 days" required /></label>
          <label>Special Instructions<input value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Take after meal" /></label>
          <ErrorMessage error={error} />
          {notice && <p className="success-message">{notice}</p>}
          <button className="button" type="submit">Issue Prescription <ArrowRight size={15} /></button>
        </form>
      )}

      <section className={userRole === 'patient' ? '' : 'dashboard-card list-card'}>
        <div className="card-title"><h3>{userRole === 'doctor' ? 'Issued Prescriptions' : 'Your Prescriptions'}</h3><span>{prescriptions.length} total</span></div>
        {prescriptions.map(p => (
          <div className="list-row" key={p.id} style={{ alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>{p.medicineName} · {p.dosage}</strong>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
              <small>{p.frequency} · Duration: {p.duration}</small>
              <small style={{ color: '#6d7e77', marginTop: '3px' }}>Prescribed by: {p.doctorName} on {p.date}</small>
              {p.instructions && <small style={{ color: '#889891', fontStyle: 'italic', marginTop: '2px' }}>Note: {p.instructions}</small>}
            </div>
            {(userRole === 'doctor' || userRole === 'admin') && (
              <button className="text-button" onClick={() => toggleStatus(p)}>
                {p.status === 'active' ? 'Mark Completed' : 'Reactivate'}
              </button>
            )}
          </div>
        ))}
        {prescriptions.length === 0 && <p className="empty-state">No prescriptions on record.</p>}
      </section>
    </div>
  </div>
}

function PatientsDirectory() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.patients().then(res => setPatients(res.patients)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load patients directory'))
  }, [])

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Clinical care</span><h2>Patient Directory</h2><p>Review registered patients under your care and monitor clinical records.</p></div></div>
    <input className="search-input" placeholder="Search patients by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
    <ErrorMessage error={error} />
    <div style={{ display: 'grid', gap: '12px' }}>
      {filtered.map(patient => (
        <div className="patient-card" key={patient.id}>
          <div className="patient-card-header">
            <div>
              <strong>{patient.name}</strong>
              <small style={{ display: 'block', color: '#7a8983' }}>{patient.email}</small>
            </div>
            <span className="badge badge-patient">Patient</span>
          </div>
          <div className="patient-stats-pill">
            <span>📅 {patient.totalAppointments} appointments</span>
            <span>📂 {patient.totalRecords} records</span>
            <span>💊 {patient.totalPrescriptions} prescriptions</span>
            <span>Last visit: {patient.lastAppointment}</span>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="empty-state">No matching patients found.</p>}
    </div>
  </div>
}

function UserManagement() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () => api.users().then(res => setUsers(res.users)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load user accounts'))

  useEffect(() => { load() }, [])

  async function updateRole(id: string, role: Role) {
    setError('')
    try {
      await api.updateUserRole(id, role)
      setNotice('User role updated successfully')
      load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update role')
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user account?')) return
    setError('')
    try {
      await api.deleteUser(id)
      setNotice('User account deleted')
      load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete user')
    }
  }

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Platform Administration</span><h2>User Management</h2><p>Review all registered users and assign permissions.</p></div></div>
    <input className="search-input" placeholder="Search users by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
    <ErrorMessage error={error} />
    {notice && <p className="success-message">{notice}</p>}
    <div className="dashboard-card">
      <div className="card-title"><h3>Platform Accounts</h3><span>{filtered.length} users</span></div>
      {filtered.map(user => (
        <div className="user-row" key={user.id}>
          <div>
            <strong>{user.name}</strong>
            <small style={{ color: '#7a8983', display: 'block' }}>{user.email}</small>
          </div>
          <select value={user.role} onChange={e => updateRole(user.id, e.target.value as Role)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          <button className="text-button" style={{ color: '#b86155' }} onClick={() => deleteUser(user.id)} title="Delete account">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      {filtered.length === 0 && <p className="empty-state">No users found.</p>}
    </div>
  </div>
}

function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'appointment' | 'medication' | 'system'>('all')
  const [error, setError] = useState('')

  const load = () => api.notifications().then(res => setNotifications(res.notifications)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load notifications'))

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    await api.markNotificationRead(id)
    load()
  }

  async function markAllRead() {
    await api.markAllNotificationsRead()
    load()
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'all') return true
    return n.type === filter
  })

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Updates & Alerts</span><h2>Notifications</h2><p>Stay informed about your appointments, routines, and messages.</p></div><button className="text-button" onClick={markAllRead}>Mark all as read</button></div>
    <div className="filter-tabs">
      <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({notifications.length})</button>
      <button className={`filter-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread ({notifications.filter(n => !n.read).length})</button>
      <button className={`filter-tab ${filter === 'appointment' ? 'active' : ''}`} onClick={() => setFilter('appointment')}>Appointments</button>
      <button className={`filter-tab ${filter === 'medication' ? 'active' : ''}`} onClick={() => setFilter('medication')}>Medication</button>
      <button className={`filter-tab ${filter === 'system' ? 'active' : ''}`} onClick={() => setFilter('system')}>System</button>
    </div>
    <ErrorMessage error={error} />
    <div>
      {filtered.map(item => (
        <div className={`notification-item ${item.read ? '' : 'unread'}`} key={item.id} onClick={() => markRead(item.id)}>
          <div className={`notification-icon feature-${item.type === 'appointment' ? '0' : item.type === 'medication' ? '1' : '2'}`}>
            {item.type === 'appointment' ? <CalendarDays size={16} /> : item.type === 'medication' ? <Clock3 size={16} /> : <ShieldCheck size={16} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{item.title}</strong>
              <small style={{ color: '#8d9c95' }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#566961' }}>{item.message}</p>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="empty-state">No notifications in this view.</p>}
    </div>
  </div>
}

function HelpAndPrivacyView() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [feedback, setFeedback] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const faqs = [
    { q: 'How does Carely protect my personal health data?', a: 'Carely uses industry-standard HttpOnly session tokens, encryption in transit (HTTPS), and isolated role permissions. Your medical notes and consultation records are only accessible to you and your authorized clinical care team.' },
    { q: 'Does Carely provide official medical diagnoses?', a: 'No. Carely is an educational health navigation companion. It helps you prepare questions, organize symptoms, and track routines, but is not a substitute for clinical diagnosis, prescription, or emergency care.' },
    { q: 'How do I share my medical records with my doctor?', a: 'Any records you save in the Medical Records hub are securely available to clinicians during your scheduled consultations on Carely.' },
    { q: 'What should I do in a medical emergency?', a: 'If you or someone around you is experiencing severe symptoms (such as acute chest pain, severe shortness of breath, or sudden weakness), please call your local emergency number (911 / 112) immediately.' },
  ]

  function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    setFeedbackSent(true)
    setFeedback('')
  }

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Support & Resources</span><h2>Help & Privacy Center</h2><p>Learn how Carely works and how your privacy is protected.</p></div></div>
    <div className="emergency-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18} /><strong>Immediate Medical Emergencies</strong></div>
      <p>Carely does not provide emergency medical interventions. In life-threatening emergencies, immediately call <strong>911</strong> (US/Canada) or <strong>112</strong> (Europe) or proceed to the nearest emergency department.</p>
    </div>
    <div className="dashboard-card" style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '16px' }}>Frequently Asked Questions</h3>
      {faqs.map((faq, index) => (
        <div className="faq-item" key={faq.q}>
          <button className="faq-header" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
            <span>{faq.q}</span>
            {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openFaq === index && <div className="faq-content">{faq.a}</div>}
        </div>
      ))}
    </div>
    <div className="dashboard-card form-card">
      <h3>Contact Care Team Support</h3>
      <p style={{ fontSize: '13px', color: '#667770', marginBottom: '14px' }}>Have questions about your account, records, or care plan? Send our team a message.</p>
      {feedbackSent ? <p className="success-message">Thank you. Your support request has been received by our patient care team.</p> : (
        <form onSubmit={submitFeedback}>
          <textarea style={{ width: '100%', minHeight: '90px', padding: '12px', borderRadius: '9px', border: '1px solid #dce5df', outline: 0 }} placeholder="How can we assist you today?" value={feedback} onChange={e => setFeedback(e.target.value)} required />
          <button className="button" style={{ marginTop: '12px' }} type="submit">Send Message <ArrowRight size={15} /></button>
        </form>
      )}
    </div>
  </div>
}

function Assistant() {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function ask(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { setReply((await api.askAi(message)).reply); setMessage('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reach Carely') } finally { setLoading(false) } }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Clarity without diagnosis</span><h2>AI assistant</h2><p>Ask health education questions. Carely does not diagnose or prescribe.</p></div></div><section className="assistant-card"><div className="assistant-intro"><div className="icon-bubble purple"><Sparkles size={22} /></div><h3>What would you like to understand?</h3><p>Share a question about a report, medication, or preparing for a clinician visit.</p></div>{reply && <div className="assistant-reply"><strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> Carely Guidance</strong><p style={{ whiteSpace: 'pre-line' }}>{reply}</p></div>}<form onSubmit={ask} className="assistant-form"><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="For example: What questions should I ask about my lab report?" required maxLength={2000} /><ErrorMessage error={error} /><button className="button" disabled={loading}>{loading ? 'Thinking…' : 'Ask Carely'} <ArrowRight size={15} /></button></form></section></div>
}

function ProfessionalHome({ role }: { role: 'doctor' | 'admin' }) {
  const [stats, setStats] = useState({ appointments: 0, scheduledAppointments: 0, patientsCount: 0, prescriptionsCount: 0, followUpsCount: 0, users: 0, doctors: 0, records: 0 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (role === 'admin') {
      api.adminStats().then(result => setStats(current => ({ ...current, ...result.stats, patientsCount: result.stats.patients || 0, prescriptionsCount: result.stats.prescriptions || 0 }))).catch(cause => setMessage(cause instanceof Error ? cause.message : 'Unable to load analytics'))
    } else {
      api.doctorStats().then(result => setStats(current => ({ ...current, ...result.stats }))).catch(cause => setMessage(cause instanceof Error ? cause.message : 'Unable to load doctor stats'))
    }
  }, [role])

  const cards = role === 'admin'
    ? [['Total Users', stats.users], ['Doctors', stats.doctors], ['Appointments', stats.appointments], ['Records', stats.records]]
    : [['Total Appointments', stats.appointments], ['Active Consultations', stats.scheduledAppointments], ['Patients Under Care', stats.patientsCount], ['Prescriptions Issued', stats.prescriptionsCount]]

  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">{role === 'admin' ? 'Platform operations' : 'Care team workspace'}</span><h2>{role === 'admin' ? 'Admin dashboard' : 'Doctor dashboard'}</h2><p>{role === 'admin' ? 'Monitor the health of the Carely platform.' : 'Keep appointments, clinical records, and follow-up care organized.'}</p></div></div>
    <div className="stats-grid">{cards.map(([label, value]) => <section className="dashboard-card stat-card" key={String(label)}><span className="eyebrow">{label}</span><strong>{value}</strong></section>)}</div>
    {message && <ErrorMessage error={message} />}
    <section className="dashboard-card help-card">
      <h3>Quick Actions</h3>
      <p>{role === 'admin' ? 'Review account roles and permissions or inspect platform data.' : 'Open patient directory to review case files or issue medication prescriptions.'}</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {role === 'doctor' && <Link className="button" to="/patient/patients">Patient Directory <ArrowRight size={15} /></Link>}
        {role === 'doctor' && <Link className="button" style={{ background: '#4d8668' }} to="/patient/prescriptions">Issue Prescription <Pill size={15} /></Link>}
        {role === 'admin' && <Link className="button" to="/patient/users">Manage Accounts <ArrowRight size={15} /></Link>}
        <Link className="button button-light" to="/patient/appointments">Appointments</Link>
      </div>
    </section>
  </div>
}

function ProtectedDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.me().then(setUser).catch(cause => setError(cause instanceof Error ? cause.message : 'Please log in')) }, [])
  if (error) return <div className="auth-panel"><div className="auth-form"><h1>Session required</h1><p>{error}</p><Link className="button" to="/login">Log in <ArrowRight size={15} /></Link></div></div>
  if (!user) return <div className="loading-screen">Loading your secure workspace…</div>
  return <DashboardLayout user={user}>
    <Routes>
      <Route index element={user.role === 'patient' ? <DashboardHome /> : <ProfessionalHome role={user.role} />} />
      <Route path="appointments" element={<Appointments />} />
      <Route path="records" element={<Records />} />
      <Route path="reminders" element={<Reminders />} />
      <Route path="assistant" element={<Assistant />} />
      <Route path="prescriptions" element={<PrescriptionsView userRole={user.role} />} />
      <Route path="patients" element={<PatientsDirectory />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="notifications" element={<NotificationsView />} />
      <Route path="help" element={<HelpAndPrivacyView />} />
      <Route path="*" element={<DashboardHome />} />
    </Routes>
  </DashboardLayout>
}

export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth register />} /><Route path="/patient/*" element={<ProtectedDashboard />} /><Route path="*" element={<Landing />} /></Routes>
}
