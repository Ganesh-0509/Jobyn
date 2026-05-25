import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Blocks, Trash2, Copy, Check, Download, ChevronDown, ChevronUp,
    PlayCircle, ShieldCheck, ShieldAlert, ShieldX, Bookmark, FolderOpen,
    Search, Filter, Github,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import { useAuth } from '../context/AuthContext'
import type { VerificationResult } from '../api/client'
import {
    getSavedProjects,
    updateProjectStatus,
    deleteProject,
    saveVerification,
    type SavedProject,
    type ProjectStatus,
} from '../utils/savedProjects'
import ProjectVerifier from '../components/ProjectVerifier'

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string; Icon: typeof Bookmark }> = {
    saved:          { label: 'Saved',        color: 'var(--blue)',   bg: 'rgba(59,130,246,0.1)',   Icon: Bookmark },
    'in-progress':  { label: 'In Progress',  color: 'var(--orange)', bg: 'rgba(245,158,11,0.1)',   Icon: PlayCircle },
    verified:       { label: 'Verified',     color: 'var(--green)',  bg: 'rgba(34,197,94,0.1)',    Icon: ShieldCheck },
    partial:        { label: 'Partial',      color: 'var(--orange)', bg: 'rgba(245,158,11,0.1)',   Icon: ShieldAlert },
    insufficient:   { label: 'Needs Work',   color: 'var(--red)',    bg: 'rgba(239,68,68,0.1)',    Icon: ShieldX },
}

export default function MyProjects() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [projects, setProjects] = useState<SavedProject[]>([])
    const [expanded, setExpanded] = useState<string | null>(null)
    const [verifyOpen, setVerifyOpen] = useState<string | null>(null)
    const [copied, setCopied] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all')
    const [search, setSearch] = useState('')

    const reload = () => setProjects(getSavedProjects(user?.email))
    useEffect(reload, [user?.email])

    const filtered = projects.filter(p => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false
        if (search) {
            const q = search.toLowerCase()
            return p.role.toLowerCase().includes(q) || p.skills.some(s => s.toLowerCase().includes(q))
        }
        return true
    })

    const counts = {
        all: projects.length,
        saved: projects.filter(p => p.status === 'saved').length,
        'in-progress': projects.filter(p => p.status === 'in-progress').length,
        verified: projects.filter(p => p.status === 'verified').length,
    }

    const handleStartProject = (id: string) => {
        updateProjectStatus(id, 'in-progress', user?.email)
        reload()
    }

    const handleVerified = (id: string, githubUrl: string, result: VerificationResult) => {
        saveVerification(id, githubUrl, result, user?.email)
        reload()
    }

    const handleDelete = (id: string) => {
        deleteProject(id, user?.email)
        if (expanded === id) setExpanded(null)
        if (verifyOpen === id) setVerifyOpen(null)
        reload()
    }

    const handleCopy = (id: string, markdown: string) => {
        navigator.clipboard.writeText(markdown).then(() => {
            setCopied(id)
            setTimeout(() => setCopied(null), 2000)
        })
    }

    const handleDownload = (p: SavedProject) => {
        const blob = new Blob([p.markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${p.role.replace(/\s+/g, '-').toLowerCase()}-capstone-project.md`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="page-content" style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--blue)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Blocks size={22} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>My Projects</h1>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                            Build projects, push to GitHub, then verify completion with AI
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
                {([
                    { key: 'all' as const, label: 'Total', color: 'var(--text-primary)', bg: 'var(--bg-card)' },
                    { key: 'saved' as const, label: 'Saved', color: 'var(--blue)', bg: 'rgba(59,130,246,0.08)' },
                    { key: 'in-progress' as const, label: 'In Progress', color: 'var(--orange)', bg: 'rgba(245,158,11,0.08)' },
                    { key: 'verified' as const, label: 'Verified', color: 'var(--green)', bg: 'rgba(34,197,94,0.08)' },
                ]).map(({ key, label, color, bg }) => (
                    <button type="button"
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        className="card"
                        style={{
                            padding: '16px', textAlign: 'center', cursor: 'pointer',
                            border: filterStatus === key ? `2px solid ${color}` : '2px solid transparent',
                            background: bg, transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ fontSize: 28, fontWeight: 800, color }}>{counts[key]}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                    </button>
                ))}
            </div>

            {/* How it works banner */}
            <div className="card" style={{
                padding: '16px 20px', marginBottom: 20,
                background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
            }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>How verification works:</strong>{' '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'var(--blue)', color: 'white', borderRadius: 10, width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</span>
                        Save a project
                    </span>
                    {' → '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'var(--orange)', color: 'white', borderRadius: 10, width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</span>
                        Build it & push to GitHub
                    </span>
                    {' → '}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'var(--green)', color: 'white', borderRadius: 10, width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>3</span>
                        Submit repo URL for AI verification
                    </span>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search by role or skill..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: '100%', padding: '10px 14px 10px 40px',
                        background: 'var(--bg-input)', border: '1px solid var(--border)',
                        borderRadius: 10, color: 'var(--text-primary)', fontSize: 14,
                    }}
                />
            </div>

            {/* Empty state */}
            {projects.length === 0 && (
                <div className="card" style={{
                    padding: '60px 24px', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
                }}>
                    <FolderOpen size={48} color="var(--text-muted)" strokeWidth={1.5} />
                    <div>
                        <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>No saved projects yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                            Generate a capstone project from the <strong>Skill Gap</strong> or <strong>Improvement Plan</strong> page,
                            then click "Save to My Projects" to track it here.
                        </p>
                    </div>
                    <button type="button" className="btn btn--primary" onClick={() => navigate('/skill-gap')}>
                        Go to Skill Gap Analysis
                    </button>
                </div>
            )}

            {/* Filtered empty */}
            {projects.length > 0 && filtered.length === 0 && (
                <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <Filter size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No projects match the current filter.</p>
                </div>
            )}

            {/* Project cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filtered.map(p => {
                    const meta = STATUS_META[p.status]
                    const isOpen = expanded === p.id
                    const isVerifyOpen = verifyOpen === p.id
                    const isCopied = copied === p.id
                    const hasVerification = !!p.verification
                    const verScore = p.verification?.overall_score

                    return (
                        <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Card header */}
                            <div
                                style={{
                                    padding: '20px 24px', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    gap: 16,
                                }}
                                onClick={() => setExpanded(isOpen ? null : p.id)}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600, padding: '3px 10px',
                                            borderRadius: 20, background: meta.bg, color: meta.color,
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                        }}>
                                            <meta.Icon size={12} /> {meta.label}
                                        </span>
                                        {hasVerification && (
                                            <span style={{
                                                fontSize: 12, fontWeight: 700, padding: '3px 10px',
                                                borderRadius: 20, background: 'var(--bg-input)',
                                                color: verScore! >= 75 ? 'var(--green)' : verScore! >= 50 ? 'var(--orange)' : 'var(--red)',
                                                border: '1px solid var(--border)',
                                            }}>
                                                Score: {verScore}/100
                                            </span>
                                        )}
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(p.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{p.role}</h3>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                                        {p.skills.map(s => (
                                            <span key={s} style={{
                                                fontSize: 12, padding: '2px 8px', borderRadius: 6,
                                                background: 'var(--bg-input)', color: 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                            }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isOpen && (
                                <>
                                    {/* Workflow bar - contextual actions based on status */}
                                    <div style={{
                                        padding: '12px 24px', background: 'var(--bg-glass)',
                                        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
                                    }}>
                                        {p.status === 'saved' && (
                                            <button type="button"
                                                className="btn btn--primary"
                                                onClick={() => handleStartProject(p.id)}
                                                style={{ fontSize: 13, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <PlayCircle size={15} /> Mark as Started
                                            </button>
                                        )}
                                        {p.status === 'in-progress' && !isVerifyOpen && (
                                            <button type="button"
                                                className="btn btn--primary"
                                                onClick={() => setVerifyOpen(p.id)}
                                                style={{ fontSize: 13, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                                            >
                                                <Github size={15} /> Submit for Verification
                                            </button>
                                        )}
                                        {(p.status === 'verified' || p.status === 'partial' || p.status === 'insufficient') && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {p.githubUrl && (
                                                    <a
                                                        href={p.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn--outline"
                                                        style={{ fontSize: 13, padding: '6px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
                                                    >
                                                        <Github size={14} /> View Repo
                                                    </a>
                                                )}
                                                <button type="button"
                                                    className="btn btn--outline"
                                                    onClick={() => setVerifyOpen(isVerifyOpen ? null : p.id)}
                                                    style={{ fontSize: 13, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                                                >
                                                    <ShieldCheck size={14} /> {isVerifyOpen ? 'Hide Report' : 'View Report'}
                                                </button>
                                            </div>
                                        )}
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {p.status === 'saved' && '→ Start building, then submit your GitHub repo for verification'}
                                            {p.status === 'in-progress' && '→ Done coding? Submit your GitHub repo link below'}
                                            {p.status === 'verified' && `✓ Verified on ${new Date(p.verifiedAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                            {p.status === 'partial' && '→ Good progress! Address the improvements and re-verify'}
                                            {p.status === 'insufficient' && '→ Keep building! Re-verify when you\'ve made more progress'}
                                        </div>
                                    </div>

                                    {/* Verification panel */}
                                    {isVerifyOpen && (
                                        <div style={{ borderBottom: '1px solid var(--border)' }}>
                                            <ProjectVerifier
                                                project={p}
                                                onVerified={(url, result) => handleVerified(p.id, url, result)}
                                            />
                                        </div>
                                    )}

                                    {/* Markdown body */}
                                    <div className="markdown-body" style={{
                                        padding: '24px', color: 'var(--text-primary)',
                                        lineHeight: 1.6, fontSize: 14, maxHeight: 500, overflowY: 'auto',
                                    }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {DOMPurify.sanitize(p.markdown)}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Action bar */}
                                    <div style={{
                                        padding: '12px 24px', borderTop: '1px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        flexWrap: 'wrap', gap: 8,
                                    }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button type="button"
                                                className="btn btn--outline"
                                                onClick={() => handleCopy(p.id, p.markdown)}
                                                style={{ fontSize: 13, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                                            >
                                                {isCopied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
                                                {isCopied ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button type="button"
                                                className="btn btn--outline"
                                                onClick={() => handleDownload(p)}
                                                style={{ fontSize: 13, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                                            >
                                                <Download size={14} /> Download
                                            </button>
                                        </div>
                                        <button type="button"
                                            className="btn btn--outline"
                                            onClick={() => handleDelete(p.id)}
                                            style={{
                                                fontSize: 13, padding: '6px 14px',
                                                color: 'var(--red)', borderColor: 'var(--red)',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Markdown styling (shared with generator modal) */}
            <style>{`
                .markdown-body h1 { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: var(--blue); }
                .markdown-body h2 { font-size: 18px; font-weight: 700; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
                .markdown-body ul, .markdown-body ol { margin-bottom: 12px; padding-left: 22px; }
                .markdown-body li { margin-bottom: 6px; }
                .markdown-body code { background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; border: 1px solid var(--border); }
                .markdown-body pre { background: var(--bg-input); padding: 14px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border); margin-bottom: 14px; }
                .markdown-body pre code { background: none; border: none; padding: 0; }
                .markdown-body p { margin-bottom: 12px; }
            `}</style>
        </div>
    )
}
