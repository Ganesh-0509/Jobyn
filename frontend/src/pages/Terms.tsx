import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Search, FileText, CheckCircle, Scale } from 'lucide-react'

interface TermChapter {
    id: string
    title: string
    content: React.ReactNode
}

export default function Terms() {
    const [searchQuery, setSearchQuery] = useState('')

    const termChapters: TermChapter[] = [
        {
            id: 'agreement',
            title: '1. Agreement to Terms',
            content: (
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                    By accessing or utilizing the CampusSync Edge AI platform, you agree to be bound by these Terms and Conditions in their entirety. If you do not agree with any clause of these terms, you are prohibited from using the platform and must immediately cease all sandbox execution and clear your browser storage data.
                </p>
            )
        },
        {
            id: 'telemetry',
            title: '2. On-Device Telemetry & WebAssembly Execution',
            content: (
                <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: 12 }}>
                        CampusSync Edge is a decentralized, browser-level analytical interface. You acknowledge and agree to the following technical operational parameters:
                    </p>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: 8, margin: 0 }}>
                        <li>
                            <strong style={{ color: 'var(--text)' }}>Hardware Overhead:</strong> Machine learning inference pipelines (including ONNX Runtime Web and WASM models) are executed directly on your hardware processor. CampusSync is not responsible for local device performance fluctuations, thermal limits, or browser crashes during runtime execution.
                        </li>
                        <li>
                            <strong style={{ color: 'var(--text)' }}>Local Storage Telemetry:</strong> Calculated readiness indexes, assessment scores, and training progress markers are cached strictly inside your local sandbox (IndexedDB). Wiping your browser history or resetting the local sandbox will permanently delete this telemetry.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'intellectual-property',
            title: '3. Resume Ownership & Intellectual Property',
            content: (
                <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
                    <p style={{ marginBottom: 12 }}>
                        Your intellectual property rights are sacred. CampusSync Edge AI does not acquire ownership over any technical portfolios, documents, resumes, or voice recordings processed through our interface:
                    </p>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: 8, margin: 0 }}>
                        <li>
                            <strong style={{ color: 'var(--text)' }}>Absolute Retention:</strong> Uploaded technical credentials, CVs, and portfolios remain 100% your property. Since all parsing is sandboxed inside ephemeral browser memory, we do not store, copy, or distribute your intellectual property.
                        </li>
                        <li>
                            <strong style={{ color: 'var(--text)' }}>Platform Materials:</strong> All proprietary source code, vector graphics, interface timelines, visual growth loop elements, and ONNX compiled model binaries represent the exclusive intellectual property of CampusSync Edge AI, protected under international copyright treaties.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'limitation',
            title: '4. Limitation of Liability',
            content: (
                <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                    In no event shall CampusSync Edge, its creators, or partners be liable for any indirect, punitive, incidental, or consequential damages (including, without limitation, missed recruitment opportunities, incorrect skill assessment scoring, or rejection from placement campaigns) arising out of or in connection with the use or performance of our local AI advisor.
                </p>
            )
        }
    ]

    const filteredChapters = termChapters.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div style={{
            background: 'var(--bg)',
            minHeight: '100vh',
            color: 'var(--text)',
            fontFamily: 'var(--font)',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden'
        }}>
            {/* Top Navigation */}
            <header style={{
                height: 'var(--navbar-h)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-nav-glass)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        textDecoration: 'none'
                    }}>
                        <ArrowLeft size={16} />
                    </Link>
                    <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>CampusSync Terms of Service</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--blue)', fontWeight: 600 }}>
                    <Scale size={12} /> Legal Framework
                </div>
            </header>

            {/* Layout Shell */}
            <div style={{
                display: 'flex',
                flex: 1,
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* ── COLUMN 1: LEFT NAVIGATION ── */}
                <aside style={{
                    width: '280px',
                    borderRight: '1px solid var(--border)',
                    background: 'rgba(9, 13, 26, 0.1)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    height: 'calc(100vh - var(--navbar-h))',
                    position: 'sticky',
                    top: 'var(--navbar-h)',
                    overflowY: 'auto'
                }} className="docs-sidebar">
                    {/* Search Field */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px'
                    }}>
                        <Search size={14} color="var(--muted)" />
                        <input
                            type="text"
                            placeholder="Filter terms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text)',
                                fontSize: '13px',
                                width: '100%'
                            }}
                        />
                    </div>

                    {/* Section Index */}
                    <div>
                        <h4 style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '12px'
                        }}>
                            Agreement Sections
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filteredChapters.map(chapter => (
                                <li key={chapter.id}>
                                    <a
                                        href={`#${chapter.id}`}
                                        style={{
                                            display: 'block',
                                            padding: '6px 12px',
                                            color: 'var(--text)',
                                            fontSize: '13px',
                                            textDecoration: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 500,
                                            transition: 'background 0.15s'
                                        }}
                                        className="toc-link"
                                    >
                                        {chapter.title.split('. ')[1] || chapter.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* ── COLUMN 2: MAIN LEGAL TEXT ── */}
                <main style={{
                    flex: 1,
                    padding: '48px 40px 80px',
                    maxWidth: '820px'
                }}>
                    <header style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 600 }}>TOS VERSION 1.0</span>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Effective Date: May 24, 2026</span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
                            Terms of Service
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                            Please review our standard operational agreement governing on-device browser metrics and student assessment limits.
                        </p>
                    </header>

                    {/* Policy content nodes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                        {filteredChapters.map(chapter => (
                            <section key={chapter.id} id={chapter.id} style={{
                                scrollMarginTop: 'calc(var(--navbar-h) + 20px)'
                            }}>
                                <h2 style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    marginBottom: '16px',
                                    borderBottom: '1px solid var(--border)',
                                    paddingBottom: '8px',
                                    color: 'var(--text)'
                                }}>
                                    {chapter.title}
                                </h2>
                                {chapter.content}
                            </section>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
