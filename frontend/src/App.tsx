import { motion } from 'framer-motion'
import { ArrowRight, Brain, CalendarDays, Check, ChevronDown, Clock3, FileText, HeartPulse, Menu, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { api, type Appointment, type Doctor, type MedicalRecord, type Reminder, type SessionUser } from './services/api'

type Role = 'Patient' | 'Doctor' | 'Admin'

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
  const [role, setRole] = useState<SessionUser['role']>('patient')
  const [specialty, setSpecialty] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit() {
    setError('')
    setLoading(true)
    try {
      if (register) await api.register({ name, email, password, role, specialty: role === 'doctor' ? specialty : undefined })
      else await api.login({ email, password })
      navigate('/patient')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally { setLoading(false) }
  }
  return <div className="auth-page"><div className="auth-brand"><Logo /><div className="auth-quote"><h2>Care that feels<br /><em>human.</em></h2><p>“The best healthcare experience I have ever had. Everything feels calm, clear, and genuinely made for me.”</p><small>— Jordan Lee, Carely member</small></div></div><div className="auth-panel"><Link className="back-link" to="/">← Back to home</Link><div className="auth-form"><div className="eyebrow">{register ? 'Welcome to Carely' : 'Welcome back'}</div><h1>{register ? 'Start feeling supported.' : 'Good to see you again.'}</h1><p>{register ? 'Create your free account in less than a minute.' : 'Log in to pick up where you left off.'}</p>{register && <><label>Full name<input value={name} onChange={event => setName(event.target.value)} placeholder="Alex Morgan" /></label><label>Account type<select value={role} onChange={event => setRole(event.target.value as SessionUser['role'])}><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="admin">Administrator</option></select></label>{role === 'doctor' && <label>Specialty<input value={specialty} onChange={event => setSpecialty(event.target.value)} placeholder="General medicine" /></label>}</>}<label>Email address<input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="you@example.com" /></label><label>Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="••••••••" /></label>{!register && <a className="forgot" href="#login">Forgot password?</a>}{error && <p className="form-error">{error}</p>}<button className="button auth-submit" disabled={loading} onClick={submit}>{loading ? 'Please wait…' : register ? 'Create my account' : 'Log in'} {!loading && <ArrowRight size={17} />}</button><div className="divider"><span>or continue with</span></div><button className="social-button" type="button" onClick={() => setError('Social sign-in is not configured yet. Use email and password.')}>◎ Continue with Google</button><p className="switch-auth">{register ? 'Already have an account?' : 'New to Carely?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div></div></div>
}

const nav = [
  { label: 'Overview', path: '/patient', icon: HeartPulse },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Medical records', path: '/patient/records', icon: FileText },
  { label: 'Reminders', path: '/patient/reminders', icon: Clock3 },
  { label: 'AI assistant', path: '/patient/assistant', icon: Sparkles },
]

function ErrorMessage({ error }: { error: string }) {
  return error ? <p className="form-error" role="alert">{error}</p> : null
}

function DashboardLayout({ children, user }: { children: ReactNode; user: SessionUser }) {
  const location = window.location.pathname
  const navigate = useNavigate()
  async function logout() { await api.logout(); navigate('/login') }
  const links = user.role === 'patient' ? nav : user.role === 'doctor' ? [{ label: 'Overview', path: '/patient', icon: HeartPulse }, { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays }, { label: 'Patients', path: '/patient/patients', icon: FileText }, { label: 'Prescriptions', path: '/patient/prescriptions', icon: ShieldCheck }] : [{ label: 'Overview', path: '/patient', icon: HeartPulse }, { label: 'Users', path: '/patient/users', icon: FileText }, { label: 'Analytics', path: '/patient/analytics', icon: CalendarDays }]
  return <div className="dashboard"><aside className="sidebar"><Logo /><nav>{links.map(({ label, path, icon: Icon }) => <Link className={location === path ? 'active' : ''} to={path} key={path}><Icon size={17} />{label}</Link>)}</nav><div className="sidebar-bottom"><Link to="/patient/help"><ShieldCheck size={17} /> Help & privacy</Link><button className="sidebar-account" onClick={logout}><span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span><span>{user.name}<small>{user.role}</small></span><ChevronDown size={15} /></button></div></aside><main className="dashboard-main"><header className="dashboard-header"><div><span className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>Good morning, {user.name.split(' ')[0]} <span>✦</span></h1></div><div className="dashboard-actions"><Link className="notification" to="/patient/notifications" aria-label="Notifications">●</Link><span className="profile-avatar">{user.name.slice(0, 2).toUpperCase()}</span></div></header>{children}</main></div>
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
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = () => Promise.all([api.appointments(), api.doctors()]).then(([a, d]) => { setAppointments(a.appointments); setDoctors(d.doctors) }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load appointments'))
  useEffect(() => { void load() }, [])
  async function book(event: React.FormEvent) { event.preventDefault(); setError(''); setNotice(''); try { await api.createAppointment({ doctorId, date, slot }); setNotice('Appointment requested successfully'); setDate(''); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to book appointment') } }
  async function cancel(id: string) { await api.cancelAppointment(id); await load() }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Care planning</span><h2>Appointments</h2><p>Book and manage your visits with your care team.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={book}><h3>Book a visit</h3><label>Clinician<select value={doctorId} onChange={event => setDoctorId(event.target.value)} required><option value="">Choose a clinician</option>{doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select></label><label>Date<input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label>Time<select value={slot} onChange={event => setSlot(event.target.value)}><option>10:00 AM</option><option>2:00 PM</option><option>4:30 PM</option></select></label><ErrorMessage error={error} />{notice && <p className="success-message">{notice}</p>}<button className="button" type="submit">Request appointment <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Your appointments</h3><span>{appointments.length} total</span></div>{appointments.map(item => <div className="list-row" key={item.id}><div><strong>{doctors.find(doctor => doctor.id === item.doctorId)?.name ?? 'Care team member'}</strong><small>{item.date} · {item.slot}</small></div><button className="text-button" onClick={() => cancel(item.id)} disabled={item.status !== 'scheduled'}>{item.status === 'scheduled' ? 'Cancel' : item.status}</button></div>)}{appointments.length === 0 && <p className="empty-state">No appointments yet.</p>}</section></div></div>
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const load = () => api.appointments().then(result => setAppointments(result.appointments)).catch(() => undefined)
  useEffect(() => { void load() }, [])
  async function change(id: string, status: Appointment['status']) { await api.updateAppointmentStatus(id, status); await load() }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Doctor workspace</span><h2>Appointment requests</h2><p>Review your schedule and keep patients informed.</p></div></div><section className="dashboard-card list-card">{appointments.map(item => <div className="list-row" key={item.id}><div><strong>{item.date} · {item.slot}</strong><small>{item.notes || 'Patient appointment request'}</small></div><div className="row-actions"><span className="muted-label">{item.status}</span>{item.status === 'scheduled' && <><button className="text-button" onClick={() => change(item.id, 'completed')}>Complete</button><button className="text-button danger" onClick={() => change(item.id, 'cancelled')}>Cancel</button></>}</div></div>)}{appointments.length === 0 && <p className="empty-state">No appointment requests yet.</p>}</section></div>
}

function Reminders() {
  const [items, setItems] = useState<Reminder[]>([])
  const [form, setForm] = useState({ medicineName: '', dosage: '', schedule: '8:00 AM' })
  const [error, setError] = useState('')
  const load = () => api.reminders().then(result => setItems(result.reminders)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load reminders'))
  useEffect(() => { void load() }, [])
  async function add(event: React.FormEvent) { event.preventDefault(); try { await api.createReminder(form); setForm({ medicineName: '', dosage: '', schedule: '8:00 AM' }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to add reminder') } }
  async function toggle(item: Reminder) { await api.toggleReminder(item.id, !item.active); await load() }
  async function remove(id: string) { await api.deleteReminder(id); await load() }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Medication adherence</span><h2>Reminders</h2><p>Keep important routines visible without adding mental load.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={add}><h3>Add a reminder</h3><label>Medicine or habit<input value={form.medicineName} onChange={event => setForm({ ...form, medicineName: event.target.value })} placeholder="Vitamin D" required /></label><label>Dosage or detail<input value={form.dosage} onChange={event => setForm({ ...form, dosage: event.target.value })} placeholder="1000 IU" required /></label><label>Schedule<input value={form.schedule} onChange={event => setForm({ ...form, schedule: event.target.value })} placeholder="8:00 AM" required /></label><ErrorMessage error={error} /><button className="button" type="submit">Add reminder <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Your reminders</h3><span>{items.length} saved</span></div>{items.map(item => <div className="list-row" key={item.id}><div><strong>{item.medicineName}</strong><small>{item.dosage} · {item.schedule}</small></div><div className="row-actions"><button className={item.active ? 'toggle active' : 'toggle'} onClick={() => toggle(item)}>{item.active ? 'Active' : 'Paused'}</button><button className="text-button danger" onClick={() => remove(item.id)}>Delete</button></div></div>)}{items.length === 0 && <p className="empty-state">Add your first medication or wellbeing reminder.</p>}</section></div></div>
}

function Records() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [form, setForm] = useState({ title: '', reportType: 'Lab result', fileUrl: '' })
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const load = () => api.records(filter || undefined).then(result => setRecords(result.records)).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load records'))
  useEffect(() => { void load() }, [filter])
  async function add(event: React.FormEvent) { event.preventDefault(); try { await api.createRecord({ ...form, fileUrl: form.fileUrl || undefined }); setForm({ title: '', reportType: 'Lab result', fileUrl: '' }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save record') } }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Your health story</span><h2>Medical records</h2><p>Keep reports and notes available for the right conversation.</p></div></div><div className="content-columns"><form className="dashboard-card form-card" onSubmit={add}><h3>Add a record</h3><label>Title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Annual blood work" required /></label><label>Type<select value={form.reportType} onChange={event => setForm({ ...form, reportType: event.target.value })}><option>Lab result</option><option>Imaging</option><option>Prescription</option><option>Visit note</option></select></label><label>Secure file URL <span className="optional">(optional)</span><input type="url" value={form.fileUrl} onChange={event => setForm({ ...form, fileUrl: event.target.value })} placeholder="https://..." /></label><ErrorMessage error={error} /><button className="button" type="submit">Save record <ArrowRight size={15} /></button></form><section className="dashboard-card list-card"><div className="card-title"><h3>Saved records</h3><select value={filter} onChange={event => setFilter(event.target.value)}><option value="">All types</option><option>Lab result</option><option>Imaging</option><option>Prescription</option><option>Visit note</option></select></div>{records.map(record => <div className="list-row" key={record.id}><div><strong>{record.title}</strong><small>{record.reportType} · {new Date(record.uploadDate).toLocaleDateString()}</small></div>{record.fileUrl ? <a className="text-button" href={record.fileUrl} target="_blank" rel="noreferrer">Open</a> : <span className="muted-label">Saved</span>}</div>)}{records.length === 0 && <p className="empty-state">No records yet. Add a report or visit note.</p>}</section></div></div>
}

function Assistant() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function ask(event: React.FormEvent) { event.preventDefault(); const question = message.trim(); if (!question) return; setLoading(true); setError(''); setMessages(current => [...current, { role: 'user', text: question }]); try { const result = await api.askAi(question); setMessages(current => [...current, { role: 'assistant', text: result.reply }]); setMessage('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reach Carely') } finally { setLoading(false) } }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Clarity without diagnosis</span><h2>AI assistant</h2><p>Ask health education questions. Carely does not diagnose or prescribe.</p></div><button className="text-button" onClick={() => setMessages([])}>Clear chat</button></div><section className="assistant-card"><div className="assistant-intro"><div className="icon-bubble purple"><Sparkles size={22} /></div><h3>What would you like to understand?</h3><p>Share a question about a report, medication, or preparing for a clinician visit.</p></div><div className="assistant-history">{messages.map((item, index) => <div className={item.role === 'user' ? 'message user-message' : 'message assistant-message'} key={`${item.role}-${index}`}><strong>{item.role === 'user' ? 'You' : 'Carely'}</strong><p>{item.text}</p></div>)}</div><form onSubmit={ask} className="assistant-form"><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="For example: What questions should I ask about my lab report?" required maxLength={2000} /><ErrorMessage error={error} /><button className="button" disabled={loading}>{loading ? 'Thinking…' : 'Ask Carely'} <ArrowRight size={15} /></button></form></section></div>
}

function ProfessionalHome({ role }: { role: 'doctor' | 'admin' }) {
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointments: 0, records: 0 })
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (role === 'admin') api.adminStats().then(result => setStats(result.stats)).catch(cause => setMessage(cause instanceof Error ? cause.message : 'Unable to load analytics'))
    else api.appointments().then(result => setStats(current => ({ ...current, appointments: result.appointments.length }))).catch(cause => setMessage(cause instanceof Error ? cause.message : 'Unable to load appointments'))
  }, [role])
  const cards = role === 'admin' ? [['Users', stats.users], ['Doctors', stats.doctors], ['Appointments', stats.appointments], ['Records', stats.records]] : [['Today’s appointments', stats.appointments], ['Follow-ups', 0], ['Patients seen', 0], ['Prescriptions', 0]]
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">{role === 'admin' ? 'Platform operations' : 'Care team workspace'}</span><h2>{role === 'admin' ? 'Admin dashboard' : 'Doctor dashboard'}</h2><p>{role === 'admin' ? 'Monitor the health of the Carely platform.' : 'Keep appointments and follow-up care organized.'}</p></div></div><div className="stats-grid">{cards.map(([label, value]) => <section className="dashboard-card stat-card" key={String(label)}><span className="eyebrow">{label}</span><strong>{value}</strong></section>)}</div>{message && <ErrorMessage error={message} />}<section className="dashboard-card help-card"><h3>Operational next steps</h3><p>{role === 'admin' ? 'Review account activity and maintain role access as your care network grows.' : 'Open appointments to review your schedule and keep patient conversations focused.'}</p><Link className="button" to="/patient/appointments">Open appointments <ArrowRight size={15} /></Link></section></div>
}

function Notifications() {
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; createdAt: string }>>([])
  useEffect(() => { api.notifications().then(result => setItems(result.notifications)).catch(() => undefined) }, [])
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Stay informed</span><h2>Notifications</h2><p>Appointment updates, active reminders, and important system notices.</p></div></div><section className="dashboard-card list-card">{items.map(item => <div className="list-row" key={item.id}><div><strong>{item.title}</strong><small>{item.body} · {new Date(item.createdAt).toLocaleString()}</small></div></div>)}{items.length === 0 && <p className="empty-state">You have no new notifications.</p>}</section></div>
}

function DoctorPatients() {
  const [patients, setPatients] = useState<SessionUser[]>([])
  const [selected, setSelected] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => { api.doctorPatients().then(result => setPatients(result.patients)).catch(() => undefined) }, [])
  async function prescribe(event: React.FormEvent) { event.preventDefault(); await api.createPrescription({ patientId: selected, title, summary }); setNotice('Clinical note saved to the patient record'); setTitle(''); setSummary('') }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Doctor workspace</span><h2>Patients & notes</h2><p>Review connected patients and add a prescription or clinical note.</p></div></div><div className="content-columns"><section className="dashboard-card list-card"><h3>My patients</h3>{patients.map(patient => <button className={selected === patient.id ? 'patient-select selected' : 'patient-select'} key={patient.id} onClick={() => setSelected(patient.id)}>{patient.name}<small>{patient.email}</small></button>)}{patients.length === 0 && <p className="empty-state">Patients appear after they book an appointment.</p>}</section><form className="dashboard-card form-card" onSubmit={prescribe}><h3>Add clinical note</h3><label>Patient<select value={selected} onChange={event => setSelected(event.target.value)} required><option value="">Choose patient</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label><label>Title<input value={title} onChange={event => setTitle(event.target.value)} placeholder="Follow-up plan" required /></label><label>Notes<textarea value={summary} onChange={event => setSummary(event.target.value)} placeholder="Medication, instructions, or clinical context" required /></label>{notice && <p className="success-message">{notice}</p>}<button className="button">Save prescription <ArrowRight size={15} /></button></form></div></div>
}

function AdminUsers() {
  const [users, setUsers] = useState<SessionUser[]>([])
  const [filter, setFilter] = useState('')
  const load = () => api.adminUsers().then(result => setUsers(result.users)).catch(() => undefined)
  useEffect(() => { void load() }, [])
  const visible = filter ? users.filter(user => user.role === filter) : users
  async function updateRole(id: string, role: SessionUser['role']) { await api.updateUserRole(id, role); await load() }
  async function remove(id: string) { if (window.confirm('Delete this user and associated records?')) { await api.deleteUser(id); await load() } }
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Platform governance</span><h2>User management</h2><p>Review accounts and manage access deliberately.</p></div><select className="filter-select" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All roles</option><option value="patient">Patients</option><option value="doctor">Doctors</option><option value="admin">Admins</option></select></div><section className="dashboard-card list-card">{visible.map(user => <div className="list-row" key={user.id}><div><strong>{user.name}</strong><small>{user.email} · {user.role}</small></div><div className="row-actions"><select value={user.role} onChange={event => updateRole(user.id, event.target.value as SessionUser['role'])}><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="admin">Admin</option></select><button className="text-button danger" onClick={() => remove(user.id)}>Delete</button></div></div>)}{visible.length === 0 && <p className="empty-state">No users match this filter.</p>}</section></div>
}

function ProtectedDashboard() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.me().then(setUser).catch(cause => setError(cause instanceof Error ? cause.message : 'Please log in')) }, [])
  if (error) return <div className="auth-panel"><div className="auth-form"><h1>Session required</h1><p>{error}</p><Link className="button" to="/login">Log in <ArrowRight size={15} /></Link></div></div>
  if (!user) return <div className="loading-screen">Loading your secure workspace…</div>
  return <DashboardLayout user={user}><Routes><Route index element={user.role === 'patient' ? <DashboardHome /> : <ProfessionalHome role={user.role} />} /><Route path="appointments" element={user.role === 'doctor' ? <DoctorAppointments /> : user.role === 'patient' ? <Appointments /> : <HelpPage title="Appointment monitoring" />} /><Route path="records" element={<Records />} /><Route path="reminders" element={user.role === 'patient' ? <Reminders /> : <HelpPage title="Reminder monitoring" />} /><Route path="assistant" element={<Assistant />} /><Route path="patients" element={user.role === 'doctor' ? <DoctorPatients /> : <HelpPage title="Patient directory" />} /><Route path="prescriptions" element={user.role === 'doctor' ? <DoctorPatients /> : <HelpPage title="Prescriptions" />} /><Route path="users" element={user.role === 'admin' ? <AdminUsers /> : <HelpPage title="User management" />} /><Route path="analytics" element={user.role === 'admin' ? <ProfessionalHome role="admin" /> : <HelpPage title="Analytics" />} /><Route path="help" element={<HelpPage />} /><Route path="notifications" element={<Notifications />} /></Routes></DashboardLayout>
}

function HelpPage({ title = 'Help & privacy' }: { title?: string }) {
  return <div className="content-page"><div className="page-title"><div><span className="eyebrow">Support</span><h2>{title}</h2><p>Carely keeps your health information private and gives you control over your next step.</p></div></div><section className="dashboard-card help-card"><h3>Need help?</h3><p>For urgent symptoms, contact local emergency services. For account questions, contact your care coordinator or support team.</p><a className="button" href="mailto:support@carely.example">Contact support <ArrowRight size={15} /></a></section></div>
}

export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth register />} /><Route path="/patient/*" element={<ProtectedDashboard />} /><Route path="*" element={<Landing />} /></Routes>
}
