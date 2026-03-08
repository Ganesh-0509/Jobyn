import { useState, useEffect } from 'react'
import { useResume } from '../context/ResumeContext'
import { getHealth } from '../api/client'
import { getItem, setItem } from '../utils/storage'
import {
    Monitor, Bell, Shield, Database, Trash2,
    Save, Cloud, Activity, Settings as SettingsIcon, User, Info, CheckCircle
} from 'lucide-react'

export default function Settings() {
    const { analysis, clear } = useResume()
    const [saved, setSaved] = useState(false)
    const [health, setHealth] = useState<{ status: string; model_version?: string; accuracy?: number; vocabulary_size?: number; trained_on?: number } | null>(null)
    const [healthLoading, setHealthLoading] = useState(true)

    // User Prefs from storage utility
    const [darkMode, setDarkMode] = useState(() => getItem<string>('theme') !== 'light')
    const [notifications, setNotifications] = useState(() => getItem<string>('notifs') !== 'false')
    const [privacyMode, setPrivacyMode] = useState(() => getItem<string>('privacy') === 'true')

    useEffect(() => {
        setHealthLoading(true)
        getHealth()
            .then(h => setHealth(h))
            .catch(() => { })
            .finally(() => setHealthLoading(false))
    }, [])

    const handleSave = () => {
        setItem('notifs', String(notifications))
        setItem('theme', darkMode ? 'dark' : 'light')
        setItem('privacy', String(privacyMode))
        // Apply theme immediately
        if (darkMode) {
            document.documentElement.classList.remove('light-mode')
        } else {
            document.documentElement.classList.add('light-mode')
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="page-content">
            <div className="page-header mb-32">
                <div className="flex-row gap-16 align-center">
                    <div className="icon-box icon-box--blue">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <div className="page-title">Preferences</div>
                        <div className="page-subtitle">Configure your workspace and AI processing environment</div>
                    </div>
                </div>
                <button className={`btn ${saved ? 'btn--success' : 'btn--primary'}`} onClick={handleSave}>
                    {saved ? <CheckCircle size={16} /> : <Save size={16} />} {saved ? 'Saved Successfully' : 'Apply Changes'}
                </button>
            </div>

            <div className="settings-grid">
                {/* Left Column: Interaction & Data */}
                <div>
                    {/* Interaction Settings */}
                    <div className="card mb-24 p-24">
                        <div className="settings-section-header">
                            <Monitor size={16} className="text-blue" /> Interaction Prefs
                        </div>

                        <div className="settings-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div className="settings-row-label">AI Analysis Notifications</div>
                                <div className="settings-row-desc">Get real-time alerts when your resume analysis is finalized</div>
                            </div>
                            <div className={`toggle ${notifications ? 'on' : ''}`} role="switch" aria-checked={notifications} aria-label="AI Analysis Notifications" tabIndex={0} onClick={() => setNotifications(!notifications)} onKeyDown={e => e.key === 'Enter' && setNotifications(!notifications)} />
                        </div>

                        <div className="settings-row" style={{ padding: '12px 0' }}>
                            <div>
                                <div className="settings-row-label">Enhanced Privacy</div>
                                <div className="settings-row-desc">Anonymize all resume data before cloud processing</div>
                            </div>
                            <div className={`toggle ${privacyMode ? 'on' : ''}`} role="switch" aria-checked={privacyMode} aria-label="Enhanced Privacy" tabIndex={0} onClick={() => setPrivacyMode(!privacyMode)} onKeyDown={e => e.key === 'Enter' && setPrivacyMode(!privacyMode)} />
                        </div>
                    </div>

                    {/* Active Analysis Control */}
                    <div className="card p-24">
                        <div className="settings-section-header">
                            <Database size={16} className="text-blue" /> Current Session Data
                        </div>

                        {analysis ? (
                            <div className="settings-active-profile">
                                <div className="settings-active-tag">Active Profile Detected</div>
                                <div className="settings-active-name">{analysis.filename}</div>
                                <div className="settings-active-detail">Analyzed as <strong>{analysis.role}</strong> with {analysis.final_score}% readiness score.</div>
                            </div>
                        ) : (
                            <div className="settings-empty-profile">
                                <div className="settings-row-desc">No active resume profile in session.</div>
                            </div>
                        )}

                        <div className="settings-danger-row">
                            <div>
                                <div className="settings-danger-title">Purge Local Memory</div>
                                <div className="settings-danger-desc">Permanently erase all stored analysis history</div>
                            </div>
                            <button className="btn btn--danger btn--sm" onClick={clear} disabled={!analysis}>
                                <Trash2 size={14} /> Clear Session
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Ecosystem Monitor */}
                <div>
                    <div className="card p-24">
                        <div className="settings-section-header">
                            <Cloud size={16} className="text-blue" /> AI Ecosystem Monitor
                        </div>

                        <div className="mb-24">
                            <div className="flex-row justify-between mb-8">
                                <span className="settings-model-label" style={{ fontWeight: 600 }}>BACKEND CORE STATUS</span>
                                {health ? (
                                    <span className="status-badge status-badge--green">
                                        <span className="live-dot" /> LIVE
                                    </span>
                                ) : healthLoading ? (
                                    <span className="status-badge status-badge--muted">
                                        <div className="spinner spinner--sm" /> CHECKING...
                                    </span>
                                ) : (
                                    <span className="status-badge status-badge--red">OFFLINE</span>
                                )}
                            </div>
                            <div className="settings-status-row">
                                <div className="settings-status-inner">
                                    <Activity size={14} className="text-blue" />
                                    <span>Cluster Logic: <strong>{health?.status?.toUpperCase() ?? 'COULD NOT REACH'}</strong></span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-24">
                            <div className="flex-row justify-between mb-8">
                                <span className="settings-model-label" style={{ fontWeight: 600 }}>INTELLIGENCE LAYER</span>
                                <span style={{ color: 'var(--blue)', fontWeight: 800, fontSize: 12 }}>MODEL {health?.model_version ?? '--'}</span>
                            </div>
                            <div className="settings-model-table">
                                <div className="settings-model-row" style={{ background: 'var(--bg-glass)' }}>
                                    <span className="settings-model-label">Accuracy Rating</span>
                                    <span className="settings-model-value" style={{ color: 'var(--cyan)' }}>{health?.accuracy ? `${(health.accuracy * 100).toFixed(1)}%` : '--'}</span>
                                </div>
                                <div className="settings-model-row" style={{ background: 'var(--bg-glass)' }}>
                                    <span className="settings-model-label">Vocabulary Size</span>
                                    <span className="settings-model-value" style={{ color: 'var(--blue)' }}>{health?.vocabulary_size?.toLocaleString() ?? '--'} words</span>
                                </div>
                            </div>
                        </div>

                        <div className="settings-info-box">
                            <div className="settings-info-inner">
                                <div style={{ marginTop: 2 }}><Info size={14} className="text-blue" /></div>
                                <div>
                                    <div className="settings-info-tag">DID YOU KNOW?</div>
                                    <p className="settings-info-text">
                                        The CampusSync engine uses a locally cached ONNX model for initial classification before delegating complex semantic reasoning to the cloud. This saves up to 40% battery on mobile devices.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
