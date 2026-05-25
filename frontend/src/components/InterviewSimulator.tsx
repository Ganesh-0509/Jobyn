import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Mic, Send, Clock, Target, ChevronRight, Trophy, AlertCircle,
    Lightbulb, BarChart3, Star, RefreshCw, Zap, CheckCircle2, XCircle
} from 'lucide-react'
import {
    startInterview, submitInterviewAnswer, endInterview,
    type InterviewQuestion, type InterviewEvaluation, type InterviewScorecard
} from '../api/client'

interface InterviewSimulatorProps {
    skill: string
    onComplete?: (scorecard: InterviewScorecard) => void
}

type Phase = 'setup' | 'answering' | 'evaluating' | 'feedback' | 'scorecard' | 'loading'

interface HistoryItem {
    question_number: number
    question: string
    answer: string
    score: number
    feedback: string
    key_points_covered: string[]
    key_points_missed: string[]
}

const DIFFICULTY_CONFIG = {
    easy: { label: 'Junior', color: '#22c55e', icon: '🌱', desc: 'Fundamentals & definitions' },
    medium: { label: 'Mid-Level', color: '#f59e0b', icon: '⚡', desc: 'Practical scenarios & trade-offs' },
    hard: { label: 'Senior / FAANG', color: '#ef4444', icon: '🔥', desc: 'System design & optimization' },
}

const MAX_QUESTIONS = 5

export default function InterviewSimulator({ skill, onComplete }: InterviewSimulatorProps) {
    const [phase, setPhase] = useState<Phase>('setup')
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null)
    const [answer, setAnswer] = useState('')
    const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null)
    const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([])
    const [scorecard, setScorecard] = useState<InterviewScorecard | null>(null)
    const [timer, setTimer] = useState(0)
    const [timerActive, setTimerActive] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [error, setError] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Timer logic
    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [timerActive])

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const handleStart = useCallback(async () => {
        setPhase('loading')
        setError('')
        try {
            const q = await startInterview(skill, difficulty)
            setCurrentQuestion(q)
            setPhase('answering')
            setTimer(0)
            setTimerActive(true)
            setShowHint(false)
            setTimeout(() => textareaRef.current?.focus(), 100)
        } catch (e) {
            setError('Failed to start interview. Check your connection.')
            setPhase('setup')
        }
    }, [skill, difficulty])

    const handleSubmitAnswer = useCallback(async () => {
        if (!answer.trim() || !currentQuestion) return
        setPhase('evaluating')
        setTimerActive(false)

        try {
            const historyForApi = sessionHistory.map(h => ({
                question: h.question,
                answer: h.answer,
                question_number: h.question_number,
                score: h.score,
            }))

            const evalResult = await submitInterviewAnswer(
                skill,
                currentQuestion.question,
                answer,
                currentQuestion.question_number,
                difficulty,
                historyForApi,
            )
            setEvaluation(evalResult)

            // Add to history
            const newItem: HistoryItem = {
                question_number: currentQuestion.question_number,
                question: currentQuestion.question,
                answer: answer,
                score: evalResult.score,
                feedback: evalResult.feedback,
                key_points_covered: evalResult.key_points_covered || [],
                key_points_missed: evalResult.key_points_missed || [],
            }
            setSessionHistory(prev => [...prev, newItem])
            setPhase('feedback')
        } catch (e) {
            setError('Failed to evaluate answer. Try again.')
            setPhase('answering')
            setTimerActive(true)
        }
    }, [answer, currentQuestion, difficulty, sessionHistory, skill])

    const handleEndInterview = useCallback(async () => {
        setPhase('loading')
        setTimerActive(false)
        try {
            const historyForApi = sessionHistory.map(h => ({
                question: h.question,
                answer: h.answer,
                question_number: h.question_number,
                score: h.score,
            }))
            const card = await endInterview(skill, difficulty, historyForApi)
            setScorecard(card)
            setPhase('scorecard')
            onComplete?.(card)
        } catch (e) {
            // Build manual scorecard
            const total = sessionHistory.reduce((s, h) => s + h.score, 0)
            const max = sessionHistory.length * 10
            const pct = max > 0 ? Math.round((total / max) * 100) : 0
            setScorecard({
                skill,
                difficulty,
                overall_score: total,
                max_score: max,
                percentage: pct,
                verdict: pct >= 70 ? 'HIRE' : 'LEAN_NO_HIRE',
                summary: `You scored ${pct}% across ${sessionHistory.length} questions.`,
                strengths: ['Completed the interview'],
                weaknesses: ['Review missed areas'],
                recommendations: [`Practice more ${skill}`],
                skill_breakdown: {},
                interview_ready: pct >= 70,
                suggested_next_topics: [skill],
                questions_answered: sessionHistory.length,
            })
            setPhase('scorecard')
        }
    }, [skill, difficulty, sessionHistory, onComplete])

    const handleNextQuestion = useCallback(() => {
        if (!evaluation?.follow_up_question) return
        if (sessionHistory.length >= MAX_QUESTIONS) {
            handleEndInterview()
            return
        }
        setCurrentQuestion(evaluation.follow_up_question)
        setAnswer('')
        setEvaluation(null)
        setShowHint(false)
        setPhase('answering')
        setTimer(0)
        setTimerActive(true)
        setTimeout(() => textareaRef.current?.focus(), 100)
    }, [evaluation, sessionHistory.length, handleEndInterview])

    const handleRestart = () => {
        setPhase('setup')
        setCurrentQuestion(null)
        setAnswer('')
        setEvaluation(null)
        setSessionHistory([])
        setScorecard(null)
        setTimer(0)
        setError('')
    }

    const avgScore = sessionHistory.length > 0
        ? Math.round(sessionHistory.reduce((s, h) => s + h.score, 0) / sessionHistory.length * 10) / 10
        : 0

    // ── SETUP PHASE ──
    if (phase === 'setup') return (
        <div className="interview-sim">
            <div className="interview-setup fade-in">
                <div className="setup-header">
                    <div className="setup-icon-wrap"><Target size={32} /></div>
                    <h2>Mock Interview: {skill}</h2>
                    <p>Practice with an AI interviewer that adapts to your level. Get real-time feedback and a comprehensive scorecard.</p>
                </div>

                <div className="difficulty-selector">
                    <h4>Select Difficulty</h4>
                    <div className="diff-options">
                        {(Object.entries(DIFFICULTY_CONFIG) as [keyof typeof DIFFICULTY_CONFIG, typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG]][]).map(([key, cfg]) => (
                            <button type="button"
                                key={key}
                                className={`diff-card ${difficulty === key ? 'active' : ''}`}
                                onClick={() => setDifficulty(key)}
                                style={{ '--diff-color': cfg.color } as React.CSSProperties}
                            >
                                <span className="diff-icon">{cfg.icon}</span>
                                <span className="diff-label">{cfg.label}</span>
                                <span className="diff-desc">{cfg.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="setup-info">
                    <div className="info-item"><Zap size={16} /> {MAX_QUESTIONS} adaptive questions</div>
                    <div className="info-item"><Clock size={16} /> ~10-15 minutes</div>
                    <div className="info-item"><BarChart3 size={16} /> Detailed scorecard</div>
                </div>

                {error && <div className="interview-error"><AlertCircle size={16} /> {error}</div>}

                <button type="button" className="btn btn--primary btn--lg" onClick={handleStart}>
                    <Target size={18} /> Begin Interview
                </button>
            </div>
        </div>
    )

    // ── LOADING ──
    if (phase === 'loading') return (
        <div className="interview-sim">
            <div className="interview-loading fade-in">
                <div className="spinner study-spinner" />
                <h3>AI Interviewer is thinking…</h3>
                <p>Preparing your next challenge</p>
            </div>
        </div>
    )

    // ── ANSWERING PHASE ──
    if (phase === 'answering' && currentQuestion) return (
        <div className="interview-sim">
            <div className="interview-active fade-in">
                {/* Status bar */}
                <div className="interview-status-bar">
                    <div className="status-left">
                        <span className="q-badge">Q{currentQuestion.question_number}/{MAX_QUESTIONS}</span>
                        <span className="cat-badge">{currentQuestion.category}</span>
                    </div>
                    <div className="status-center">
                        {sessionHistory.length > 0 && (
                            <span className="avg-score">Avg: {avgScore}/10</span>
                        )}
                    </div>
                    <div className="status-right">
                        <Clock size={14} /> <span className={timer > (currentQuestion.time_estimate_seconds || 120) ? 'time-warning' : ''}>{formatTime(timer)}</span>
                        {timer > (currentQuestion.time_estimate_seconds || 120) && <span className="overtime-badge">Overtime</span>}
                    </div>
                </div>

                {/* Progress */}
                <div className="interview-progress-track">
                    {Array.from({ length: MAX_QUESTIONS }, (_, i) => (
                        <div
                            key={i}
                            className={`progress-dot ${i < sessionHistory.length ? 'done' : i === sessionHistory.length ? 'current' : ''}`}
                            title={i < sessionHistory.length ? `Q${i + 1}: ${sessionHistory[i].score}/10` : ''}
                        >
                            {i < sessionHistory.length && (
                                <span className="dot-score">{sessionHistory[i].score}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Question */}
                <div className="interview-question-box">
                    <div className="interviewer-avatar">
                        <Target size={20} />
                    </div>
                    <div className="question-body">
                        <p className="question-text">{currentQuestion.question}</p>
                        {!showHint ? (
                            <button type="button" className="hint-toggle" onClick={() => setShowHint(true)}>
                                <Lightbulb size={14} /> Need a hint?
                            </button>
                        ) : (
                            <div className="hint-box fade-in">
                                <Lightbulb size={14} /> <span>{currentQuestion.hint}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Answer area */}
                <div className="interview-answer-area">
                    <textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here... Be thorough and specific."
                        className="interview-textarea"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) handleSubmitAnswer()
                        }}
                    />
                    <div className="answer-footer">
                        <span className="word-count">{answer.split(/\s+/).filter(Boolean).length} words</span>
                        <div className="answer-actions">
                            {sessionHistory.length >= 1 && (
                                <button type="button" className="btn btn--ghost btn--sm" onClick={handleEndInterview}>
                                    End Interview
                                </button>
                            )}
                            <button type="button"
                                className="btn btn--primary"
                                onClick={handleSubmitAnswer}
                                disabled={!answer.trim()}
                            >
                                <Send size={16} /> Submit Answer
                                <span className="shortcut">Ctrl+Enter</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    // ── EVALUATING ──
    if (phase === 'evaluating') return (
        <div className="interview-sim">
            <div className="interview-loading fade-in">
                <div className="spinner study-spinner" />
                <h3>Evaluating your answer…</h3>
                <p>The interviewer is reviewing your response</p>
            </div>
        </div>
    )

    // ── FEEDBACK PHASE ──
    if (phase === 'feedback' && evaluation) {
        const scoreColor = evaluation.score >= 8 ? '#22c55e' : evaluation.score >= 6 ? '#f59e0b' : '#ef4444'
        return (
            <div className="interview-sim">
                <div className="interview-feedback fade-in">
                    {/* Score ring */}
                    <div className="feedback-score-section">
                        <div className="score-ring" style={{ '--score-color': scoreColor, '--score-pct': `${(evaluation.score / 10) * 100}%` } as React.CSSProperties}>
                            <span className="ring-number">{evaluation.score}</span>
                            <span className="ring-label">/10</span>
                        </div>
                        {evaluation.interviewer_note && (
                            <p className="interviewer-note">"{evaluation.interviewer_note}"</p>
                        )}
                    </div>

                    {/* Detailed feedback */}
                    <div className="feedback-detail">
                        <p className="feedback-text">{evaluation.feedback}</p>

                        <div className="points-grid">
                            {evaluation.key_points_covered.length > 0 && (
                                <div className="points-col covered">
                                    <h5><CheckCircle2 size={14} /> Points Covered</h5>
                                    <ul>
                                        {evaluation.key_points_covered.map((p, i) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {evaluation.key_points_missed.length > 0 && (
                                <div className="points-col missed">
                                    <h5><XCircle size={14} /> Points Missed</h5>
                                    <ul>
                                        {evaluation.key_points_missed.map((p, i) => (
                                            <li key={i}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="feedback-actions">
                        {sessionHistory.length < MAX_QUESTIONS ? (
                            <button type="button" className="btn btn--primary" onClick={handleNextQuestion}>
                                Next Question <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button type="button" className="btn btn--primary" onClick={handleEndInterview}>
                                <Trophy size={16} /> View Scorecard
                            </button>
                        )}
                        {sessionHistory.length >= 2 && sessionHistory.length < MAX_QUESTIONS && (
                            <button type="button" className="btn btn--ghost" onClick={handleEndInterview}>
                                End Early & Get Scorecard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ── SCORECARD PHASE ──
    if (phase === 'scorecard' && scorecard) {
        const verdictConfig: Record<string, { color: string; emoji: string; label: string }> = {
            STRONG_HIRE: { color: '#22c55e', emoji: '🏆', label: 'Strong Hire' },
            HIRE: { color: '#22c55e', emoji: '✅', label: 'Hire' },
            LEAN_HIRE: { color: '#f59e0b', emoji: '👍', label: 'Lean Hire' },
            LEAN_NO_HIRE: { color: '#f97316', emoji: '⚠️', label: 'Lean No Hire' },
            NO_HIRE: { color: '#ef4444', emoji: '❌', label: 'No Hire' },
        }
        const v = verdictConfig[scorecard.verdict] || verdictConfig.LEAN_HIRE

        return (
            <div className="interview-sim">
                <div className="interview-scorecard fade-in">
                    <div className="scorecard-header">
                        <span className="verdict-emoji">{v.emoji}</span>
                        <h2 style={{ color: v.color }}>{v.label}</h2>
                        <p className="verdict-summary">{scorecard.summary}</p>
                    </div>

                    <div className="scorecard-stats">
                        <div className="stat-card">
                            <span className="stat-value" style={{ color: v.color }}>{scorecard.percentage}%</span>
                            <span className="stat-label">Overall Score</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{scorecard.questions_answered}</span>
                            <span className="stat-label">Questions</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{scorecard.overall_score}/{scorecard.max_score}</span>
                            <span className="stat-label">Points</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{scorecard.interview_ready ? '✅' : '🔄'}</span>
                            <span className="stat-label">Interview Ready</span>
                        </div>
                    </div>

                    {/* Skill breakdown */}
                    {scorecard.skill_breakdown && Object.keys(scorecard.skill_breakdown).length > 0 && (
                        <div className="breakdown-section">
                            <h4><BarChart3 size={16} /> Skill Breakdown</h4>
                            <div className="breakdown-bars">
                                {Object.entries(scorecard.skill_breakdown).map(([key, val]) => (
                                    <div key={key} className="breakdown-row">
                                        <span className="breakdown-label">{key.replace(/_/g, ' ')}</span>
                                        <div className="breakdown-track">
                                            <div
                                                className="breakdown-fill"
                                                style={{ width: `${(val as number / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="breakdown-val">{val as number}/10</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="scorecard-columns">
                        {scorecard.strengths.length > 0 && (
                            <div className="sc-col strengths">
                                <h4><Star size={16} /> Strengths</h4>
                                <ul>{scorecard.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                            </div>
                        )}
                        {scorecard.weaknesses.length > 0 && (
                            <div className="sc-col weaknesses">
                                <h4><AlertCircle size={16} /> Areas to Improve</h4>
                                <ul>{scorecard.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                            </div>
                        )}
                    </div>

                    {scorecard.recommendations.length > 0 && (
                        <div className="recommendations-section">
                            <h4><Lightbulb size={16} /> Recommendations</h4>
                            <ul>{scorecard.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                        </div>
                    )}

                    {/* Question history review */}
                    {sessionHistory.length > 0 && (
                        <div className="history-review">
                            <h4>Interview Transcript</h4>
                            {sessionHistory.map((h, i) => (
                                <div key={i} className="history-item">
                                    <div className="hi-header">
                                        <span className="hi-q">Q{h.question_number}</span>
                                        <span className="hi-score" style={{ color: h.score >= 7 ? '#22c55e' : h.score >= 5 ? '#f59e0b' : '#ef4444' }}>
                                            {h.score}/10
                                        </span>
                                    </div>
                                    <p className="hi-question">{h.question}</p>
                                    <p className="hi-answer">{h.answer}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="scorecard-actions">
                        <button type="button" className="btn btn--primary" onClick={handleRestart}>
                            <RefreshCw size={16} /> Practice Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
