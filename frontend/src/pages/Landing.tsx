import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LogoMark from '../components/LogoMark'
import { Canvas } from '@react-three/fiber'
import CharacterScene from '../components/3d/Character'

const STATS = [
    { val: '74%', lbl: 'Readiness score', tone: 'green' },
    { val: '18', lbl: 'Skills detected', tone: 'amber' },
    { val: '5', lbl: 'Missing skills', tone: 'red' },
    { val: '68%', lbl: 'Interview score', tone: 'green' },
]

const STEPS = [
    {
        num: 'Step 01',
        icon: '📄',
        title: 'Upload your resume',
        desc: 'Drop your PDF or DOCX. Our AI instantly extracts every skill, project, and experience - no manual input needed.',
    },
    {
        num: 'Step 02',
        icon: '📊',
        title: 'Get your readiness score',
        desc: 'A precise readiness percentage for your target role, with a full breakdown of what is working and what is missing.',
    },
    {
        num: 'Step 03',
        icon: '🎯',
        title: 'Follow your action plan',
        desc: 'AI-generated study paths, interview prep, and project ideas - all tailored to close your specific skill gaps.',
    },
]

const FEATURES = [
    {
        icon: '📄',
        title: 'Smart resume analysis',
        desc: 'AI extracts skills, sections and metadata instantly from PDF or DOCX with deterministic weighted scoring.',
        tag: 'PDF + DOCX',
    },
    {
        icon: '🧠',
        title: 'Skill graph engine',
        desc: 'Visual skill dependency graph - see exactly what to learn next and in what order using React Flow.',
        tag: 'Interactive graph',
    },
    {
        icon: '📊',
        title: 'ML readiness score',
        desc: 'RandomForest model with 82.1% accuracy across 7 engineering tracks, exported to ONNX for edge inference.',
        tag: '82.1% accuracy',
    },
    {
        icon: '🎯',
        title: 'Skill gap analysis',
        desc: 'Prioritized gaps with critical/high ratings, reasons, and actionable next steps for every missing skill.',
        tag: 'Prioritized',
    },
    {
        icon: '🎙️',
        title: 'Interview simulator',
        desc: '30+ role-specific technical questions with on-device concept scoring, voice support via Web Speech API.',
        tag: 'Voice enabled',
    },
    {
        icon: '🛠️',
        title: 'AI project generator',
        desc: 'Capstone project specs tailored to your gaps, auto-verified against your GitHub with Gemini AI scoring.',
        tag: 'GitHub verified',
    },
]

const DASHBOARD_METRICS = [
    { value: '76%', label: 'Readiness score', color: 'var(--forest)' },
    { value: '87%', label: 'Core skill coverage', color: 'var(--amber)' },
    { value: '5', label: 'Missing critical', color: 'var(--red)' },
    { value: 'Job Ready', label: 'Interview status', color: 'var(--forest)' },
]

const SKILL_COVERAGE = [
    { label: 'Programming langs', value: 33, tone: 'forest' },
    { label: 'Frameworks', value: 22, tone: 'amber' },
    { label: 'Core CS concepts', value: 44, tone: 'forest' },
    { label: 'Tools & platforms', value: 25, tone: 'amber' },
]

const SKILL_GAPS = [
    { name: 'Statistics', level: 'Critical' },
    { name: 'R language', level: 'High' },
    { name: 'Apache Spark', level: 'High' },
    { name: 'Kubernetes', level: 'High' },
]

const BAND_STATS = [
    { value: '82%', label: 'ML model accuracy' },
    { value: '2k+', label: 'Resumes analyzed' },
    { value: '7', label: 'Engineering roles tracked' },
    { value: '30+', label: 'Interview questions per role' },
]

const TESTIMONIALS = [
    {
        initials: 'AM',
        author: 'Arjun Mehta',
        role: 'B.Tech CSE, IIT Madras',
        quote: 'I had no idea what skills were actually missing until CampusSync showed me. Got my first SDE offer within 3 months of using it.',
    },
    {
        initials: 'PR',
        author: 'Priya Ramachandran',
        role: 'B.E. IT, Anna University',
        quote: 'The interview simulator is incredibly realistic. It flagged exactly the concepts I kept blanking on, and I fixed them before my actual interview.',
    },
    {
        initials: 'KS',
        author: 'Karthik Subramanian',
        role: 'M.Tech CS, NIT Trichy',
        quote: 'The project verifier pushed me to actually complete what I started. My GitHub looks solid now and recruiters actually respond to my applications.',
    },
]

function StatCard({ value, label, tone }: { value: string; label: string; tone: string }) {
    return (
        <div className="stat-card reveal">
            <div className={`stat-num ${tone}`}>{value}</div>
            <div className="stat-lbl">{label}</div>
        </div>
    )
}

export default function Landing() {
    const [mobileNav, setMobileNav] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [cursorPos, setCursorPos] = useState({ x: -200, y: -200 })

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        window.addEventListener('scroll', onScroll, { passive: true })

        const onMouseMove = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', onMouseMove)

        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('mousemove', onMouseMove)
        }
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.12 }
        )

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    return (
        <div className="landing-v2">
            <div 
                className="interactive-glow" 
                style={{ left: cursorPos.x, top: cursorPos.y }}
                aria-hidden="true" 
            />
            <div className="hero-bg-pattern" aria-hidden="true" />

            <nav className={scrolled ? 'landing-nav landing-nav--scrolled' : 'landing-nav'}>
                <Link className="logo" to="/">
                    <div className="logo-mark">C</div>
                    <div>
                        <div className="logo-name">CampusSync</div>
                        <div className="logo-sub">Edge AI</div>
                    </div>
                </Link>

                <button
                    className="nav-toggle"
                    onClick={() => setMobileNav(v => !v)}
                    aria-label="Toggle navigation"
                >
                    {mobileNav ? '✕' : '☰'}
                </button>

                <div className={mobileNav ? 'nav-links nav-links--open' : 'nav-links'}>
                    <a href="#how" onClick={() => setMobileNav(false)}>How it works</a>
                    <a href="#features" onClick={() => setMobileNav(false)}>Features</a>
                    <a href="#dashboard" onClick={() => setMobileNav(false)}>Dashboard</a>
                    <Link to="/login" onClick={() => setMobileNav(false)}>Sign in</Link>
                    <Link to="/signup" className="btn-nav" onClick={() => setMobileNav(false)}>
                        Analyze my resume →
                    </Link>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <div className="badge reveal">
                        <div className="badge-dot" />
                        <span>Edge AI - Interview analyzer live</span>
                    </div>

                    <h1 className="reveal reveal-delay-1">
                        Know your readiness.<br />
                        Close every <span className="amber">gap.</span>
                    </h1>

                    <p className="hero-sub reveal reveal-delay-2">
                        AI-powered career intelligence for engineering students. Upload your resume - get your score,
                        skill gaps, and a personalized action plan in seconds.
                    </p>

                    <div className="cta-row reveal reveal-delay-3">
                        <Link to="/signup" className="btn-primary">🚀 Start free - instant results</Link>
                        <a href="#how" className="btn-secondary">See how it works ↓</a>
                    </div>

                    <div className="hero-3d-character reveal reveal-delay-3" style={{ height: '400px', width: '100%', maxWidth: '800px', margin: '2rem auto 0', position: 'relative' }}>
                        <Canvas camera={{ position: [0, 4, 10], fov: 50 }} gl={{ preserveDrawingBuffer: true, powerPreference: "high-performance" }}>
                            <CharacterScene modelUrl="/3dpea.com_Talking.glb" scale={1.5} />
                        </Canvas>
                    </div>

                    <div className="stats-grid">
                        {STATS.map(stat => (
                            <StatCard key={stat.lbl} value={stat.val} label={stat.lbl} tone={stat.tone} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" id="how">
                <div className="section-inner">
                    <div className="eyebrow reveal">How it works</div>
                    <h2 className="reveal reveal-delay-1">
                        Three steps to <span className="amber">job ready.</span>
                    </h2>
                    <p className="sec-sub reveal reveal-delay-2">From resume upload to a full career action plan - in under 60 seconds.</p>
                    <div className="steps">
                        {STEPS.map((step, index) => (
                            <div key={step.title} className={`step reveal reveal-delay-${Math.min(index + 1, 3)}`}>
                                <div className="step-num">{step.num}</div>
                                <div className="step-icon">{step.icon}</div>
                                <div className="step-title">{step.title}</div>
                                <div className="step-desc">{step.desc}</div>
                                {index < STEPS.length - 1 ? <div className="step-connector" /> : null}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" id="dashboard">
                <div className="section-inner">
                    <div className="eyebrow reveal">Dashboard preview</div>
                    <h2 className="reveal reveal-delay-1">
                        Measure. Improve. <span className="amber">Achieve.</span>
                    </h2>
                    <p className="sec-sub reveal reveal-delay-2">Your full career intelligence hub - all in one clean dashboard.</p>

                    <div className="dash-wrap reveal reveal-delay-3">
                        <div className="dash-bar" aria-hidden="true">
                            <div className="dot dot-r" />
                            <div className="dot dot-y" />
                            <div className="dot dot-g" />
                        </div>
                        <div className="dash-inner">
                            <div className="dash-sidebar">
                                <div className="sb-brand">
                                    <div className="sb-brand-name">CampusSync</div>
                                    <div className="sb-brand-tag">EDGE AI</div>
                                </div>
                                <div className="sb-item active"><span className="sb-dot" /> Dashboard</div>
                                <div className="sb-item">Resume analyzer</div>
                                <div className="sb-item">Readiness score</div>
                                <div className="sb-item">Skill gap analysis</div>
                                <div className="sb-item">Improvement plan</div>
                                <div className="sb-item">Interview readiness</div>
                                <div className="sb-item">Progress tracking</div>
                                <div className="sb-item">My projects</div>
                                <div className="sb-item">Industry alignment</div>
                            </div>

                            <div className="dash-main">
                                <div className="dash-hero-card">
                                    <div className="dash-hero-title">Welcome back, Ganesh Kumar T!</div>
                                    <div className="dash-hero-sub">AI-powered job readiness intelligence for engineering students.</div>
                                </div>

                                <div className="metrics">
                                    {DASHBOARD_METRICS.map(metric => (
                                        <div key={metric.label} className="metric">
                                            <div className="metric-val" style={{ color: metric.color }}>{metric.value}</div>
                                            <div className="metric-lbl">{metric.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bottom-grid">
                                    <div className="skill-card">
                                        <div className="skill-card-title">Skill coverage</div>
                                        <div className="skill-card-sub">Proficiency across key areas</div>
                                        {SKILL_COVERAGE.map(skill => (
                                            <div className="bar-row" key={skill.label}>
                                                <span className="bar-lbl">{skill.label}</span>
                                                <div className="bar-track">
                                                    <div
                                                        className={skill.tone === 'amber' ? 'bar-fill amber' : 'bar-fill'}
                                                        style={{ width: `${skill.value}%`, animationDelay: '0.2s' }}
                                                    />
                                                </div>
                                                <span className="bar-pct">{skill.value}%</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="skill-card">
                                        <div className="skill-card-title">Skill gaps</div>
                                        <div className="skill-card-sub">Top critical skills to focus on</div>
                                        {SKILL_GAPS.map(gap => (
                                            <div className="gap-row" key={gap.name}>
                                                <span className="gap-name">{gap.name}</span>
                                                <span className={gap.level === 'Critical' ? 'pill pill-critical' : 'pill pill-high'}>
                                                    {gap.level}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="stats-band">
                <div className="stats-band-inner">
                    {BAND_STATS.map((stat, index) => (
                        <div key={stat.label} className={`band-stat reveal reveal-delay-${Math.min(index, 3)}`}>
                            <div className="band-num">{stat.value}</div>
                            <div className="band-label">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <section className="section" id="features">
                <div className="section-inner">
                    <div className="eyebrow reveal">Features</div>
                    <h2 className="reveal reveal-delay-1">
                        Everything you need to <span className="amber">land the role.</span>
                    </h2>
                    <p className="sec-sub reveal reveal-delay-2">Built specifically for engineering students targeting placements and internships.</p>

                    <div className="features">
                        {FEATURES.map((feature, index) => (
                            <div key={feature.title} className={`feat reveal reveal-delay-${Math.min((index % 3) + 1, 3)}`}>
                                <div className="feat-icon">{feature.icon}</div>
                                <div className="feat-title">{feature.title}</div>
                                <div className="feat-desc">{feature.desc}</div>
                                <div className="feat-tag">{feature.tag}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="section-inner">
                    <div className="eyebrow reveal">Student stories</div>
                    <h2 className="reveal reveal-delay-1">
                        From campus to <span className="amber">career.</span>
                    </h2>
                    <p className="sec-sub reveal reveal-delay-2">Engineering students using CampusSync to land their first roles.</p>

                    <div className="tgrid">
                        {TESTIMONIALS.map((testimonial, index) => (
                            <div key={testimonial.author} className={`tcard reveal reveal-delay-${Math.min(index + 1, 3)}`}>
                                <div className="stars">★★★★★</div>
                                <div className="tcard-quote">"{testimonial.quote}"</div>
                                <div className="tcard-footer">
                                    <div className="tcard-avatar">{testimonial.initials}</div>
                                    <div>
                                        <div className="tcard-author">{testimonial.author}</div>
                                        <div className="tcard-role">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="cta-section">
                <div className="cta-box reveal">
                    <h2>Ready to close every gap?</h2>
                    <p>
                        Upload your resume and get your full readiness report in under 60 seconds.<br />
                        Free, instant, no signup required to start.
                    </p>
                    <div className="cta-btns">
                        <Link to="/signup" className="btn-light">🚀 Start free - instant results</Link>
                        <a href="#how" className="btn-amber-outline">See how it works</a>
                    </div>
                </div>
            </div>

            <footer>
                <div className="foot-brand">
                    <div className="foot-logo-mark">C</div>
                    <div>
                        <div className="foot-name">CampusSync Edge AI</div>
                        <div className="foot-tag">AI-powered career intelligence for engineering students</div>
                    </div>
                </div>
                <div className="foot-links">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer">GitHub</a>
                    <a href="#">Contact</a>
                </div>
                <div className="foot-copy">© 2026 CampusSync</div>
            </footer>
        </div>
    )
}
