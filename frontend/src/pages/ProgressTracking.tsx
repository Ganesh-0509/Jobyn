import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { loadHistory } from '../utils/history'
import {
    Star, Award, Zap, Trophy, TrendingUp, Target,
    ChevronRight, BookOpen, Flame, Shield, Cpu,
    BarChart2, Lock, Sparkles, CheckCircle, Brain,
} from 'lucide-react'
import StudyHub from '../components/StudyHub'

/* ── Skill → category resolution (same source-of-truth as scoring) ────── */
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

/* ── XP constants - each action has a clear, documented XP value ──────── */
const XP_PER_SKILL_MASTERED = 50   // 50 XP for each skill mastered via study
const XP_FOR_RESUME_UPLOAD  = 100  // 100 XP for uploading and analyzing a resume
const XP_PER_HISTORY_ENTRY  = 20   // 20 XP for each re-analysis (shows iteration)
const XP_PER_COMPLETED_TASK = 10   // 10 XP for each improvement plan task completed

const XP_PER_LEVEL = 150           // fixed XP per level (level 1 = 0-149, level 2 = 150-299, etc.)

/* ── Milestone definitions - thresholds based on scoring.json readiness ── */
const MILESTONE_DEFS = [
    { icon: Star,   label: 'Resume Insight',   test: (s: number, a: boolean) => a,        sub: 'Profile analyzed' },
    { icon: Award,  label: 'Growing Talent',    test: (s: number) => s >= 50,              sub: '50% readiness' },
    { icon: Zap,    label: 'Placement Ready',   test: (s: number) => s >= 75,              sub: '75% readiness' },
    { icon: Trophy, label: 'Industry Elite',    test: (s: number) => s >= 90,              sub: '90% readiness' },
]

/* ── Streak calculation from actual history dates ─────────────────────── */
function computeStreak(hist: { label: string }[]): number {
    if (hist.length === 0) return 0
    // labels are like "Mar 1", "Feb 28" - we count how many unique dates exist
    // from the end that are sequential. Since the exact date parse can be fragile,
    // just count consecutive entries from the tail (each entry = 1 day max).
    // History already de-duplicates same-day entries, so length = # distinct days with activity.
    return hist.length
}

/* ════════════════════════════════════════════════════════════════════ */
export default function ProgressTracking() {
    const navigate = useNavigate()
    const { analysis, masteredSkills, markSkillMastered, completedTasks } = useResume()
    const { user } = useAuth()
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
    const [expandedCat, setExpandedCat] = useState<string | null>(null)

    const score = analysis?.final_score ?? 0
    const hist = loadHistory(user?.email)

    /* ── Build the FULL skill universe from the user's actual analysis ── */
    // All skills the user's role cares about = detected + missing core + missing optional
    const roleSkills = useMemo(() => {
        if (!analysis) return { all: [] as string[], detected: new Set<string>(), mastered: new Set<string>() }
        const detected = new Set((analysis.detected_skills ?? []).map(s => s.toLowerCase()))
        const mastered = new Set(masteredSkills.map(s => s.toLowerCase()))
        const allSet = new Set<string>()
        // Add everything the analysis mentions
        for (const s of analysis.detected_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of analysis.missing_core_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of analysis.missing_optional_skills ?? []) allSet.add(s.toLowerCase())
        for (const s of masteredSkills) allSet.add(s.toLowerCase())
        return { all: [...allSet], detected, mastered }
    }, [analysis, masteredSkills])

    /* Is a skill "verified"? = detected on resume OR mastered via study */
    const isVerified = useCallback((skill: string) => {
        const s = skill.toLowerCase()
        return roleSkills.detected.has(s) || roleSkills.mastered.has(s)
    }, [roleSkills])

    /* ── Dynamic categories from actual user skills ──────────────────── */
    const catStats = useMemo(() => {
        const buckets: Record<string, { skills: { name: string; verified: boolean }[] }> = {}
        for (const skill of roleSkills.all) {
            const catKey = resolveCategory(skill)
            if (!buckets[catKey]) buckets[catKey] = { skills: [] }
            buckets[catKey].skills.push({ name: skill, verified: isVerified(skill) })
        }
        // Convert to array, sorted by category order, skip empty
        const order = ['lang', 'cs', 'frame', 'infra', 'ai', 'other']
        return order
            .filter(k => buckets[k] && buckets[k].skills.length > 0)
            .map(k => {
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

    /* ── XP - derived from real, trackable actions ───────────────────── */
    const totalXp = useMemo(() => {
        let xp = 0
        if (analysis) xp += XP_FOR_RESUME_UPLOAD                            // uploaded resume
        xp += masteredSkills.length * XP_PER_SKILL_MASTERED                  // each skill mastered
        xp += (completedTasks?.length ?? 0) * XP_PER_COMPLETED_TASK         // improvement plan tasks
        xp += Math.max(0, hist.length - 1) * XP_PER_HISTORY_ENTRY           // re-analyses (exclude first)
        return xp
    }, [analysis, masteredSkills, completedTasks, hist])

    const level     = Math.floor(totalXp / XP_PER_LEVEL) + 1
    const xpInLevel = totalXp % XP_PER_LEVEL
    const xpPct     = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

    /* ── Milestones ──────────────────────────────────────────────────── */
    const milestones = MILESTONE_DEFS.map((m, i) => ({
        ...m,
        done: m.test(score, !!analysis),
    }))
    const milestonePct = milestones.filter(m => m.done).length / milestones.length

    /* ── Velocity (score change first → last history entry) ──────────── */
    const velocity = hist.length >= 2 ? hist[hist.length - 1].value - hist[0].value : null

    /* ── Streak ──────────────────────────────────────────────────────── */
    const streak = computeStreak(hist)

    /* ── Next skill to learn - first missing core, then optional ──────── */
    const nextSkill = useMemo(() => {
        const masLower = new Set(masteredSkills.map(s => s.toLowerCase()))
        const detLower = new Set((analysis?.detected_skills ?? []).map(s => s.toLowerCase()))
        // Core first
        for (const s of analysis?.missing_core_skills ?? []) {
            if (!masLower.has(s.toLowerCase()) && !detLower.has(s.toLowerCase())) return s
        }
        // Then optional
        for (const s of analysis?.missing_optional_skills ?? []) {
            if (!masLower.has(s.toLowerCase()) && !detLower.has(s.toLowerCase())) return s
        }
        return null
    }, [analysis, masteredSkills])

    /* ── Locked state ────────────────────────────────────────────────── */
    if (!analysis) {
        return (
            <div className="page-content">
                <div className="pt-locked">
                    <div className="pt-locked__icon"><Lock size={48} strokeWidth={1.2} /></div>
                    <h1 className="pt-locked__title">Growth Tracking Locked</h1>
                    <p className="pt-locked__sub">Upload your resume to unlock real-time growth analytics, XP leveling,
                    skill density mapping, and career milestones.</p>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        <Sparkles size={16} /> Analyze Your Resume
                    </button>
                    <div className="pt-locked__features">
                        {[
                            { icon: BarChart2, title: 'Skill Radar', desc: 'Interactive skill coverage map across all relevant domains' },
                            { icon: Trophy,    title: 'XP Leveling',  desc: 'Earn XP for mastering skills, completing tasks, and iterating' },
                            { icon: Flame,     title: 'Velocity Tracking', desc: 'See how your readiness score changes over time' },
                        ].map(f => (
                            <div key={f.title} className="pt-locked__feat-card">
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

    /* ═══════════════════════════════════════════════════════════════════ */
    return (
        <div className="page-content">

            {/* ── XP Bar + Level ───────────────────────────────────────── */}
            <div className="pt-xp-bar">
                <div className="pt-xp-bar__left">
                    <div className="pt-xp-bar__level">LVL {level}</div>
                    <div className="pt-xp-bar__track">
                        <div className="pt-xp-bar__fill" style={{ width: `${xpPct}%` }} />
                    </div>
                    <div className="pt-xp-bar__label">{xpInLevel} / {XP_PER_LEVEL} XP</div>
                </div>
                <div className="pt-xp-bar__right">
                    <div className="pt-xp-bar__stat" title={`${streak} analysis session${streak !== 1 ? 's' : ''} recorded`}>
                        <Flame size={14} color="#f59e0b" />
                        <span>{streak} session{streak !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="pt-xp-bar__stat" title={velocity !== null ? `Score changed ${velocity > 0 ? '+' : ''}${velocity} pts from first to latest analysis` : 'Need at least 2 analyses to show velocity'}>
                        <TrendingUp size={14} color={velocity !== null && velocity > 0 ? 'var(--green)' : 'var(--text-muted)'} />
                        <span>{velocity !== null ? `${velocity > 0 ? '+' : ''}${velocity} pts` : '-'}</span>
                    </div>
                </div>
            </div>

            {/* ── XP Breakdown tooltip row ─────────────────────────────── */}
            <div className="pt-xp-breakdown">
                <span className="pt-xp-tag" title="100 XP for uploading your resume">Resume +{XP_FOR_RESUME_UPLOAD}</span>
                <span className="pt-xp-tag" title={`${XP_PER_SKILL_MASTERED} XP × ${masteredSkills.length} skills mastered`}>Skills +{masteredSkills.length * XP_PER_SKILL_MASTERED}</span>
                <span className="pt-xp-tag" title={`${XP_PER_COMPLETED_TASK} XP × ${completedTasks?.length ?? 0} tasks completed`}>Tasks +{(completedTasks?.length ?? 0) * XP_PER_COMPLETED_TASK}</span>
                {hist.length > 1 && <span className="pt-xp-tag" title={`${XP_PER_HISTORY_ENTRY} XP × ${hist.length - 1} re-analyses`}>Iterations +{(hist.length - 1) * XP_PER_HISTORY_ENTRY}</span>}
                <span className="pt-xp-total">= {totalXp} XP Total</span>
            </div>

            {/* ── Hero Stats Row ───────────────────────────────────────── */}
            <div className="pt-hero-row">
                {/* Overall Ring */}
                <div className="pt-ring-card">
                    <svg viewBox="0 0 120 120" className="pt-ring-svg">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="52" fill="none"
                            stroke="url(#ptGrad)" strokeWidth="10" strokeLinecap="round"
                            strokeDasharray={`${(overallPct / 100) * 327} 327`}
                            transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dasharray 1.5s ease' }}
                        />
                        <defs>
                            <linearGradient id="ptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--cyan)" />
                                <stop offset="100%" stopColor="var(--blue)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="pt-ring-text">
                        <span className="pt-ring-num">{overallPct}%</span>
                        <span className="pt-ring-label">Coverage</span>
                    </div>
                </div>

                {/* Quick stat chips - all dynamic */}
                <div className="pt-quick-stats">
                    <div className="pt-qstat">
                        <div className="pt-qstat__num">{totalVerified}<span>/{totalSkills}</span></div>
                        <div className="pt-qstat__label">Skills Verified</div>
                    </div>
                    <div className="pt-qstat">
                        <div className="pt-qstat__num">{score}<span>/100</span></div>
                        <div className="pt-qstat__label">Readiness Score</div>
                    </div>
                    <div className="pt-qstat">
                        <div className="pt-qstat__num">{analysis.role?.split(' ')[0]}</div>
                        <div className="pt-qstat__label">Best-Fit Role</div>
                    </div>
                    <div className="pt-qstat pt-qstat--cta" onClick={() => nextSkill && setSelectedSkill(nextSkill)} style={{ cursor: nextSkill ? 'pointer' : 'default' }}>
                        <Target size={18} color="var(--blue)" />
                        <div className="pt-qstat__label" style={{ marginTop: 4 }}>Next Target</div>
                        <div className="pt-qstat__next">{nextSkill ?? 'All caught up!'}</div>
                    </div>
                </div>
            </div>

            {/* ── Skill Radar - Dynamic Category Cards ─────────────────── */}
            <div className="pt-section-header">
                <BarChart2 size={18} />
                <div>
                    <div className="pt-section-title">Skill Radar</div>
                    <div className="pt-section-sub">
                        {catStats.length} categories from your {analysis.role} profile. Click a missing skill to learn it.
                    </div>
                </div>
            </div>

            <div className="pt-cat-grid">
                {catStats.map(cat => {
                    const Icon = cat.icon
                    const isOpen = expandedCat === cat.code
                    return (
                        <div key={cat.code} className={`pt-cat-card ${isOpen ? 'pt-cat-card--open' : ''}`}>
                            <button type="button" className="pt-cat-card__head" onClick={() => setExpandedCat(isOpen ? null : cat.code)}>
                                <div className="pt-cat-card__icon" style={{ color: cat.color, background: `${cat.color}15` }}>
                                    <Icon size={18} />
                                </div>
                                <div className="pt-cat-card__info">
                                    <div className="pt-cat-card__name">{cat.label}</div>
                                    <div className="pt-cat-card__count" style={{ color: cat.color }}>
                                        {cat.verifiedCount}/{cat.skills.length}
                                    </div>
                                </div>
                                <div className="pt-cat-card__ring-mini">
                                    <svg viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="14" fill="none"
                                            stroke={cat.color} strokeWidth="3" strokeLinecap="round"
                                            strokeDasharray={`${(cat.pct / 100) * 88} 88`}
                                            transform="rotate(-90 18 18)"
                                        />
                                    </svg>
                                    <span style={{ color: cat.color }}>{cat.pct}%</span>
                                </div>
                                <ChevronRight size={16} className={`pt-cat-card__chevron ${isOpen ? 'rotated' : ''}`} />
                            </button>

                            {isOpen && (
                                <div className="pt-cat-card__body fade-in">
                                    <div className="pt-cat-heatstrip">
                                        {cat.skills.map((s, i) => (
                                            <div
                                                key={i}
                                                className={`pt-heat-cell ${s.verified ? 'mastered' : 'missing'}`}
                                                style={{ '--cat-color': cat.color } as React.CSSProperties}
                                                title={s.name}
                                            />
                                        ))}
                                    </div>
                                    <div className="pt-cat-skills">
                                        {cat.skills.map(s => (
                                            <button type="button"
                                                key={s.name}
                                                className={`pt-skill-chip ${s.verified ? 'pt-skill-chip--done' : 'pt-skill-chip--missing'}`}
                                                style={{ '--cat-color': cat.color } as React.CSSProperties}
                                                onClick={() => !s.verified && setSelectedSkill(s.name)}
                                                title={s.verified ? `${s.name} - Verified ✓` : `Click to learn ${s.name}`}
                                            >
                                                {s.verified && <CheckCircle size={12} />}
                                                {s.name}
                                                {!s.verified && <BookOpen size={11} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* ── Milestones Timeline ─────────────────────────────────── */}
            <div className="pt-section-header" style={{ marginTop: 32 }}>
                <Trophy size={18} />
                <div>
                    <div className="pt-section-title">Career Milestones</div>
                    <div className="pt-section-sub">{milestones.filter(m => m.done).length} of {milestones.length} unlocked</div>
                </div>
            </div>

            <div className="pt-milestone-track">
                <div className="pt-milestone-rail">
                    <div className="pt-milestone-rail__fill" style={{ width: `${milestonePct * 100}%` }} />
                </div>
                <div className="pt-milestone-nodes">
                    {milestones.map((m, i) => {
                        const Icon = m.icon
                        const isNext = !m.done && (i === 0 || milestones[i - 1].done)
                        return (
                            <div key={i} className={`pt-milestone-node ${m.done ? 'done' : ''} ${isNext ? 'next' : ''}`}>
                                <div className="pt-milestone-dot">
                                    <Icon size={16} />
                                </div>
                                <div className="pt-milestone-label">{m.label}</div>
                                <div className="pt-milestone-sub">
                                    {m.done ? <><CheckCircle size={10} /> Done</> : m.sub}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Verified Skills Strip ───────────────────────────────── */}
            {roleSkills.all.filter(s => isVerified(s)).length > 0 && (
                <div className="pt-verified-strip">
                    <div className="pt-verified-strip__head">
                        <Zap size={12} color="var(--cyan)" />
                        <span>Verified mastery from resume & study ({roleSkills.all.filter(s => isVerified(s)).length} skills)</span>
                    </div>
                    <div className="pt-verified-strip__tags">
                        {roleSkills.all.filter(s => isVerified(s)).slice(0, 12).map(s => (
                            <span key={s} className="pt-verified-tag">{s}</span>
                        ))}
                        {roleSkills.all.filter(s => isVerified(s)).length > 12 && (
                            <span className="pt-verified-tag pt-verified-tag--more">
                                +{roleSkills.all.filter(s => isVerified(s)).length - 12}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Study Hub modal ─────────────────────────────────────── */}
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
