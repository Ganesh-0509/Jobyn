import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft, Shield, Search, Database, EyeOff, Lock,
    CheckCircle, Terminal, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react'

interface PolicySection {
    id: string
    title: string
    content: React.ReactNode
}

export default function Privacy() {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)

    const toggleAccordion = (id: string) => {
        setExpandedAccordion(expandedAccordion === id ? null : id)
    }

    const policySections: PolicySection[] = [
        {
            id: 'intro',
            title: '1. Executive Summary & Core Pillars',
            content: (
                <div>
                    <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '16px' }}>
                        CampusSync Edge AI operates on a **Zero-Cloud-Retention Architecture**. Unlike traditional platforms that harvest technical portfolios and resumes onto centralized databases, our system relies on client-side sandboxed environments. Your data belongs exclusively to you and remains hosted on your physical machine.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px', borderRadius: '12px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <EyeOff size={14} /> Zero Tracking
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>Resumes and portfolio transcripts are parsed entirely within client sandboxes. We never view or log raw documents.</p>
                        </div>
                        <div style={{ background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.15)', padding: '16px', borderRadius: '12px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Database size={14} /> Sandbox Encryption
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>Calculated SDE track alignment states are stored locally on encrypted browser IndexedDB databases.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'data-matrix',
            title: '2. Unified Data Telemetry Matrix',
            content: (
                <div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        To guarantee complete transparency, the following technical matrix details exactly how each data point is generated, cached, and destroyed:
                    </p>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '12px 16px', color: 'var(--text)' }}>Data Point</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text)' }}>Extraction Method</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text)' }}>Storage Location</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text)' }}>Cloud Upload</th>
                                    <th style={{ padding: '12px 16px', color: 'var(--text)' }}>Wipe Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>PDF Resumes</td>
                                    <td style={{ padding: '12px 16px' }}>Local WASM Parser</td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>RAM (Ephemeral)</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--red)' }}>NEVER</td>
                                    <td style={{ padding: '12px 16px' }}>Wiped on browser reload</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Skill Indexes</td>
                                    <td style={{ padding: '12px 16px' }}>ONNX role classifiers</td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>IndexedDB (Sandbox)</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--red)' }}>NEVER</td>
                                    <td style={{ padding: '12px 16px' }}>Settings -&gt; Clear Cache</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Voice Recordings</td>
                                    <td style={{ padding: '12px 16px' }}>Speech Recognition API</td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>RAM (Ephemeral)</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--red)' }}>NEVER</td>
                                    <td style={{ padding: '12px 16px' }}>Wiped on arena exit</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Auth Credentials</td>
                                    <td style={{ padding: '12px 16px' }}>User Registration</td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>Secure Cloud (Firestore)</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--green)' }}>Yes (Authorized Only)</td>
                                    <td style={{ padding: '12px 16px' }}>Settings -&gt; Delete Account</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        },
        {
            id: 'gdpr-ccpa',
            title: '3. Legal Standards (GDPR, CCPA & FERPA)',
            content: (
                <div>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        CampusSync Edge AI explicitly aligns its internal structures with standard global compliance frameworks:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Accordion 1 */}
                        <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.01)',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => toggleAccordion('gdpr')}
                                style={{
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    padding: '16px',
                                    color: 'var(--text)',
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                GDPR Alignment (Articles 15 & 17)
                                {expandedAccordion === 'gdpr' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedAccordion === 'gdpr' && (
                                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)' }}>
                                    Under GDPR Article 17 (Right to Erasure), any user can wipe their technical indicators, parsed resumes, and performance logs instantly. Because all calculations run within browser IndexedDB sandboxes, erasing the state is fully local and does not leave residual backups on remote backup servers.
                                </div>
                            )}
                        </div>

                        {/* Accordion 2 */}
                        <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.01)',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => toggleAccordion('ccpa')}
                                style={{
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    padding: '16px',
                                    color: 'var(--text)',
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                CCPA Alignment (Data Sharing & Transparency)
                                {expandedAccordion === 'ccpa' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedAccordion === 'ccpa' && (
                                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)' }}>
                                    CampusSync does not sell, barter, or distribute your technical assessments or speech telemetry. All models running on ONNX Runtime Web execute offline in sandboxed client scripts. We have zero central access to your portfolios, maintaining complete compliance with California regulations.
                                </div>
                            )}
                        </div>

                        {/* Accordion 3 */}
                        <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.01)',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => toggleAccordion('ferpa')}
                                style={{
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    padding: '16px',
                                    color: 'var(--text)',
                                    fontWeight: 600,
                                    fontSize: '13.5px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                FERPA Alignment (Student Telemetry Protection)
                                {expandedAccordion === 'ferpa' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {expandedAccordion === 'ferpa' && (
                                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)' }}>
                                    Our platform strictly aligns with the Family Educational Rights and Privacy Act (FERPA) by ensuring that academic scores, portfolio benchmarks, and technical training profiles are not public or exposed without user-authorized cloud synchronization.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }
    ]

    const filteredSections = policySections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>CampusSync Privacy Center</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                    <CheckCircle size={12} /> Compliance Audited
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
                            placeholder="Filter policy..."
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
                            Policy Chapters
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filteredSections.map(section => (
                                <li key={section.id}>
                                    <a
                                        href={`#${section.id}`}
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
                                        {section.title.split('. ')[1] || section.title}
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
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--blue)', fontWeight: 600 }}>VERSION 1.1</span>
                            <span style={{ color: 'var(--border)' }}>·</span>
                            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Last Updated: May 24, 2026</span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
                            Privacy Shield Policy
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                            Learn how we protect student datasets using end-to-end sandboxed intelligence, absolute data ownership, and strict zero cloud retention logs.
                        </p>
                    </header>

                    {/* Policy content nodes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                        {filteredSections.map(section => (
                            <section key={section.id} id={section.id} style={{
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
                                    {section.title}
                                </h2>
                                {section.content}
                            </section>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
