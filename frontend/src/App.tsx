import { motion } from 'framer-motion'
import { ArrowRight, Brain, CalendarDays, Check, ChevronDown, Clock3, FileText, HeartPulse, Menu, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { api } from './services/api'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit() {
    setError('')
    setLoading(true)
    try {
      if (register) await api.register({ name, email, password })
      else await api.login({ email, password })
      navigate('/patient')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally { setLoading(false) }
  }
  return <div className="auth-page"><div className="auth-brand"><Logo /><div className="auth-quote"><h2>Care that feels<br /><em>human.</em></h2><p>“The best healthcare experience I have ever had. Everything feels calm, clear, and genuinely made for me.”</p><small>— Jordan Lee, Carely member</small></div></div><div className="auth-panel"><Link className="back-link" to="/">← Back to home</Link><div className="auth-form"><div className="eyebrow">{register ? 'Welcome to Carely' : 'Welcome back'}</div><h1>{register ? 'Start feeling supported.' : 'Good to see you again.'}</h1><p>{register ? 'Create your free account in less than a minute.' : 'Log in to pick up where you left off.'}</p>{register && <label>Full name<input value={name} onChange={event => setName(event.target.value)} placeholder="Alex Morgan" /></label>}<label>Email address<input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="you@example.com" /></label><label>Password<input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="••••••••" /></label>{!register && <a className="forgot" href="#login">Forgot password?</a>}{error && <p className="form-error">{error}</p>}<button className="button auth-submit" disabled={loading} onClick={submit}>{loading ? 'Please wait…' : register ? 'Create my account' : 'Log in'} {!loading && <ArrowRight size={17} />}</button><div className="divider"><span>or continue with</span></div><button className="social-button">◎ Continue with Google</button><p className="switch-auth">{register ? 'Already have an account?' : 'New to Carely?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p></div></div></div>
}

function Dashboard() {
  const [role, setRole] = useState<Role>('Patient')
  const navItems = role === 'Patient' ? ['Overview', 'Appointments', 'Medical records', 'Reminders', 'AI assistant'] : role === 'Doctor' ? ['Overview', 'Appointments', 'My patients', 'Prescriptions'] : ['Overview', 'Users', 'Doctors', 'Analytics']
  return <div className="dashboard"><aside className="sidebar"><Logo /><div className="role-switcher">{(['Patient', 'Doctor', 'Admin'] as Role[]).map(item => <button className={role === item ? 'selected' : ''} key={item} onClick={() => setRole(item)}>{item}</button>)}</div><nav>{navItems.map((item, i) => <a className={i === 0 ? 'active' : ''} href="#dashboard" key={item}>{i === 0 ? <HeartPulse size={17} /> : i === 1 ? <CalendarDays size={17} /> : i === 2 ? <FileText size={17} /> : <Sparkles size={17} />}{item}</a>)}</nav><div className="sidebar-bottom"><a href="#dashboard"><ShieldCheck size={17} /> Help & privacy</a><a href="#dashboard"><span className="profile-avatar">AM</span><span>Alex Morgan<small>{role}</small></span><ChevronDown size={15} /></a></div></aside><main className="dashboard-main"><header className="dashboard-header"><div><span className="eyebrow">Monday, 14 October 2025</span><h1>Good morning, Alex <span>✦</span></h1></div><div className="dashboard-actions"><button className="notification">●</button><span className="profile-avatar">AM</span></div></header><div className="dashboard-grid"><section className="welcome-card"><div><span className="eyebrow">Your wellness snapshot</span><h2>Small steps add up<br />to <em>feeling better.</em></h2><p>You are doing well this week. Keep taking it one day at a time.</p><a href="#dashboard">View health summary <ArrowRight size={15} /></a></div><div className="dashboard-ring"><strong>84</strong><small>wellness<br />score</small></div></section><section className="appointment-card"><div className="card-title"><div><span className="eyebrow">Next appointment</span><h3>Dr. Amara Patel</h3></div><span className="feature-icon feature-1"><Stethoscope size={19} /></span></div><p>General consultation · Tomorrow</p><div className="appointment-time"><CalendarDays size={16} /> 15 October · <strong>10:30 AM</strong></div><button className="outline-button">View appointment <ArrowRight size={15} /></button></section><section className="dashboard-card activity-card"><div className="card-title"><div><span className="eyebrow">This week</span><h3>Your activity</h3></div><select><option>Last 7 days</option></select></div><div className="chart"><div className="chart-line" /><div className="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div></section><section className="dashboard-card reminders"><div className="card-title"><div><span className="eyebrow">Stay on track</span><h3>Today’s reminders</h3></div><a href="#dashboard">See all</a></div>{['Vitamin D · 1000 IU', 'Drink 6 glasses of water', 'Evening walk · 20 min'].map((r, i) => <div className="reminder-row" key={r}><span className={i === 0 ? 'reminder-check done' : 'reminder-check'}>{i === 0 && <Check size={12} />}</span><span>{r}</span><small>{i === 0 ? '8:00 AM' : i === 1 ? 'All day' : '6:00 PM'}</small></div>)}</section><section className="ai-prompt"><div className="icon-bubble purple"><Sparkles size={18} /></div><div><strong>Have a health question?</strong><p>Ask Carely. I’m here to help you make sense of it.</p></div><button className="round-arrow">→</button></section></div></main></div>
}

export default function App() {
  return <Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Auth />} /><Route path="/register" element={<Auth register />} /><Route path="/patient/*" element={<Dashboard />} /><Route path="*" element={<Landing />} /></Routes>
}
