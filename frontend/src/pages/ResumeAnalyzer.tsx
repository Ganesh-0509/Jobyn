import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { uploadResume, predictResume, getRoles } from '../api/client'
import { Upload, FileText, CheckCircle, Cpu, Shield } from 'lucide-react'
import { usePrivacy } from '../context/PrivacyContext'
import { useToast } from '../context/ToastContext'
import { predictOnDevice, isOnDeviceReady } from '../utils/onDevicePredictor'

export default function ResumeAnalyzer() {
    const { setAnalysis, setPrediction, analysis, setCurrentFile } = useResume()
    const { privacy } = usePrivacy()
    const { user } = useAuth()
    const { toast } = useToast()
    const navigate = useNavigate()

    const [roles, setRoles] = useState<string[]>([])
    const [role, setRole] = useState('Backend Developer')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [drag, setDrag] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getRoles().then(r => { setRoles(r); if (r.length) setRole(r[0]) }).catch(() => { })
    }, [])

    const handleFile = (f: File) => {
        const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
        if (f.size > MAX_SIZE) { setError('File must be under 5 MB.'); toast('File must be under 5 MB.', 'warning'); return }
        const ok = f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        if (!ok) { setError('Only PDF and DOCX files are supported.'); toast('Only PDF and DOCX files are supported.', 'warning'); return }
        setFile(f); setCurrentFile(f); setError('')
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true); setError('')
        try {
            const result = await uploadResume(file, role, privacy, user?.email)
            setAnalysis(result)

            const useLocal = privacy || isOnDeviceReady()

            // Also hit ML predict (AI Score)
            try {
                if (useLocal && isOnDeviceReady()) {
                    // ON-DEVICE INFERENCE
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
                    // SERVER-SIDE INFERENCE
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
                    predicted_role: role,
                    confidence: 0,
                    resume_score: result.final_score,
                    weak_areas: result.missing_core_skills.slice(0, 3),
                    model_version: 'fallback-v1',
                    inference_time_ms: 0
                })
            }
            toast('Resume analyzed successfully!', 'success')
            navigate('/readiness-score')
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Upload failed. Make sure the backend is running on :8000'
            setError(msg)
            toast(msg, 'error')
        } finally { setLoading(false) }
    }

    const skills = analysis?.detected_skills ?? []
    const atsGood = (analysis?.ats_score_percent ?? 0) >= 70

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="page-title">Resume Analyzer</div>
                <div className="page-subtitle">Upload and analyze your resume with AI</div>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone${drag ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef} type="file" accept=".pdf,.docx"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    style={{ display: 'none' }}
                />
                <div className="upload-zone__icon"><Upload size={36} strokeWidth={1.5} /></div>
                <div className="upload-zone__title">
                    {file ? `📄 ${file.name}` : 'Drag & drop your resume'}
                </div>
                <div className="upload-zone__sub">Supports PDF, DOCX up to 5MB</div>
                <button className="btn btn--primary btn--sm" onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                    Browse Files
                </button>
            </div>

            {error && (
                <div style={{ color: 'var(--red)', background: 'rgba(var(--red-rgb),0.08)', border: '1px solid rgba(var(--red-rgb),0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Role selector + Upload button */}
            <div className="card mb-16">
                <div className="select-group">
                    <label className="select-label">Target Role</label>
                    <select className="select" value={role} onChange={e => setRole(e.target.value)}>
                        {roles.length
                            ? roles.map(r => <option key={r} value={r}>{r}</option>)
                            : ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer'].map(r => <option key={r} value={r}>{r}</option>)
                        }
                    </select>
                </div>
                <button
                    className="btn btn--primary"
                    disabled={!file || loading}
                    onClick={handleUpload}
                    style={{ opacity: !file ? 0.5 : 1 }}
                >
                    {loading ? '⏳ Analyzing...' : '🚀 Analyze Resume'}
                </button>
                {loading && <div className="spinner" />}
            </div>

            {/* Results (show if analysis exists) */}
            {analysis && (
                <div className="grid-2">
                    {/* Parsed Preview */}
                    <div className="card">
                        <div className="flex items-center gap-8 mb-16">
                            <FileText size={16} color="var(--blue)" />
                            <div className="card-title" style={{ marginBottom: 0 }}>Parsed Resume</div>
                        </div>
                        {[
                            { label: 'Filename', value: analysis.filename },
                            { label: 'Role', value: analysis.role },
                            { label: 'Sections', value: analysis.sections_detected?.join(', ') || 'Not detected' },
                            { label: 'Links', value: `${analysis.links?.length ?? 0} detected` },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Extracted Skills + ATS */}
                    <div className="card">
                        <div className="card-title mb-12">Extracted Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                            {(analysis.detected_skills ?? skills).map(s => (
                                <span key={s} className="tag tag--skill" style={{ textTransform: 'capitalize' }}>{s}</span>
                            ))}
                        </div>

                        <div className="card-title mb-8" style={{ marginTop: 16 }}>ATS Compatibility</div>
                        <div className={`ats-badge ${atsGood ? 'green' : 'orange'}`}>
                            <CheckCircle size={16} />
                            {atsGood ? 'ATS Compatible' : 'Needs Improvement'}
                            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>
                                Score: {analysis.ats_score_percent}/100
                            </span>
                        </div>

                        {analysis.db_warning && (
                            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--orange)' }}>
                                ⚡ {analysis.db_warning}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!analysis && (
                <div className="grid-2">
                    <div className="card"><div className="empty-state"><div className="empty-state__icon">📄</div><div className="empty-state__text">Upload a resume to see the parsed preview</div></div></div>
                    <div className="card"><div className="empty-state"><div className="empty-state__icon">🔍</div><div className="empty-state__text">Extracted skills and ATS score will appear here</div></div></div>
                </div>
            )}
        </div>
    )
}
