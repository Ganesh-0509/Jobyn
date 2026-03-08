import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume, getReadinessClass } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from '../components/StateDisplay'
import { uploadResume, predictResume } from '../api/client'
import CircularProgress from '../components/CircularProgress'
import { Cpu, Cloud, Zap, ArrowRight, TrendingUp, AlertCircle, Shield } from 'lucide-react'
import { usePrivacy } from '../context/PrivacyContext'
import { predictOnDevice, isOnDeviceReady } from '../utils/onDevicePredictor'

const CLASSES = [
    { label: 'Beginner', range: '0–40%', min: 0, max: 40 },
    { label: 'Developing', range: '41–60%', min: 41, max: 60 },
    { label: 'Placement Ready', range: '61–80%', min: 61, max: 80 },
    { label: 'Interview Ready', range: '81–100%', min: 81, max: 100 },
]

export default function ReadinessScore() {
    const { analysis, prediction, bestFit, setAnalysis, setPrediction, currentFile } = useResume()
    const { privacy } = usePrivacy()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [switching, setSwitching] = useState(false)
    const [switchError, setSwitchError] = useState<string | null>(null)

    if (!analysis) {
        return (
            <div className="page-content">
                <EmptyState
                    icon="📊"
                    title="No Analysis Available"
                    subtitle="Upload and analyze your resume to see your readiness score breakdown."
                    action={{ label: 'Upload Resume', onClick: () => navigate('/resume-analyzer') }}
                />
            </div>
        )
    }

    const score = analysis?.final_score ?? 0
    const current = getReadinessClass(score)


    const corePct = analysis?.core_coverage_percent ?? 0
    const projectPct = analysis?.project_score_percent ?? 0
    const atsPct = analysis?.ats_score_percent ?? 0
    const structPct = analysis?.structure_score_percent ?? 0
    const optPct = analysis?.optional_coverage_percent ?? 0

    const BREAKDOWN = [
        { label: 'Core Skill Coverage', pct: corePct, weight: 35, cls: 'blue' },
        { label: 'Projects & Experience', pct: projectPct, weight: 25, cls: 'cyan' },
        { label: 'ATS Compatibility', pct: atsPct, weight: 20, cls: 'green' },
        { label: 'Resume Structure', pct: structPct, weight: 10, cls: 'purple' },
        { label: 'Optional Skills', pct: optPct, weight: 10, cls: 'orange' },
    ]

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Readiness Score</div>
                <div className="page-subtitle">Detailed scoring breakdown • All values from your resume analysis</div>
            </div>

            <div className="grid-2 mb-16">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: 16 }}>
                    <CircularProgress pct={score} size={160} stroke={14} color="var(--blue)" label="Overall" />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{current}</div>
                        {analysis?.role && <div className="text-muted">for {analysis.role}</div>}
                    </div>

                    {prediction && (
                        <>
                            <div style={{
                                marginTop: 4, display: 'flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px', borderRadius: 20,
                                background: prediction.model_version.includes('onnx') ? 'rgba(var(--green-rgb),0.1)' : 'rgba(var(--blue-rgb),0.1)',
                                border: `1px solid ${prediction.model_version.includes('onnx') ? 'rgba(var(--green-rgb),0.2)' : 'rgba(var(--blue-rgb),0.2)'}`,
                                fontSize: 11, color: prediction.model_version.includes('onnx') ? 'var(--green)' : 'var(--blue)',
                                fontWeight: 600
                            }}>
                                {prediction.model_version.includes('onnx') ? <Shield size={12} /> : <Cloud size={12} />}
                                {prediction.model_version.includes('onnx') ? 'Verified AI Engine' : 'Cloud Intelligence'}
                                {prediction.inference_time_ms != null && prediction.inference_time_ms > 0 && (
                                    <span style={{ opacity: 0.6, fontWeight: 400 }}>• Latency {prediction.inference_time_ms.toFixed(1)}ms</span>
                                )}
                            </div>

                            <div style={{
                                marginTop: 18, padding: '16px 20px', borderRadius: 12,
                                background: score < 50
                                    ? 'linear-gradient(135deg, rgba(var(--orange-rgb),0.12) 0%, rgba(var(--red-rgb),0.12) 100%)'
                                    : 'linear-gradient(135deg, rgba(var(--blue-rgb),0.08) 0%, rgba(var(--green-rgb),0.08) 100%)',
                                border: score < 50
                                    ? '1px solid rgba(var(--orange-rgb),0.3)'
                                    : '1px solid rgba(var(--blue-rgb),0.15)',
                                textAlign: 'left',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{
                                        background: score < 50 ? 'var(--orange)' : 'var(--blue)',
                                        color: 'white', padding: 4, borderRadius: 6
                                    }}>
                                        {score < 50 ? <AlertCircle size={14} /> : <TrendingUp size={14} />}
                                    </div>
                                    <div style={{
                                        fontSize: 11, textTransform: 'uppercase',
                                        color: score < 50 ? 'var(--orange)' : 'var(--blue)',
                                        fontWeight: 800, letterSpacing: 0.5
                                    }}>
                                        {score < 50 ? 'Skill Gap Alert' : 'Path Intelligence'}
                                    </div>
                                </div>

                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {score < 50
                                        ? `Developing for ${analysis?.role}`
                                        : (prediction.predicted_role === analysis?.role && score > 70
                                            ? `High Match for ${prediction.predicted_role}`
                                            : `Potential Path: ${bestFit?.predicted_role || prediction.predicted_role}`)
                                    }
                                </div>

                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                    {score < 50
                                        ? `Your readiness for ${analysis?.role} is currently introductory (${score}%). We recommend focusing on the missing core skills in your Improvement Plan.`
                                        : (bestFit?.reasoning || prediction.explanation || `Your profile shows strong semantic alignment with the ${prediction.predicted_role} career path.`)
                                    }
                                </div>

                                {bestFit && bestFit.predicted_role !== analysis?.role && (
                                    <>
                                    <button
                                        className="btn btn--primary btn--sm"
                                        onClick={async () => {
                                            if (!currentFile || !bestFit.predicted_role) return
                                            setSwitching(true)
                                            setSwitchError(null)
                                            try {
                                                const result = await uploadResume(currentFile, bestFit.predicted_role, privacy, user?.email)
                                                setAnalysis(result)
                                            } catch (err: unknown) {
                                                setSwitchError(err instanceof Error ? err.message : 'Failed to switch role. Please try again.')
                                            } finally {
                                                setSwitching(false)
                                            }
                                        }}
                                        disabled={switching || !currentFile}
                                        style={{
                                            marginTop: 12, width: '100%', justifyContent: 'center', gap: 8, fontSize: 12,
                                            background: score < 50 ? 'var(--orange)' : 'var(--blue)',
                                            opacity: !currentFile ? 0.6 : 1
                                        }}
                                    >
                                        {switching ? <div className="spinner spinner--sm" /> : <><Zap size={14} /> {score < 50 ? 'Switch to Highest Match Role' : 'Apply Suggested Path'}</>}
                                    </button>
                                    {switchError && (
                                        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(var(--red-rgb),0.1)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                                            {switchError}
                                        </div>
                                    )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="card">
                    <div className="card-title mb-16">Weighted Breakdown</div>
                    {BREAKDOWN.map(b => (
                        <div className="progress-row" key={b.label}>
                            <div className="progress-label">
                                <span>{b.label}</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    {Math.round(b.pct)}%
                                    <span style={{ fontSize: 10, marginLeft: 4 }}>(×{b.weight}%)</span>
                                </span>
                            </div>
                            <div className="progress-track">
                                <div className={`progress-fill progress-fill--${b.cls}`} style={{ width: `${Math.min(100, Math.round(b.pct))}%` }} />
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        Final Score = ({corePct}×0.35) + ({projectPct}×0.25) + ({atsPct}×0.20) + ({structPct}×0.10) + ({optPct}×0.10) = <strong style={{ color: 'var(--blue)' }}>{score}</strong>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-title mb-16">Readiness Classification</div>
                <div className="readiness-classes">
                    {CLASSES.map((c, i) => (
                        <div key={i} className={`readiness-class${c.label === current ? ' current' : ''}`}>
                            <div className="readiness-class__label">{c.label}</div>
                            <div className="readiness-class__range">{c.range}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
