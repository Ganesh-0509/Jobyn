import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'

const STATS = [
    { val: '82.1%', lbl: 'ML model accuracy', tone: 'green' },
    { val: '7', lbl: 'Engineering roles scored', tone: 'accent' },
    { val: '30+', lbl: 'Interview questions', tone: '' },
    { val: '16k+', lbl: 'Skill connections mapped', tone: '' },
]

const SIMULATOR_QUESTIONS = [
    {
        role: 'Backend SDE',
        question: 'Explain the difference between optimistic and pessimistic locking in database transaction management.',
        simulatedAnswer: 'Optimistic locking assumes transactions can complete without conflict — it checks before committing. Pessimistic locking blocks the resource upfront, preventing concurrent updates from happening at all.',
        score: '84%',
        conceptsCovered: ['ACID', 'Concurrency', 'Dist. Consensus'],
    },
    {
        role: 'Frontend SDE',
        question: 'What is the Virtual DOM reconciliation algorithm in React, and how does the key prop optimize array rendering performance?',
        simulatedAnswer: 'The Virtual DOM compares the virtual tree with the actual tree using diffing. The key prop helps React uniquely identify elements across renders, avoiding unnecessary DOM re-creation.',
        score: '91%',
        conceptsCovered: ['Fiber', 'Diffing', 'Key Reconciliation'],
    },
    {
        role: 'Data Engineer',
        question: 'Describe how Apache Spark handles lazy evaluation and action execution in a distributed cluster network.',
        simulatedAnswer: 'Spark builds a Directed Acyclic Graph (DAG) when transformations are declared. It does not run them immediately. Only when an action like count() or collect() is called, does it optimize the graph and trigger execution.',
        score: '64%',
        conceptsCovered: ['DAG Engine', 'Lazy Evaluation', 'Transformations'],
    }
]



const TESTIMONIALS = [
    {
        initials: 'SK',
        author: 'Siddharth Kapoor',
        role: 'Infrastructure Engineer, Bangalore',
        quote: 'It flagged that my distributed databases scaling was a critical gap. I fixed it, cleared the SDE-1 placement round, and the interviewer asked almost exactly the question CampusSync predicted.',
    },
    {
        initials: 'AN',
        author: 'Aparna Nair',
        role: 'Frontend Engineer, Hyderabad',
        quote: 'The voice interview simulator is genuinely useful. Speaking answers out loud is completely different from typing them. It caught that I couldn\'t explain transaction concurrency under pressure.',
    },
    {
        initials: 'RG',
        author: 'Rohan Gupta',
        role: 'ML Engineer, Pune',
        quote: 'The GitHub verifier is something I didn\'t know I needed. I used it to verify my capstone project before submitting job applications — the VERIFIED badge actually came up in my interview.',
    },
]

export default function Landing() {
    const [isLoading, setIsLoading] = useState(true)
    const [loaderText, setLoaderText] = useState('INITIALIZING ENGINE...')
    const [loaderPercent, setLoaderPercent] = useState(0)
    const [mobileNav, setMobileNav] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    
    // Interactive states
    const [activeSimIndex, setActiveSimIndex] = useState(0)
    const [isSimulating, setIsSimulating] = useState(false)
    const [simText, setSimText] = useState('')
    const [animateBars, setAnimateBars] = useState(false)
    const [hoveredModule, setHoveredModule] = useState<string | null>(null)
    
    // Simulated upload states
    const [dragActive, setDragActive] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadFinished, setUploadFinished] = useState(false)

    useEffect(() => {
        // High fidelity loading sequence
        const interval = setInterval(() => {
            setLoaderPercent(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => setIsLoading(false), 500)
                    return 100
                }
                const increment = Math.floor(Math.random() * 15) + 5
                const next = Math.min(prev + increment, 100)
                
                if (next < 30) setLoaderText('INGESTING NEURAL MODEL (82.1% ACCURACY)...')
                else if (next < 60) setLoaderText('COMPILING DYNAMIC INTERVIEW GRAPHS...')
                else if (next < 90) setLoaderText('PROVISIONING EDGE TELEMETRY ENGINE...')
                else setLoaderText('SYSTEM READY.')
                
                return next
            })
        }, 120)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!isLoading) {
            // Trigger skill bar filling animation
            setTimeout(() => setAnimateBars(true), 300)
            
            // Intersection observer for buttery reveals
            const observer = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible')
                        }
                    })
                },
                { threshold: 0.08 }
            )

            document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
            return () => observer.disconnect()
        }
    }, [isLoading])

    // Simulator typing animation effect
    const startSimulatingText = () => {
        setIsSimulating(true)
        setSimText('')
        const fullAnswer = SIMULATOR_QUESTIONS[activeSimIndex].simulatedAnswer
        let index = 0
        
        const typingInterval = setInterval(() => {
            if (index < fullAnswer.length) {
                setSimText(prev => prev + fullAnswer.charAt(index))
                index++
            } else {
                clearInterval(typingInterval)
                setIsSimulating(false)
            }
        }, 25)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            simulateUpload()
        }
    }

    const simulateUpload = () => {
        if (isUploading || uploadFinished) return
        setIsUploading(true)
        setUploadProgress(0)
        setUploadFinished(false)
        
        const uploadInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(uploadInterval)
                    setTimeout(() => {
                        setIsUploading(false)
                        setUploadFinished(true)
                    }, 600)
                    return 100
                }
                return prev + 10
            })
        }, 150)
    }

    if (isLoading) {
        return (
            <div className="landing-v2-loader">
                <div className="loader-box">
                    <div className="loader-brand-animated">
                        {"CampusSync".split("").map((char, idx) => (
                            <span 
                                key={idx} 
                                className="loader-char" 
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                {char}
                            </span>
                        ))}
                    </div>
                    <div className="loader-sub-animated">EDGE AI ENGINE</div>
                    <div className="loader-progress-track">
                        <div className="loader-progress-fill" style={{ width: `${loaderPercent}%` }} />
                    </div>
                    <div className="loader-meta-row">
                        <span className="loader-text">{loaderText}</span>
                        <span className="loader-percent">{loaderPercent}%</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="landing-v2">
            {/* Apple style Frosted Translucent Sticky Navigation */}
            <nav>
                <Link className="nav-logo" to="/">
                    <div className="logo-mark">C</div>
                    <div>
                        <div className="logo-text">CampusSync</div>
                        <div className="logo-sub">EDGE AI</div>
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
                    <a href="#simulator" onClick={() => setMobileNav(false)}>Interview Prep</a>
                    <Link to="/signup" className="btn-nav" onClick={() => setMobileNav(false)}>
                        Scan Resume Free →
                    </Link>
                </div>
            </nav>

            {/* Spacious, Editorial Hero Section */}
            <div className="hero">
                <div className="hero-left">
                    {/* Hero section */}

                    <h1 className="reveal reveal-d1">
                        Know <em>exactly</em> where you stand before placement season.
                    </h1>

                    <p className="hero-sub reveal reveal-d2">
                        Upload your resume. CampusSync tells you your readiness score for 7 engineering roles, what skills you're missing, and what to study — no guessing, no generic advice.
                    </p>

                    <div className="cta-row reveal reveal-d3">
                        <Link to="/signup" className="btn-primary">
                            <span>→</span> Check my readiness
                        </Link>
                        <a href="#how" className="btn-secondary">See how it works</a>
                    </div>
                </div>

                <div className="hero-visual reveal reveal-d2">
                    <div style={{ position: 'relative' }}>
                        <div className="float-card float-top">
                            <div className="float-icon">✓</div>
                            <div>
                                <div className="float-label">ML model active</div>
                                <div className="float-sub">82.1% accuracy</div>
                            </div>
                        </div>

                        <div className="score-card">
                            <div className="score-header">
                                <div>
                                    <div className="score-title">Readiness Report</div>
                                    <div className="score-sub">Backend SDE track · Analyzed just now</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="score-big">78</div>
                                    <div className="score-label">/ 100</div>
                                </div>
                            </div>

                            <div className="bars">
                                <div className="bar-row">
                                    <span className="bar-lbl">Systems Design</span>
                                    <div className="bar-track">
                                        <div className="bar-fill green" style={{ width: animateBars ? '82%' : '0%' }} />
                                    </div>
                                    <span className="bar-pct">82%</span>
                                </div>
                                <div className="bar-row">
                                    <span className="bar-lbl">Algorithms / DSA</span>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{ width: animateBars ? '74%' : '0%' }} />
                                    </div>
                                    <span className="bar-pct">74%</span>
                                </div>
                                <div className="bar-row">
                                    <span className="bar-lbl">Frontend Eng</span>
                                    <div className="bar-track">
                                        <div className="bar-fill green" style={{ width: animateBars ? '91%' : '0%' }} />
                                    </div>
                                    <span className="bar-pct">91%</span>
                                </div>
                                <div className="bar-row">
                                    <span className="bar-lbl">Cloud / Pipelines</span>
                                    <div className="bar-track">
                                        <div className="bar-fill amber" style={{ width: animateBars ? '45%' : '0%' }} />
                                    </div>
                                    <span className="bar-pct">45%</span>
                                </div>
                            </div>

                            <div className="gap-chips">
                                <span className="chip chip-red">⚠ Apache Spark missing</span>
                                <span className="chip chip-amber">Server Components</span>
                                <span className="chip chip-green">✓ React 91%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS STRIP */}
            <div className="stats-strip">
                {STATS.map((stat) => (
                    <div key={stat.lbl} className="stat-item">
                        <div className={`stat-num ${stat.tone}`}>{stat.val}</div>
                        <div className="stat-lbl">{stat.lbl}</div>
                    </div>
                ))}
            </div>

            {/* HOW IT WORKS */}
            <section id="how">
                <div className="section-inner">
                    <div className="eyebrow reveal">How it works</div>
                    <h2 className="reveal reveal-d1">From resume to roadmap <em>in minutes.</em></h2>
                    <p className="sec-sub reveal reveal-d2">No account needed to start. Upload your resume and get an honest picture of where you stand.</p>
                    
                    <div className="how-tree-container reveal reveal-d3">
                        {/* Cinematic Laser Splines */}
                        <svg className="tree-svg" viewBox="0 0 100 420" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="laser-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(99, 102, 241, 0.02)" />
                                    <stop offset="30%" stopColor="rgba(168, 85, 247, 0.4)" />
                                    <stop offset="50%" stopColor="rgba(99, 102, 241, 0.8)" />
                                    <stop offset="70%" stopColor="rgba(168, 85, 247, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(99, 102, 241, 0.02)" />
                                </linearGradient>
                            </defs>
                            
                            {/* Thin rail pathway */}
                            <path 
                                d="M 8 290 C 15 290, 22 210, 29 210 C 36 210, 43 290, 50 290 C 57 290, 64 210, 71 210 C 78 210, 85 290, 92 290" 
                                fill="none" 
                                stroke="rgba(255, 255, 255, 0.05)" 
                                strokeWidth="1" 
                            />

                            {/* Glowing laser energy tracer */}
                            <path 
                                d="M 8 290 C 15 290, 22 210, 29 210 C 36 210, 43 290, 50 290 C 57 290, 64 210, 71 210 C 78 210, 85 290, 92 290" 
                                fill="none" 
                                stroke="url(#laser-grad)" 
                                strokeWidth="1.5" 
                                className="tree-path tree-path-flow" 
                            />
                        </svg>

                        {/* Staggered Compact Floating Nodes */}
                        <div className="tree-node pos-down" style={{ left: '8%', top: '290px' }}>
                            <div className="node-point"></div>
                            <div className="node-card">
                                <div className="node-badge">01</div>
                                <h3 className="node-title">Upload Resume</h3>
                                <p className="node-desc">Submit your resume in seconds with zero signup required.</p>
                            </div>
                        </div>

                        <div className="tree-node pos-up" style={{ left: '29%', top: '210px' }}>
                            <div className="node-point"></div>
                            <div className="node-card">
                                <div className="node-badge">02</div>
                                <h3 className="node-title">AI Analysis</h3>
                                <p className="node-desc">Advanced models extract your complete profile and experience instantly.</p>
                            </div>
                        </div>

                        <div className="tree-node pos-down" style={{ left: '50%', top: '290px' }}>
                            <div className="node-point"></div>
                            <div className="node-card">
                                <div className="node-badge">03</div>
                                <h3 className="node-title">Detect Skill Gaps</h3>
                                <p className="node-desc">Instantly see critical skill gaps mapped against real-world roles.</p>
                            </div>
                        </div>

                        <div className="tree-node pos-up" style={{ left: '71%', top: '210px' }}>
                            <div className="node-point"></div>
                            <div className="node-card">
                                <div className="node-badge">04</div>
                                <h3 className="node-title">Personalized Roadmap</h3>
                                <p className="node-desc">Get a customized learning path built specifically for you.</p>
                            </div>
                        </div>

                        <div className="tree-node pos-down" style={{ left: '92%', top: '290px' }}>
                            <div className="node-point"></div>
                            <div className="node-card">
                                <div className="node-badge">05</div>
                                <h3 className="node-title">Interview Practice</h3>
                                <p className="node-desc">Simulate real-time voice interviews with instant smart grading.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CAMPUSSYNC GROWTH LOOP CENTERPIECE */}
            <section id="features" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
                <div className="section-inner" style={{ padding: '80px 0' }}>
                    <div className="eyebrow reveal" style={{ textAlign: 'center' }}>CampusSync Loop</div>
                    <h2 className="reveal reveal-d1" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 10px' }}>
                        One connected student growth loop.
                    </h2>
                    <p className="sec-sub reveal reveal-d2" style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 40px' }}>
                        Placement preparation isn't a series of separate tasks. It's a continuous, synchronized system built for your success.
                    </p>

                    {/* Compact Loop Metaphor centerpiece */}
                    <div className="loop-centerpiece reveal reveal-d3">
                        <div className="loop-line-wrap">
                            <svg className="loop-svg" viewBox="0 0 800 60" preserveAspectRatio="none">
                                <line x1="50" y1="30" x2="750" y2="30" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" />
                                <line x1="50" y1="30" x2="750" y2="30" stroke="url(#loop-glow)" strokeWidth="2" className="loop-pulse-line" />
                                <defs>
                                    <linearGradient id="loop-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
                                        <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
                                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="loop-stages">
                            <div className="loop-stage">
                                <div className="stage-icon">📄</div>
                                <span className="stage-label">Resume Ingestion</span>
                            </div>
                            <div className="stage-arrow-indicator">➔</div>
                            <div className="loop-stage">
                                <div className="stage-icon">🕸️</div>
                                <span className="stage-label">Skill Assessment</span>
                            </div>
                            <div className="stage-arrow-indicator">➔</div>
                            <div className="loop-stage">
                                <div className="stage-icon">📚</div>
                                <span className="stage-label">Dynamic Roadmap</span>
                            </div>
                            <div className="stage-arrow-indicator">➔</div>
                            <div className="loop-stage">
                                <div className="stage-icon">🎙️</div>
                                <span className="stage-label">Smart Practice</span>
                            </div>
                            <div className="stage-arrow-indicator">➔</div>
                            <div className="loop-stage placement-node">
                                <div className="stage-icon">🎓</div>
                                <span className="stage-label">Placement Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* 3 Premium Simple Concept Cards */}
                    <div className="concept-row reveal reveal-d4">
                        <div className="concept-card">
                            <div className="concept-icon-tag">01</div>
                            <h3 className="concept-title">Career Sync</h3>
                            <p className="concept-desc">
                                Tracks skills, learning, interviews, and placement readiness together.
                            </p>
                        </div>
                        <div className="concept-card">
                            <div className="concept-icon-tag">02</div>
                            <h3 className="concept-title">Adaptive Roadmaps</h3>
                            <p className="concept-desc">
                                Personalized learning paths based on your goals and gaps.
                            </p>
                        </div>
                        <div className="concept-card">
                            <div className="concept-icon-tag">03</div>
                            <h3 className="concept-title">Smart Practice</h3>
                            <p className="concept-desc">
                                Real interview simulations with instant feedback and progress tracking.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SIMULATOR SECTION */}
            <section id="simulator">
                <div className="section-inner">
                    <div className="split">
                        <div className="split-text">
                            <div className="eyebrow reveal">Interview prep</div>
                            <h2 className="reveal reveal-d1">Practice until <em>answers feel obvious.</em></h2>
                            <p className="sec-sub reveal reveal-d2">
                                Real questions, real feedback. The simulator runs entirely on-device for speed — no waiting for an API call to grade your answer.
                            </p>
                            
                            <div className="steps reveal reveal-d3">
                                <div className="step-item" style={{ padding: '14px 0' }}>
                                    <div className="step-num">→</div>
                                    <div>
                                        <div className="step-title">Role-specific questions</div>
                                        <div className="step-desc" style={{ fontSize: '13px' }}>Different question bank for each of 6 roles. Backend, Frontend, ML, Data, DevOps, and Full-Stack tracks.</div>
                                    </div>
                                </div>
                                <div className="step-item" style={{ padding: '14px 0' }}>
                                    <div className="step-num">→</div>
                                    <div>
                                        <div className="step-title">Voice practice mode</div>
                                        <div className="step-desc" style={{ fontSize: '13px' }}>Speak your answer using Web Speech API. Good for training under pressure before real interviews.</div>
                                    </div>
                                </div>
                                <div className="step-item" style={{ padding: '14px 0' }}>
                                    <div className="step-num">→</div>
                                    <div>
                                        <div className="step-title">Concepts + gaps detected</div>
                                        <div className="step-desc" style={{ fontSize: '13px' }}>Instant breakdown of what you covered well and what's still missing from a complete answer.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="split-visual reveal reveal-d2">
                            <div className="sim-card">
                                <div className="sim-bar">
                                    <div className="sim-dots">
                                        <div className="sim-dot r" />
                                        <div className="sim-dot y" />
                                        <div className="sim-dot g" />
                                    </div>
                                    <span className="sim-title">interview_arena · {SIMULATOR_QUESTIONS[activeSimIndex].role}</span>
                                </div>
                                
                                <div className="sim-body">
                                    <div className="sim-tabs">
                                        {SIMULATOR_QUESTIONS.map((q, idx) => (
                                            <button 
                                                key={q.role}
                                                className={`sim-tab-btn ${activeSimIndex === idx ? 'active' : ''}`}
                                                onClick={() => {
                                                    setActiveSimIndex(idx)
                                                    setSimText('')
                                                    setIsSimulating(false)
                                                }}
                                            >
                                                {q.role}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="sim-q">
                                        <div className="sim-q-label">QUESTION</div>
                                        {SIMULATOR_QUESTIONS[activeSimIndex].question}
                                    </div>
                                    
                                    <div className="sim-answer">
                                        {simText || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Click response simulation below to speak...</span>}
                                    </div>
                                    
                                    <div className="sim-score-row">
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>ACCURACY SCORE</div>
                                            <div className="sim-score">{SIMULATOR_QUESTIONS[activeSimIndex].score}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>COVERED</div>
                                            <div className="sim-chips">
                                                {SIMULATOR_QUESTIONS[activeSimIndex].conceptsCovered.map((c) => (
                                                    <span key={c} className="chip chip-green">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="sim-btn-container">
                                    <button 
                                        className="btn-sim-action"
                                        disabled={isSimulating}
                                        onClick={startSimulatingText}
                                    >
                                        🎙️ {isSimulating ? 'Simulating Voice Input...' : 'Simulate Voice Response'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GITHUB VERIFIER SECTION */}
            <section style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="section-inner">
                    <div className="split reverse">
                        <div className="split-text">
                            <div className="eyebrow reveal">GitHub verifier</div>
                            <h2 className="reveal reveal-d1">Prove your projects are <em>actually yours.</em></h2>
                            <p className="sec-sub reveal reveal-d2">
                                Recruiters can't verify GitHub projects during a resume screen. CampusSync does it automatically — commit history, file structure, code quality, and AI authenticity check.
                            </p>
                            <p className="reveal reveal-d3" style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.7' }}>
                                Paste your repo URL. The verifier fetches metadata, languages, commit timeline, and file tree in parallel — then Gemini AI checks it against 5 authenticity criteria. You get a structured verdict you can share with recruiters.
                            </p>
                            <div style={{ marginTop: '20px' }} className="reveal reveal-d3">
                                <span className="chip chip-green" style={{ fontSize: '13px', padding: '5px 12px' }}>VERIFIED</span>
                                <span className="chip chip-amber" style={{ fontSize: '13px', padding: '5px 12px', marginLeft: '6px' }}>PARTIAL</span>
                                <span className="chip chip-red" style={{ fontSize: '13px', padding: '5px 12px', marginLeft: '6px' }}>SUSPICIOUS</span>
                            </div>
                        </div>
                        
                        <div className="split-visual reveal reveal-d2">
                            <div className="verify-card">
                                <div className="verify-header">
                                    <span style={{ fontSize: '14px' }}>⚡</span>
                                    <span className="verify-title">github.com/you/campus-sync-edge-ai</span>
                                </div>
                                <div className="verify-body">
                                    <div className="verify-row">
                                        <span className="verify-criterion">Commit history consistent</span>
                                        <span className="verdict v-pass">PASS</span>
                                    </div>
                                    <div className="verify-row">
                                        <span className="verify-criterion">Language matches claimed stack</span>
                                        <span className="verdict v-pass">PASS</span>
                                    </div>
                                    <div className="verify-row">
                                        <span className="verify-criterion">File structure non-trivial</span>
                                        <span className="verdict v-pass">PASS</span>
                                    </div>
                                    <div className="verify-row">
                                        <span className="verify-criterion">Code complexity adequate</span>
                                        <span className="verdict v-pass">PASS</span>
                                    </div>
                                    <div className="verify-row">
                                        <span className="verify-criterion">Not a copied tutorial repo</span>
                                        <span className="verdict v-warn">REVIEW</span>
                                    </div>
                                    <div className="verify-final">
                                        ✓ VERIFIED — Project is authentic with minor flags
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section>
                <div className="section-inner">
                    <div className="eyebrow reveal">Student feedback</div>
                    <h2 className="reveal reveal-d1">From students who <em>actually got placed.</em></h2>
                    <p className="sec-sub reveal reveal-d2">Real feedback from students who used CampusSync to identify their gaps before placement season.</p>
                    
                    <div className="tgrid reveal reveal-d3">
                        {TESTIMONIALS.map((t) => (
                            <div key={t.author} className="tcard">
                                <div className="stars">★★★★★</div>
                                <p className="tcard-quote">"{t.quote}"</p>
                                <div className="tcard-footer">
                                    <div className="tcard-av">{t.initials}</div>
                                    <div>
                                        <div className="tcard-name">{t.author}</div>
                                        <div className="tcard-role">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA DRAG AND DROP */}
            <div className="cta-section">
                <div className="cta-inner">
                    <h2 className="reveal">Ready to find out where you actually stand?</h2>
                    <p className="reveal reveal-d1">Upload your resume and get a detailed readiness report for 7 engineering roles — free, takes under 60 seconds.</p>
                    
                    <div 
                        className={`dropzone reveal reveal-d2 ${uploadFinished ? 'success' : ''}`} 
                        id="drop"
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={simulateUpload}
                    >
                        {isUploading ? (
                            <div>
                                <div className="drop-icon">⏳</div>
                                <div className="drop-txt" style={{ color: '#9E9A94' }}>Analyzing resume ({uploadProgress}%)</div>
                            </div>
                        ) : uploadFinished ? (
                            <div className="drop-success">✓ Resume analyzed — redirecting to your report...</div>
                        ) : (
                            <div>
                                <div className="drop-icon">📄</div>
                                <div className="drop-txt">Drag & drop your resume here</div>
                                <div className="drop-sub">PDF or DOCX · Encrypted at rest · Never stored longer than needed</div>
                            </div>
                        )}
                    </div>
                    
                    <div className="cta-btns reveal reveal-d3">
                        <Link to="/signup" className="btn-light">→ Scan Resume Free</Link>
                        <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer" className="btn-outline">View on GitHub ↗</a>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer>
                <div className="foot-brand">
                    <div className="logo-mark" style={{ width: '28px', height: '28px', fontSize: '15px' }}>C</div>
                    <div>
                        <div className="foot-name">CampusSync Edge AI</div>
                        <div className="foot-tag">Career Intelligence for Engineers</div>
                    </div>
                </div>
                <div className="foot-links">
                    <a href="https://campussync-edge.onrender.com" target="_blank" rel="noreferrer">Live app ↗</a>
                    <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer">GitHub ↗</a>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/docs">Docs</Link>
                    <Link to="/terms">Terms</Link>
                </div>
                <div className="foot-copy">© 2026 CampusSync Edge AI · Built by Ganesh</div>
            </footer>
        </div>
    )
}
