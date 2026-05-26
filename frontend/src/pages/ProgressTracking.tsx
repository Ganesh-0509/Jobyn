import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { loadHistory } from '../utils/history'
import {
    Star, Award, Zap, Trophy, TrendingUp, Target,
    ChevronRight, BookOpen, Flame, Shield, Cpu,
    BarChart2, Lock, CheckCircle, Brain, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion, AnimatePresence } from 'framer-motion'
import StudyHub from '../components/StudyHub'

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
    lang:   { label: 'Languages',      color: '#3b82f6', icon: Cpu },
    frame:  { label: 'Frameworks',     color: '#22d3ee', icon: Sparkles },
    ai:     { label: 'AI / ML',        color: '#a78bfa', icon: Brain },
    infra:  { label: 'Infrastructure',  color: '#f59e0b', icon: Shield },
    cs:     { label: 'Core CS',        color: '#ef4444', icon: Target },
    other:  { label: 'Other',          color: '#64748b', icon: BarChart2 },
}

const CATEGORY_SKILLS: Record<string, string[]> = {
    lang:  ['python', 'java', 'javascript', 'typescript', 'c', 'c++', 'cpp', 'c#', 'go', 'golang', 'rust', 'r', 'matlab', 'sql', 'bash', 'kotlin', 'swift', 'ruby', 'php', 'scala', 'dart'],
    frame: ['react', 'angular', 'vue', 'next.js', 'django', 'flask', 'fastapi', 'express', 'spring boot', 'node.js', 'node', 'redux', 'tailwind', 'flutter', 'html', 'css', 'graphql', 'nestjs', 'svelte', 'bootstrap'],
    ai:    ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'numpy', 'pandas', 'scikit-learn', 'generative ai', 'llm', 'rag', 'computer vision', 'prompt engineering', 'nlp', 'statistics', 'mlops', 'transformers', 'onnx', 'langchain', 'opencv', 'spark', 'data engineering', 'data analysis', 'vector databases', 'tableau'],
    infra: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'linux', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'git', 'firebase', 'mongodb', 'redis', 'postgresql', 'microservices', 'nginx', 'supabase', 'elasticsearch', 'prometheus', 'gitops', 'cloud computing'],
    cs:    ['dsa', 'system design', 'oops', 'cybersecurity', 'testing', 'api', 'rest', 'agile', 'blockchain'],
}

function resolveCategory(skill: string): string {
    const s = skill.toLowerCase()
    for (const [cat, list] of Object.entries(CATEGORY_SKILLS)) {
        if (list.includes(s)) return cat
    }
    return 'other'
}

const XP_PER_SKILL_MASTERED = 50
const XP_FOR_RESUME_UPLOAD  = 100
const XP_PER_HISTORY_ENTRY  = 20
const XP_PER_COMPLETED_TASK = 10
const XP_PER_LEVEL = 150

const MILESTONE_DEFS = [
    { icon: Star,   label: 'Resume Insight',   test: (_s: number, a: boolean) => a, sub: 'Profile analyzed' },
    { icon: Award,  label: 'Growing Talent',    test: (s: number) => s >= 50,       sub: '50% readiness' },
    { icon: Zap,    label: 'Placement Ready',   test: (s: number) => s >= 75,       sub: '75% readiness' },
    { icon: Trophy, label: 'Industry Elite',    test: (s: number) => s >= 90,       sub: '90% readiness' },
]

function computeStreak(hist: { label: string }[]): number {
    return hist.length
}

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function ProgressTracking() {
    const navigate = useNavigate()
    const { analysis, masteredSkills, markSkillMastered, completedTasks } = useResume()
    const { user } = useAuth()
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
    const [expandedCat, setExpandedCat] = useState<string | null>(null)

    const score = analysis?.final_score ?? 0
    const hist = loadHistory(user?.email)

    const roleSkills = useMemo(() => {
        if (!analysis) return { all: [] as string[], detected: new Set<string>(), mastered: new Set<string>() }
        const detected = new Set((analysis.detected_skills ?? []).map(s => s.toLowerCase()))
        const mastered = new Set(masteredSkills.map(s => s.toLowerCase()))
        const allSet = new Set<string>()
        for (const s of analysis.detected_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of analysis.missing_core_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of analysis.missing_optional_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of masteredSkills) allSet.add(s.toLowerCase())
        return { all: [...allSet], detected, mastered }
    }, [analysis, masteredSkills])

    const isVerified = useCallback((skill: string) => {
        const s = skill.toLowerCase()
        return roleSkills.detected.has(s) || roleSkills.mastered.has(s)
    }, [roleSkills])

    const catStats = useMemo(() => {
        const buckets: Record<string, { skills: { name: string; verified: boolean }[] }> = {}
        for (const skill of roleSkills.all) {
            const catKey = resolveCategory(skill)
            if (!buckets[catKey]) buckets[catKey] = { skills: [] }
            buckets[catKey].skills.push({ name: skill, verified: isVerified(skill) })
        }
        const order = ['lang', 'cs', 'frame', 'infra', 'ai', 'other']
        return order.filter(k => buckets[k]?.skills.length > 0).map(k => {
            const meta = CATEGORY_MAP[k]
            const skills = buckets[k].skills
            const verifiedCount = skills.filter(s => s.verified).length
            const pct = Math.round((verifiedCount / skills.length) * 100)
            return { code: k, label: meta.label, color: meta.color, icon: meta.icon, skills, verifiedCount, pct }
        })
    }, [roleSkills, isVerified])

    const totalVerified = catStats.reduce((a, c) => a + c.verifiedCount, 0)
    const totalSkills   = catStats.reduce((a, c) => a + c.skills.length, 0)
    const overallPct    = totalSkills > 0 ? Math.round((totalVerified / totalSkills) * 100) : 0

    const totalXp = useMemo(() => {
        let xp = 0
        if (analysis) xp += XP_FOR_RESUME_UPLOAD
        xp += masteredSkills.length * XP_PER_SKILL_MASTERED
        xp += (completedTasks?.length ?? 0) * XP_PER_COMPLETED_TASK
        xp += Math.max(0, hist.length - 1) * XP_PER_HISTORY_ENTRY
        return xp
    }, [analysis, masteredSkills, completedTasks, hist])

    const level     = Math.floor(totalXp / XP_PER_LEVEL) + 1
    const xpInLevel = totalXp % XP_PER_LEVEL
    const xpPct     = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

    const milestones = MILESTONE_DEFS.map(m => ({ ...m, done: m.test(score, !!analysis) }))
    const milestonePct = milestones.filter(m => m.done).length / milestones.length

    const velocity = hist.length >= 2 ? hist[hist.length - 1].value - hist[0].value : null
    const streak = computeStreak(hist)

    const nextSkill = useMemo(() => {
        const masLower = new Set(masteredSkills.map(s => s.toLowerCase()))
        const detLower = new Set((analysis?.detected_skills ?? []).map(s => s.toLowerCase()))
        for (const s of analysis?.missing_core_skills ?? []) {
            if (!masLower.has(s.toLowerCase()) && !detLower.has(s.toLowerCase())) return s
        }
        for (const s of analysis?.missing_optional_skills ?? []) {
            if (!masLower.has(s.toLowerCase()) && !detLower.has(s.toLowerCase())) return s
        }
        return null
    }, [analysis, masteredSkills])

    const verifiedAll = roleSkills.all.filter(s => isVerified(s))

    if (!analysis) {
        return (
            <div className="mx-auto max-w-xl py-20 text-center">
                <motion.div {...fadeUp}>
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-muted">
                        <Lock className="size-10 text-muted-foreground" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Growth Tracking Locked</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Upload your resume to unlock real-time growth analytics, XP leveling, skill density mapping, and career milestones.</p>
                    <Button className="mt-6 gap-2" onClick={() => navigate('/resume-analyzer')}>
                        <Sparkles className="size-4" /> Analyze Your Resume
                    </Button>
                    <div className="mt-10 grid gap-4 sm:grid-cols-3">
                        {[
                            { icon: BarChart2, title: 'Skill Radar', desc: 'Interactive skill coverage map across all domains' },
                            { icon: Trophy,    title: 'XP Leveling',  desc: 'Earn XP for mastering skills and completing tasks' },
                            { icon: Flame,     title: 'Velocity',     desc: 'See how your readiness score changes over time' },
                        ].map(f => (
                            <Card key={f.title} className="premium-hover-card text-center">
                                <CardContent className="pt-6">
                                    <f.icon className="mx-auto mb-2 size-5 text-muted-foreground" />
                                    <p className="text-sm font-semibold">{f.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* XP Bar */}
            <motion.div {...fadeUp}>
                <Card className="premium-hover-card bg-gradient-to-r from-amber-500/5 to-primary/5">
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                LVL {level}
                            </Badge>
                            <div className="min-w-0 flex-1">
                                <Progress value={xpPct} className="h-2" />
                                <p className="mt-1 text-xs text-muted-foreground">{xpInLevel} / {XP_PER_LEVEL} XP</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Flame className="size-3.5 text-amber-500" /> {streak} session{streak !== 1 && 's'}</span>
                            <span className="flex items-center gap-1">
                                <TrendingUp className={`size-3.5 ${velocity !== null && velocity > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                                {velocity !== null ? `${velocity > 0 ? '+' : ''}${velocity} pts` : '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* XP Breakdown */}
            <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">Resume +{XP_FOR_RESUME_UPLOAD}</Badge>
                    <Badge variant="secondary">Skills +{masteredSkills.length * XP_PER_SKILL_MASTERED}</Badge>
                    <Badge variant="secondary">Tasks +{(completedTasks?.length ?? 0) * XP_PER_COMPLETED_TASK}</Badge>
                    {hist.length > 1 && <Badge variant="secondary">Iterations +{(hist.length - 1) * XP_PER_HISTORY_ENTRY}</Badge>}
                    <span className="font-mono text-xs font-semibold text-muted-foreground">= {totalXp} XP Total</span>
                </div>
            </motion.div>

            {/* Hero Stats */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Coverage Ring */}
                    <Card className="premium-hover-card col-span-1 flex flex-col items-center justify-center py-6">
                        <div className="relative size-24">
                            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#ptGrad)" strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${(overallPct / 100) * 327} 327`}
                                    className="transition-[stroke-dasharray] duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="ptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                                        <stop offset="100%" stopColor="#9B51E0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-heading text-2xl font-bold">{overallPct}%</span>
                                <span className="text-[10px] text-muted-foreground">Coverage</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="premium-hover-card flex flex-col items-center justify-center py-6 text-center">
                        <p className="font-heading text-3xl font-bold">{totalVerified}<span className="text-lg text-muted-foreground">/{totalSkills}</span></p>
                        <p className="text-xs text-muted-foreground">Skills Verified</p>
                    </Card>
                    <Card className="premium-hover-card flex flex-col items-center justify-center py-6 text-center">
                        <p className="font-heading text-3xl font-bold">{score}<span className="text-lg text-muted-foreground">/100</span></p>
                        <p className="text-xs text-muted-foreground">Readiness Score</p>
                    </Card>
                    <Card
                        className={`premium-hover-card flex flex-col items-center justify-center py-6 text-center ${nextSkill ? 'cursor-pointer border-primary/20 hover:border-primary/40' : ''}`}
                        onClick={() => nextSkill && setSelectedSkill(nextSkill)}
                    >
                        <Target className="mb-1 size-5 text-primary" />
                        <p className="text-xs text-muted-foreground">Next Target</p>
                        <p className="mt-1 text-sm font-semibold text-primary">{nextSkill ?? 'All caught up!'}</p>
                    </Card>
                </div>
            </motion.div>

            {/* Skill Radar */}
            <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
                <div className="mb-3 flex items-center gap-2">
                    <BarChart2 className="size-4 text-muted-foreground" />
                    <h2 className="font-heading text-lg font-semibold">Skill Radar</h2>
                    <span className="text-xs text-muted-foreground">{catStats.length} categories from your {analysis.role} profile</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catStats.map(cat => {
                        const Icon = cat.icon
                        const isOpen = expandedCat === cat.code
                        return (
                            <Card key={cat.code} className={`premium-hover-card transition-all ${isOpen ? 'border-primary/20' : ''}`}>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 p-4 text-left"
                                    onClick={() => setExpandedCat(isOpen ? null : cat.code)}
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ color: cat.color, background: `${cat.color}15` }}>
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">{cat.label}</p>
                                        <p className="text-xs font-medium" style={{ color: cat.color }}>{cat.verifiedCount}/{cat.skills.length}</p>
                                    </div>
                                    {/* Mini ring */}
                                    <div className="relative size-9 shrink-0">
                                        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                                            <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="14" fill="none" stroke={cat.color} strokeWidth="3" strokeLinecap="round"
                                                strokeDasharray={`${(cat.pct / 100) * 88} 88`}
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                                    </div>
                                    <ChevronRight className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <Separator />
                                            <div className="flex flex-wrap gap-1.5 p-4">
                                                {cat.skills.map(s => (
                                                    <button
                                                        type="button"
                                                        key={s.name}
                                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                                            s.verified
                                                                ? 'bg-success/10 text-success'
                                                                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                                        }`}
                                                        onClick={() => !s.verified && setSelectedSkill(s.name)}
                                                        title={s.verified ? `${s.name} - Verified` : `Click to learn ${s.name}`}
                                                    >
                                                        {s.verified ? <CheckCircle className="size-3" /> : <BookOpen className="size-3" />}
                                                        {s.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        )
                    })}
                </div>
            </motion.div>

            {/* Milestones */}
            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
                <div className="mb-3 flex items-center gap-2">
                    <Trophy className="size-4 text-muted-foreground" />
                    <h2 className="font-heading text-lg font-semibold">Career Milestones</h2>
                    <span className="text-xs text-muted-foreground">{milestones.filter(m => m.done).length} of {milestones.length} unlocked</span>
                </div>
                <Card className="premium-hover-card">
                    <CardContent className="pt-6">
                        {/* Rail */}
                        <div className="relative mb-8">
                            <div className="absolute left-0 right-0 top-4 h-0.5 bg-muted" />
                            <div className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500" style={{ width: `${milestonePct * 100}%` }} />
                            <div className="relative flex justify-between">
                                {milestones.map((m, i) => {
                                    const Icon = m.icon
                                    const isNext = !m.done && (i === 0 || milestones[i - 1].done)
                                    return (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors ${
                                                m.done ? 'border-primary bg-primary/10 text-primary'
                                                    : isNext ? 'border-primary/40 bg-background text-primary/60'
                                                    : 'border-muted bg-background text-muted-foreground'
                                            }`}>
                                                <Icon className="size-3.5" />
                                            </div>
                                            <p className="mt-2 text-center text-[11px] font-semibold">{m.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{m.done ? 'Done' : m.sub}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Verified Strip */}
            {verifiedAll.length > 0 && (
                <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
                    <Card className="premium-hover-card">
                        <CardContent className="pt-6">
                            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Zap className="size-3 text-primary" />
                                Verified mastery from resume & study ({verifiedAll.length} skills)
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {verifiedAll.slice(0, 12).map(s => (
                                    <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
                                ))}
                                {verifiedAll.length > 12 && (
                                    <Badge variant="outline" className="text-[11px]">+{verifiedAll.length - 12}</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Study Hub */}
            {selectedSkill && (
                <StudyHub
                    skill={selectedSkill}
                    onClose={() => setSelectedSkill(null)}
                    onVerified={(s) => markSkillMastered(s)}
                />
            )}
        </div>
    )
}
