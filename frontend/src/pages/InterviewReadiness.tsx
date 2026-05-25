import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import {
    Mic, MicOff, RefreshCw, ChevronRight, Target, Trophy,
    Zap, Clock, BarChart2, Lock, Sparkles, CheckCircle,
    AlertCircle, TrendingUp, MessageSquare, Brain, ChevronDown,
    Flame, Lightbulb,
} from 'lucide-react'
import { BASE } from '../api/client'

/* ── Types ──────────────────────────────────────────────── */
interface Question {
    id: string
    question: string
    difficulty: string
    role: string
}
interface EvalResult {
    score: number
    grade: string
    detected_concepts: string[]
    missing_concepts: string[]
    total_concepts: number
    feedback: string
    tip: string
}
interface SessionRecord {
    id: string
    date: string
    role: string
    difficulty: string
    score: number
    grade: string
    conceptsCovered: string[]
    conceptsMissed: string[]
    questionPreview: string
}

/* ── localStorage helpers for interview history ─────────── */
const LS_INTERVIEW_LOG = 'cse_interview_log'

function loadInterviewLog(email?: string): SessionRecord[] {
    const key = email ? `${email}_${LS_INTERVIEW_LOG}` : LS_INTERVIEW_LOG
    try { return JSON.parse(localStorage.getItem(key) || '[]') }
    catch { return [] }
}

function saveSession(record: SessionRecord, email?: string) {
    const key = email ? `${email}_${LS_INTERVIEW_LOG}` : LS_INTERVIEW_LOG
    const log = loadInterviewLog(email)
    log.push(record)
    if (log.length > 50) log.splice(0, log.length - 50)
    localStorage.setItem(key, JSON.stringify(log))
}

/* ── Web Speech hook ───────────────────────────────────── */
function useWebSpeech() {
    const [transcript, setTranscript] = useState('')
    const [listening, setListening] = useState(false)
    const [supported] = useState(() => {
        const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
        return !!SR
    })
    const recRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
        if (!SR) return
        const rec = new SR()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = 'en-US'
        rec.onresult = (e: SpeechRecognitionEvent) => {
            const text = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(' ')
            setTranscript(text)
        }
        rec.onend = () => setListening(false)
        recRef.current = rec
    }, [])

    const start = () => { if (!recRef.current) return; setTranscript(''); recRef.current.start(); setListening(true) }
    const stop = () => { if (!recRef.current) return; recRef.current.stop(); setListening(false) }

    return { transcript, setTranscript, listening, supported, start, stop }
}

/* ════════════════════════════════════════════════════════════ */
export default function InterviewReadiness() {
    const navigate = useNavigate()
    const { analysis, prediction } = useResume()
    const { user } = useAuth()
    const role = analysis?.role ?? prediction?.predicted_role ?? ''
    const readiness = analysis?.final_score ?? 0

    const [question, setQuestion] = useState<Question | null>(null)
    const [result, setResult] = useState<EvalResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [evalLoading, setEval] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [phase, setPhase] = useState<'idle' | 'questioning' | 'done'>('idle')
    const [showHistory, setShowHistory] = useState(false)
    const [log, setLog] = useState<SessionRecord[]>([])

    const { transcript, setTranscript, listening, supported, start, stop } = useWebSpeech()

    useEffect(() => { setLog(loadInterviewLog(user?.email)) }, [user?.email])

    /* ── Stats derived from log ─────────────────────────── */
    const stats = useMemo(() => {
        const total = log.length
        const avgScore = total > 0 ? Math.round(log.reduce((a, s) => a + s.score, 0) / total) : 0
        const bestScore = total > 0 ? Math.max(...log.map(s => s.score)) : 0
        const wins = log.filter(s => s.score >= 70).length
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
        const allCovered = new Set(log.flatMap(s => s.conceptsCovered.map(c => c.toLowerCase())))
        const allMissed = new Set(log.flatMap(s => s.conceptsMissed.map(c => c.toLowerCase())))
        allCovered.forEach(c => allMissed.delete(c))
        return { total, avgScore, bestScore, winRate, conceptsCovered: allCovered, conceptsMissed: allMissed }
    }, [log])

    /* ── Practice targets - missing skills not yet practiced ── */
    const targets = useMemo(() => {
        const coreGaps = analysis?.missing_core_skills ?? []
        const optGaps = analysis?.missing_optional_skills ?? []
        const practiced = stats.conceptsCovered
        const core = coreGaps.filter(s => !practiced.has(s.toLowerCase())).slice(0, 4)
        const optional = optGaps.filter(s => !practiced.has(s.toLowerCase())).slice(0, 2)
        return { core, optional }
    }, [analysis, stats])

    /* ── Actions ────────────────────────────────────────── */
    const fetchQuestion = async () => {
        setLoading(true); setResult(null); setTranscript(''); setFetchError(null)
        try {
            const res = await fetch(`${BASE}/interview/question?role=${encodeURIComponent(role)}`)
            if (!res.ok) throw new Error('Failed to fetch question')
            setQuestion(await res.json())
            setPhase('questioning')
        } catch (err: unknown) {
            setFetchError(err instanceof Error ? err.message : 'Could not load question.')
        } finally { setLoading(false) }
    }

    const evalAnswer = async () => {
        if (!question || !transcript.trim()) return
        setEval(true)
        try {
            const res = await fetch(`${BASE}/interview/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, question_id: question.id, answer: transcript }),
            })
            if (!res.ok) throw new Error()
            const data: EvalResult = await res.json()
            setResult(data)
            setPhase('done')
            const record: SessionRecord = {
                id: `ir_${Date.now()}`,
                date: new Date().toISOString(),
                role,
                difficulty: question.difficulty,
                score: data.score,
                grade: data.grade,
                conceptsCovered: data.detected_concepts,
                conceptsMissed: data.missing_concepts,
                questionPreview: question.question.slice(0, 80),
            }
            saveSession(record, user?.email)
            setLog(loadInterviewLog(user?.email))
        } catch {
            setResult({
                score: 0, grade: 'Error', detected_concepts: [], missing_concepts: [],
                total_concepts: 0, feedback: 'Evaluation failed - check connection.', tip: 'Try again.',
            })
            setPhase('done')
        } finally { setEval(false) }
    }

    const reset = () => { setQuestion(null); setResult(null); setTranscript(''); setPhase('idle') }

    const readinessLabel = readiness >= 80 ? 'Interview Ready' : readiness >= 60 ? 'Placement Ready' : readiness >= 40 ? 'Developing' : 'Getting Started'

    /* ── Locked state ──────────────────────────────────── */
    if (!analysis) {
        return (
            <div className="page-content">
                <div className="ir-locked">
                    <div className="ir-locked__icon"><Lock size={48} strokeWidth={1.2} /></div>
                    <h1 className="ir-locked__title">Interview Arena Locked</h1>
                    <p className="ir-locked__sub">Upload your resume to unlock AI-powered mock interviews tailored to your role, skill gaps, and career level.</p>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        <Sparkles size={16} /> Analyze Your Resume
                    </button>
                    <div className="ir-locked__features">
                        {[
                            { icon: MessageSquare, title: 'Voice & Text', desc: 'Answer via speech recognition or typing' },
                            { icon: Brain, title: 'AI Evaluation', desc: 'Concept coverage scoring with feedback' },
                            { icon: TrendingUp, title: 'Progress Tracking', desc: 'Track scores, win rate & concept mastery' },
                        ].map(f => (
                            <div key={f.title} className="ir-locked__feat">
                                <f.icon size={20} />
                                <h4>{f.title}</h4>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    /* ═══════════════════════════════════════════════════════ */
    return (
        <div className="page-content">

            {/* ── Hero Bar ──────────────────────────────────── */}
            <div className="ir-hero">
                <div className="ir-hero__left">
                    <div className="ir-hero__badge">{role}</div>
                    <h1 className="ir-hero__title">Interview Arena</h1>
                    <p className="ir-hero__sub">
                        Practice role-specific questions. AI evaluates concept coverage in real time.
                    </p>
                </div>
                <div className="ir-hero__ring">
                    <svg viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="34" fill="none"
                            stroke={readiness >= 75 ? 'var(--green)' : readiness >= 50 ? 'var(--orange)' : 'var(--red)'}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${(readiness / 100) * 214} 214`}
                            transform="rotate(-90 40 40)"
                        />
                    </svg>
                    <div className="ir-hero__ring-text">
                        <span className="ir-hero__ring-num">{readiness}</span>
                        <span className="ir-hero__ring-label">{readinessLabel}</span>
                    </div>
                </div>
            </div>

            {/* ── Battle Stats Strip ─────────────────────────── */}
            <div className="ir-stats-strip">
                <div className="ir-stat">
                    <Trophy size={14} color="#f59e0b" />
                    <span className="ir-stat__num">{stats.total}</span>
                    <span className="ir-stat__label">Sessions</span>
                </div>
                <div className="ir-stat">
                    <Target size={14} color="var(--cyan)" />
                    <span className="ir-stat__num">{stats.avgScore}%</span>
                    <span className="ir-stat__label">Avg Score</span>
                </div>
                <div className="ir-stat">
                    <Zap size={14} color="var(--green)" />
                    <span className="ir-stat__num">{stats.bestScore}%</span>
                    <span className="ir-stat__label">Best</span>
                </div>
                <div className="ir-stat">
                    <Flame size={14} color="#ef4444" />
                    <span className="ir-stat__num">{stats.winRate}%</span>
                    <span className="ir-stat__label">Win Rate</span>
                </div>
                <div className="ir-stat">
                    <Brain size={14} color="#a78bfa" />
                    <span className="ir-stat__num">{stats.conceptsCovered.size}</span>
                    <span className="ir-stat__label">Concepts</span>
                </div>
            </div>

            {/* ── Concept Confidence Map ──────────────────────── */}
            {(stats.conceptsCovered.size > 0 || stats.conceptsMissed.size > 0) && (
                <div className="ir-concepts-card">
                    <div className="ir-concepts__head">
                        <BarChart2 size={14} />
                        <span>Concept Confidence Map</span>
                        <span className="ir-concepts__summary">
                            {stats.conceptsCovered.size} mastered · {stats.conceptsMissed.size} to review
                        </span>
                    </div>
                    <div className="ir-concepts__cloud">
                        {[...stats.conceptsCovered].slice(0, 20).map(c => (
                            <span key={c} className="ir-concept ir-concept--ok">{c}</span>
                        ))}
                        {[...stats.conceptsMissed].slice(0, 15).map(c => (
                            <span key={c} className="ir-concept ir-concept--miss">{c}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Practice Targets ───────────────────────────── */}
            {(targets.core.length > 0 || targets.optional.length > 0) && (
                <div className="ir-targets-card">
                    <div className="ir-targets__head">
                        <Lightbulb size={14} color="#f59e0b" />
                        <span>Recommended Focus Areas</span>
                    </div>
                    <div className="ir-targets__list">
                        {targets.core.map(s => (
                            <span key={s} className="ir-target ir-target--core" title="Core skill gap">{s}</span>
                        ))}
                        {targets.optional.map(s => (
                            <span key={s} className="ir-target ir-target--opt" title="Optional skill gap">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Q&A Arena Panel ────────────────────────────── */}
            <div className="ir-arena-card">
                <div className="ir-arena__head">
                    <MessageSquare size={16} />
                    <span>Live Interview Practice</span>
                    {phase !== 'idle' && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={reset} style={{ marginLeft: 'auto' }}>
                            <RefreshCw size={12} /> New Question
                        </button>
                    )}
                </div>

                {/* IDLE */}
                {phase === 'idle' && (
                    <div className="ir-arena__idle">
                        <div className="ir-arena__idle-icon"><Target size={28} /></div>
                        <p>Get a role-specific question for <strong>{role}</strong>. Answer by voice or typing.</p>
                        <button type="button" className="btn btn--primary" onClick={fetchQuestion} disabled={loading}>
                            {loading ? <><Clock size={14} /> Loading…</> : <><ChevronRight size={14} /> Start Question</>}
                        </button>
                        {fetchError && <div className="ir-arena__error"><AlertCircle size={14} /> {fetchError}</div>}
                    </div>
                )}

                {/* QUESTIONING */}
                {phase === 'questioning' && question && (
                    <div className="ir-arena__question fade-in">
                        <div className="ir-q-card">
                            <div className="ir-q-card__top">
                                <span className={`ir-q-difficulty ir-q-difficulty--${question.difficulty === 'Beginner' ? 'easy' : question.difficulty === 'Advanced' ? 'hard' : 'mid'}`}>
                                    {question.difficulty}
                                </span>
                                <span className="ir-q-id">{question.id}</span>
                            </div>
                            <p className="ir-q-text">{question.question}</p>
                        </div>

                        <div className="ir-input-area">
                            {supported && (
                                <div className="ir-voice-row">
                                    <button type="button"
                                        className={`ir-voice-btn ${listening ? 'ir-voice-btn--rec' : ''}`}
                                        onClick={listening ? stop : start}
                                    >
                                        {listening ? <><MicOff size={16} /> Stop</> : <><Mic size={16} /> Record</>}
                                    </button>
                                    {listening && <span className="ir-rec-indicator">● Recording</span>}
                                </div>
                            )}
                            <textarea
                                value={transcript}
                                onChange={e => setTranscript(e.target.value)}
                                placeholder="Type or speak your answer..."
                                className="ir-textarea"
                            />
                            <div className="ir-input-footer">
                                <span className="ir-word-count">{transcript.split(/\s+/).filter(Boolean).length} words</span>
                                <button type="button" className="btn btn--primary" onClick={evalAnswer} disabled={!transcript.trim() || evalLoading}>
                                    {evalLoading ? 'Evaluating...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESULT */}
                {phase === 'done' && result && (
                    <div className="ir-arena__result fade-in">
                        <div className="ir-score-hero">
                            <div className={`ir-score-ring ${result.score >= 70 ? 'ir-score-ring--good' : result.score >= 40 ? 'ir-score-ring--mid' : 'ir-score-ring--low'}`}>
                                <span className="ir-score-num">{result.score}%</span>
                                <span className="ir-score-grade">{result.grade}</span>
                            </div>
                            <div className="ir-score-meta">
                                {result.detected_concepts.length}/{result.total_concepts} concepts covered
                            </div>
                        </div>

                        <div className="ir-result-concepts">
                            <div className="ir-result-col">
                                <div className="ir-result-col__head ir-result-col__head--ok">
                                    <CheckCircle size={12} /> Covered
                                </div>
                                <div className="ir-result-tags">
                                    {result.detected_concepts.length
                                        ? result.detected_concepts.map(c => <span key={c} className="ir-tag ir-tag--ok">{c}</span>)
                                        : <span className="ir-tag ir-tag--none">None detected</span>}
                                </div>
                            </div>
                            <div className="ir-result-col">
                                <div className="ir-result-col__head ir-result-col__head--miss">
                                    <AlertCircle size={12} /> Missing
                                </div>
                                <div className="ir-result-tags">
                                    {result.missing_concepts.length
                                        ? result.missing_concepts.map(c => <span key={c} className="ir-tag ir-tag--miss">{c}</span>)
                                        : <span className="ir-tag ir-tag--none">All covered!</span>}
                                </div>
                            </div>
                        </div>

                        <div className="ir-feedback-box">
                            <div className="ir-feedback-label">AI Feedback</div>
                            <p>{result.feedback}</p>
                        </div>
                        {result.tip && (
                            <div className="ir-tip-box">
                                <Lightbulb size={14} />
                                <p>{result.tip}</p>
                            </div>
                        )}

                        <button type="button" className="btn btn--primary" onClick={reset} style={{ marginTop: 12 }}>
                            <ChevronRight size={14} /> Next Question
                        </button>
                    </div>
                )}
            </div>

            {/* ── Session History ─────────────────────────────── */}
            {log.length > 0 && (
                <div className="ir-history-card">
                    <button type="button" className="ir-history__toggle" onClick={() => setShowHistory(!showHistory)}>
                        <Clock size={14} />
                        <span>Session History ({log.length})</span>
                        <ChevronDown size={14} className={showHistory ? 'rotated' : ''} />
                    </button>
                    {showHistory && (
                        <div className="ir-history__list fade-in">
                            {[...log].reverse().slice(0, 15).map(s => (
                                <div key={s.id} className="ir-history-item">
                                    <div className={`ir-history-score ${s.score >= 70 ? 'good' : s.score >= 40 ? 'mid' : 'low'}`}>
                                        {s.score}%
                                    </div>
                                    <div className="ir-history-info">
                                        <div className="ir-history-q">{s.questionPreview}...</div>
                                        <div className="ir-history-meta">
                                            {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.difficulty} · {s.grade}
                                        </div>
                                    </div>
                                    <div className="ir-history-concepts">
                                        <span className="ir-hc ir-hc--ok">{s.conceptsCovered.length} covered</span>
                                        {s.conceptsMissed.length > 0 && <span className="ir-hc ir-hc--miss">{s.conceptsMissed.length} missed</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
