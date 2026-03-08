import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { X, BookOpen, CheckCircle2, ChevronRight, ChevronLeft, BrainCircuit, Lightbulb, Clock, MessageSquare, Send, Sparkles, Pin, Sun, Moon, Target, Zap, RotateCcw, AlertCircle, Code2, ExternalLink, Loader2 } from 'lucide-react'
import { getStudyNotes, getStudyQuiz, getStudySection, studyChat, type StudyNotesResult, type QuizResult, type DetailedContent } from '../api/client'
const ReactMarkdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import InterviewSimulator from './InterviewSimulator'

interface StudyHubProps {
    skill: string
    onClose: () => void
    onVerified: (skill: string) => void
}

type Tab = 'notes' | 'quiz' | 'ask' | 'interview'

export default function StudyHub({ skill, onClose, onVerified }: StudyHubProps) {
    const { masteredSkills } = useResume()
    const { user } = useAuth()
    const [tab, setTab] = useState<Tab>('notes')
    const [notes, setNotes] = useState<StudyNotesResult | null>(null)
    const [quiz, setQuiz] = useState<QuizResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    // Paginated section state
    const [activeSectionIdx, setActiveSectionIdx] = useState(0)
    const [sections, setSections] = useState<Record<number, DetailedContent>>({})
    const [sectionLoading, setSectionLoading] = useState<number | null>(null)
    const totalSections = notes?.total_sections || 5

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [quizFinished, setQuizFinished] = useState(false)
    const [score, setScore] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

    // Section completion tracking
    const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set([0]))
    const allSectionsRead = visitedSections.size >= totalSections
    const PASS_THRESHOLD = 0.8 // 80% to pass (4/5)
    const quizPassed = quizFinished && quiz ? score >= Math.ceil(quiz.questions.length * PASS_THRESHOLD) : false

    // Auto-trigger mastery when both conditions become true
    const [masteryAwarded, setMasteryAwarded] = useState(false)
    useEffect(() => {
        if (quizPassed && allSectionsRead && !masteryAwarded) {
            setMasteryAwarded(true)
            onVerified(skill)
        }
    }, [quizPassed, allSectionsRead, masteryAwarded, onVerified, skill])

    // Interactive notes state
    const [expandedTryIt, setExpandedTryIt] = useState<Record<number, boolean>>({})

    // Chat state
    const [query, setQuery] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Saved state
    const [isPinned, setIsPinned] = useState(false)
    // Theme & Notes state
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [personalNotes, setPersonalNotes] = useState(() => localStorage.getItem(`notes_${skill}`) || '')

    useEffect(() => {
        localStorage.setItem(`notes_${skill}`, personalNotes)
    }, [personalNotes, skill])

    // Stabilize masteredSkills to prevent duplicate API calls on every render
    const skillsKey = masteredSkills.join(',')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setLoadError('')
        // Check if already pinned
        const pinned = JSON.parse(localStorage.getItem('pinned_notes') || '[]')
        setIsPinned(pinned.includes(skill))

        const skills = skillsKey ? skillsKey.split(',') : []
        Promise.all([
            getStudyNotes(skill, skills),
            getStudyQuiz(skill)
        ]).then(([n, q]) => {
            if (cancelled) return
            setNotes(n)
            setQuiz(q)
            // Populate section map from any detailed_content returned with overview
            // SKIP section index 4 (LeetCode) — it must always load from the
            // dedicated section endpoint so the LeetCode-specific prompt is used.
            if (n?.detailed_content?.length) {
                const sMap: Record<number, DetailedContent> = {}
                n.detailed_content.forEach((s, i) => {
                    if (i !== 4) sMap[i] = s
                })
                setSections(sMap)
            }
            if ((n as any)?.is_fallback && (q as any)?.is_fallback) {
                setLoadError('AI service returned limited content. Some sections may be incomplete.')
            }
        }).catch(err => {
            if (cancelled) return
            console.error(err)
            setLoadError('Failed to load study materials. You can still use the Interview Simulator and AI Chat.')
        }).finally(() => {
            if (!cancelled) setLoading(false)
        })
        return () => { cancelled = true }
    }, [skill, skillsKey])  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Section loader: fetches a section on demand ──
    const loadSection = useCallback(async (idx: number) => {
        if (sections[idx] || sectionLoading === idx) return // already loaded or loading
        setSectionLoading(idx)
        try {
            const skills = skillsKey ? skillsKey.split(',') : []
            const section = await getStudySection(skill, idx, skills)
            setSections(prev => ({ ...prev, [idx]: section }))
        } catch (err) {
            console.error(`Failed to load section ${idx}:`, err)
            setSections(prev => ({
                ...prev,
                [idx]: {
                    subheading: `Section ${idx + 1}`,
                    explanation: 'Failed to load this section. Please try again.',
                    example: '',
                    is_fallback: true,
                }
            }))
        } finally {
            setSectionLoading(null)
        }
    }, [sections, sectionLoading, skill, skillsKey])

    // Preload next section when user views current one
    useEffect(() => {
        const nextIdx = activeSectionIdx + 1
        if (nextIdx < totalSections && !sections[nextIdx]) {
            // Small delay to not compete with current section load
            const timer = setTimeout(() => loadSection(nextIdx), 1500)
            return () => clearTimeout(timer)
        }
    }, [activeSectionIdx, totalSections, sections, loadSection])

    const goToSection = (idx: number) => {
        if (idx < 0 || idx >= totalSections) return
        setActiveSectionIdx(idx)
        setVisitedSections(prev => new Set(prev).add(idx))
        if (!sections[idx]) {
            loadSection(idx)
        }
    }

    const togglePin = () => {
        const pinned = JSON.parse(localStorage.getItem('pinned_notes') || '[]')
        let next: string[]
        if (isPinned) {
            next = pinned.filter((s: string) => s !== skill)
        } else {
            next = [...pinned, skill]
        }
        localStorage.setItem('pinned_notes', JSON.stringify(next))
        setIsPinned(!isPinned)
    }

    const handleChat = async () => {
        if (!query.trim()) return
        const newMsg = { role: 'user' as const, content: query }
        const history = [...messages, newMsg]
        setMessages(history)
        setQuery('')
        setChatLoading(true)

        try {
            // Pass masteredSkills for better AI context
            const response = await studyChat(skill, query, history, masteredSkills)
            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI Tutor. Check your connection or API key." }])
        } finally {
            setChatLoading(false)
        }
    }

    const handleAnswer = (idx: number) => {
        if (showExplanation) return // prevent double-click during reveal
        setSelectedAnswer(idx)
        setShowExplanation(true)

        const newAns = [...answers]
        newAns[currentQ] = idx
        setAnswers(newAns)
    }

    const handleNextQuestion = () => {
        setShowExplanation(false)
        setSelectedAnswer(null)
        if (quiz && currentQ < quiz.questions.length - 1) {
            setCurrentQ(v => v + 1)
        } else if (quiz) {
            const correct = answers.filter((a, i) => a === quiz.questions[i]?.correct_index).length
            // Also count the current question if correct
            const finalAnswers = [...answers]
            const totalCorrect = finalAnswers.filter((a, i) => a === quiz.questions[i]?.correct_index).length
            setScore(totalCorrect)
            setQuizFinished(true)
            // Mastery is auto-triggered by the useEffect when both conditions are met
        }
    }



    if (loading) return (
        <div className="study-modal" role="dialog" aria-label="Loading study materials">
            <div className="study-content study-content--loading">
                <div className="spinner study-spinner"></div>
                <h2>Gathering Learning Materials...</h2>
                <p>Personalizing notes for {skill} based on your career goal.</p>
                <p style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>This may take 15-30 seconds for new topics</p>
            </div>
        </div>
    )

    return (
        <div className={`study-modal ${theme}-hub`} role="dialog" aria-label={`Study Hub: ${skill}`}>
            <div className="study-workspace">
                {/* ── Focus Sidebar ── */}
                <aside className="workspace-sidebar">
                    <div className="sidebar-brand">
                        <Sparkles size={20} className="glow-icon" />
                        <span>Focus Mode</span>
                        <button
                            className="theme-toggle-btn"
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>

                    {loadError && (
                        <div className="sidebar-warning" style={{ padding: '8px 12px', margin: '0 8px 8px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, fontSize: 12, color: '#fbbf24' }}>
                            {loadError}
                        </div>
                    )}

                    <div className="sidebar-mastery-card">
                        <p>Mastery Progress</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: allSectionsRead ? 'var(--green)' : 'rgba(255,255,255,0.08)', color: allSectionsRead ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
                                    {allSectionsRead ? '✓' : `${visitedSections.size}`}
                                </div>
                                <span style={{ fontSize: 12, color: allSectionsRead ? 'var(--green)' : 'var(--text-secondary)' }}>
                                    Read all {totalSections} sections {allSectionsRead ? '' : `(${visitedSections.size}/${totalSections})`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: quizPassed ? 'var(--green)' : 'rgba(255,255,255,0.08)', color: quizPassed ? '#fff' : 'var(--text-muted)', flexShrink: 0 }}>
                                    {quizPassed ? '✓' : '○'}
                                </div>
                                <span style={{ fontSize: 12, color: quizPassed ? 'var(--green)' : 'var(--text-secondary)' }}>
                                    Pass quiz (≥80%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="workspace-nav-group">
                        <h6>Main Navigation</h6>
                        <button
                            className={`ws-nav-item ${tab === 'notes' ? 'active' : ''}`}
                            onClick={() => setTab('notes')}
                        >
                            <BookOpen size={18} />
                            <span>Course Guide</span>
                        </button>
                        <button
                            className={`ws-nav-item ${tab === 'ask' ? 'active' : ''}`}
                            onClick={() => setTab('ask')}
                        >
                            <MessageSquare size={18} />
                            <span>AI Assistant</span>
                        </button>
                        <button
                            className={`ws-nav-item ${tab === 'quiz' ? 'active' : ''}`}
                            onClick={() => setTab('quiz')}
                        >
                            <CheckCircle2 size={18} />
                            <span>Knowledge Check</span>
                        </button>
                        <button
                            className={`ws-nav-item ${tab === 'interview' ? 'active' : ''}`}
                            onClick={() => setTab('interview')}
                        >
                            <Target size={18} />
                            <span>Mock Interview</span>
                        </button>
                    </div>

                    <div className="workspace-nav-group">
                        <h6>Personal Scratchpad</h6>
                        <textarea
                            className="focus-scratchpad"
                            placeholder="Type your notes here... (saved automatically)"
                            value={personalNotes}
                            onChange={(e) => setPersonalNotes(e.target.value)}
                        />
                    </div>

                    {notes?.sub_roadmap && (
                        <div className="workspace-nav-group">
                            <h6>Mastery Curriculum</h6>
                            {notes.sub_roadmap.map((step, idx) => (
                                <button
                                    key={idx}
                                    className={`curriculum-item ${idx === activeSectionIdx && tab === 'notes' ? 'curriculum-item--active' : ''} ${sections[idx] ? 'curriculum-item--loaded' : ''} ${visitedSections.has(idx) ? 'curriculum-item--visited' : ''}`}
                                    onClick={() => { setTab('notes'); goToSection(idx) }}
                                >
                                    <div className={`item-dot ${visitedSections.has(idx) ? 'visited' : sections[idx] ? 'loaded' : ''}`}>
                                        {visitedSections.has(idx) && <CheckCircle2 size={10} />}
                                    </div>
                                    <span>{step.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="sidebar-footer">
                        <button
                            className={`btn-pin ${isPinned ? 'pinned' : ''}`}
                            onClick={togglePin}
                        >
                            <Pin size={16} /> {isPinned ? 'Saved to Hub' : 'Pin to Study Hub'}
                        </button>
                    </div>
                </aside>

                {/* ── Main Workspace Body ── */}
                <main className="workspace-body">
                    <header className="workspace-header">
                        <div className="header-skill">
                            <div className="skill-avatar">{skill[0]}</div>
                            <div>
                                <h1>{skill}</h1>
                                <span>Mastery Course • Level {skill.toLowerCase() === 'dsa' ? 'Pro' : 'Core'}</span>
                            </div>
                        </div>
                        <button className="btn-close-ws" onClick={onClose}><X size={24} /></button>
                    </header>

                    <div className="workspace-content">
                        {tab === 'notes' && !notes && (
                            <div className="workspace-pane fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <BrainCircuit size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <h3>Notes unavailable</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Study materials couldn't be loaded. Try the AI Assistant or Mock Interview instead.</p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                    <button className="btn btn--ghost" onClick={() => setTab('ask')}>AI Assistant</button>
                                    <button className="btn btn--primary" onClick={() => setTab('interview')}>Mock Interview</button>
                                </div>
                            </div>
                        )}
                        {tab === 'notes' && notes && (
                            <div className="workspace-pane fade-in">
                                {/* Hero Summary */}
                                <div className="notes-hero">
                                    <p>{notes.quick_summary}</p>
                                    <div className="time-est"><Clock size={16} />{notes.estimated_study_time} est. focus time</div>
                                </div>

                                {/* Section progress bar */}
                                <div className="section-progress-bar">
                                    {Array.from({ length: totalSections }).map((_, i) => (
                                        <button
                                            key={i}
                                            className={`section-dot ${i === activeSectionIdx ? 'active' : ''} ${sections[i] ? 'loaded' : ''} ${visitedSections.has(i) ? 'visited' : ''}`}
                                            onClick={() => goToSection(i)}
                                            title={notes.sub_roadmap?.[i]?.title || `Section ${i + 1}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <div className="section-progress-label">
                                        Section {activeSectionIdx + 1} of {totalSections}
                                    </div>
                                </div>

                                {/* Active Section Content */}
                                {sectionLoading === activeSectionIdx && !sections[activeSectionIdx] ? (
                                    <div className="section-loading-state">
                                        <div className="section-loading-spinner">
                                            <Loader2 size={32} className="spin-animation" />
                                        </div>
                                        <h3>Preparing {notes.sub_roadmap?.[activeSectionIdx]?.title || `Section ${activeSectionIdx + 1}`}...</h3>
                                        <p>AI is generating detailed content with code examples. Please wait a few seconds.</p>
                                        <div className="section-loading-bar">
                                            <div className="section-loading-fill" />
                                        </div>
                                    </div>
                                ) : sections[activeSectionIdx] ? (
                                    <div className="section-content-page fade-in">
                                        <div className="focus-card detailed-card">
                                            <div className="card-num">{activeSectionIdx + 1}</div>
                                            <h3>{sections[activeSectionIdx].subheading}</h3>
                                            <div className="content-prose">
                                                <Suspense fallback={<p>{sections[activeSectionIdx].explanation}</p>}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {sections[activeSectionIdx].explanation}
                                                    </ReactMarkdown>
                                                </Suspense>

                                                {sections[activeSectionIdx].algorithm && (
                                                    <div className="algo-block" style={{ marginBottom: 16 }}>
                                                        <strong style={{ display: 'block', color: 'var(--cyan)', marginBottom: 4 }}>Algorithm / Steps:</strong>
                                                        <div style={{ fontSize: 13, background: 'rgba(34, 211, 238, 0.05)', padding: 12, borderRadius: 8, borderLeft: '2px solid var(--cyan)' }}>
                                                            <Suspense fallback={<p style={{ whiteSpace: 'pre-line' }}>{sections[activeSectionIdx].algorithm}</p>}>
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {sections[activeSectionIdx].algorithm!}
                                                                </ReactMarkdown>
                                                            </Suspense>
                                                        </div>
                                                    </div>
                                                )}

                                                {sections[activeSectionIdx].example && (
                                                    <div className="example-block">
                                                        <div className="example-label"><Code2 size={14} /> Code Example</div>
                                                        <div className="example-content">
                                                            <Suspense fallback={<pre>{sections[activeSectionIdx].example}</pre>}>
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {sections[activeSectionIdx].example.includes('```') ? sections[activeSectionIdx].example : `\`\`\`\n${sections[activeSectionIdx].example}\n\`\`\``}
                                                                </ReactMarkdown>
                                                            </Suspense>
                                                        </div>
                                                    </div>
                                                )}

                                                {sections[activeSectionIdx].key_takeaway && (
                                                    <div className="takeaway-box">
                                                        <Zap size={16} />
                                                        <div>
                                                            <strong>Key Takeaway</strong>
                                                            <p>{sections[activeSectionIdx].key_takeaway}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {sections[activeSectionIdx].try_it && (
                                                    <div className="try-it-box">
                                                        <button
                                                            className="try-it-toggle"
                                                            onClick={() => setExpandedTryIt(prev => ({ ...prev, [activeSectionIdx]: !prev[activeSectionIdx] }))}
                                                        >
                                                            <Target size={16} />
                                                            <span>Try It Yourself</span>
                                                            <ChevronRight size={16} className={expandedTryIt[activeSectionIdx] ? 'rotated' : ''} />
                                                        </button>
                                                        {expandedTryIt[activeSectionIdx] && (
                                                            <div className="try-it-content">
                                                                <p>{sections[activeSectionIdx].try_it}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {sections[activeSectionIdx].complexity && sections[activeSectionIdx].complexity !== 'N/A' && (
                                                    <div style={{ marginTop: 16, display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                                                        <strong style={{ color: 'var(--orange)' }}>Complexity:</strong> <span>{sections[activeSectionIdx].complexity}</span>
                                                    </div>
                                                )}

                                                {/* LeetCode Problems (section 4) */}
                                                {sections[activeSectionIdx].leetcode_problems && sections[activeSectionIdx].leetcode_problems!.length > 0 && (
                                                    <div className="leetcode-section">
                                                        <h4 className="leetcode-header">
                                                            <Code2 size={18} /> LeetCode Practice Problems
                                                        </h4>
                                                        <div className="leetcode-grid">
                                                            {sections[activeSectionIdx].leetcode_problems!.map((p, pi) => (
                                                                <div
                                                                    key={pi}
                                                                    className={`leetcode-card leetcode-card--${p.difficulty?.toLowerCase()}`}
                                                                >
                                                                    <div className="leetcode-card-top">
                                                                        <span className="leetcode-num">#{p.number}</span>
                                                                        <span className={`leetcode-diff leetcode-diff--${p.difficulty?.toLowerCase()}`}>
                                                                            {p.difficulty}
                                                                        </span>
                                                                    </div>
                                                                    <h5 className="leetcode-title">{p.title}</h5>
                                                                    {p.description && <p className="leetcode-desc">{p.description}</p>}
                                                                    {(p.example_input || p.example_output) && (
                                                                        <div className="leetcode-io">
                                                                            {p.example_input && (
                                                                                <div className="leetcode-io-row">
                                                                                    <span className="leetcode-io-label">Input:</span>
                                                                                    <code>{p.example_input}</code>
                                                                                </div>
                                                                            )}
                                                                            {p.example_output && (
                                                                                <div className="leetcode-io-row">
                                                                                    <span className="leetcode-io-label">Output:</span>
                                                                                    <code>{p.example_output}</code>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {p.pattern && <span className="leetcode-pattern">{p.pattern}</span>}
                                                                    {p.hint && <p className="leetcode-hint">💡 {p.hint}</p>}
                                                                    <a
                                                                        className="leetcode-link"
                                                                        href={p.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        Solve on LeetCode <ExternalLink size={12} />
                                                                    </a>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="section-loading-state" style={{ cursor: 'pointer' }} onClick={() => loadSection(activeSectionIdx)}>
                                        <BrainCircuit size={40} style={{ opacity: 0.3 }} />
                                        <h3>Click to load {notes.sub_roadmap?.[activeSectionIdx]?.title || `Section ${activeSectionIdx + 1}`}</h3>
                                        <p>Content will be generated by AI</p>
                                    </div>
                                )}

                                {/* Section Navigation Arrows */}
                                <div className="section-nav-arrows">
                                    <button
                                        className="section-arrow section-arrow--prev"
                                        onClick={() => goToSection(activeSectionIdx - 1)}
                                        disabled={activeSectionIdx === 0}
                                    >
                                        <ChevronLeft size={20} /> Previous
                                    </button>
                                    <div className="section-nav-info">
                                        {notes.sub_roadmap?.[activeSectionIdx]?.title || `Section ${activeSectionIdx + 1}`}
                                    </div>
                                    {activeSectionIdx < totalSections - 1 ? (
                                        <button
                                            className="section-arrow section-arrow--next"
                                            onClick={() => goToSection(activeSectionIdx + 1)}
                                        >
                                            Next <ChevronRight size={20} />
                                        </button>
                                    ) : (
                                        <button
                                            className="section-arrow section-arrow--next section-arrow--quiz"
                                            onClick={() => setTab('quiz')}
                                        >
                                            Take Quiz <ChevronRight size={20} />
                                        </button>
                                    )}
                                </div>

                                {/* Industry Insight */}
                                {notes.pro_tip && (
                                    <div className="pro-zone">
                                        <div className="zone-icon"><Lightbulb size={24} /></div>
                                        <div className="zone-text">
                                            <h4>Industry Insight</h4>
                                            <p>{notes.pro_tip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'ask' && (
                            <div className="workspace-pane chat-pane fade-in">
                                <div className="chat-history">
                                    {messages.length === 0 && (
                                        <div className="chat-empty">
                                            <BrainCircuit size={48} className="empty-icon" />
                                            <h3>Ask anything about {skill}</h3>
                                            <p>I can explain concepts, give code examples, or help you with specific doubts.</p>
                                        </div>
                                    )}
                                    {messages.map((m, i) => (
                                        <div key={i} className={`msg msg--${m.role}`}>
                                            <div className="msg-content">
                                                {m.role === 'assistant' ? (
                                                    <Suspense fallback={<span>Loading...</span>}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {m.content}
                                                        </ReactMarkdown>
                                                    </Suspense>
                                                ) : m.content}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="msg msg--assistant">
                                            <div className="msg-content loading-dots">Thinking...</div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="chat-input-row">
                                    <input
                                        type="text"
                                        placeholder="Ask a question..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                                    />
                                    <button className="btn-send" onClick={handleChat} disabled={chatLoading}><Send size={18} /></button>
                                </div>
                            </div>
                        )}

                        {tab === 'quiz' && !quiz && (
                            <div className="workspace-pane fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
                                <CheckCircle2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                                <h3>Quiz unavailable</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Quiz couldn't be loaded. Try the Mock Interview for a comprehensive skill assessment.</p>
                                <button className="btn btn--primary" onClick={() => setTab('interview')}>Try Mock Interview</button>
                            </div>
                        )}
                        {tab === 'quiz' && quiz && (
                            <div className="workspace-pane fade-in">
                                {!quizFinished ? (
                                    <div className="quiz-container">
                                        {/* Progress dots */}
                                        <div className="quiz-dots">
                                            {quiz.questions.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`quiz-dot ${i === currentQ ? 'active' : ''} ${i < currentQ ? (answers[i] === quiz.questions[i].correct_index ? 'correct' : 'wrong') : ''}`}
                                                />
                                            ))}
                                        </div>

                                        <div className="quiz-meta-row">
                                            <span className="quiz-counter">Question {currentQ + 1} of {quiz.questions.length}</span>
                                            {quiz.questions[currentQ].difficulty && (
                                                <span className={`quiz-difficulty quiz-difficulty--${quiz.questions[currentQ].difficulty}`}>
                                                    {quiz.questions[currentQ].difficulty}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="quiz-question-text">
                                            <Suspense fallback={<span>{quiz.questions[currentQ].question}</span>}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {quiz.questions[currentQ].question}
                                                </ReactMarkdown>
                                            </Suspense>
                                        </h2>

                                        <div className="quiz-options-grid">
                                            {quiz.questions[currentQ].options.map((opt, i) => {
                                                const isSelected = selectedAnswer === i
                                                const isCorrect = i === quiz.questions[currentQ].correct_index
                                                const revealed = showExplanation
                                                let optClass = 'quiz-option'
                                                if (revealed && isCorrect) optClass += ' quiz-option--correct'
                                                else if (revealed && isSelected && !isCorrect) optClass += ' quiz-option--wrong'
                                                else if (isSelected) optClass += ' quiz-option--selected'

                                                return (
                                                    <button
                                                        key={i}
                                                        className={optClass}
                                                        onClick={() => handleAnswer(i)}
                                                        disabled={showExplanation}
                                                    >
                                                        <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                                                        <span className="quiz-option-text">{opt}</span>
                                                        {revealed && isCorrect && <CheckCircle2 size={18} className="quiz-icon-correct" />}
                                                        {revealed && isSelected && !isCorrect && <X size={18} className="quiz-icon-wrong" />}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {showExplanation && (
                                            <div className={`quiz-explanation ${selectedAnswer === quiz.questions[currentQ].correct_index ? 'quiz-explanation--correct' : 'quiz-explanation--wrong'}`}>
                                                <div className="quiz-explanation-header">
                                                    {selectedAnswer === quiz.questions[currentQ].correct_index
                                                        ? <><CheckCircle2 size={18} /> Correct!</>
                                                        : <><AlertCircle size={18} /> Not quite</>
                                                    }
                                                </div>
                                                <p>{quiz.questions[currentQ].explanation}</p>
                                                <button className="btn btn--primary btn--sm quiz-next-btn" onClick={handleNextQuestion}>
                                                    {currentQ < quiz.questions.length - 1 ? 'Next Question →' : 'See Results'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="quiz-results">
                                        {(() => {
                                            const needed = Math.ceil(quiz.questions.length * PASS_THRESHOLD)
                                            const mastered = quizPassed && allSectionsRead
                                            return (
                                                <>
                                                    <div className={`quiz-score-ring ${mastered ? 'perfect' : quizPassed ? 'pass' : score >= quiz.questions.length * 0.5 ? 'pass' : 'fail'}`}>
                                                        <div className="quiz-score-num">{score}/{quiz.questions.length}</div>
                                                        <div className="quiz-score-label">{mastered ? 'Mastered!' : quizPassed ? 'Passed!' : 'Keep Learning'}</div>
                                                    </div>

                                                    <h2 style={{ textAlign: 'center', marginBottom: 8 }}>
                                                        {mastered ? 'Mastery Verified!' : quizPassed ? 'Quiz Passed!' : 'Review & Retry'}
                                                    </h2>
                                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>
                                                        {mastered
                                                            ? `Outstanding! You've demonstrated mastery of ${skill}. Your skill is now verified.`
                                                            : quizPassed && !allSectionsRead
                                                                ? `Great score! But you still need to read all ${totalSections} sections to unlock mastery. (${visitedSections.size}/${totalSections} read)`
                                                                : `You got ${score} out of ${quiz.questions.length} correct (need ${needed} to pass). Review the explanations below, then give it another shot.`
                                                        }
                                                    </p>

                                                    {quizPassed && !allSectionsRead && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                                                            borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                                                            marginBottom: 16, fontSize: 13, color: '#fbbf24'
                                                        }}>
                                                            <AlertCircle size={16} />
                                                            <span>Complete all study sections first, then your skill will be marked as mastered.</span>
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()}

                                        {/* Question review */}
                                        <div className="quiz-review-list">
                                            {quiz.questions.map((q, i) => {
                                                const wasCorrect = answers[i] === q.correct_index
                                                return (
                                                    <div key={i} className={`quiz-review-item ${wasCorrect ? 'quiz-review--correct' : 'quiz-review--wrong'}`}>
                                                        <div className="quiz-review-header">
                                                            <span className="quiz-review-num">Q{i + 1}</span>
                                                            {wasCorrect
                                                                ? <CheckCircle2 size={16} className="quiz-icon-correct" />
                                                                : <X size={16} className="quiz-icon-wrong" />
                                                            }
                                                        </div>
                                                        <p className="quiz-review-question">{q.question}</p>
                                                        {!wasCorrect && (
                                                            <div className="quiz-review-answer">
                                                                <span>Your answer: <strong>{q.options[answers[i]] || 'Skipped'}</strong></span>
                                                                <span>Correct: <strong style={{ color: 'var(--green)' }}>{q.options[q.correct_index]}</strong></span>
                                                            </div>
                                                        )}
                                                        <p className="quiz-review-explanation">{q.explanation}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {(() => {
                                            const mastered = quizPassed && allSectionsRead
                                            return (
                                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                                                    {mastered ? (
                                                        <button className="btn btn--primary" onClick={onClose}>
                                                            <CheckCircle2 size={18} /> Finish & Earn Credits
                                                        </button>
                                                    ) : quizPassed && !allSectionsRead ? (
                                                        <button className="btn btn--primary" onClick={() => { setTab('notes'); goToSection(Array.from({ length: totalSections }, (_, i) => i).find(i => !visitedSections.has(i)) ?? 0) }}>
                                                            <BookOpen size={16} /> Go to Unread Section
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button className="btn btn--ghost" onClick={() => setTab('notes')}>
                                                                <BookOpen size={16} /> Review Notes
                                                            </button>
                                                            <button className="btn btn--primary" onClick={() => {
                                                                setQuizFinished(false)
                                                                setCurrentQ(0)
                                                                setAnswers([])
                                                                setSelectedAnswer(null)
                                                                setShowExplanation(false)
                                                            }}>
                                                                <RotateCcw size={16} /> Retry Quiz
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === 'interview' && (
                            <div className="workspace-pane fade-in">
                                <InterviewSimulator skill={skill} />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
