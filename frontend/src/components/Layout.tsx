import { NavLink, Outlet } from 'react-router-dom'
import {
    LayoutDashboard, FileText, BarChart2, ZapOff,
    CheckSquare, MessageSquare, TrendingUp, GitCompare,
    Building2, Blocks, Settings, Sun, Moon, Shield, Cpu, Menu, X as XIcon, LogOut
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import LogoMark from './LogoMark'
import { useAuth } from '../context/AuthContext'
import { PrivacyContext } from '../context/PrivacyContext'
import { isOnDeviceReady } from '../utils/onDevicePredictor'

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard Overview', Icon: LayoutDashboard },
    { to: '/resume-analyzer', label: 'Resume Analyzer', Icon: FileText },
    { to: '/readiness-score', label: 'Readiness Score', Icon: BarChart2 },
    { to: '/skill-gap', label: 'Skill Gap Analysis', Icon: ZapOff },
    { to: '/improvement-plan', label: 'Improvement Plan', Icon: CheckSquare },
    { to: '/interview-readiness', label: 'Interview Readiness', Icon: MessageSquare },
    { to: '/progress-tracking', label: 'Progress Tracking', Icon: TrendingUp },
    { to: '/resume-comparison', label: 'Resume Comparison', Icon: GitCompare },
    { to: '/industry-alignment', label: 'Industry Alignment', Icon: Building2 },
    { to: '/my-projects', label: 'My Projects', Icon: Blocks },
    { to: '/admin', label: 'Admin Portal', Icon: Shield },
    { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function Layout() {
    const { user, logout } = useAuth()
    const [privacy, setPrivacy] = useState(() => localStorage.getItem('cse_privacy') === 'true')
    const [theme, setTheme] = useState(() => localStorage.getItem('cse_theme') || 'light')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => { localStorage.setItem('cse_privacy', String(privacy)) }, [privacy])

    useEffect(() => {
        // The new theme is the default, so we only need to toggle a class for a potential 'dark-mode'
        // For now, we remove the old 'light-mode' class to avoid conflicts.
        document.documentElement.classList.remove('light-mode');
        
        // If you decide to implement a dark theme later, you could do:
        // if (theme === 'dark') {
        //   document.documentElement.classList.add('dark-mode');
        // } else {
        //   document.documentElement.classList.remove('dark-mode');
        // }

        localStorage.setItem('cse_theme', theme)
    }, [theme])

    const privacyValue = useMemo(() => ({ privacy, setPrivacy }), [privacy])

    return (
        <PrivacyContext.Provider value={privacyValue}>
            <div className="app-shell">
                {/* ── Mobile overlay ── */}
                {mobileMenuOpen && (
                    <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside className={`sidebar ${mobileMenuOpen ? 'sidebar--mobile-open' : ''}`}>
                    <div className="sidebar__logo">
                        <div className="sidebar__logo-icon"><LogoMark size={28} /></div>
                        <div className="sidebar__logo-name">CampusSync</div>
                        <div className="sidebar__logo-sub">Edge AI</div>
                        <button type="button"
                            className="mobile-close-btn"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close navigation menu"
                        >
                            <XIcon size={20} />
                        </button>
                    </div>

                    {/* Privacy Mode indicator in sidebar */}
                    {privacy && (
                        <div style={{
                            margin: '8px 12px', padding: '8px 10px',
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <Shield size={11} color="var(--green)" />
                            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, lineHeight: 1.2 }}>
                                Privacy Mode<br />
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Local only</span>
                            </span>
                        </div>
                    )}

                    <nav className="sidebar__nav" aria-label="Main navigation">
                        {NAV_ITEMS.filter(({ to }) => to !== '/admin' || user?.isAdmin).map(({ to, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Icon className="nav-item__icon" size={16} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="sidebar__footer">
                        <button type="button" className="nav-item nav-item--logout" onClick={logout}>
                            <LogOut className="nav-item__icon" size={16} />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div className="main-area">
                    <Navbar privacy={privacy} setPrivacy={setPrivacy} theme={theme} setTheme={setTheme} onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
                    <main>
                        <Outlet />
                    </main>
                </div>
            </div>
        </PrivacyContext.Provider>
    )
}

/* ── Navbar ─────────────────────────────────────────── */
function Navbar({ privacy, setPrivacy, theme, setTheme, onMenuToggle }: { privacy: boolean; setPrivacy: (v: boolean) => void; theme: string; setTheme: (v: string) => void; onMenuToggle: () => void }) {
    const { user, logout } = useAuth()
    const [onDevice, setOnDevice] = useState(false)
    const initials = user?.name
        ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
        : 'U'

    useEffect(() => {
        // Check if ONNX models loaded (non-blocking)
        const check = setInterval(() => {
            if (isOnDeviceReady()) { setOnDevice(true); clearInterval(check) }
        }, 2000)
        return () => clearInterval(check)
    }, [])

    return (
        <header className="navbar">
            {/* Hamburger button for mobile */}
            <button type="button"
                className="navbar__btn mobile-menu-btn"
                onClick={onMenuToggle}
                aria-label="Open navigation menu"
            >
                <Menu size={20} />
            </button>

            {/* Search placeholder removed – can be added later if needed */}

            <div className="navbar__actions">
                {/* On-Device badge */}
                {onDevice && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        background: 'rgba(34,197,94,0.10)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        fontSize: 12, color: 'var(--green)', fontWeight: 600,
                    }}>
                        <Cpu size={10} /> On-Device
                    </div>
                )}

                {/* Privacy Mode toggle */}
                <button type="button"
                    className="navbar__btn"
                    title={privacy ? 'Privacy Mode ON - click to disable' : 'Enable Privacy Mode (local-only)'}
                    onClick={() => setPrivacy(!privacy)}
                    style={{ color: privacy ? 'var(--green)' : undefined }}
                >
                    <Shield size={15} />
                </button>

                {/* Theme toggle */}
                <button type="button"
                    className="navbar__btn"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </button>

                <div className="navbar__avatar" title={user?.name ?? 'Profile'}>
                    {initials}
                </div>

                <button type="button"
                    className="navbar__btn navbar__logout"
                    title="Logout"
                    aria-label="Logout"
                    onClick={logout}
                >
                    <LogOut size={15} />
                </button>
            </div>
        </header>
    )
}
