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
    GitBranch, ExternalLink, Shield, Sparkles,
} from 'lucide-react'
import StudyHub from '../components/StudyHub'
import ProjectGeneratorModal from '../components/ProjectGeneratorModal'
import {
    getStreakData, awardXP, getXPForNextLevel, getStreakMultiplier,
    getLevelTitle, type StreakData,
} from '../utils/streakTracker'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function ImprovementPlan() {
    const { analysis, masteredSkills, dailyCommitment, setDailyCommitment, markSkillMastered } = useResume()
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const highlightSkill = (location.state as { highlightSkill?: string } | null)?.highlightSkill

    const role = analysis?.role ?? 'Software Developer'
    const missingCore = analysis?.missing_core_skills ?? []
    const missingOpt = analysis?.missing_optional_skills ?? []

    const [smartPlan, setSmartPlan] = useState<SmartPlanResult | null>(null)
    const [planLoading, setPlanLoading] = useState(false)
    const [planError, setPlanError] = useState<string | null>(null)
    const [deadline, setDeadline] = useState<string>('')
    const [deadlineOpen, setDeadlineOpen] = useState(false)
    const [activeStudy, setActiveStudy] = useState<string | null>(null)
    const [activeProject, setActiveProject] = useState<{ role: string; skills: string[] } | null>(null)
    const [aiForecast, setAiForecast] = useState<ForecastResult | null>(null)
    const [forecastLoading, setForecastLoading] = useState(false)
    const [forecastError, setForecastError] = useState<string | null>(null)
    const [forecastExpanded, setForecastExpanded] = useState(false)
    const [streak, setStreak] = useState<StreakData>(() => getStreakData(user?.email))
    const [xpToast, setXpToast] = useState<{ xp: number; action: string } | null>(null)
    const toastTimer = useRef<ReturnType<typeof setTimeout>>()

    const doAwardXP = (action: Parameters<typeof awardXP>[0], detail?: string) => {
        const result = awardXP(action, user?.email, detail)
        if (result.xpAwarded > 0) {
            setStreak(result.streakData)
            setXpToast({ xp: result.xpAwarded, action: detail || action })
            clearTimeout(toastTimer.current)
            toastTimer.current = setTimeout(() => setXpToast(null), 2500)
        }
    }

    useEffect(() => { if (analysis) doAwardXP('daily_login', 'Opened Improvement Plan') }, []) // eslint-disable-line

    useEffect(() => {
        if (!analysis) return
        setPlanLoading(true); setPlanError(null)
        getSmartPlan(missingCore, missingOpt, masteredSkills, dailyCommitment, deadline || undefined)
            .then(setSmartPlan)
            .catch(err => setPlanError(err?.message || 'Failed to build learning plan'))
            .finally(() => setPlanLoading(false))
    }, [analysis, dailyCommitment, deadline, masteredSkills.length]) // eslint-disable-line

    useEffect(() => {
        if (!analysis) return
        const today = new Date().toISOString().slice(0, 10)
        const cacheKey = `forecast_${role}_${today}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) { try { setAiForecast(JSON.parse(cached)); return } catch { /* */ } }
        setForecastLoading(true); setForecastError(null)
        getMarketForecast(role, missingCore)
            .then(data => {
                setAiForecast(data)
                try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* */ }
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i)
                    if (k && k.startsWith('forecast_') && !k.includes(today)) localStorage.removeItem(k)
                }
            })
            .catch(err => setForecastError(err?.message || 'Failed to load market forecast'))
            .finally(() => setForecastLoading(false))
    }, [role, analysis]) // eslint-disable-line

    const planItems = smartPlan?.schedule ?? []
    const totalMastered = planItems.filter(p => masteredSkills.includes(p.skill.toLowerCase())).length

    const dayGroups = planItems.reduce<Record<number, SmartPlanItem[]>>((acc, item) => {
        (acc[item.scheduled_day] ??= []).push(item)
        return acc
    }, {})

    const canStudy = (item: SmartPlanItem) => item.prerequisites.every(p => masteredSkills.includes(p.toLowerCase()))

    const handleVerified = (skill: string) => { markSkillMastered(skill.toLowerCase()); doAwardXP('quiz_passed', skill) }

    const xpInfo = getXPForNextLevel(streak.totalXP)
    const multiplier = getStreakMultiplier(streak.currentStreak)

    if (!analysis) {
        return (
            <div className="mx-auto max-w-xl py-20 text-center">
                <motion.div {...fadeUp}>
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-muted">
                        <Sparkles className="size-10 text-muted-foreground" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">No Roadmap Available</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Your personalized learning path will be generated once you upload and analyze your resume.</p>
                    <Button className="mt-6 gap-2" onClick={() => navigate('/resume-analyzer')}>
                        <Sparkles className="size-4" /> Analyze Your Resume Now
                    </Button>
                    <Card className="mt-10 text-left">
                        <CardContent className="pt-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">What's Inside?</p>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>Smart dependency-aware learning path (powered by skill graph)</li>
                                <li>Daily streak + XP gamification system</li>
                                <li>Deadline mode — set your interview date, we adjust the plan</li>
                                <li>AI Market Forecast with growth insights</li>
                                <li>Integrated Study Hub + Project Verification</li>
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* XP Toast */}
            <AnimatePresence>
                {xpToast && (
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80 }}
                        className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30"
                    >
                        <Zap className="size-4" /> +{xpToast.xp} XP
                        {multiplier > 1 && <span className="text-xs opacity-90">({multiplier}x streak!)</span>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Streak + XP Banner */}
            <motion.div {...fadeUp}>
                <Card className="border-amber-500/10 bg-gradient-to-r from-amber-500/5 to-primary/5">
                    <CardContent className="grid items-center gap-6 pt-6 sm:grid-cols-[auto_1fr_auto]">
                        <div className="flex flex-col items-center">
                            <div className={`flex size-14 items-center justify-center rounded-full border-2 ${streak.currentStreak > 0 ? 'border-amber-500/40 bg-amber-500/15' : 'border-transparent bg-muted'}`}>
                                <Flame className="size-7" style={{ color: streak.currentStreak > 0 ? '#f59e0b' : 'var(--muted-foreground)' }} />
                            </div>
                            <p className="mt-1 font-heading text-xl font-extrabold">{streak.currentStreak}</p>
                            <p className="text-[10px] uppercase text-muted-foreground">Day Streak</p>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] font-bold text-primary">LVL {streak.level}</Badge>
                                <span className="text-sm font-bold">{getLevelTitle(streak.level)}</span>
                                {multiplier > 1 && (
                                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-500">{multiplier}x MULTIPLIER</Badge>
                                )}
                            </div>
                            <Progress value={xpInfo.progress} className="mb-1 h-2" />
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>{streak.totalXP} XP total</span>
                                <span>{xpInfo.next - streak.totalXP} XP to Level {streak.level + 1}</span>
                            </div>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div><p className="font-heading text-lg font-extrabold text-success">{totalMastered}</p><p className="text-[10px] text-muted-foreground">Skills</p></div>
                            <div><p className="font-heading text-lg font-extrabold text-primary">{streak.longestStreak}</p><p className="text-[10px] text-muted-foreground">Best Streak</p></div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Header + Controls */}
            <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight">Adaptive Learning Path</h1>
                        <p className="text-sm text-muted-foreground">Smart dependency-aware {role} roadmap</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
                            <Clock className="size-3.5 text-primary" />
                            <select value={dailyCommitment} onChange={e => setDailyCommitment(Number(e.target.value))} className="bg-transparent text-xs font-medium outline-none">
                                <option value={1}>1h / day</option>
                                <option value={2}>2h / day</option>
                                <option value={4}>4h / day</option>
                                <option value={8}>Full-time</option>
                            </select>
                        </div>
                        <Button variant={deadline ? 'default' : 'outline'} size="sm" className="gap-2" onClick={() => setDeadlineOpen(!deadlineOpen)}>
                            <CalendarClock className="size-3.5" />
                            {deadline ? `Deadline: ${new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Set Deadline'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Deadline picker */}
            <AnimatePresence>
                {deadlineOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <Card className="border-destructive/15 bg-destructive/5">
                            <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                                <CalendarClock className="size-5 text-destructive" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">Deadline Mode</p>
                                    <p className="text-xs text-muted-foreground">Set your interview or job application date — we'll auto-adjust daily study hours.</p>
                                </div>
                                <input type="date" value={deadline} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} onChange={e => setDeadline(e.target.value)} className="rounded-md border bg-background px-3 py-1.5 text-sm" />
                                {deadline && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setDeadline(''); setDeadlineOpen(false) }}>Clear</Button>}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deadline insights */}
            {smartPlan?.deadline && smartPlan.days_available && (
                <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
                    <Card className={smartPlan.recommended_daily_hours > smartPlan.daily_hours ? 'border-destructive/20 bg-destructive/5' : 'border-success/20 bg-success/5'}>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <Target className="size-4 shrink-0" style={{ color: smartPlan.recommended_daily_hours > smartPlan.daily_hours ? 'var(--destructive)' : 'var(--success)' }} />
                            <p className="text-sm">
                                <strong>{smartPlan.days_available} days</strong> until deadline.
                                {smartPlan.recommended_daily_hours > smartPlan.daily_hours ? (
                                    <> You need <strong className="text-destructive">{smartPlan.recommended_daily_hours}h/day</strong> to finish on time (currently {smartPlan.daily_hours}h).</>
                                ) : (
                                    <> At {smartPlan.daily_hours}h/day you'll finish in <strong className="text-success">{smartPlan.total_days} days</strong> — comfortably on time!</>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* AI Market Forecast */}
            {forecastLoading && (
                <Card><CardContent className="flex items-center justify-center gap-3 py-8">
                    <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Loading market forecast…</span>
                </CardContent></Card>
            )}
            {forecastError && !forecastLoading && (
                <Card className="border-destructive/20 bg-destructive/5"><CardContent className="py-4 text-sm text-destructive">{forecastError}</CardContent></Card>
            )}
            {aiForecast && !forecastLoading && (
                <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                    <Card className="cursor-pointer border-success/20" onClick={() => setForecastExpanded(!forecastExpanded)}>
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-lg">📈</div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">AI MARKET FORECAST</Badge>
                                    <span className="text-xs font-bold text-success">{aiForecast.growth_pct != null ? `+${aiForecast.growth_pct}% Opportunity` : 'Analyzing...'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{aiForecast.summary}</p>
                            </div>
                            {forecastExpanded ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                        </CardContent>
                        <AnimatePresence>
                            {forecastExpanded && aiForecast.sources?.length > 0 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <Separator />
                                    <CardContent className="space-y-2 pt-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verification Sources</p>
                                        {aiForecast.sources.map((src, i) => (
                                            <div key={i} className="flex items-start gap-3 rounded-lg border border-success/10 bg-success/5 p-3">
                                                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-success" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold">{src.name}</p>
                                                    <p className="text-xs text-muted-foreground">{src.insight}</p>
                                                    {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="size-3" /> View Source</a>}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </motion.div>
            )}

            {/* Plan Summary */}
            {smartPlan && (
                <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { value: smartPlan.total_skills, label: 'Total Skills', color: 'text-primary' },
                            { value: smartPlan.prerequisite_skills, label: 'Prerequisites', color: 'text-amber-500' },
                            { value: smartPlan.target_skills, label: 'Target Skills', color: 'text-success' },
                            { value: smartPlan.total_days, label: 'Days', color: '' },
                            { value: `${smartPlan.total_hours}h`, label: 'Study Time', color: '' },
                        ].map(s => (
                            <Card key={s.label} className="text-center"><CardContent className="py-3">
                                <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            </CardContent></Card>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Plan Loading / Error */}
            {planLoading && (
                <Card><CardContent className="flex flex-col items-center gap-3 py-10">
                    <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Building your dependency-aware learning plan…</p>
                </CardContent></Card>
            )}
            {planError && !planLoading && (
                <Card className="border-destructive/20 bg-destructive/5"><CardContent className="py-4 text-sm text-destructive">{planError}</CardContent></Card>
            )}

            {/* Roadmap */}
            {!planLoading && smartPlan && (
                <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                    <div className="space-y-8">
                        {Object.entries(dayGroups).map(([dayStr, tasks]) => {
                            const day = Number(dayStr)
                            return (
                                <div key={day} className="relative pl-8">
                                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                                    <div className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-2 ring-background">D{day}</div>
                                    <div className="mb-3 flex items-center gap-3">
                                        <h3 className="font-heading text-base font-semibold">Day {day}</h3>
                                        <span className="text-xs text-muted-foreground">{tasks.reduce((acc, t) => acc + t.duration_minutes, 0)} mins</span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {tasks.map(task => {
                                            const isMastered = masteredSkills.includes(task.skill.toLowerCase())
                                            const isLocked = !canStudy(task) && !isMastered
                                            return (
                                                <motion.div key={task.id} layout>
                                                    <Card className={`relative transition-all ${isLocked ? 'opacity-50' : ''} ${isMastered ? 'border-success/30 bg-success/5' : ''} ${highlightSkill?.toLowerCase() === task.skill ? 'ring-2 ring-primary' : ''}`}>
                                                        <CardContent className="pt-5">
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <Badge variant={task.difficulty === 'Advanced' ? 'destructive' : task.difficulty === 'Intermediate' ? 'default' : 'secondary'} className="text-[10px]">{task.difficulty}</Badge>
                                                                    {task.is_prerequisite && !task.is_target_skill && <Badge variant="secondary" className="bg-violet-500/10 text-violet-500 text-[10px]">PREREQUISITE</Badge>}
                                                                    {task.is_target_skill && <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]"><Target className="mr-1 size-2.5" /> TARGET</Badge>}
                                                                </div>
                                                                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {task.duration_minutes}m</span>
                                                            </div>
                                                            <h4 className="mb-2 text-sm font-semibold">{task.title}</h4>
                                                            {(task.prerequisites.length > 0 || task.unlocks.length > 0) && (
                                                                <div className="mb-3 space-y-1.5">
                                                                    {task.prerequisites.length > 0 && (
                                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                                            <Shield className="size-3 text-muted-foreground" />
                                                                            <span className="text-[10px] text-muted-foreground">Requires:</span>
                                                                            {task.prerequisites.map(p => {
                                                                                const met = masteredSkills.includes(p.toLowerCase())
                                                                                return <Badge key={p} variant="secondary" className={`text-[10px] ${met ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{met ? '✓' : '○'} {p}</Badge>
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                    {task.unlocks.length > 0 && (
                                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                                            <GitBranch className="size-3 text-primary" />
                                                                            <span className="text-[10px] text-muted-foreground">Unlocks:</span>
                                                                            {task.unlocks.map(u => <Badge key={u} variant="secondary" className="bg-primary/10 text-primary text-[10px]">{u}</Badge>)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isLocked ? (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium"><Lock className="size-3.5" /> Complete prerequisites first</div>
                                                            ) : isMastered ? (
                                                                <div className="flex items-center gap-2 text-sm font-bold text-success"><Trophy className="size-4" /> Verified Mastery <span className="ml-auto text-xs font-normal text-muted-foreground">+50 XP</span></div>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    <Button size="sm" className="w-full justify-center gap-2" onClick={() => setActiveStudy(task.skill)}><PlayCircle className="size-4" /> Start AI Study Hub</Button>
                                                                    <Button variant="outline" size="sm" className="w-full justify-center gap-2" onClick={() => setActiveProject({ role, skills: [task.skill] })}><Blocks className="size-4" /> Generate Project</Button>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {activeStudy && <StudyHub skill={activeStudy} onClose={() => setActiveStudy(null)} onVerified={s => handleVerified(s)} />}
            {activeProject && <ProjectGeneratorModal role={activeProject.role} skills={activeProject.skills} onClose={() => setActiveProject(null)} />}
        </div>
    )
}
