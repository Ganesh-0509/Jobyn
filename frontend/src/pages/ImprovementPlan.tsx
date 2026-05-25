import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    getMarketForecast, getSmartPlan,
    type ForecastResult, type SmartPlanResult, type SmartPlanItem,
} from '../api/client'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import {
    Clock, Lock, Flame, PlayCircle, Trophy, Blocks,
    Zap, Target, CalendarClock, TrendingUp, ChevronDown, ChevronUp,
    GitBranch, ExternalLink, Shield,
} from 'lucide-react'
import StudyHub from '../components/StudyHub'
import ProjectGeneratorModal from '../components/ProjectGeneratorModal'
import {
    getStreakData, awardXP, getXPForNextLevel, getStreakMultiplier,
    getLevelTitle, type StreakData,
} from '../utils/streakTracker'

export default function ImprovementPlan() {
    const { analysis, masteredSkills, dailyCommitment, setDailyCommitment, markSkillMastered } = useResume()
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const highlightSkill = (location.state as { highlightSkill?: string } | null)?.highlightSkill

    const role = analysis?.role ?? 'Software Developer'
    const missingCore = analysis?.missing_core_skills ?? []
    const missingOpt = analysis?.missing_optional_skills ?? []

    // ── Smart plan state ───────────────────────────────────────────
    const [smartPlan, setSmartPlan] = useState<SmartPlanResult | null>(null)
    const [planLoading, setPlanLoading] = useState(false)
    const [planError, setPlanError] = useState<string | null>(null)

    // ── Deadline mode ──────────────────────────────────────────────
    const [deadline, setDeadline] = useState<string>('')
    const [deadlineOpen, setDeadlineOpen] = useState(false)

    // ── UI state ───────────────────────────────────────────────────
    const [activeStudy, setActiveStudy] = useState<string | null>(null)
    const [activeProject, setActiveProject] = useState<{ role: string; skills: string[] } | null>(null)
    const [aiForecast, setAiForecast] = useState<ForecastResult | null>(null)
    const [forecastLoading, setForecastLoading] = useState(false)
    const [forecastError, setForecastError] = useState<string | null>(null)
    const [forecastExpanded, setForecastExpanded] = useState(false)

    // ── Streak + XP ────────────────────────────────────────────────
    const [streak, setStreak] = useState<StreakData>(() => getStreakData(user?.email))
    const [xpToast, setXpToast] = useState<{ xp: number; action: string } | null>(null)
    const toastTimer = useRef<ReturnType<typeof setTimeout>>()

    const refreshStreak = () => setStreak(getStreakData(user?.email))

    const doAwardXP = (action: Parameters<typeof awardXP>[0], detail?: string) => {
        const result = awardXP(action, user?.email, detail)
        if (result.xpAwarded > 0) {
            setStreak(result.streakData)
            setXpToast({ xp: result.xpAwarded, action: detail || action })
            clearTimeout(toastTimer.current)
            toastTimer.current = setTimeout(() => setXpToast(null), 2500)
        }
    }

    // ── Award daily login XP on mount ──────────────────────────────
    useEffect(() => {
        if (analysis) doAwardXP('daily_login', 'Opened Improvement Plan')
    }, []) // eslint-disable-line

    // ── Fetch smart plan from backend ──────────────────────────────
    useEffect(() => {
        if (!analysis) return
        setPlanLoading(true)
        setPlanError(null)
        getSmartPlan(missingCore, missingOpt, masteredSkills, dailyCommitment, deadline || undefined)
            .then(setSmartPlan)
            .catch(err => setPlanError(err?.message || 'Failed to build learning plan'))
            .finally(() => setPlanLoading(false))
    }, [analysis, dailyCommitment, deadline, masteredSkills.length]) // eslint-disable-line

    // ── Fetch market forecast (cached per day in localStorage) ─────
    useEffect(() => {
        if (!analysis) return
        const today = new Date().toISOString().slice(0, 10)
        const cacheKey = `forecast_${role}_${today}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                setAiForecast(JSON.parse(cached))
                return
            } catch { /* parse error - refetch */ }
        }
        setForecastLoading(true)
        setForecastError(null)
        getMarketForecast(role, missingCore)
            .then(data => {
                setAiForecast(data)
                // Cache for the day
                try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* quota */ }
                // Clean up old forecast caches
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i)
                    if (k && k.startsWith('forecast_') && !k.includes(today)) {
                        localStorage.removeItem(k)
                    }
                }
            })
            .catch(err => setForecastError(err?.message || 'Failed to load market forecast'))
            .finally(() => setForecastLoading(false))
    }, [role, analysis]) // eslint-disable-line

    // ── Derived data ───────────────────────────────────────────────
    const planItems = smartPlan?.schedule ?? []
    const totalMastered = planItems.filter(p => masteredSkills.includes(p.skill.toLowerCase())).length

    // Group by scheduled day
    const dayGroups = planItems.reduce<Record<number, SmartPlanItem[]>>((acc, item) => {
        (acc[item.scheduled_day] ??= []).push(item)
        return acc
    }, {})

    // Can a skill be studied? All its prerequisites must be mastered.
    const canStudy = (item: SmartPlanItem) => {
        return item.prerequisites.every(p => masteredSkills.includes(p.toLowerCase()))
    }

    const handleStudyOpen = (skill: string) => {
        setActiveStudy(skill)
    }

    const handleVerified = (skill: string) => {
        markSkillMastered(skill.toLowerCase())
        doAwardXP('quiz_passed', skill)
    }

    const xpInfo = getXPForNextLevel(streak.totalXP)
    const multiplier = getStreakMultiplier(streak.currentStreak)

    // ── No analysis state ──────────────────────────────────────────
    if (!analysis) {
        return (
            <div className="page-content">
                <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>📊</div>
                    <h1 className="page-title">No Roadmap Available</h1>
                    <p className="page-subtitle">Your personalized learning path will be generated once you upload and analyze your resume.</p>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        Analyze Your Resume Now
                    </button>
                    <div style={{ marginTop: 40, padding: 30, background: 'rgba(59,130,246,0.03)', borderRadius: 20, border: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>WHAT'S INSIDE?</div>
                        <ul style={{ textAlign: 'left', display: 'inline-block', margin: '0 auto', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            <li>• Smart dependency-aware learning path (powered by skill graph)</li>
                            <li>• Daily streak + XP gamification system</li>
                            <li>• Deadline mode - set your interview date, we adjust the plan</li>
                            <li>• AI Market Forecast with growth insights</li>
                            <li>• Integrated Study Hub + Project Verification</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>

                {/* ════════ XP Toast ════════ */}
                {xpToast && (
                    <div style={{
                        position: 'fixed', top: 24, right: 24, zIndex: 9999,
                        padding: '12px 20px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: 'white', fontWeight: 700, fontSize: 14,
                        boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                        animation: 'slideInRight 0.3s ease',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Zap size={18} /> +{xpToast.xp} XP
                        {multiplier > 1 && <span style={{ fontSize: 12, opacity: 0.9 }}>({multiplier}x streak!)</span>}
                    </div>
                )}

                {/* ════════ Streak + XP Banner ════════ */}
                <div className="card" style={{
                    padding: '20px 24px', marginBottom: 24,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(59,130,246,0.06))',
                    border: '1px solid rgba(245,158,11,0.15)',
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center',
                }}>
                    {/* Streak flame */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: streak.currentStreak > 0 ? 'rgba(245,158,11,0.15)' : 'var(--bg-input)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: streak.currentStreak >= 7 ? '2px solid var(--orange)' : '2px solid transparent',
                        }}>
                            <Flame size={28} color={streak.currentStreak > 0 ? 'var(--orange)' : 'var(--text-muted)'} />
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{streak.currentStreak}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Day Streak</div>
                    </div>

                    {/* Level + XP bar */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 700, padding: '2px 10px',
                                borderRadius: 20, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)',
                            }}>
                                LVL {streak.level}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{getLevelTitle(streak.level)}</span>
                            {multiplier > 1 && (
                                <span style={{
                                    fontSize: 12, fontWeight: 700, padding: '2px 8px',
                                    borderRadius: 10, background: 'rgba(245,158,11,0.12)', color: 'var(--orange)',
                                }}>
                                    {multiplier}x MULTIPLIER
                                </span>
                            )}
                        </div>
                        <div className="progress-track" style={{ height: 8, marginBottom: 4 }}>
                            <div className="progress-fill progress-fill--blue" style={{ width: `${xpInfo.progress}%`, transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{streak.totalXP} XP total</span>
                            <span>{xpInfo.next - streak.totalXP} XP to Level {streak.level + 1}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{totalMastered}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skills</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)' }}>{streak.longestStreak}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Best Streak</div>
                        </div>
                    </div>
                </div>

                {/* ════════ Header + Controls ════════ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <h1 className="page-title">Adaptive Learning Path</h1>
                        <p className="page-subtitle">Smart dependency-aware {role} roadmap</p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Daily commitment */}
                        <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(59, 130, 246, 0.05)' }}>
                            <Clock size={14} color="var(--blue)" />
                            <select
                                value={dailyCommitment}
                                onChange={(e) => setDailyCommitment(Number(e.target.value))}
                                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', padding: '4px 8px', fontSize: 12 }}
                            >
                                <option value={1}>1h / day</option>
                                <option value={2}>2h / day</option>
                                <option value={4}>4h / day</option>
                                <option value={8}>Full-time</option>
                            </select>
                        </div>

                        {/* Deadline mode toggle */}
                        <button type="button"
                            className={`card card-sm ${deadline ? 'card--active' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                                background: deadline ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-card)',
                                border: deadline ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                                fontSize: 12, fontWeight: 600, color: deadline ? 'var(--red)' : 'var(--text-secondary)',
                            }}
                            onClick={() => setDeadlineOpen(!deadlineOpen)}
                        >
                            <CalendarClock size={14} />
                            {deadline ? `Deadline: ${new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Set Deadline'}
                        </button>
                    </div>
                </div>

                {/* ════════ Deadline picker (collapsible) ════════ */}
                {deadlineOpen && (
                    <div className="card" style={{
                        padding: '16px 20px', marginBottom: 20,
                        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                        background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239,68,68,0.12)',
                    }}>
                        <CalendarClock size={18} color="var(--red)" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Deadline Mode</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Set your interview or job application date - we'll auto-adjust daily study hours to fit everything.
                            </div>
                        </div>
                        <input
                            type="date"
                            value={deadline}
                            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                            onChange={(e) => setDeadline(e.target.value)}
                            style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 8, color: 'var(--text-primary)', padding: '6px 12px', fontSize: 13,
                            }}
                        />
                        {deadline && (
                            <button type="button"
                                className="btn btn--outline btn--sm"
                                style={{ color: 'var(--red)', borderColor: 'var(--red)', fontSize: 12 }}
                                onClick={() => { setDeadline(''); setDeadlineOpen(false) }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* ════════ Deadline insights ════════ */}
                {smartPlan && smartPlan.deadline && smartPlan.days_available && (
                    <div className="card" style={{
                        padding: '12px 20px', marginBottom: 20,
                        background: smartPlan.recommended_daily_hours > smartPlan.daily_hours
                            ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                        border: `1px solid ${smartPlan.recommended_daily_hours > smartPlan.daily_hours
                            ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`,
                        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
                    }}>
                        <Target size={16} color={smartPlan.recommended_daily_hours > smartPlan.daily_hours ? 'var(--red)' : 'var(--green)'} />
                        <span>
                            <strong>{smartPlan.days_available} days</strong> until deadline.
                            {smartPlan.recommended_daily_hours > smartPlan.daily_hours ? (
                                <> You need <strong style={{ color: 'var(--red)' }}>{smartPlan.recommended_daily_hours}h/day</strong> to finish on time (currently set to {smartPlan.daily_hours}h).</>
                            ) : (
                                <> At {smartPlan.daily_hours}h/day you'll finish in <strong style={{ color: 'var(--green)' }}>{smartPlan.total_days} days</strong> - comfortably on time!</>
                            )}
                        </span>
                    </div>
                )}

                {/* ════════ AI Market Forecast ════════ */}
                {forecastLoading && (
                    <div className="hero" style={{ padding: '16px 20px', marginBottom: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                            <div className="spinner spinner--sm" />
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading market forecast...</span>
                        </div>
                    </div>
                )}
                {forecastError && !forecastLoading && (
                    <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13, color: 'var(--red)' }}>
                        {forecastError}
                    </div>
                )}
                {aiForecast && !forecastLoading && (
                    <div className="hero" style={{ padding: '16px 20px', marginBottom: 20, border: '1px solid rgba(34, 197, 94, 0.2)', cursor: 'pointer' }}
                        onClick={() => setForecastExpanded(!forecastExpanded)}
                    >
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📈</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <span className="badge badge--low">AI MARKET FORECAST</span>
                                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{aiForecast.growth_pct != null ? `+${aiForecast.growth_pct}% Opportunity` : 'Analyzing...'}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{aiForecast.summary}</p>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                {forecastExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {/* ── Expanded sources ── */}
                        {forecastExpanded && aiForecast.sources && aiForecast.sources.length > 0 && (
                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                                    Verification Sources
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {aiForecast.sources.map((src, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '8px 12px', borderRadius: 8,
                                            background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)',
                                        }}>
                                            <TrendingUp size={14} color="var(--green)" style={{ marginTop: 2, flexShrink: 0 }} />
                                            <div style={{ flex: 1, fontSize: 12 }}>
                                                <div style={{ fontWeight: 600, marginBottom: 2 }}>{src.name}</div>
                                                <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{src.insight}</div>
                                                {src.url && (
                                                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                                                        style={{ color: 'var(--blue)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4 }}
                                                    >
                                                        <ExternalLink size={10} /> View Source
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════ Plan Summary Cards ════════ */}
                {smartPlan && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
                        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>{smartPlan.total_skills}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Skills</div>
                        </div>
                        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--orange)' }}>{smartPlan.prerequisite_skills}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prerequisites</div>
                        </div>
                        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>{smartPlan.target_skills}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target Skills</div>
                        </div>
                        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>{smartPlan.total_days}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Days to Complete</div>
                        </div>
                        <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>{smartPlan.total_hours}h</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Study Time</div>
                        </div>
                    </div>
                )}

                {/* ════════ Plan Loading / Error ════════ */}
                {planLoading && (
                    <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner spinner--sm" style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Building your dependency-aware learning plan...</p>
                    </div>
                )}
                {planError && !planLoading && (
                    <div style={{ padding: '12px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13, color: 'var(--red)' }}>
                        {planError}
                    </div>
                )}

                {/* ════════ Roadmap ════════ */}
                {!planLoading && smartPlan && (
                    <div className="roadmap-container">
                        {Object.entries(dayGroups).map(([dayStr, tasks]) => {
                            const day = Number(dayStr)
                            return (
                                <div key={day} className="day-block" style={{ marginBottom: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontWeight: 800, fontSize: 12 }}>
                                            D{day}
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>Day {day}</div>
                                        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                                            {tasks.reduce((acc, t) => acc + t.duration_minutes, 0)} mins
                                        </div>
                                    </div>

                                    <div className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                        {tasks.map(task => {
                                            const isMastered = masteredSkills.includes(task.skill.toLowerCase())
                                            const isLocked = !canStudy(task) && !isMastered

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`card task-card ${isLocked ? 'locked' : ''} ${isMastered ? 'completed' : ''}`}
                                                    style={{
                                                        position: 'relative', opacity: isLocked ? 0.5 : 1, transition: 'all 0.3s',
                                                        border: isMastered ? '1px solid var(--green)'
                                                            : highlightSkill?.toLowerCase() === task.skill ? '2px solid var(--blue)'
                                                            : '1px solid var(--border)',
                                                        background: isMastered ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-card)',
                                                    }}
                                                >
                                                    {/* Header row: badges */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <span className={`badge ${task.difficulty === 'Advanced' ? 'badge--high' : task.difficulty === 'Intermediate' ? 'badge--medium' : 'badge--blue'}`}>
                                                                {task.difficulty}
                                                            </span>
                                                            {task.is_prerequisite && !task.is_target_skill && (
                                                                <span style={{
                                                                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                                                                    borderRadius: 4, background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)',
                                                                }}>
                                                                    PREREQUISITE
                                                                </span>
                                                            )}
                                                            {task.is_target_skill && (
                                                                <span style={{
                                                                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                                                                    borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)',
                                                                }}>
                                                                    <Target size={9} style={{ marginRight: 2, verticalAlign: 'middle' }} /> TARGET
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                                            <Clock size={12} /> {task.duration_minutes}m
                                                        </span>
                                                    </div>

                                                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{task.title}</h3>

                                                    {/* Dependency info */}
                                                    <div style={{ marginBottom: 12 }}>
                                                        {task.prerequisites.length > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                                                <Shield size={11} color="var(--text-muted)" />
                                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Requires:</span>
                                                                {task.prerequisites.map(p => {
                                                                    const met = masteredSkills.includes(p.toLowerCase())
                                                                    return (
                                                                        <span key={p} style={{
                                                                            fontSize: 12, padding: '1px 6px', borderRadius: 4,
                                                                            background: met ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                                                                            color: met ? 'var(--green)' : 'var(--red)',
                                                                            fontWeight: 600,
                                                                        }}>
                                                                            {met ? '✓' : '○'} {p}
                                                                        </span>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                        {task.unlocks.length > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                <GitBranch size={11} color="var(--blue)" />
                                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlocks:</span>
                                                                {task.unlocks.map(u => (
                                                                    <span key={u} style={{
                                                                        fontSize: 12, padding: '1px 6px', borderRadius: 4,
                                                                        background: 'rgba(59,130,246,0.08)', color: 'var(--blue)', fontWeight: 600,
                                                                    }}>
                                                                        {u}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    {isLocked ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                                            <Lock size={14} /> Complete prerequisites first
                                                        </div>
                                                    ) : isMastered ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>
                                                            <Trophy size={16} /> Verified Mastery
                                                            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>+50 XP</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <button type="button"
                                                                className="btn btn--primary btn--sm"
                                                                style={{ width: '100%', justifyContent: 'center' }}
                                                                onClick={() => handleStudyOpen(task.skill)}
                                                            >
                                                                <PlayCircle size={16} /> Start AI Study Hub
                                                            </button>
                                                            <button type="button"
                                                                className="btn btn--outline btn--sm"
                                                                style={{ width: '100%', justifyContent: 'center' }}
                                                                onClick={() => setActiveProject({ role, skills: [task.skill] })}
                                                            >
                                                                <Blocks size={16} /> Generate Project
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}


            </div>

            {/* Study Hub Overlay */}
            {activeStudy && (
                <StudyHub
                    skill={activeStudy}
                    onClose={() => setActiveStudy(null)}
                    onVerified={(s) => handleVerified(s)}
                />
            )}
            {/* Capstone Project Modal */}
            {activeProject && (
                <ProjectGeneratorModal
                    role={activeProject.role}
                    skills={activeProject.skills}
                    onClose={() => setActiveProject(null)}
                />
            )}

            {/* XP toast animation */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
