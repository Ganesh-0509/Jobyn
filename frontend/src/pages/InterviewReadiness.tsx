import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { Mic, MicOff, RefreshCw, ChevronRight } from 'lucide-react'
import { BASE } from '../api/client'

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

function useWebSpeech() {
    const [transcript, setTranscript] = useState('')
    const [listening, setListening] = useState(false)
    const [supported, setSupported] = useState(true)
    const recRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) { setSupported(false); return }

        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = 'en-US'
        rec.onresult = (e: SpeechRecognitionEvent) => {
            const results = e.results
            const text = Array.from({ length: results.length }, (_, i) => results[i][0].transcript).join(' ')
            setTranscript(text)
        }
        rec.onend = () => setListening(false)
        recRef.current = rec
    }, [])

    const start = () => {
        if (!recRef.current) return
        setTranscript('')
        recRef.current.start()
        setListening(true)
    }

    const stop = () => {
        if (!recRef.current) return
        recRef.current.stop()
        setListening(false)
    }

    return { transcript, setTranscript, listening, supported, start, stop }
}

export default function InterviewReadiness() {
    const navigate = useNavigate()
    const { analysis, prediction } = useResume()
    const role = analysis?.role ?? prediction?.predicted_role ?? ''
    const readiness = analysis?.final_score ?? 0

    const [question, setQuestion] = useState<Question | null>(null)
    const [result, setResult] = useState<EvalResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [evalLoading, setEval] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [phase, setPhase] = useState<'idle' | 'questioning' | 'done'>('idle')

    const { transcript, setTranscript, listening, supported, start, stop } = useWebSpeech()

    const fetchQuestion = async () => {
        setLoading(true); setResult(null); setTranscript(''); setFetchError(null)
        try {
            const res = await fetch(`${BASE}/interview/question?role=${encodeURIComponent(role)}`)
            if (!res.ok) throw new Error('Failed to fetch question from server')
            const q = await res.json()
            setQuestion(q)
            setPhase('questioning')
        } catch (err: unknown) {
            setFetchError(err instanceof Error ? err.message : 'Could not load interview question. Check your connection.')
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
            const data = await res.json()
            setResult(data)
            setPhase('done')
        } catch (err: unknown) {
            setResult({ score: 0, grade: 'Error', detected_concepts: [], missing_concepts: [], total_concepts: 0, feedback: err instanceof Error ? err.message : 'Evaluation failed — check backend connection.', tip: 'Please try again or check your internet connection.' })
            setPhase('done')
        } finally { setEval(false) }
    }

    const reset = () => { setQuestion(null); setResult(null); setTranscript(''); setPhase('idle') }

    const overallLabel = readiness >= 80 ? 'Interview Ready' : readiness >= 60 ? 'Placement Ready' : readiness >= 40 ? 'Developing' : 'Beginner'
    const STRENGTHS = analysis?.detected_skills?.slice(0, 4).map(s => s.charAt(0).toUpperCase() + s.slice(1)) ?? []
    const IMPROVEMENTS = prediction?.weak_areas?.length ? prediction.weak_areas : (analysis?.missing_core_skills?.slice(0, 3) ?? [])

    if (!analysis) {
        return (
            <div className="page-content">
                <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>🎙️</div>
                    <h1 className="page-title">Mock Interview Locked</h1>
                    <p className="page-subtitle">We need your resume analysis to generate role-specific interview questions just for you.</p>
                    <button className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        Analyze Your Resume Now
                    </button>
                    <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>🔊</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Voice AI</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time speech recognition</div>
                        </div>
                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>🎯</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Targeted questions</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Based on your skill gaps</div>
                        </div>
                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>📊</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Deep Feedback</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Concept coverage scorecard</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Interview Readiness</div>
                <div className="page-subtitle">Practice real interview questions with AI feedback</div>
            </div>

            {/* Readiness Meter */}
            <div className="card mb-16">
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>Readiness Level</div>
                <div className="readiness-meter">
                    <div className="readiness-meter__cursor" style={{ left: `${readiness}%` }} />
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginTop: 14, letterSpacing: '-1px' }}>
                    {readiness}% — <span style={{ color: 'var(--blue)' }}>{overallLabel}</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Practicing for: <strong style={{ color: 'var(--cyan)' }}>{role}</strong>
                </div>
            </div>

            {/* ── Q&A Panel ─── */}
            <div className="card mb-16">
                <div className="flex items-center justify-between mb-16">
                    <div className="card-title">🎙️ Live Interview Practice</div>
                    {phase !== 'idle' && (
                        <button className="btn btn--ghost btn--sm" onClick={reset}>
                            <RefreshCw size={12} /> New Question
                        </button>
                    )}
                </div>

                {/* IDLE */}
                {phase === 'idle' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ready to practice?</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Get a real interview question for <strong>{role}</strong>. Answer by voice or typing.
                        </div>
                        <button className="btn btn--primary" onClick={fetchQuestion} disabled={loading}>
                            {loading ? '⏳ Loading...' : <><ChevronRight size={14} /> Start Interview Question</>}
                        </button>
                        {fetchError && (
                            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 8, fontSize: 13, color: 'var(--red)' }}>
                                {fetchError}
                            </div>
                        )}
                    </div>
                )}

                {/* QUESTION PHASE */}
                {phase === 'questioning' && question && (
                    <>
                        <div style={{
                            background: 'rgba(var(--blue-rgb),0.06)', border: '1px solid rgba(var(--blue-rgb),0.2)',
                            borderRadius: 10, padding: '16px 18px', marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className={`badge badge--${question.difficulty === 'Beginner' ? 'low' : question.difficulty === 'Advanced' ? 'high' : 'medium'}`}>
                                    {question.difficulty}
                                </span>
                                <span className="text-muted">{question.id}</span>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>{question.question}</div>
                        </div>

                        {/* Speech controls */}
                        {supported ? (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                    <button
                                        className={`btn ${listening ? 'btn--danger' : 'btn--primary'}`}
                                        onClick={listening ? stop : start}
                                        aria-label={listening ? 'Stop recording' : 'Start recording'}
                                    >
                                        {listening ? <><MicOff size={14} /> Stop Recording</> : <><Mic size={14} /> Start Recording</>}
                                    </button>
                                    {listening && <span style={{ fontSize: 12, color: 'var(--red)', alignSelf: 'center', animation: 'nodePulse 1s infinite' }}>● REC</span>}
                                </div>
                                <div className="text-muted" style={{ marginBottom: 6 }}>Or type your answer below:</div>
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, color: 'var(--orange)', marginBottom: 10 }}>⚠️ Speech not supported in this browser. Type your answer below.</div>
                        )}

                        <textarea
                            value={transcript}
                            onChange={e => setTranscript(e.target.value)}
                            placeholder="Your answer will appear here as you speak, or type directly..."
                            style={{
                                width: '100%', minHeight: 100, background: 'var(--bg-input)',
                                border: '1px solid var(--border)', borderRadius: 8, padding: '12px',
                                color: 'var(--text-primary)', fontFamily: 'var(--font)',
                                fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />

                        <button
                            className="btn btn--primary" style={{ marginTop: 12 }}
                            onClick={evalAnswer}
                            disabled={!transcript.trim() || evalLoading}
                        >
                            {evalLoading ? '⏳ Evaluating...' : '📊 Evaluate My Answer'}
                        </button>
                    </>
                )}

                {/* RESULT PHASE */}
                {phase === 'done' && result && (
                    <>
                        {/* Score display */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                                padding: '20px 40px',
                                background: result.score >= 70 ? 'rgba(var(--green-rgb),0.08)' : result.score >= 40 ? 'rgba(var(--orange-rgb),0.08)' : 'rgba(var(--red-rgb),0.08)',
                                border: `1px solid ${result.score >= 70 ? 'rgba(var(--green-rgb),0.3)' : result.score >= 40 ? 'rgba(var(--orange-rgb),0.3)' : 'rgba(var(--red-rgb),0.3)'}`,
                                borderRadius: 14,
                            }}>
                                <div style={{ fontSize: 52, fontWeight: 900, color: result.score >= 70 ? 'var(--green)' : result.score >= 40 ? 'var(--orange)' : 'var(--red)', letterSpacing: -2 }}>
                                    {result.score}%
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.grade}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {result.detected_concepts.length} / {result.total_concepts} concepts covered
                                </div>
                            </div>
                        </div>

                        {/* Concepts */}
                        <div className="grid-2 mb-16">
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✓ Covered</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {result.detected_concepts.length
                                        ? result.detected_concepts.map(c => <span key={c} className="tag tag--added">{c}</span>)
                                        : <span className="text-muted">None detected</span>
                                    }
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>✗ Missing</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {result.missing_concepts.length
                                        ? result.missing_concepts.map(c => <span key={c} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.25)', fontSize: 11, color: 'var(--red)' }}>{c}</span>)
                                        : <span className="text-muted">Nothing critical missing!</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Feedback */}
                        <div style={{ background: 'rgba(var(--blue-rgb),0.06)', border: '1px solid rgba(var(--blue-rgb),0.15)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', marginBottom: 6 }}>💬 AI FEEDBACK</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{result.feedback}</div>
                        </div>

                        {result.tip && (
                            <div style={{ background: 'rgba(var(--orange-rgb),0.06)', border: '1px solid rgba(var(--orange-rgb),0.15)', borderRadius: 10, padding: 14 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 6 }}>💡 TIP</div>
                                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{result.tip}</div>
                            </div>
                        )}

                        <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => { setPhase('idle'); setResult(null) }}>
                            → Try Another Question
                        </button>
                    </>
                )}
            </div>

            {/* Strength / Improvement areas */}
            <div className="grid-2">
                <div className="card">
                    <div className="flex items-center gap-8 mb-16">
                        <span style={{ color: 'var(--green)' }}>●</span>
                        <div className="card-title" style={{ marginBottom: 0 }}>Strength Areas</div>
                    </div>
                    {STRENGTHS.map((s, i) => <div key={i} className="area-item area-item--strength">{s}</div>)}
                </div>
                <div className="card">
                    <div className="flex items-center gap-8 mb-16">
                        <span style={{ color: 'var(--orange)' }}>●</span>
                        <div className="card-title" style={{ marginBottom: 0 }}>Improvement Focus</div>
                    </div>
                    {IMPROVEMENTS.map((s, i) => <div key={i} className="area-item area-item--weak">{s}</div>)}
                </div>
            </div>
        </div>
    )
}
