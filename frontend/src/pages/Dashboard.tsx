import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { getAnalytics } from '../api/client'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Upload, AlertCircle, Lightbulb, Activity, TrendingUp, Trophy } from 'lucide-react'
import { ErrorState } from '../components/StateDisplay'

export default function Dashboard() {
    const { analysis, prediction, bestFit, masteredSkills, loading } = useResume()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [analytics, setAnalytics] = useState<any>(null)
    const [analyticsError, setAnalyticsError] = useState<string | null>(null)

    useEffect(() => {
        const ctl = new AbortController()
        setAnalyticsError(null)
        getAnalytics()
            .then(d => { if (!ctl.signal.aborted) setAnalytics(d) })
            .catch(err => { if (!ctl.signal.aborted) setAnalyticsError(err?.message || 'Failed to load analytics') })
        return () => ctl.abort()
    }, [])

    const chartHistory = useMemo(() => getHistoryOrDemo(loadHistory(user?.email)), [user?.email])

    const score = analysis?.final_score ?? 0
    const readiness = analysis?.readiness_category ?? 'Unknown'
    // Merge resume skills + mastered skills for accurate coverage
    const masteredLower = useMemo(() => new Set(masteredSkills.map(s => s.toLowerCase())), [masteredSkills])
    const skills = useMemo(() => {
        const base = analysis?.detected_skills ?? []
        const extra = masteredSkills.filter(s => !base.some(b => b.toLowerCase() === s.toLowerCase()))
        return [...base, ...extra]
    }, [analysis, masteredSkills])
    // Filter out mastered skills from missing counts
    const missingCore = useMemo(() => (analysis?.missing_core_skills ?? []).filter(s => !masteredLower.has(s.toLowerCase())), [analysis, masteredLower])
    const missingOpt = useMemo(() => (analysis?.missing_optional_skills ?? []).filter(s => !masteredLower.has(s.toLowerCase())), [analysis, masteredLower])
    const missingCount = missingCore.length + missingOpt.length
    // Core coverage: original % boosted by each mastered core skill
    const originalCorePct = analysis?.core_coverage_percent ?? 0
    const totalCoreSkills = (analysis?.detected_skills?.length ?? 0) + (analysis?.missing_core_skills?.length ?? 0)
    const newlyMasteredCore = (analysis?.missing_core_skills ?? []).filter(s => masteredLower.has(s.toLowerCase())).length
    const corePct = analysis ? Math.min(100, Math.round(originalCorePct + (totalCoreSkills > 0 ? (newlyMasteredCore / totalCoreSkills) * 100 : 0))) : 0

    // Memoize expensive skill coverage computation (avoids O(n²) on every render)
    // Now includes masteredSkills so coverage updates reactively
    const { SKILL_COVERAGE, TOP_MISSING } = useMemo(() => {
        const skillsLower = new Set(skills.map(x => x.toLowerCase()))
        const hasSkill = (list: string[]) => list.filter(s => skillsLower.has(s)).length

        const coverage = [
            { label: 'Programming Languages', pct: analysis ? Math.min(100, Math.round(hasSkill(['python', 'java', 'javascript', 'typescript', 'c', 'c++', 'go', 'rust', 'kotlin']) / 9 * 100)) : 0, cls: 'blue' },
            { label: 'Frameworks', pct: analysis ? Math.min(100, Math.round(hasSkill(['react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'spring', 'express', 'next']) / 9 * 100)) : 0, cls: 'cyan' },
            { label: 'Core CS Concepts', pct: analysis ? Math.min(100, Math.round(hasSkill(['dsa', 'sql', 'git', 'api', 'rest', 'testing', 'debugging', 'algorithms', 'data structures']) / 9 * 100)) : 0, cls: 'green' },
            { label: 'Tools & Platforms', pct: analysis ? Math.min(100, Math.round(hasSkill(['docker', 'aws', 'gcp', 'kubernetes', 'linux', 'git', 'ci/cd', 'terraform']) / 8 * 100)) : 0, cls: 'purple' },
        ]

        // Filter out mastered skills from the gap list
        const missing = analysis ? [
            ...missingCore.slice(0, 3).map(s => ({ skill: s, priority: 'Critical' })),
            ...missingOpt.slice(0, 2).map(s => ({ skill: s, priority: 'High' }))
        ] : []

        return { SKILL_COVERAGE: coverage, TOP_MISSING: missing }
    }, [analysis, skills, missingCore, missingOpt])

    const METRICS = useMemo(() => [
        { icon: <Activity size={14} />, label: 'Readiness Score', value: analysis ? `${score}%` : '--', sub: analysis ? (chartHistory.length > 1 ? `+${score - chartHistory[0].value}% overall` : 'First analysis') : 'No analysis yet', pct: score, bg: 'rgba(var(--blue-rgb),0.12)', col: 'var(--blue)', colRgb: 'var(--blue-rgb)' },
        { icon: <Lightbulb size={14} />, label: 'Core Skill Coverage', value: analysis ? `${corePct}%` : '--', sub: analysis ? `${skills.length} skills detected` : 'Upload resume', pct: corePct, bg: 'rgba(var(--cyan-rgb),0.12)', col: 'var(--cyan)', colRgb: 'var(--cyan-rgb)' },
        { icon: <AlertCircle size={14} />, label: 'Missing Critical Skills', value: analysis ? String(missingCount) : '--', sub: analysis ? `${Math.min(missingCount, 3)} high priority` : 'Pending analysis', pct: analysis ? Math.min(100, (missingCount / 10) * 100) : 0, bg: 'rgba(var(--orange-rgb),0.12)', col: 'var(--orange)', colRgb: 'var(--orange-rgb)' },
        { icon: <Activity size={14} />, label: 'Interview Readiness', value: analysis ? readiness : '--', sub: analysis ? (analytics?.total_analyses ? `${analytics.total_analyses} total analyses` : 'First analysis') : 'Ready to start', pct: analysis ? score * 0.8 : 0, bg: 'rgba(var(--purple-rgb),0.12)', col: 'var(--purple)', colRgb: 'var(--purple-rgb)' },
    ], [analysis, score, corePct, missingCount, readiness, skills, chartHistory, analytics])


    return (
        <div className="page-content">
            {/* Hero */}
            <div className="hero">
                <h1>Measure. Improve. <span className="accent">Achieve.</span></h1>
                <p>
                    {user ? `Welcome back, ${user.name}! ` : ''}
                    AI-powered job readiness intelligence for engineering students.
                </p>
                <button className="btn btn--primary" onClick={() => navigate('/resume-analyzer')}>
                    <Upload size={14} /> {analysis ? 'Re-Upload Resume' : 'Upload Resume'}
                </button>
            </div>

            {/* Analytics Error */}
            {analyticsError && (
                <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--red)' }}>
                    <AlertCircle size={14} />
                    {analyticsError}
                </div>
            )}

            {/* Metric Cards */}
            <div className="metrics-grid mb-32">
                {METRICS.map((m, i) => (
                    <div key={i} className="metric-card" style={{ background: m.bg }}>
                        <div className="metric-card__icon" style={{ background: `rgba(${m.colRgb},0.13)`, color: m.col }}>{m.icon}</div>
                        <div className="metric-card__value">{m.value}</div>
                        <div className="metric-card__label">{m.label}</div>
                        <div className="metric-card__bar">
                            <div className="metric-card__bar-fill" style={{ width: `${m.pct}%`, background: m.col }} />
                        </div>
                        <div className="metric-card__sub" style={{ opacity: 0.7 }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Skill Coverage + Skill Gaps + Role Model */}
            <div className="dashboard-grid mb-16">
                <div className="card card--full-height">
                    <div className="card-title mb-4">Skill Coverage</div>
                    <div className="card-subtitle mb-16">Your proficiency across key areas</div>
                    {SKILL_COVERAGE.map((s, i) => (
                        <div className="progress-row" key={i}>
                            <div className="progress-label">
                                <span>{s.label}</span>
                                <span>{s.pct}%</span>
                            </div>
                            <div className="progress-track">
                                <div className={`progress-fill progress-fill--${s.cls}`} style={{ width: `${s.pct}%` }} />
                            </div>
                        </div>
                    ))}
                    {!analysis && <div className="pending-badge">Pending Analysis</div>}
                </div>

                <div className="card card--full-height">
                    <div className="flex items-center justify-between mb-4">
                        <div className="card-title">Skill Gaps</div>
                        {analysis && <button className="btn btn--ghost btn--sm" style={{ padding: '0 8px' }} onClick={() => navigate('/skill-gap')}>Gaps →</button>}
                    </div>
                    <div className="card-subtitle mb-16">Top critical skills to focus on</div>
                    {TOP_MISSING.length > 0 ? (
                        TOP_MISSING.map((item, i) => (
                            <div className="gap-row" key={i}>
                                <span className="gap-row__num">{i + 1}</span>
                                <span className="gap-row__name">{item.skill}</span>
                                <span className={`badge badge--${item.priority.toLowerCase()}`}>{item.priority}</span>
                            </div>
                        ))
                    ) : analysis ? (
                        <div className="empty-placeholder" style={{ color: 'var(--green)' }}>
                            <Trophy size={32} />
                            <p>All skill gaps resolved! 🎉</p>
                        </div>
                    ) : (
                        <div className="empty-placeholder">
                            <AlertCircle size={32} />
                            <p>Analyze a resume to see skill gaps</p>
                        </div>
                    )}
                </div>

                {/* AI Recommendation (Only show if there is a role mismatch OR current score is very low) */}
                {bestFit && (bestFit.predicted_role !== analysis?.role || (score < 50 && bestFit.confidence > 0.6)) && (
                    <div className="card ai-rec-card">
                        <div className="flex items-center justify-between mb-16">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="ai-rec-icon">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <div className="card-title" style={{ fontSize: 16 }}>AI Best Fit Recommendation</div>
                                    <div className="ai-rec-subtitle">Cross-Role Comparison</div>
                                </div>
                            </div>
                            <div className="badge badge--medium" style={{ fontSize: 9 }}>
                                SKILL SIMILARITY
                            </div>
                        </div>

                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="ai-rec-inner">
                                <div className="ai-rec-role-label">Your highest potential role is:</div>
                                <div className="ai-rec-role-name">{bestFit.predicted_role}</div>

                                <div className="confidence-bar-wrap">
                                    <div className="confidence-track">
                                        <div className="confidence-fill" style={{ width: `${(bestFit.confidence ?? 0) * 100}%` }} />
                                    </div>
                                    <span className="confidence-label">{bestFit.confidence ? `${Math.round(bestFit.confidence * 100)}% Match` : 'N/A'}</span>
                                </div>

                                <p className="ai-rec-reasoning">
                                    {bestFit.reasoning || `Based on your skill profile, you are a much stronger match for ${bestFit.predicted_role} than your currently selected path.`}
                                </p>
                            </div>

                            <button
                                className="btn btn--primary btn--sm"
                                onClick={() => navigate('/resume-analyzer')}
                                style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                            >
                                Switch to Recommended Path →
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
