import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { BarChart2 } from 'lucide-react'
import SkillGraphViz from '../components/SkillGraphViz'
import ProjectGeneratorModal from '../components/ProjectGeneratorModal'
import { ErrorState } from '../components/StateDisplay'
import { BASE } from '../api/client'

export default function SkillGap() {
    const navigate = useNavigate()
    const { analysis, masteredSkills } = useResume()
    const [deps, setDeps] = useState<Record<string, string[]>>({})
    const [depsError, setDepsError] = useState(false)
    const [showGraph, setShowGraph] = useState(true)
    const [activeProject, setActiveProject] = useState<{ role: string, skills: string[] } | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        fetch(`${BASE}/interview/dependencies`, { signal: controller.signal })
            .then(r => r.json())
            .then(d => setDeps(d))
            .catch((err) => {
                if (err.name !== 'AbortError') setDepsError(true)
            })
        return () => controller.abort()
    }, [])

    const coreMissing = (analysis?.missing_core_skills ?? []).filter((s: string) => !masteredSkills.includes(s))
    const optMissing = (analysis?.missing_optional_skills ?? []).filter((s: string) => !masteredSkills.includes(s))

    const gaps = analysis
        ? [
            ...coreMissing.map((s: string) => ({
                skill: s,
                priority: 'Critical' as const,
                action: 'Start Learning',
            })),
            ...optMissing.map((s: string, i: number) => ({
                skill: s,
                priority: i < 2 ? 'High' as const : 'Medium' as const,
                action: 'Explore',
            })),
        ]
        : []

    const getPrereqs = (skillName: string): string[] =>
        deps[skillName.toLowerCase()] ?? []

    const detected = [...(analysis?.detected_skills ?? []), ...masteredSkills]
    const coreGaps = coreMissing
    const optGaps = optMissing

    const handleAction = (skill: string) => {
        navigate('/improvement-plan', { state: { highlightSkill: skill } })
    }

    const role = analysis?.role ?? ''

    if (!analysis) {
        return (
            <div className="page-content">
                <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>🧠</div>
                    <h1 className="page-title">Skill Gap Analysis Locked</h1>
                    <p className="page-subtitle">Upload your resume first to identify skill gaps.</p>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        Analyze Your Resume Now
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            {/* ── Page Header ── */}
            <div className="page-header">
                <div className="page-title">Adaptive Gap Analysis</div>
                <div className="page-subtitle">
                    Prioritizing <span style={{ color: 'var(--red)', fontWeight: 700 }}>Critical</span> gaps for your {role} career path
                </div>
            </div>

            {/* ── Dependencies Error ── */}
            {depsError && (
                <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--red)' }}>
                    ⚠️ Failed to load skill dependencies. Prerequisite data may be unavailable.
                </div>
            )}

            {/* ── Skill Dependency Graph ── */}
            <div className="card mb-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div className="card-title" style={{ marginBottom: 2 }}>🕸 Skill Dependency Graph</div>
                        <div className="card-subtitle">Your skills (green) vs gaps (red/orange)</div>
                    </div>
                    <button type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setShowGraph(v => !v)}
                    >
                        {showGraph ? 'Hide Graph' : 'Show Graph'}
                    </button>
                </div>
                {showGraph && (
                    <SkillGraphViz
                        detected={detected}
                        missingCore={coreGaps}
                        missingOptional={optGaps}
                        dependencies={deps}
                        onNodeClick={(skill) => setActiveProject({ role, skills: [skill] })}
                    />
                )}
            </div>

            {/* ── Active Gaps ── */}
            <div className="card mb-16">
                <div className="card-title mb-16">Active Priority Gaps</div>
                {gaps.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🎉</div>
                        <div className="empty-state__text">No critical skill gaps detected. You are ready for placement!</div>
                    </div>
                ) : (
                    gaps.map((g, i) => {
                        const prereqs = getPrereqs(g.skill)
                        return (
                            <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 14 }}>
                                <div className="gap-row" style={{ marginBottom: prereqs.length ? 8 : 0 }}>
                                    <span className="gap-row__num">{i + 1}</span>
                                    <BarChart2 size={14} color="var(--blue)" style={{ flexShrink: 0 }} />
                                    <span className="gap-row__name">{g.skill}</span>
                                    <div className="gap-row__actions">
                                        <span className={`badge ${g.priority === 'Critical' ? 'badge--high' : g.priority === 'High' ? 'badge--medium' : 'badge--blue'}`}>{g.priority}</span>
                                        <button type="button" className="btn btn--primary btn--sm" onClick={() => handleAction(g.skill)}>{g.action} →</button>
                                    </div>
                                </div>
                                {prereqs.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 40, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prerequisites:</span>
                                        {prereqs.map(p => (
                                            <span key={p} style={{
                                                fontSize: 12, padding: '1px 6px', borderRadius: 4,
                                                background: 'var(--bg-glass)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-secondary)'
                                            }}>{p}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* ── Verified Skills ── */}
            {masteredSkills.length > 0 && (
                <div className="card">
                    <div className="card-title mb-16" style={{ color: 'var(--green)' }}>Verified & Mastered</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {masteredSkills.map(s => (
                            <div key={s} className="badge badge--low" style={{ padding: '6px 14px', borderRadius: 8, gap: 8 }}>
                                <BarChart2 size={12} /> {s}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Capstone Project Modal */}
            {activeProject && (
                <ProjectGeneratorModal
                    role={activeProject.role}
                    skills={activeProject.skills}
                    onClose={() => setActiveProject(null)}
                />
            )}
        </div>
    )
}
