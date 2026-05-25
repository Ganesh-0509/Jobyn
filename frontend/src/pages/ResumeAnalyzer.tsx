import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { uploadResume, predictResume, type RoleMatch } from '../api/client'
import {
    Upload, FileText, CheckCircle, Sparkles, ChevronDown, ChevronUp,
    Zap, Shield, Brain, Target, TrendingUp, ExternalLink, Cpu, Clock,
    BarChart2, AlertCircle,
} from 'lucide-react'
import { usePrivacy } from '../context/PrivacyContext'
import { useToast } from '../context/ToastContext'
import { predictOnDevice, isOnDeviceReady } from '../utils/onDevicePredictor'

/* ── Analysis stages shown during loading ────────────────────────────────── */
const STAGES = [
    { icon: FileText, label: 'Parsing document structure', dur: 800 },
    { icon: Brain, label: 'Extracting skills & technologies', dur: 1200 },
    { icon: Target, label: 'Matching against 7 career roles', dur: 1500 },
    { icon: BarChart2, label: 'Scoring readiness metrics', dur: 1000 },
    { icon: Sparkles, label: 'Generating AI insights', dur: 1000 },
]

/* ── Skill category colours for grouping ─────────────────────────────────── */
const SKILL_CATEGORIES: Record<string, { label: string; color: string; skills: string[] }> = {
    lang: { label: 'Languages', color: '#3b82f6', skills: ['python', 'java', 'javascript', 'typescript', 'c', 'cpp', 'c++', 'go', 'rust', 'r', 'matlab', 'sql', 'bash', 'kotlin', 'swift', 'ruby', 'php', 'scala'] },
    frameworks: { label: 'Frameworks', color: '#22d3ee', skills: ['react', 'angular', 'vue', 'next.js', 'django', 'flask', 'fastapi', 'express', 'spring', 'node.js', 'node', 'redux', 'tailwind', 'flutter'] },
    ai: { label: 'AI / ML', color: '#a78bfa', skills: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'numpy', 'pandas', 'scikit-learn', 'generative ai', 'llm', 'rag', 'computer vision', 'prompt engineering', 'nlp', 'statistics', 'mlops'] },
    infra: { label: 'Infrastructure', color: '#f59e0b', skills: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'linux', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'git', 'firebase', 'mongodb', 'redis', 'postgresql', 'graphql', 'rest', 'api', 'microservices'] },
    cs: { label: 'Core CS', color: '#ef4444', skills: ['dsa', 'system design', 'oops', 'cybersecurity', 'cloud computing', 'testing', 'algorithms', 'data structures'] },
}

function categorizeSkill(skill: string): { label: string; color: string } {
    const s = skill.toLowerCase()
    for (const cat of Object.values(SKILL_CATEGORIES)) {
        if (cat.skills.includes(s)) return { label: cat.label, color: cat.color }
    }
    return { label: 'Other', color: '#64748b' }
}

export default function ResumeAnalyzer() {
    const { setAnalysis, setPrediction, analysis, setCurrentFile } = useResume()
    const { privacy } = usePrivacy()
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [drag, setDrag] = useState(false)
    const [error, setError] = useState('')
    const [stageIdx, setStageIdx] = useState(-1)
    const [whyExpanded, setWhyExpanded] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback((f: File) => {
        const MAX_SIZE = 5 * 1024 * 1024
        if (f.size > MAX_SIZE) { setError('File must be under 5 MB.'); toast('File must be under 5 MB.', 'warning'); return }
        const ok = f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        if (!ok) { setError('Only PDF and DOCX files are supported.'); toast('Only PDF and DOCX files are supported.', 'warning'); return }
        setFile(f); setCurrentFile(f); setError('')
    }, [setCurrentFile, toast])

    /* Animated stage progression during analysis */
    useEffect(() => {
        if (!loading) { setStageIdx(-1); return }
        let i = 0
        setStageIdx(0)
        const timers: ReturnType<typeof setTimeout>[] = []
        let cumulative = 0
        for (const stage of STAGES) {
            cumulative += stage.dur
            const nextI = ++i
            timers.push(setTimeout(() => setStageIdx(nextI), cumulative))
        }
        return () => {
            timers.forEach(t => clearTimeout(t))
        }
    }, [loading])

    const handleUpload = async () => {
        if (!file) return
        setLoading(true); setError('')
        try {
            /* role='auto' - backend scores all roles and picks best fit */
            const result = await uploadResume(file, 'auto', privacy, user?.email)
            setAnalysis(result)

            const useLocal = privacy || isOnDeviceReady()
            try {
                if (useLocal && isOnDeviceReady()) {
                    const localResult = await predictOnDevice(
                        result.detected_skills,
                        result.project_score_percent,
                        result.ats_score_percent,
                        result.structure_score_percent,
                        result.core_coverage_percent,
                        result.optional_coverage_percent
                    )
                    setPrediction({
                        predicted_role: localResult.predictedRole || result.role,
                        confidence: localResult.score / 100,
                        resume_score: localResult.score,
                        weak_areas: result.missing_core_skills.slice(0, 3),
                        model_version: 'v2.0-onnx',
                        inference_time_ms: localResult.inferenceMs
                    })
                } else {
                    const pred = await predictResume({
                        skills: result.detected_skills,
                        project_score: result.project_score_percent,
                        ats_score: result.ats_score_percent,
                        structure_score: result.structure_score_percent,
                        core_coverage: result.core_coverage_percent,
                        optional_coverage: result.optional_coverage_percent,
                    })
                    setPrediction(pred)
                }
            } catch (e) {
                console.warn('ML Prediction failed (fallback to base):', e)
                setPrediction({
                    predicted_role: result.role,
                    confidence: 0,
                    resume_score: result.final_score,
                    weak_areas: result.missing_core_skills.slice(0, 3),
                    model_version: 'fallback-v1',
                    inference_time_ms: 0
                })
            }
            toast('Resume analyzed successfully!', 'success')
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Upload failed. Make sure the backend is running on :8000'
            setError(msg)
            toast(msg, 'error')
        } finally { setLoading(false) }
    }

    const skills = analysis?.detected_skills ?? []
    const roleMatches: RoleMatch[] = analysis?.role_matches ?? []
    const topRole = roleMatches[0]
    const runnerUp = roleMatches[1]
    const atsGood = (analysis?.ats_score_percent ?? 0) >= 70

    /* Group skills by category */
    const groupedSkills = skills.reduce<Record<string, { color: string; skills: string[] }>>((acc, s) => {
        const { label, color } = categorizeSkill(s)
        if (!acc[label]) acc[label] = { color, skills: [] }
        acc[label].skills.push(s)
        return acc
    }, {})

    return (
        <div className="page-content">
            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="analyzer-hero">
                <div className="analyzer-hero__badge">
                    <Cpu size={14} /> AI-POWERED ANALYSIS ENGINE
                </div>
                <h1 className="analyzer-hero__title">
                    Resume <span className="accent">Intelligence</span>
                </h1>
                <p className="analyzer-hero__sub">
                    Drop your resume - our AI scans it against 7 career paths, auto-detects your best-fit role,
                    and delivers a comprehensive readiness breakdown. No manual selection needed.
                </p>
            </div>

            {/* ── Upload Zone ─────────────────────────────────────────── */}
            <div
                className={`upload-zone upload-zone--modern${drag ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => !file && inputRef.current?.click()}
            >
                <input
                    ref={inputRef} type="file" accept=".pdf,.docx"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
                {!file ? (
                    <>
                        <div className="upload-zone__glow" />
                        <div className="upload-zone__icon"><Upload size={40} strokeWidth={1.5} /></div>
                        <div className="upload-zone__title">Drag & drop your resume</div>
                        <div className="upload-zone__sub">PDF or DOCX up to 5MB</div>
                        <button type="button" className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                            Browse Files
                        </button>
                    </>
                ) : (
                    <div className="upload-zone__file-row">
                        <div className="upload-zone__file-info">
                            <FileText size={24} color="var(--blue)" />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{file.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB &bull; Ready to analyze</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={e => { e.stopPropagation(); setFile(null); setError('') }}>
                                Change File
                            </button>
                            <button type="button"
                                className="btn btn--primary"
                                disabled={loading}
                                onClick={e => { e.stopPropagation(); handleUpload() }}
                            >
                                {loading ? (
                                    <><span className="spinner-sm" /> Analyzing...</>
                                ) : (
                                    <><Sparkles size={16} /> Analyze Resume</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ color: 'var(--red)', background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* ── Animated Analysis Stages ─────────────────────────────── */}
            {loading && (
                <div className="analysis-stages">
                    {STAGES.map((stage, i) => {
                        const Icon = stage.icon
                        const done = stageIdx > i
                        const active = stageIdx === i
                        return (
                            <div key={i} className={`analysis-stage ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                                <div className="analysis-stage__icon">
                                    {done ? <CheckCircle size={18} /> : <Icon size={18} />}
                                </div>
                                <span>{stage.label}</span>
                                {active && <div className="analysis-stage__pulse" />}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Results ─────────────────────────────────────────────── */}
            {analysis && !loading && (
                <div className="analyzer-results fade-in">

                    {/* ── Best-Fit Role Hero ───────────────────────────── */}
                    <div className="role-hero-card">
                        <div className="role-hero__glow" />
                        <div className="role-hero__top">
                            {analysis.auto_detected && (
                                <span className="role-hero__badge">
                                    <Sparkles size={12} /> AI AUTO-DETECTED
                                </span>
                            )}
                            <div className="role-hero__score-ring">
                                <svg viewBox="0 0 120 120" className="role-hero__svg">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="52" fill="none"
                                        stroke={analysis.final_score >= 75 ? 'var(--green)' : analysis.final_score >= 50 ? 'var(--blue)' : 'var(--orange)'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${(analysis.final_score / 100) * 327} 327`}
                                        transform="rotate(-90 60 60)"
                                        style={{ transition: 'stroke-dasharray 1.5s ease' }}
                                    />
                                </svg>
                                <div className="role-hero__score-text">
                                    <span className="role-hero__score-num">{analysis.final_score}</span>
                                    <span className="role-hero__score-label">Score</span>
                                </div>
                            </div>
                        </div>

                        <h2 className="role-hero__role">{analysis.role}</h2>
                        <div className="role-hero__category">{analysis.readiness_category}</div>

                        {/* Sub-scores */}
                        <div className="role-hero__metrics">
                            {[
                                { label: 'Core Skills', value: analysis.core_coverage_percent, icon: Target },
                                { label: 'Projects', value: analysis.project_score_percent, icon: Zap },
                                { label: 'ATS Score', value: analysis.ats_score_percent, icon: Shield },
                                { label: 'Structure', value: analysis.structure_score_percent, icon: FileText },
                            ].map(m => (
                                <div key={m.label} className="role-hero__metric">
                                    <m.icon size={14} />
                                    <div className="role-hero__metric-bar">
                                        <div className="role-hero__metric-fill" style={{ width: `${m.value}%` }} />
                                    </div>
                                    <span className="role-hero__metric-val">{m.value}%</span>
                                    <span className="role-hero__metric-label">{m.label}</span>
                                </div>
                            ))}
                        </div>

                        <button type="button" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} onClick={() => navigate('/readiness-score')}>
                            <TrendingUp size={16} /> View Full Readiness Report
                        </button>
                    </div>

                    {/* ── Why This Role? ────────────────────────────────── */}
                    {roleMatches.length > 1 && (
                        <div className="card why-role-card">
                            <button type="button"
                                className="why-role-toggle"
                                onClick={() => setWhyExpanded(v => !v)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Brain size={18} color="var(--blue)" />
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>Why {analysis.role}?</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            Scored against all 7 roles - here's how you matched
                                        </div>
                                    </div>
                                </div>
                                {whyExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {whyExpanded && (
                                <div className="why-role-body fade-in">
                                    {topRole && runnerUp && (
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
                                            Your skills best align with <strong style={{ color: 'var(--blue)' }}>{topRole.role}</strong> ({topRole.score}% readiness).
                                            {runnerUp && (
                                                <> The runner-up was <strong>{runnerUp.role}</strong> at {runnerUp.score}%.
                                                    {topRole.score - runnerUp.score <= 5
                                                        ? ' These are very close - you could pursue either path!'
                                                        : ` That's a ${topRole.score - runnerUp.score}pt gap, showing a clear strength toward ${topRole.role}.`
                                                    }
                                                </>
                                            )}
                                        </p>
                                    )}

                                    <div className="role-match-list">
                                        {roleMatches.map((rm, i) => (
                                            <div key={rm.role} className={`role-match-row ${i === 0 ? 'role-match-row--best' : ''}`}>
                                                <div className="role-match-rank">
                                                    {i === 0 ? <Sparkles size={14} /> : `#${i + 1}`}
                                                </div>
                                                <div className="role-match-name">{rm.role}</div>
                                                <div className="role-match-bar-wrap">
                                                    <div
                                                        className="role-match-bar"
                                                        style={{
                                                            width: `${rm.score}%`,
                                                            background: i === 0 ? 'var(--blue)' : 'rgba(255,255,255,0.1)',
                                                        }}
                                                    />
                                                </div>
                                                <div className="role-match-score">{rm.score}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Skills DNA ───────────────────────────────────── */}
                    <div className="card skills-dna-card">
                        <div className="flex items-center justify-between mb-16">
                            <div>
                                <div className="card-title" style={{ marginBottom: 2 }}>Skill DNA</div>
                                <div className="card-subtitle">{skills.length} technologies detected</div>
                            </div>
                            <div className="ats-mini-badge" style={{ background: atsGood ? 'rgba(34,197,94,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${atsGood ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.25)'}`, color: atsGood ? 'var(--green)' : '#fbbf24' }}>
                                <Shield size={12} /> ATS {analysis.ats_score_percent}/100
                            </div>
                        </div>

                        <div className="skills-dna-groups">
                            {Object.entries(groupedSkills).map(([cat, { color, skills: catSkills }]) => (
                                <div key={cat} className="skills-dna-group">
                                    <div className="skills-dna-group__label" style={{ color }}>{cat}</div>
                                    <div className="skills-dna-group__tags">
                                        {catSkills.map(s => (
                                            <span key={s} className="skills-dna-tag" style={{ borderColor: `${color}40`, color }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Resume Metadata (compact) ─────────────────────── */}
                    <div className="card analyzer-meta-card">
                        <div className="analyzer-meta-grid">
                            <div className="analyzer-meta-item">
                                <FileText size={14} color="var(--text-muted)" />
                                <div>
                                    <div className="analyzer-meta-label">Document</div>
                                    <div className="analyzer-meta-val">{analysis.filename}</div>
                                </div>
                            </div>
                            <div className="analyzer-meta-item">
                                <Clock size={14} color="var(--text-muted)" />
                                <div>
                                    <div className="analyzer-meta-label">Sections Found</div>
                                    <div className="analyzer-meta-val">{analysis.sections_detected?.join(', ') || 'None'}</div>
                                </div>
                            </div>
                            <div className="analyzer-meta-item">
                                <ExternalLink size={14} color="var(--text-muted)" />
                                <div>
                                    <div className="analyzer-meta-label">Links</div>
                                    <div className="analyzer-meta-val">{analysis.links?.length ?? 0} detected</div>
                                </div>
                            </div>
                        </div>
                        {analysis.db_warning && (
                            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={12} /> {analysis.db_warning}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Empty State ──────────────────────────────────────────── */}
            {!analysis && !loading && (
                <div className="analyzer-empty">
                    <div className="analyzer-empty__grid">
                        <div className="analyzer-empty__feature">
                            <Target size={24} />
                            <h4>Auto Role Detection</h4>
                            <p>Scores your resume against 7 career paths and picks the strongest match</p>
                        </div>
                        <div className="analyzer-empty__feature">
                            <Brain size={24} />
                            <h4>Skill DNA Extraction</h4>
                            <p>Identifies 50+ technologies across languages, frameworks, AI/ML, and infrastructure</p>
                        </div>
                        <div className="analyzer-empty__feature">
                            <Shield size={24} />
                            <h4>ATS Compatibility Check</h4>
                            <p>Ensures your resume passes automated tracking systems used by recruiters</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
