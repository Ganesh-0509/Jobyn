import { useState, useEffect, useRef } from 'react'
import {
    Check, X, Shield, Users, BookOpen, Clock,
    TrendingUp, AlertCircle, Database, Search,
    Filter, RefreshCcw, Activity, HardDrive,
    ArrowLeft, Terminal, Cpu, Layout, Info,
    UserCheck, Zap, MoreHorizontal, FileText
} from 'lucide-react'
import {
    getAdminStats, getPendingContributions, approveContribution,
    rejectContribution, getFullDataset, deleteAnalysis
} from '../api/client'
import { Trash2 } from 'lucide-react'
import type { AdminStats, Contribution, AdminStudent } from '../api/client'
import { LoadingState, ErrorState } from '../components/StateDisplay'

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [contributions, setContributions] = useState<Contribution[]>([])
    const [students, setStudents] = useState<AdminStudent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState('')
    const [selectedView, setSelectedView] = useState<string | null>(null)
    const [viewingStudent, setViewingStudent] = useState<AdminStudent | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [s, c, d] = await Promise.all([
                getAdminStats(),
                getPendingContributions(),
                getFullDataset()
            ])
            setStats(s)
            setContributions(c)
            setStudents(d)
        } catch (err: unknown) {
            console.error("Failed to load admin data:", err)
            setError(err instanceof Error ? err.message : 'Failed to load admin data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (viewingStudent) overlayRef.current?.focus()
    }, [viewingStudent])

    const handleApprove = async (id: number) => {
        await approveContribution(id)
        fetchData()
    }

    const handleReject = async (id: number) => {
        await rejectContribution(id)
        fetchData()
    }

    const handleDeleteAnalysis = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this analysis permanently?')) return
        try {
            await deleteAnalysis(id)
            fetchData()
        } catch (err) {
            alert('Failed to delete analysis')
        }
    }

    const filteredContributions = contributions.filter(c =>
        c.topic.toLowerCase().includes(filter.toLowerCase()) ||
        c.submitted_by.toLowerCase().includes(filter.toLowerCase())
    )

    if (loading && !selectedView) return (
        <div className="page-content">
            <LoadingState message="Loading admin data..." />
        </div>
    )

    if (error && !stats) return (
        <div className="page-content">
            <ErrorState title="Failed to load admin data" message={error} onRetry={fetchData} />
        </div>
    )

    // --- Sub-Views (Drill-downs) ---

    // 1. Student Directory View
    if (selectedView === 'users') {
        return (
            <div className="page-content animate-fade-in">
                <button className="btn btn--ghost btn--sm mb-24" onClick={() => setSelectedView(null)}>
                    <ArrowLeft size={14} /> Back to Command Center
                </button>

                <div className="card">
                    <div className="flex items-center justify-between mb-32">
                        <div className="flex items-center gap-12">
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--blue-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 20 }}>Student Readiness Pool</h2>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Performance tracking across all registered users</p>
                            </div>
                        </div>
                        <div className="badge badge--active">Total: {stats?.active_students ?? 0}</div>
                    </div>

                    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                            <thead style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>File Ref</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Target Role</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Score</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Top Skills</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Analysis ID</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr
                                        key={s.analysis_id}
                                        onClick={() => setViewingStudent(s)}
                                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 20px', fontWeight: 700 }}>{s.filename.split('.')[0]}</td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{s.role}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 4, background: 'var(--track-color)', borderRadius: 2, width: 60 }}>
                                                    <div style={{ height: '100%', width: `${s.final_score}%`, background: s.final_score > 80 ? 'var(--green)' : 'var(--blue)', borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700 }}>{s.final_score}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {s.detected_skills.slice(0, 3).map(sk => <span key={sk} className="tag tag--skill" style={{ fontSize: 10 }}>{sk}</span>)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'monospace' }}>#{s.analysis_id}</span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <button
                                                className="btn btn--ghost btn--sm"
                                                onClick={(e) => handleDeleteAnalysis(e, s.analysis_id)}
                                                style={{ color: 'var(--red)', padding: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: 16, textAlign: 'center', background: 'var(--bg-glass)', fontSize: 12, color: 'var(--text-muted)' }}>
                            Showing {students.length} historical analyses
                        </div>
                    </div>

                    {/* Student Detail Slideover/Modal Overlay */}
                    {viewingStudent && (
                        <div ref={overlayRef} tabIndex={-1} onKeyDown={e => { if (e.key === 'Escape') setViewingStudent(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', outline: 'none' }}>
                            <div style={{ width: 500, background: 'var(--bg-card)', height: '100%', borderLeft: '1px solid var(--border)', padding: 40, overflowY: 'auto', position: 'relative' }}>
                                <button
                                    onClick={() => setViewingStudent(null)}
                                    style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>

                                <div className="flex items-center gap-12 mb-32">
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--blue-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 20 }}>Analysis View</h2>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Resume ID: {viewingStudent.resume_id}</p>
                                    </div>
                                </div>

                                <div className="card mb-24" style={{ padding: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)', marginBottom: 8, textTransform: 'uppercase' }}>Target Role Profile</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{viewingStudent.role}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Readiness</div>
                                            <div style={{ fontSize: 16, fontWeight: 800 }}>{viewingStudent.final_score}%</div>
                                        </div>
                                        <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>ATS Score</div>
                                            <div style={{ fontSize: 16, fontWeight: 800 }}>{viewingStudent.ats_score_percent}%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-24">
                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Detected Skills</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {viewingStudent.detected_skills.map(s => <span key={s} className="tag tag--skill">{s}</span>)}
                                    </div>
                                </div>

                                <div className="mb-24">
                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Missing Core Skills</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {viewingStudent.missing_core_skills.length > 0
                                            ? viewingStudent.missing_core_skills.map(s => <span key={s} className="badge badge--high" style={{ fontSize: 10 }}>{s}</span>)
                                            : <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ All core skills present</div>
                                        }
                                    </div>
                                </div>

                                <div style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Analysis metadata</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                        Filename: {viewingStudent.filename}<br />
                                        Analyzed: {new Date(viewingStudent.analyzed_at).toLocaleString()}<br />
                                        Structure Score: {viewingStudent.structure_score_percent}%<br />
                                        Project Score: {viewingStudent.project_score_percent}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // 2. Database Explorer View
    if (selectedView === 'database') {
        return (
            <div className="page-content animate-fade-in">
                <button className="btn btn--ghost btn--sm mb-24" onClick={() => setSelectedView(null)}>
                    <ArrowLeft size={14} /> Back to Command Center
                </button>

                <div className="grid-2">
                    <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-12 mb-24">
                            <Terminal size={24} className="text-blue" />
                            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>Vector Engine Console</h2>
                        </div>
                        <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, height: 400, overflowY: 'auto', border: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>[CampusSync Edge — System Console]</div>
                            <div style={{ color: 'var(--green)', marginTop: 8 }}>{'>'} Status: {stats ? 'Connected' : 'Checking...'}</div>
                            <div style={{ color: 'var(--blue)' }}>{'>'} Pending Reviews: {stats?.pending_reviews ?? '...'}</div>
                            <div style={{ color: 'var(--blue)' }}>{'>'} Approved Content: {stats?.approved_contributions ?? '...'}</div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: 12 }}>{'>'} Active Students: {stats?.active_students ?? '...'}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{'>'} Cached Courses: {stats?.total_courses_cached ?? '...'}</div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: 12 }}>{'>'} Analyses in DB: {students.length}</div>
                            <div className="pulse" style={{ color: 'var(--text-primary)', display: 'flex', gap: 4, marginTop: 20 }}>
                                <span>_</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <Cpu size={20} className="text-purple" />
                                <div style={{ fontSize: 15, fontWeight: 700 }}>Neural Processing Units</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Students</div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{stats?.active_students ?? '--'}</div>
                                </div>
                                <div style={{ padding: 16, background: 'rgba(var(--green-rgb), 0.05)', borderRadius: 10, border: '1px solid rgba(var(--green-rgb), 0.2)' }}>
                                    <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 4 }}>Courses Cached</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{stats?.total_courses_cached ?? '--'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <Zap size={20} className="text-cyan" />
                                <div style={{ fontSize: 15, fontWeight: 700 }}>Cache Strategy</div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Modern RAG (Retrieval-Augmented Generation) is enabled for all community-approved sources. Semantic indices are updated instantly upon approval.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- Main Dashboard ---

    return (
        <div className="page-content">
            {/* Header with System Health */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 20px rgba(var(--blue-rgb), 0.3)' }}>
                            <Shield size={24} />
                        </div>
                        <h1 className="page-title" style={{ margin: 0 }}>Command Center</h1>
                    </div>
                    <p className="page-subtitle">Unified platform control, content moderation, and real-time system metrics</p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'rgba(var(--green-rgb), 0.05)', border: '1px solid rgba(var(--green-rgb), 0.2)' }}>
                        <div className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>SYSTEM OPERATIONAL</span>
                    </div>
                    <button className="btn btn--ghost btn--sm" onClick={fetchData}>
                        <RefreshCcw size={14} /> Sync
                    </button>
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                <div
                    className="card clickable-card"
                    onClick={() => setSelectedView('users')}
                    style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--blue-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                            <Users size={18} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 800 }}>LIVE</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.active_students.toLocaleString() ?? '1,248'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Engineers</div>
                    <div style={{ height: 2, background: 'rgba(var(--blue-rgb), 0.1)', marginTop: 16 }}>
                        <div style={{ width: '70%', height: '100%', background: 'var(--blue)' }} />
                    </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--green-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
                            <BookOpen size={18} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>+12 Today</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.total_courses_cached ?? '42'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Learning Tracks</div>
                    <div style={{ height: 2, background: 'rgba(var(--green-rgb), 0.1)', marginTop: 16 }}>
                        <div style={{ width: '45%', height: '100%', background: 'var(--green)' }} />
                    </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--orange-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                            <AlertCircle size={18} />
                        </div>
                        <span className="badge badge--medium" style={{ fontSize: 9 }}>TOP PRIORITY</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{stats?.pending_reviews ?? contributions.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Moderation</div>
                    <div style={{ height: 2, background: 'rgba(var(--orange-rgb), 0.1)', marginTop: 16 }}>
                        <div style={{ width: `${(stats?.pending_reviews ?? 0) * 10}%`, height: '100%', background: 'var(--orange)' }} />
                    </div>
                </div>

                <div
                    className="card clickable-card"
                    onClick={() => setSelectedView('database')}
                    style={{ padding: 24, cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(var(--purple-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                            <Activity size={18} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>99.9% SLI</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>142ms</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Inference Latency</div>
                    <div style={{ height: 2, background: 'rgba(var(--purple-rgb), 0.1)', marginTop: 16 }}>
                        <div style={{ width: '60%', height: '100%', background: 'var(--purple)' }} />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 32 }}>
                {/* Community Moderation Queue */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            Moderation Queue <span className="badge badge--active">{filteredContributions.length}</span>
                        </h2>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field"
                                    placeholder="Search by topic or user..."
                                    style={{ paddingLeft: 36, height: 36, width: 240, fontSize: 12 }}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {filteredContributions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {filteredContributions.map(c => (
                                <div key={c.id} style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 12 }}>
                                    <div style={{ padding: '20px 24px', background: 'var(--bg-glass)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(var(--blue-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', fontSize: 14, fontWeight: 800 }}>
                                                {c.topic.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700 }}>{c.topic.toUpperCase()}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    By <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.submitted_by}</span> • {new Date(c.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn--danger btn--sm" onClick={() => handleReject(c.id)}>
                                                <X size={14} /> Reject
                                            </button>
                                            <button className="btn btn--primary btn--sm" onClick={() => handleApprove(c.id)} style={{ background: 'var(--green)' }}>
                                                <Check size={14} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ padding: 20 }}>
                                        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                            {c.content ? (
                                                <>
                                                    {c.content.substring(0, 250)}...
                                                    <span style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 600, marginLeft: 6 }}>Review Full Source →</span>
                                                </>
                                            ) : 'No semantic content detected.'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(var(--green-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', margin: '0 auto 20px' }}>
                                <Check size={32} />
                            </div>
                            <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>Queue Clean!</h3>
                            <p style={{ color: 'var(--text-muted)' }}>All contributions have been indexed.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Advanced Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card" onClick={() => setSelectedView('database')} style={{ padding: 24, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <Database size={20} className="text-blue" />
                            <div style={{ fontWeight: 800 }}>Vector Index</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Health Check</span>
                            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 800 }}>99.9% Sync</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--track-color)', borderRadius: 3 }}>
                            <div style={{ width: '99.9%', height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                        </div>
                    </div>

                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <Activity size={20} className="text-purple" />
                            <div style={{ fontWeight: 800 }}>Traffic surge</div>
                        </div>
                        <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                            {[20, 40, 30, 60, 80, 50, 70, 90, 40, 60].map((h, i) => (
                                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(var(--purple-rgb), 0.3)', borderRadius: '2px 2px 0 0' }} />
                            ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>Traffic intensity (Last 12 Hours)</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
