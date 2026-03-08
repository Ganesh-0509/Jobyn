import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { X, BookOpen, CheckCircle2, ChevronRight, BrainCircuit, Lightbulb, Clock, MessageSquare, Send, Sparkles, Pin, Sun, Moon, Target, Zap, RotateCcw, AlertCircle, Code2 } from 'lucide-react'
import { getStudyNotes, getStudyQuiz, studyChat, submitContribution, type StudyNotesResult, type QuizResult } from '../api/client'
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

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [quizFinished, setQuizFinished] = useState(false)
    const [score, setScore] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

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
            // If both are fallback, show a warning but still display
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
            if (totalCorrect === quiz.questions.length) {
                onVerified(skill)
            }
        }
    }

    const [suggested, setSuggested] = useState(false)
    const handleSuggest = async () => {
        if (!personalNotes.trim()) return
        try {
            await submitContribution(skill, user?.name || 'Anonymous', { suggested_notes: personalNotes })
            setSuggested(true)
            setTimeout(() => setSuggested(false), 3000)
        } catch (err) {
            console.error(err)
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
                        <div className="progress-track" style={{ height: 6, margin: '8px 0' }}>
                            <div className="progress-fill" style={{ width: `${quizFinished ? score === (quiz?.questions?.length || 0) ? '100%' : '50%' : '15%'}` }} />
                        </div>
                        <small>{isPinned ? 'Pinned for Review' : 'Learning Phase'}</small>
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
                        <button
                            className="btn btn--outline btn--sm"
                            style={{ marginTop: 8, width: '100%' }}
                            onClick={handleSuggest}
                            disabled={!personalNotes.trim() || suggested}
                        >
                            {suggested ? <><CheckCircle2 size={14} /> Submitted</> : 'Suggest to Course'}
                        </button>
                    </div>

                    {notes?.sub_roadmap && (
                        <div className="workspace-nav-group">
                            <h6>Mastery Curriculum</h6>
                            {notes.sub_roadmap.map((step, idx) => (
                                <div key={idx} className="curriculum-item">
                                    <div className="item-dot" />
                                    <span>{step.title}</span>
                                </div>
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
                                <div className="notes-hero">
                                    <p>{notes.quick_summary}</p>
                                    <div className="time-est"><Clock size={16} />{notes.estimated_study_time} est. focus time</div>
                                </div>

                                {notes.sub_roadmap && notes.sub_roadmap.length > 0 && (
                                    <div className="roadmap-path">
                                        <div className="path-header">
                                            <Sparkles size={16} /> Hierarchical Mastery Path
                                        </div>
                                        <div className="path-items">
                                            {notes.sub_roadmap?.map((step: { title: string; duration: string }, idx: number) => (
                                                <div key={idx} className="path-node">
                                                    <div className="node-marker">{idx + 1}</div>
                                                    <div className="node-info">
                                                        <div className="node-title">{step.title}</div>
                                                        <div className="node-meta">{step.duration} focus</div>
                                                    </div>
                                                    {notes.sub_roadmap && idx < notes.sub_roadmap.length - 1 && <div className="node-line" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {notes.detailed_content && notes.detailed_content.length > 0 ? (
                                    <div className="concept-sections">
                                        {notes.detailed_content.map((c, i) => (
                                            <div key={i} className="focus-card detailed-card">
                                                <div className="card-num">{i + 1}</div>
                                                <h3>{c.subheading}</h3>
                                                <div className="content-prose">
                                                    <Suspense fallback={<p>{c.explanation}</p>}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {c.explanation}
                                                        </ReactMarkdown>
                                                    </Suspense>

                                                    {c.algorithm && (
                                                        <div className="algo-block" style={{ marginBottom: 16 }}>
                                                            <strong style={{ display: 'block', color: 'var(--cyan)', marginBottom: 4 }}>Algorithm / Steps:</strong>
                                                            <div style={{ fontSize: 13, background: 'rgba(34, 211, 238, 0.05)', padding: 12, borderRadius: 8, borderLeft: '2px solid var(--cyan)' }}>
                                                                <Suspense fallback={<p style={{ whiteSpace: 'pre-line' }}>{c.algorithm}</p>}>
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {c.algorithm}
                                                                    </ReactMarkdown>
                                                                </Suspense>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {c.example && (
                                                        <div className="example-block">
                                                            <div className="example-label"><Code2 size={14} /> Code Example</div>
                                                            <div className="example-content">
                                                                <Suspense fallback={<pre>{c.example}</pre>}>
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {c.example.includes('```') ? c.example : `\`\`\`\n${c.example}\n\`\`\``}
                                                                    </ReactMarkdown>
                                                                </Suspense>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {c.key_takeaway && (
                                                        <div className="takeaway-box">
                                                            <Zap size={16} />
                                                            <div>
                                                                <strong>Key Takeaway</strong>
                                                                <p>{c.key_takeaway}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {c.try_it && (
                                                        <div className="try-it-box">
                                                            <button
                                                                className="try-it-toggle"
                                                                onClick={() => setExpandedTryIt(prev => ({ ...prev, [i]: !prev[i] }))}
                                                            >
                                                                <Target size={16} />
                                                                <span>Try It Yourself</span>
                                                                <ChevronRight size={16} className={expandedTryIt[i] ? 'rotated' : ''} />
                                                            </button>
                                                            {expandedTryIt[i] && (
                                                                <div className="try-it-content">
                                                                    <p>{c.try_it}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {c.complexity && c.complexity !== 'N/A' && (
                                                        <div style={{ marginTop: 16, display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                                                            <strong style={{ color: 'var(--orange)' }}>Complexity:</strong> <span>{c.complexity}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notes.key_concepts && notes.key_concepts.length > 0 ? (
                                    <div className="concept-sections">
                                        {notes.key_concepts.map((c, i) => (
                                            <div key={i} className="focus-card">
                                                <div className="card-num">{i + 1}</div>
                                                <h3>{c.title}</h3>
                                                <p>{c.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="pro-zone">
                                    <div className="zone-icon"><Lightbulb size={24} /></div>
                                    <div className="zone-text">
                                        <h4>Industry Insight</h4>
                                        <p>{notes.pro_tip}</p>
                                    </div>
                                </div>

                                <div className="ws-actions">
                                    <button className="btn btn--primary" onClick={() => setTab('quiz')}>
                                        I'm ready for a Challenge <ChevronRight size={18} />
                                    </button>
                                </div>
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
                                        <div className={`quiz-score-ring ${score === quiz.questions.length ? 'perfect' : score >= quiz.questions.length * 0.6 ? 'pass' : 'fail'}`}>
                                            <div className="quiz-score-num">{score}/{quiz.questions.length}</div>
                                            <div className="quiz-score-label">{score === quiz.questions.length ? 'Perfect!' : score >= quiz.questions.length * 0.6 ? 'Good Job' : 'Keep Learning'}</div>
                                        </div>

                                        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>
                                            {score === quiz.questions.length ? 'Mastery Verified!' : 'Review & Retry'}
                                        </h2>
                                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                                            {score === quiz.questions.length
                                                ? `Outstanding! You've demonstrated mastery of ${skill}. Your skill is now verified.`
                                                : `You got ${score} out of ${quiz.questions.length} correct. Review the explanations below, then give it another shot.`
                                            }
                                        </p>

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

                                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                                            {score === quiz.questions.length ? (
                                                <button className="btn btn--primary" onClick={onClose}>
                                                    <CheckCircle2 size={18} /> Finish & Earn Credits
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
