import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LogoMark from '../components/LogoMark'
import { isValidEmail, isValidPassword, isValidName, sanitizeText } from '../utils/sanitize'
import CharacterAssistant from '../components/CharacterAssistant'

const SHOWCASE_CHIPS = [
    { label: '📊 Readiness Score', cls: 'blue' },
    { label: '🎯 Role Matching', cls: 'cyan' },
    { label: '📈 Skill Graphs', cls: 'purple' },
    { label: '🤖 ML-Powered', cls: 'green' },
    { label: '⚡ Edge AI', cls: 'orange' },
]

const SHOWCASE_STATS = [
    { val: '15min', lbl: 'Daily Plans' },
    { val: '100%', lbl: 'On Device' },
    { val: '₹0', lbl: 'Free Tier' },
]

export default function Signup() {
    const { signup, loginWithGoogle } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [college, setCollege] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [charState, setCharState] = useState<'idle' | 'typing' | 'loading' | 'error' | 'success'>('idle')

    const handle = async (e: FormEvent) => {
        e.preventDefault()
        if (!name || !email || !password) { setCharState('error'); setError('Please fill all required fields.'); return }
        const nameCheck = isValidName(name)
        if (!nameCheck.valid) { setCharState('error'); setError(nameCheck.message); return }
        if (!isValidEmail(email)) { setCharState('error'); setError('Please enter a valid email address.'); return }
        const pwCheck = isValidPassword(password)
        if (!pwCheck.valid) { setCharState('error'); setError(pwCheck.message); return }

        setLoading(true); setError(''); setCharState('loading')
        try {
            await signup(sanitizeText(name.trim()), email.trim(), password)
            setCharState('success')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (err: unknown) {
            setCharState('error')
            setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
        } finally { setLoading(false) }
    }

    const onTyping = () => { if (charState === 'idle' || charState === 'error') setCharState('typing') }

    return (
        <div className="signup-v2">
            {/* ── Animated background (full page) ── */}
            <div className="gradient-mesh" aria-hidden="true">
                <div className="gradient-mesh__orb gradient-mesh__orb--1" />
                <div className="gradient-mesh__orb gradient-mesh__orb--2" />
                <div className="gradient-mesh__orb gradient-mesh__orb--3" />
            </div>

            {/* ── LEFT: Showcase panel ── */}
            <div className="signup-v2__showcase">
                {/* Orbital animation rings */}
                <div className="signup-v2__orbital" aria-hidden="true">
                    <div className="signup-v2__orbit signup-v2__orbit--1">
                        <div className="signup-v2__orbit-dot" />
                    </div>
                    <div className="signup-v2__orbit signup-v2__orbit--2">
                        <div className="signup-v2__orbit-dot" />
                    </div>
                    <div className="signup-v2__orbit signup-v2__orbit--3">
                        <div className="signup-v2__orbit-dot" />
                    </div>
                </div>

                <div className="signup-v2__showcase-content">
                    {/* Brand */}
                    <div className="auth-v2__logo" style={{ justifyContent: 'center', marginBottom: 32 }}>
                        <div className="auth-v2__logo-icon"><LogoMark size={30} /></div>
                        <div className="auth-v2__logo-text">
                            <div className="auth-v2__logo-name">CampusSync</div>
                            <div className="auth-v2__logo-tag">Edge AI</div>
                        </div>
                    </div>

                    {/* Skill chips */}
                    <div className="skill-chips" style={{ marginBottom: 32 }}>
                        {SHOWCASE_CHIPS.map((c, i) => (
                            <span key={i} className={`skill-chip skill-chip--${c.cls}`}>{c.label}</span>
                        ))}
                    </div>

                    {/* Tagline */}
                    <div className="signup-v2__tagline">
                        <h2>Start your <span className="gradient-text">AI-powered</span><br />placement journey</h2>
                        <p>Upload your resume. Get a job readiness score in seconds. Know exactly what to improve.</p>
                    </div>

                    {/* Mini stats */}
                    <div className="auth-stats" style={{ marginTop: 32 }}>
                        {SHOWCASE_STATS.map((s, i) => (
                            <div key={i} className="auth-stat">
                                <div className="auth-stat__val">{s.val}</div>
                                <div className="auth-stat__lbl">{s.lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Form panel ── */}
            <div className="signup-v2__form-side">
                <div className="signup-v2__form-box">
                    <CharacterAssistant state={charState} message={error && charState === 'error' ? error : undefined} />

                    <h1>Create account 🚀</h1>
                    <div className="signup-v2__form-sub">Your AI career coach is ready. Let's get started.</div>

                    {error && <div className="auth-v2__error">{error}</div>}

                    <form onSubmit={handle}>
                        <div className="auth-field">
                            <label htmlFor="signup-name">Full Name *</label>
                            <input
                                id="signup-name"
                                type="text" placeholder="Ganesh Kumar"
                                value={name} onChange={e => setName(e.target.value)}
                                autoComplete="name" onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="signup-email">College Email *</label>
                            <input
                                id="signup-email"
                                type="email" placeholder="you@college.edu"
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoComplete="email" onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="signup-college">College Name</label>
                            <input
                                id="signup-college"
                                type="text" placeholder="Anna University"
                                value={college} onChange={e => setCollege(e.target.value)}
                                onFocus={onTyping}
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="signup-password">Password *</label>
                            <input
                                id="signup-password"
                                type="password" placeholder="Min 6 characters"
                                value={password} onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password" onFocus={onTyping}
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? '⏳ Creating account...' : '→ Create Free Account'}
                        </button>
                    </form>

                    <div className="auth-divider">or</div>

                    <button
                        className="google-btn"
                        onClick={async () => {
                            try {
                                await loginWithGoogle()
                            } catch (err) {
                                setCharState('error')
                                setError(err instanceof Error ? err.message : 'Google sign-up failed.')
                            }
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div style={{ marginTop: 12, fontSize: 11, color: '#9E9A94', textAlign: 'center', lineHeight: 1.5 }}>
                        By signing up, you agree to our <Link to="/terms" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Terms of Service</Link> & <Link to="/privacy" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Privacy Policy</Link>.<br />
                        Your resume data never leaves your device. 🔒
                    </div>

                    <div className="auth-v2__footer" style={{ marginTop: 16 }}>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                    <Link to="/" className="auth-v2__back">← Back to homepage</Link>
                </div>
            </div>
        </div>
    )
}
