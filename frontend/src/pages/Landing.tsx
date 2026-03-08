import { Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'

/* ── Static data ── */
const FEATURES = [
    { icon: '🧠', title: 'Skill Graph Engine', desc: 'Builds a personal skill dependency graph from your resume. Maps missing skills and their prerequisites.' },
    { icon: '📊', title: 'Readiness Score', desc: 'Deterministic weighted scoring across core coverage, projects, ATS quality and structure.' },
    { icon: '🤖', title: 'ML Role Prediction', desc: 'RandomForest model (82.1% accuracy) trained on 2,000 synthetic + real resumes predicts your best-fit role.' },
    { icon: '🎙️', title: 'Interview Analyzer', desc: 'Speak or type your answers. On-device concept matching scores technical depth and gives actionable feedback.' },
    { icon: '📈', title: 'Growth Tracking', desc: 'Every upload logs your score. Watch your readiness grow week-over-week with a real historical chart.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Resume data stays in your browser session. No resume file is stored on external servers.' },
]

const STEPS = [
    { title: 'Upload Resume', desc: 'Drop your PDF or DOCX resume. The AI extracts skills, sections, and links in seconds.' },
    { title: 'Get Readiness Score', desc: 'See your job readiness % for your target role with a breakdown of core vs optional skill coverage.' },
    { title: 'Close Skill Gaps', desc: 'Get a ranked list of missing skills with learning paths showing what prerequisites you need first.' },
    { title: 'Practice Interviews', desc: 'Answer real technical questions by voice. Get scored on concept coverage and targeted feedback.' },
]

const STATS = [
    { val: '2,000+', lbl: 'Training Records' },
    { val: '82.1%', lbl: 'Model Accuracy' },
    { val: '6', lbl: 'Roles Tracked' },
    { val: '30+', lbl: 'Interview Questions' },
]

const PREVIEW_CARDS = [
    { label: 'Readiness Score', val: '74%', color: 'var(--blue)', icon: '📊' },
    { label: 'Skills Detected', val: '18', color: 'var(--cyan)', icon: '🧠' },
    { label: 'Missing Skills', val: '5', color: 'var(--orange)', icon: '🎯' },
    { label: 'Interview Score', val: '68%', color: 'var(--purple)', icon: '🎙️' },
]

const TECH = ['⚡ AMD Ryzen AI NPU', '🔷 ONNX Models', '🔒 On-Device Inference', '🎙️ Web Speech API', '🌐 No Cloud Required']

/* ── Particles component ── */
function Particles({ count = 30 }: { count?: number }) {
    const particles = useRef(
        Array.from({ length: count }, (_, i) => ({
            left: `${Math.random() * 100}%`,
            duration: `${6 + Math.random() * 8}s`,
            delay: `${Math.random() * 6}s`,
            size: Math.random() > 0.5 ? 3 : 2,
            key: i,
        }))
    ).current

    return (
        <div className="particles" aria-hidden="true">
            {particles.map(p => (
                <div
                    key={p.key}
                    className="particle"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDuration: p.duration,
                        animationDelay: p.delay,
                    }}
                />
            ))}
        </div>
    )
}

/* ── Animated counter hook ── */
function useCountUp(end: number, duration = 1800) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    const start = performance.now()
                    const tick = (now: number) => {
                        const elapsed = now - start
                        const progress = Math.min(elapsed / duration, 1)
                        const eased = 1 - Math.pow(1 - progress, 3)
                        setCount(Math.round(eased * end))
                        if (progress < 1) requestAnimationFrame(tick)
                    }
                    requestAnimationFrame(tick)
                }
            },
            { threshold: 0.5 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [end, duration])

    return { count, ref }
}

function AnimatedStat({ val, lbl }: { val: string; lbl: string }) {
    const numMatch = val.match(/^([\d,]+)/)
    const num = numMatch ? parseInt(numMatch[1].replace(/,/g, ''), 10) : 0
    const suffix = val.replace(/^[\d,]+/, '')
    const { count, ref } = useCountUp(num)

    return (
        <div className="landing-stats__item" ref={ref}>
            <div className="landing-stats__val">
                {num > 0 ? `${count.toLocaleString()}${suffix}` : val}
            </div>
            <div className="landing-stats__label">{lbl}</div>
        </div>
    )
}

/* ── Main Landing ── */
export default function Landing() {
    const [mobileNav, setMobileNav] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
            { threshold: 0.12 }
        )
        document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    const closeNav = useCallback(() => setMobileNav(false), [])

    return (
        <div className="landing-v2">
            {/* ── Animated background ── */}
            <div className="gradient-mesh" aria-hidden="true">
                <div className="gradient-mesh__orb gradient-mesh__orb--1" />
                <div className="gradient-mesh__orb gradient-mesh__orb--2" />
                <div className="gradient-mesh__orb gradient-mesh__orb--3" />
                <div className="grid-overlay" />
                <Particles count={25} />
            </div>

            <div className="landing-v2__content">
                {/* ── NAV ── */}
                <nav className={`landing-nav-v2${scrolled ? ' landing-nav-v2--scrolled' : ''}`}>
                    <div className="landing-nav-v2__brand">
                        <div className="landing-nav-v2__logo">⚡</div>
                        <div>
                            <div className="landing-nav-v2__name">CampusSync</div>
                            <span className="landing-nav-v2__tag">Edge AI</span>
                        </div>
                    </div>

                    <button
                        className="landing-nav-v2__hamburger"
                        onClick={() => setMobileNav(v => !v)}
                        aria-label="Toggle navigation"
                    >
                        {mobileNav ? '✕' : '☰'}
                    </button>

                    <div className={`landing-nav-v2__links${mobileNav ? ' landing-nav-v2__links--open' : ''}`}>
                        <a href="#how" onClick={closeNav}>How It Works</a>
                        <a href="#features" onClick={closeNav}>Features</a>
                        <Link to="/login" onClick={closeNav} className="landing-nav-v2__signin">Sign In</Link>
                        <Link to="/signup" onClick={closeNav} className="landing-nav-v2__cta">Analyze My Resume →</Link>
                    </div>
                </nav>

                {/* ── HERO ── */}
                <section className="landing-hero">
                    <div className="landing-hero__badge">
                        <span className="dot" /> Edge AI — Interview Analyzer Live
                    </div>

                    <h1 className="landing-hero__title">
                        Know Your Readiness.{' '}
                        <span className="gradient-text">Close Every Gap.</span>
                    </h1>

                    <p className="landing-hero__sub">
                        AI-powered career intelligence for engineering students.
                        Upload your resume — get your score, skill gaps, and a personalized action plan in seconds.
                    </p>

                    <div className="landing-hero__actions">
                        <Link to="/signup" className="landing-hero__primary">
                            🚀 Start Free — Instant Results
                        </Link>
                        <a href="#how" className="landing-hero__secondary">
                            See How It Works ↓
                        </a>
                    </div>

                    {/* Preview metric cards */}
                    <div className="landing-preview">
                        {PREVIEW_CARDS.map((m, i) => (
                            <div key={i} className="landing-preview__card" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                                <div className="landing-preview__icon">{m.icon}</div>
                                <div className="landing-preview__val" style={{ color: m.color }}>{m.val}</div>
                                <div className="landing-preview__label">{m.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── STATS BAR ── */}
                <div className="landing-stats">
                    {STATS.map((s, i) => (
                        <AnimatedStat key={i} val={s.val} lbl={s.lbl} />
                    ))}
                </div>

                {/* ── HOW IT WORKS ── */}
                <div className="fade-in-section">
                    <section id="how" className="landing-section">
                        <div className="landing-section__eyebrow">HOW IT WORKS</div>
                        <h2 className="landing-section__title">
                            From resume to offer — <span className="gradient-text">in 4 steps</span>
                        </h2>

                        <div className="landing-steps stagger-reveal">
                            {STEPS.map((s, i) => (
                                <div key={i} className="landing-step">
                                    <div className="landing-step__num">{String(i + 1).padStart(2, '0')}</div>
                                    <div className="landing-step__icon">{i + 1}</div>
                                    <div className="landing-step__title">{s.title}</div>
                                    <div className="landing-step__desc">{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── FEATURES ── */}
                <div className="fade-in-section">
                    <section id="features" className="landing-section">
                        <div className="landing-section__eyebrow" style={{ color: 'var(--cyan)' }}>FEATURES</div>
                        <h2 className="landing-section__title">
                            Not a resume scanner.<br />
                            <span style={{ color: 'var(--cyan)' }}>A career intelligence system.</span>
                        </h2>

                        <div className="landing-features-grid stagger-reveal">
                            {FEATURES.map((f, i) => (
                                <div key={i} className="glow-card" style={{ padding: '28px 24px' }}>
                                    <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── TECH BADGES ── */}
                <div className="fade-in-section">
                    <div className="landing-tech">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 2, marginRight: 8, fontWeight: 600 }}>
                            OPTIMIZED FOR
                        </div>
                        {TECH.map((t, i) => (
                            <div key={i} className="landing-tech__badge">{t}</div>
                        ))}
                    </div>
                </div>

                {/* ── CTA ── */}
                <div className="fade-in-section">
                    <section className="landing-cta">
                        <h2 className="landing-cta__title">
                            Ready to measure your readiness?
                        </h2>
                        <p className="landing-cta__sub">
                            Upload your resume. Get your score in 10 seconds. No sign-up needed to try.
                        </p>
                        <Link to="/signup" className="landing-hero__primary" style={{ display: 'inline-flex' }}>
                            🚀 Start for Free — It's Instant
                        </Link>
                    </section>
                </div>

                {/* ── FOOTER ── */}
                <footer className="landing-footer">
                    <div className="landing-footer__brand">
                        <span>⚡</span> CampusSync Edge AI
                        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>— v4.1.0</span>
                    </div>
                    <div className="landing-footer__tech">
                        Built on FastAPI · RandomForest · Web Speech API · Supabase
                    </div>
                    <div className="landing-footer__links">
                        <Link to="/login">Sign In</Link>
                        <Link to="/signup" style={{ color: 'var(--blue)', fontWeight: 600 }}>Get Started</Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
