import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { TrendingUp } from 'lucide-react'

export default function ResumeComparison() {
    const navigate = useNavigate()
    const { analysis, previousAnalysis } = useResume()

    const curr = analysis
    const prev = previousAnalysis

    const currScore = curr?.final_score ?? 0
    const prevScore = prev?.final_score ?? 0
    const currSkills = curr?.detected_skills ?? []
    const prevSkills = prev?.detected_skills ?? []

    const prevSet = new Set(prevSkills.map(s => s.toLowerCase()))
    const currSet = new Set(currSkills.map(s => s.toLowerCase()))

    const shared = currSkills.filter(s => prevSet.has(s.toLowerCase()))
    const added = currSkills.filter(s => !prevSet.has(s.toLowerCase()))
    const removed = prevSkills.filter(s => !currSet.has(s.toLowerCase()))

    const diff = currScore - prevScore

    if (!curr || !prev) {
        return (
            <div className="page-content">
                <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>🆚</div>
                    <h1 className="page-title">Version Comparison Locked</h1>
                    <p className="page-subtitle">To see side-by-side improvements, you need to upload at least two versions of your resume.</p>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/resume-analyzer')} style={{ marginTop: 24 }}>
                        Upload Second Version
                    </button>
                    <div className="card" style={{ marginTop: 40, padding: '24px 32px', textAlign: 'left', background: 'rgba(var(--blue-rgb),0.03)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>WHY USE COMPARISON?</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--green)' }}>✓ Score Delta</strong><br />
                                Directly see how much your latest changes improved your readiness.
                            </div>
                            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--blue)' }}>✓ Skill Evolution</strong><br />
                                Track which skills the AI detected in your new version vs the old one.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Resume Comparison</div>
                <div className="page-subtitle">Compare your resume versions side by side</div>
            </div>

            <div className="grid-2 mb-16">
                {/* Previous */}
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <div className="card-title">First Upload</div>
                        <span className="compare-score">{prevScore}%</span>
                    </div>
                    {[...shared, ...removed].slice(0, 8).map(s => (
                        <div
                            key={s}
                            className={`compare-skill-item ${removed.includes(s) ? 'compare-skill-item--removed' : 'compare-skill-item--neutral'}`}
                        >
                            {removed.includes(s) ? '− ' : '• '}{s}
                        </div>
                    ))}
                </div>

                {/* Current */}
                <div className="card">
                    <div className="flex items-center justify-between mb-16">
                        <div className="card-title">Latest Upload</div>
                        <span className="compare-score">{currScore}%</span>
                    </div>
                    {shared.slice(0, 5).map(s => (
                        <div key={s} className="compare-skill-item compare-skill-item--neutral">• {s}</div>
                    ))}
                    {added.slice(0, 4).map(s => (
                        <div key={s} className="compare-skill-item compare-skill-item--added">+ {s}</div>
                    ))}
                </div>
            </div>

            {/* Score difference */}
            <div className="card">
                <div className="card-title mb-12">Score Difference</div>
                <div className="flex items-center gap-12">
                    <TrendingUp size={20} color={diff >= 0 ? 'var(--green)' : 'var(--red)'} style={diff < 0 ? { transform: 'scaleY(-1)' } : undefined} />
                    <div>
                        <div className={`diff-positive`} style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {diff >= 0 ? `+${diff}%` : `${diff}%`} change from first upload
                        </div>
                        <div className="diff-info">
                            + {added.length} skills added &nbsp;&nbsp; − {removed.length} skills removed
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
