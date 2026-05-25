import { useState, useEffect, useMemo } from 'react'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { getHealth } from '../api/client'
import { getItem, setItem } from '../utils/storage'
import { loadHistory } from '../utils/history'
import {
    Settings as SettingsIcon, Save, CheckCircle, Trash2,
    Monitor, Shield, Cloud, Activity, Info, Bell,
    User, Download, HardDrive, Keyboard,
    Sliders, Database, Zap, FileText, Target,
} from 'lucide-react'

export default function Settings() {
    const { analysis, masteredSkills, completedTasks, dailyCommitment, setDailyCommitment, clear } = useResume()
    const { user } = useAuth()
    const [saved, setSaved] = useState(false)
    const [health, setHealth] = useState<{ status: string; model_version?: string; accuracy?: number; vocabulary_size?: number } | null>(null)
    const [healthLoading, setHealthLoading] = useState(true)

    const [notifications, setNotifications] = useState(() => getItem<string>('notifs') !== 'false')
    const [privacyMode, setPrivacyMode] = useState(() => getItem<string>('privacy') === 'true')

    useEffect(() => {
        getHealth().then(h => setHealth(h)).catch(() => {}).finally(() => setHealthLoading(false))
    }, [])

    const handleSave = () => {
        setItem('notifs', String(notifications))
        setItem('privacy', String(privacyMode))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    /* ── Profile stats ─────────────────────────────── */
    const hist = loadHistory(user?.email)
    const profileStats = useMemo(() => ({
        analysisCount: hist.length,
        firstDate: hist.length > 0 ? hist[0].label : null,
    }), [hist])

    /* ── Storage gauge ─────────────────────────────── */
    const storageStats = useMemo(() => {
        let totalBytes = 0
        const breakdown: { key: string; label: string; bytes: number }[] = []
        const checks = [
            { key: 'analysis', label: 'Resume Analysis', pattern: 'cse_analysis' },
            { key: 'history', label: 'Score History', pattern: 'cse_score_history' },
            { key: 'mastered', label: 'Mastered Skills', pattern: 'cse_mastered_skills' },
            { key: 'tasks', label: 'Completed Tasks', pattern: 'cse_completed_tasks' },
            { key: 'interview', label: 'Interview Log', pattern: 'cse_interview_log' },
            { key: 'cache', label: 'Study Cache', pattern: 'study_' },
        ]
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (!k) continue
            const val = localStorage.getItem(k) || ''
            const bytes = new Blob([val]).size
            totalBytes += bytes
            for (const check of checks) {
                if (k.includes(check.pattern)) {
                    const existing = breakdown.find(b => b.key === check.key)
                    if (existing) existing.bytes += bytes
                    else breakdown.push({ key: check.key, label: check.label, bytes })
                }
            }
        }
        return { totalBytes, breakdown: breakdown.sort((a, b) => b.bytes - a.bytes) }
    }, [])

    const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

    /* ── Export data ─────────────────────────────────── */
    const exportData = () => {
        const data: Record<string, unknown> = {}
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.includes('cse_')) {
                try { data[k] = JSON.parse(localStorage.getItem(k) || 'null') }
                catch { data[k] = localStorage.getItem(k) }
            }
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `campussync-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    /* ── Keyboard Shortcuts ──────────────────────────── */
    const shortcuts = [
        { keys: 'Ctrl + Enter', action: 'Submit interview answer' },
        { keys: 'Esc', action: 'Close study hub / modal' },
        { keys: '1-5 keys', action: 'Jump to section in study' },
        { keys: 'Arrow keys', action: 'Navigate study sections' },
    ]

    return (
        <div className="page-content">

            {/* ── Header ─────────────────────────────────── */}
            <div className="st-header">
                <div className="st-header__left">
                    <div className="st-header__icon"><SettingsIcon size={22} /></div>
                    <div>
                        <h1 className="st-header__title">Command Center</h1>
                        <p className="st-header__sub">Profile, preferences, data, and system diagnostics</p>
                    </div>
                </div>
                <button type="button" className={`btn ${saved ? 'btn--success' : 'btn--primary'}`} onClick={handleSave}>
                    {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Apply</>}
                </button>
            </div>

            <div className="st-grid">
                {/* ══════════ LEFT COLUMN ══════════ */}
                <div>

                    {/* ── Profile Intel Card ─────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><User size={14} /> Profile Intel</div>
                        <div className="st-profile">
                            <div className="st-profile__avatar">
                                {(user?.name ?? 'U')[0].toUpperCase()}
                            </div>
                            <div className="st-profile__info">
                                <div className="st-profile__name">{user?.name ?? 'User'}</div>
                                <div className="st-profile__email">{user?.email ?? '-'}</div>
                            </div>
                        </div>
                        <div className="st-profile-stats">
                            <div className="st-pstat">
                                <FileText size={13} />
                                <span>{profileStats.analysisCount}</span>
                                <span>Analyses</span>
                            </div>
                            <div className="st-pstat">
                                <CheckCircle size={13} />
                                <span>{masteredSkills.length}</span>
                                <span>Skills Mastered</span>
                            </div>
                            <div className="st-pstat">
                                <Target size={13} />
                                <span>{completedTasks?.length ?? 0}</span>
                                <span>Tasks Done</span>
                            </div>
                            <div className="st-pstat">
                                <Zap size={13} />
                                <span>{analysis?.role?.split(' ')[0] ?? '-'}</span>
                                <span>Role</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Learning Commitment ────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><Sliders size={14} /> Daily Learning Goal</div>
                        <p className="st-muted">Hours per day you can dedicate to skill building. Used by Improvement Plan to tailor your schedule.</p>
                        <div className="st-commitment">
                            <input
                                type="range" min={1} max={6} step={0.5}
                                value={dailyCommitment}
                                onChange={e => setDailyCommitment(Number(e.target.value))}
                                className="st-slider"
                            />
                            <div className="st-commitment__labels">
                                <span>1h</span>
                                <span className="st-commitment__current">{dailyCommitment}h / day</span>
                                <span>6h</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Interaction Prefs ──────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><Monitor size={14} /> Preferences</div>
                        <div className="st-toggle-row">
                            <div>
                                <div className="st-toggle-label"><Bell size={13} /> Notifications</div>
                                <div className="st-toggle-desc">Get alerts when analysis completes</div>
                            </div>
                            <div className={`toggle ${notifications ? 'on' : ''}`} role="switch"
                                aria-checked={notifications} tabIndex={0}
                                onClick={() => setNotifications(!notifications)}
                                onKeyDown={e => e.key === 'Enter' && setNotifications(!notifications)}
                            />
                        </div>
                        <div className="st-toggle-row" style={{ borderBottom: 'none' }}>
                            <div>
                                <div className="st-toggle-label"><Shield size={13} /> Enhanced Privacy</div>
                                <div className="st-toggle-desc">Anonymize resume data before cloud processing</div>
                            </div>
                            <div className={`toggle ${privacyMode ? 'on' : ''}`} role="switch"
                                aria-checked={privacyMode} tabIndex={0}
                                onClick={() => setPrivacyMode(!privacyMode)}
                                onKeyDown={e => e.key === 'Enter' && setPrivacyMode(!privacyMode)}
                            />
                        </div>
                    </div>

                    {/* ── Danger Zone ────────────────── */}
                    <div className="st-card">
                        <div className="st-section-head" style={{ color: 'var(--red)' }}><Trash2 size={14} /> Danger Zone</div>
                        {analysis && (
                            <div className="st-active-session">
                                <span className="st-active-tag">Active Session</span>
                                <span className="st-active-file">{analysis.filename}</span>
                                <span className="st-active-detail">{analysis.role} · {analysis.final_score}%</span>
                            </div>
                        )}
                        <div className="st-danger-actions">
                            <button type="button" className="btn btn--danger btn--sm" onClick={clear} disabled={!analysis}>
                                <Trash2 size={13} /> Clear All Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══════════ RIGHT COLUMN ══════════ */}
                <div>

                    {/* ── System Status ──────────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><Cloud size={14} /> System Status</div>
                        <div className="st-status-grid">
                            <div className="st-status-item">
                                <span>Backend</span>
                                {health ? (
                                    <span className="st-status-badge st-status-badge--ok"><span className="live-dot" /> Live</span>
                                ) : healthLoading ? (
                                    <span className="st-status-badge st-status-badge--muted">Checking…</span>
                                ) : (
                                    <span className="st-status-badge st-status-badge--err">Offline</span>
                                )}
                            </div>
                            <div className="st-status-item">
                                <span>Model</span>
                                <span className="st-status-val">{health?.model_version ? `v${health.model_version}` : '-'}</span>
                            </div>
                            <div className="st-status-item">
                                <span>Accuracy</span>
                                <span className="st-status-val" style={{ color: 'var(--cyan)' }}>
                                    {health?.accuracy ? `${(health.accuracy * 100).toFixed(1)}%` : '-'}
                                </span>
                            </div>
                            <div className="st-status-item">
                                <span>Vocabulary</span>
                                <span className="st-status-val">{health?.vocabulary_size?.toLocaleString() ?? '-'} terms</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Data Vault ─────────────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><HardDrive size={14} /> Data Vault</div>
                        <div className="st-storage">
                            <div className="st-storage__total">
                                <Database size={13} />
                                <span>Local Storage: <strong>{formatBytes(storageStats.totalBytes)}</strong></span>
                            </div>
                            {storageStats.breakdown.length > 0 && (
                                <div className="st-storage__bars">
                                    {storageStats.breakdown.map(b => (
                                        <div key={b.key} className="st-storage__bar-row">
                                            <span className="st-storage__bar-label">{b.label}</span>
                                            <div className="st-storage__bar-track">
                                                <div className="st-storage__bar-fill"
                                                    style={{ width: `${Math.max(3, (b.bytes / Math.max(storageStats.totalBytes, 1)) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="st-storage__bar-val">{formatBytes(b.bytes)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="st-vault-actions">
                            <button type="button" className="btn btn--ghost btn--sm" onClick={exportData}>
                                <Download size={13} /> Export All Data
                            </button>
                        </div>
                    </div>

                    {/* ── Keyboard Shortcuts ──────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><Keyboard size={14} /> Keyboard Shortcuts</div>
                        <div className="st-shortcuts">
                            {shortcuts.map(s => (
                                <div key={s.keys} className="st-shortcut-row">
                                    <kbd className="st-kbd">{s.keys}</kbd>
                                    <span>{s.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── About ──────────────────────── */}
                    <div className="st-card">
                        <div className="st-section-head"><Info size={14} /> About</div>
                        <div className="st-about">
                            <p><strong>CampusSync Edge AI</strong> - v2.0</p>
                            <p>Locally cached ONNX model for classification + Gemini 2.0 Flash for semantic reasoning. Built to help students bridge the gap between academic skills and industry expectations.</p>
                            <p className="st-muted">FastAPI · React · Supabase · ONNX Runtime</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
