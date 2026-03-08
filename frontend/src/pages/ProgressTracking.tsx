import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Star, Award, Zap, Trophy, TrendingUp } from 'lucide-react'
import StudyHub from '../components/StudyHub'

export default function ProgressTracking() {
    const navigate = useNavigate()
    const { analysis, masteredSkills, markSkillMastered } = useResume()
    const { user } = useAuth()
    const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
    const score = analysis?.final_score ?? 0
    const realHistory = loadHistory(user?.email)
    const hist = getHistoryOrDemo(realHistory)

    const allSkills = [
        ...(analysis?.detected_skills ?? []).map(s => s.toLowerCase()),
        ...masteredSkills.map(s => s.toLowerCase())
    ]

    // Skill Categories for the Heatmap rows
    const CATEGORIES = [
        { label: 'Languages', code: 'LANG', color: '#3b82f6', skills: ['python', 'java', 'javascript', 'typescript', 'c', 'cpp', 'go', 'rust', 'sql', 'bash'] },
        { label: 'Core CS', code: 'CORE', color: '#fbbf24', skills: ['dsa', 'database', 'os', 'networks', 'rest api', 'oops', 'system design', 'testing', 'security', 'git'] },
        { label: 'Frameworks', code: 'FRAME', color: '#22d3ee', skills: ['react', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'next', 'tailwind', 'angular'] },
        { label: 'Cloud & DevOps', code: 'TOOLS', color: '#a78bfa', skills: ['docker', 'kubernetes', 'aws', 'linux', 'azure', 'gcp', 'ci/cd', 'jenkins', 'terraform', 'graphql'] }
    ]

    const statsGrid = CATEGORIES.map(cat => {
        const rowSkills = cat.skills.map(skillName => {
            const isMastered = allSkills.includes(skillName.toLowerCase())
            return {
                name: skillName,
                isMastered
            }
        })
        return { ...cat, rowSkills }
    })

    const totalMasteredCount = CATEGORIES.reduce((acc, cat) => acc + cat.skills.filter(s => allSkills.includes(s.toLowerCase())).length, 0)

    const MILESTONES = [
        { icon: Star, label: 'Resume Insight', done: !!analysis, sub: analysis ? 'Initial profile analyzed' : 'Pending upload', scoreVal: 0 },
        { icon: Award, label: 'Growing Talent', done: score >= 50, sub: score >= 50 ? 'Reached 50% Threshold' : 'Target: 50% Score', scoreVal: 50 },
        { icon: Zap, label: 'Placement Ready', done: score >= 75, sub: score >= 75 ? 'Top 25% percentile' : 'Target: 75% Score', scoreVal: 75 },
        { icon: Trophy, label: 'Industry Elite', done: score >= 90, sub: score >= 90 ? 'Perfect Alignment' : 'Target: 90% Score', scoreVal: 90 },
    ]

    const nextSkill = (analysis?.missing_core_skills ?? []).find(s => !masteredSkills.includes(s.toLowerCase())) ?? null

    if (!analysis) {
        return (
            <div className="page-content">
                <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>📈</div>
                    <h1 className="page-title">Growth Tracking Locked</h1>
                    <p className="page-subtitle">We can't track your progress until we have your baseline resume analysis.</p>
                    <button className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        Analyze Your Resume Now
                    </button>
                    <div className="grid-3" style={{ marginTop: 40, gap: 16 }}>
                        <div className="card" style={{ padding: 16, textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>Skill Density Matrix</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Compare your skills against industry standards.</div>
                        </div>
                        <div className="card" style={{ padding: 16, textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>Career Milestones</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Visualize your path to "Interview Ready".</div>
                        </div>
                        <div className="card" style={{ padding: 16, textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>Growth Velocity</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Track your scoring trend over time.</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="page-header" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>Growth Analytics</div>
                        <div className="page-subtitle">Real-time mapping of your evolution into a professional engineer</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--blue)', lineHeight: 1 }}>{totalMasteredCount}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Skills Verified</div>
                </div>
            </div>

            <div className="grid-3 mb-24">
                {/* Score Focus */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.05), transparent)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 20 }}>🎯</div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Milestone</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{MILESTONES.find(m => !m.done)?.label || 'All Completed!'}</div>
                        </div>
                    </div>
                </div>

                {/* Growth Velocity */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.05), transparent)', border: '1px solid rgba(34,211,238,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 20 }}>⚡</div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase' }}>Velocity</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{hist.length >= 2 ? `+${hist[hist.length - 1].value - hist[0].value}% Growth Trend` : 'Awaiting data'}</div>
                        </div>
                    </div>
                </div>

                {/* Priority Focus */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.05), transparent)', border: '1px solid rgba(167,139,250,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 20 }}>🔥</div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase' }}>Next Target</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{nextSkill ?? 'All caught up!'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-auto mb-24" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
                {/* Advanced Heatmap */}
                <div className="card" style={{ padding: 24 }}>
                    <div className="flex items-center justify-between mb-32">
                        <div>
                            <div className="card-title" style={{ fontSize: 18 }}>Skill Density Matrix</div>
                            <div className="card-subtitle">Mapping coverage across industry-standard stacks</div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--bg-glass)', border: '1px solid var(--border)' }} />
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Missing</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--cyan)', boxShadow: '0 0 10px rgba(34,211,238,0.4)' }} />
                                <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 700 }}>Mastered</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {statsGrid.map((row, ri) => (
                            <div key={ri} className="heatmap-row-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: row.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{row.label}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Foundational proficiency</div>
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 700 }}>
                                        {row.rowSkills.filter(s => s.isMastered).length} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {row.rowSkills.length}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
                                    {row.rowSkills.map((s, si) => (
                                        <div
                                            key={si}
                                            title={`${row.label}: ${s.name}\nStatus: ${s.isMastered ? 'Mastered' : 'Missing'}`}
                                            style={{
                                                aspectRatio: '1/1', borderRadius: 4,
                                                background: s.isMastered ? `rgba(var(--cyan-rgb), 0.4)` : 'var(--bg-glass)',
                                                border: s.isMastered ? '1px solid rgba(var(--cyan-rgb),0.3)' : '1px solid var(--border)',
                                                boxShadow: s.isMastered ? 'inset 0 0 10px rgba(var(--cyan-rgb),0.1)' : 'none',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                cursor: 'help',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.15)'
                                                e.currentTarget.style.zIndex = '10'
                                                if (s.isMastered) e.currentTarget.style.background = 'var(--cyan)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)'
                                                e.currentTarget.style.zIndex = '1'
                                                e.currentTarget.style.background = s.isMastered ? `rgba(var(--cyan-rgb), 0.4)` : 'var(--bg-glass)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Zap size={12} className="text-cyan" />
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Verified Mastery detected from resume</div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {allSkills.slice(0, 8).map((s: string) => (
                                <div key={s} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 6, color: 'var(--cyan)', fontWeight: 600 }}>
                                    {s}
                                </div>
                            ))}
                            {allSkills.length > 8 && (
                                <div style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, color: 'var(--text-muted)' }}>
                                    +{allSkills.length - 8} more
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Career Milestones */}
                <div className="card" style={{ padding: 24 }}>
                    <div className="card-title mb-32">Professional Milestones</div>
                    <div style={{ position: 'relative', paddingLeft: 8 }}>
                        {/* Vertical Progress Line */}
                        <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
                        <div style={{
                            position: 'absolute',
                            left: 23,
                            top: 0,
                            height: `${Math.min(100, (score / 100) * 105)}%`,
                            width: 2,
                            background: 'linear-gradient(to bottom, var(--blue), var(--cyan))',
                            boxShadow: '0 0 10px var(--blue)'
                        }} />

                        {MILESTONES.map((m, i) => {
                            const Icon = m.icon
                            const isNext = !m.done && (i === 0 || MILESTONES[i - 1].done)

                            return (
                                <div key={i} style={{ marginBottom: 40, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: m.done ? 'var(--blue)' : isNext ? 'rgba(var(--blue-rgb),0.1)' : 'var(--bg-input)',
                                        border: m.done ? 'none' : isNext ? '2px solid var(--blue)' : '1px solid var(--border)',
                                        boxShadow: m.done ? '0 0 15px rgba(59,130,246,0.4)' : 'none',
                                        zIndex: 2,
                                        transition: 'all 0.3s'
                                    }}>
                                        <Icon size={14} color={m.done ? '#fff' : isNext ? 'var(--blue)' : 'rgba(255,255,255,0.2)'} />
                                    </div>
                                    <div style={{ marginLeft: 20 }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: m.done ? 'var(--text-primary)' : isNext ? 'var(--blue)' : 'var(--text-muted)' }}>{m.label}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.sub}</div>
                                        {m.done && <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>Completed ✓</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ marginTop: 24, padding: 20, background: 'rgba(59,130,246,0.04)', borderRadius: 16, border: '1px solid rgba(59,130,246,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ padding: 8, background: 'var(--blue)', borderRadius: 8 }}>
                                <Award size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Latest Achievement</div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>Profile Verified</div>
                            </div>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            Your profile has been analyzed and matched against our growing database of placement patterns for personalized recommendations.
                        </p>
                    </div>
                </div>
            </div>

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
