import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft, Search, BookOpen, Terminal, Code,
    Shield, Cpu, Zap, Copy, Check, Info, AlertTriangle, HelpCircle
} from 'lucide-react'

// Structure of documentation pages
interface DocSection {
    id: string
    title: string
    category: string
    icon: any
    content: React.ReactNode
    toc: { id: string; text: string }[]
}

export default function Docs() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activePage, setActivePage] = useState('intro')
    const [activeCodeTab, setActiveCodeTab] = useState<'js' | 'python'>('js')
    const [copiedText, setCopiedText] = useState(false)

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedText(true)
        setTimeout(() => setCopiedText(false), 2000)
    }

    const docPages: DocSection[] = [
        {
            id: 'intro',
            title: 'Welcome to CampusSync',
            category: 'Getting Started',
            icon: BookOpen,
            toc: [
                { id: 'overview', text: 'Overview' },
                { id: 'why-edge', text: 'Why Edge Intelligence?' },
                { id: 'loop', text: 'The Growth Loop Metaphor' }
            ],
            content: (
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Welcome to CampusSync Edge
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                        CampusSync Edge AI is a state-of-the-art career readiness intelligence engine designed to align academic curriculum and engineering student portfolios directly with live industry benchmarks. By leveraging on-device machine learning, the system acts as a real-time advisor for technical skill building.
                    </p>

                    <div style={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        display: 'flex',
                        gap: '14px'
                    }}>
                        <Info color="var(--blue)" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong style={{ display: 'block', color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>Fast Track Guidance</strong>
                            <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                                If you are a new developer or student setting up the system for the first time, skip directly to the <span style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setActivePage('quickstart')}>Quickstart Guide</span> to spin up the local server in under 2 minutes.
                            </span>
                        </div>
                    </div>

                    <h2 id="overview" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Overview
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        Traditional career portals rely on heavy relational structures that store sensitive student telemetry in third-party cloud databases. CampusSync Edge introduces a peerless **local edge engine** built to index portfolios directly in sandboxed database environments, matching engineering gaps with immediate precision.
                    </p>

                    <h2 id="why-edge" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Why Edge Intelligence?
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        By porting complex machine learning models directly into standardized client environments, we eliminate cloud subscription overhead and guarantee privacy:
                    </p>
                    <ul style={{ paddingLeft: '20px', marginBottom: '24px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
                        <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text)' }}>Zero Server Latency:</strong> Inference pipelines (text extraction, semantic mapping) run natively inside your hardware threads.</li>
                        <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text)' }}>Zero Cloud Retention:</strong> Resumes and voice inputs are parsed inside the local sandbox-never uploaded to standard cloud datastores.</li>
                        <li><strong style={{ color: 'var(--text)' }}>Offline Availability:</strong> Track and evaluate placement skills even without an active internet connection.</li>
                    </ul>

                    <h2 id="loop" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        The Growth Loop Metaphor
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        Instead of treating preparation as a series of isolated assignments, CampusSync orchestrates an elegant, closed-loop growth pathway:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--blue)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>01</div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Ingestion</h4>
                            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Parse and structure technical portfolios locally.</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--purple)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>02</div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Assessment</h4>
                            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Map technical experience delta against industry frameworks.</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ color: 'var(--cyan)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>03</div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>Simulations</h4>
                            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Simulate live SDE technical rounds offline.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'quickstart',
            title: 'Quickstart Guide',
            category: 'Getting Started',
            icon: Terminal,
            toc: [
                { id: 'installation', text: 'Installation' },
                { id: 'spinnup', text: 'Spinning Up Dev Server' },
                { id: 'first-inbound', text: 'Your First Resume Scan' }
            ],
            content: (
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Quickstart Guide
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                        Deploy and run CampusSync Edge on your local development machine in under two minutes. Follow this step-by-step layout using npm commands.
                    </p>

                    <h2 id="installation" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Installation
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                        Clone the repository and install core dependencies. Make sure you have Node.js 18+ loaded on your host machine.
                    </p>

                    {/* Code Snippet Card */}
                    <div style={{
                        background: '#090d1a',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Terminal</span>
                            <button type="button"
                                onClick={() => handleCopy('git clone https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai.git\ncd Campus-Sync-Edge-Ai\nnpm install')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 12
                                }}
                            >
                                {copiedText ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                                {copiedText ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <pre style={{
                            padding: '16px',
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            color: '#a5b4fc',
                            overflowX: 'auto',
                            lineHeight: 1.6
                        }}>
                            $ git clone https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai.git<br />
                            $ cd Campus-Sync-Edge-Ai/frontend<br />
                            $ npm install
                        </pre>
                    </div>

                    <h2 id="spinnup" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Spinning Up Dev Server
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                        Launch the local development environment. By default, the application runs on port `5173`.
                    </p>

                    <div style={{
                        background: '#090d1a',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Terminal</span>
                            <button type="button"
                                onClick={() => handleCopy('npm run dev')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 12
                                }}
                            >
                                {copiedText ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                                {copiedText ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <pre style={{
                            padding: '16px',
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '13px',
                            color: '#a5b4fc',
                            overflowX: 'auto',
                            lineHeight: 1.6
                        }}>
                            $ npm run dev<br />
                            <span style={{ color: 'var(--green)' }}>  ➜  Local:   http://localhost:5173/</span>
                        </pre>
                    </div>

                    <h2 id="first-inbound" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Your First Resume Scan
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        Open `http://localhost:5173/` in your browser. Drag and drop any standardized technical resume (PDF format) directly into the center Hero dropzone. Our client-side WebAssembly scanner will extract structure in under 3 seconds and redirect you to the custom skill analysis dashboard!
                    </p>
                </div>
            )
        },
        {
            id: 'onnx-engine',
            title: 'ONNX WebAssembly AI',
            category: 'Core System',
            icon: Cpu,
            toc: [
                { id: 'how-onnx-works', text: 'How ONNX Runtime Web Works' },
                { id: 'model-spec', text: 'Local Model Specifications' },
                { id: 'code-example', text: 'WASM Inference Integration' }
            ],
            content: (
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        ONNX WebAssembly AI Engine
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                        Learn how CampusSync Edge loads and runs machine learning models offline inside the client sandbox using WASM execution pipelines.
                    </p>

                    <h2 id="how-onnx-works" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        How ONNX Runtime Web Works
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        To keep data secure and ensure instant calculations, we compile lightweight **RandomForest** classifiers and NLP embedding encoders into `.onnx` formats.
                        When a user lands on the dashboard, the page initializes an asynchronous **WebAssembly worker** thread, loads the model file from public assets, and runs all inference metrics strictly on the client processor threads.
                    </p>

                    <div style={{
                        background: 'rgba(239, 68, 68, 0.04)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '30px',
                        display: 'flex',
                        gap: '14px'
                    }}>
                        <AlertTriangle color="var(--red)" size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <strong style={{ display: 'block', color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>Hardware Acceleration Warning</strong>
                            <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                                Make sure hardware acceleration is enabled inside your browser settings to allow multi-threaded WebAssembly to access web hardware threads, decreasing inference loops from 800ms down to 40ms.
                            </span>
                        </div>
                    </div>

                    <h2 id="model-spec" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Local Model Specifications
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        CampusSync Edge ships with exactly three client-side model files:
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'var(--text)' }}>Model</th>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'var(--text)' }}>Size</th>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'var(--text)' }}>Inference Output</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)' }}>resume_parser.onnx</td>
                                <td style={{ padding: '12px 0' }}>1.2 MB</td>
                                <td style={{ padding: '12px 0', color: 'var(--muted)' }}>NLP Entity extraction for technical skills.</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)' }}>role_classifier.onnx</td>
                                <td style={{ padding: '12px 0' }}>450 KB</td>
                                <td style={{ padding: '12px 0', color: 'var(--muted)' }}>RandomForest portfolio readiness scoring.</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px 0', fontFamily: 'var(--font-mono)' }}>skill_alignment.onnx</td>
                                <td style={{ padding: '12px 0' }}>850 KB</td>
                                <td style={{ padding: '12px 0', color: 'var(--muted)' }}>SDE track delta scoring indexes.</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 id="code-example" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        WASM Inference Integration
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                        Here is a reference snippet demonstrating how the client loads and runs the role classifier:
                    </p>

                    {/* Tabbed Code Snippet */}
                    <div style={{
                        background: '#090d1a',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            background: 'rgba(255,255,255,0.02)',
                            borderBottom: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontFamily: 'var(--font-mono)',
                                        color: activeCodeTab === 'js' ? 'var(--blue)' : 'var(--muted)',
                                        cursor: 'pointer',
                                        fontWeight: activeCodeTab === 'js' ? 700 : 500
                                    }}
                                    onClick={() => setActiveCodeTab('js')}
                                >
                                    JavaScript
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontFamily: 'var(--font-mono)',
                                        color: activeCodeTab === 'python' ? 'var(--blue)' : 'var(--muted)',
                                        cursor: 'pointer',
                                        fontWeight: activeCodeTab === 'python' ? 700 : 500
                                    }}
                                    onClick={() => setActiveCodeTab('python')}
                                >
                                    Python
                                </span>
                            </div>
                        </div>
                        <pre style={{
                            padding: '16px',
                            margin: 0,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12.5px',
                            color: '#a5b4fc',
                            overflowX: 'auto',
                            lineHeight: 1.6
                        }}>
                            {activeCodeTab === 'js' ? (
                                `// Load ONNX Runtime Web assembly
import * as ort from 'onnxruntime-web';

async function runRoleInference(inputFeatures) {
    const session = await ort.InferenceSession.create('/models/role_classifier.onnx');
    const inputTensor = new ort.Tensor('float32', Float32Array.from(inputFeatures), [1, 14]);
    
    // Run evaluation pipeline
    const outputs = await session.run({ 'input': inputTensor });
    return outputs.output.data; // Array of role readiness scores
}`
                            ) : (
                                `# Load ONNX runtime inside local testing scripts
import onnxruntime as ort
import numpy as np

def run_role_inference(input_features):
    session = ort.InferenceSession("role_classifier.onnx")
    input_data = np.array([input_features], dtype=np.float32)
    
    # Run pipeline evaluation
    outputs = session.run(None, {"input": input_data})
    return outputs[0] # Role readiness scores`
                            )}
                        </pre>
                    </div>
                </div>
            )
        },
        {
            id: 'privacy-shield',
            title: 'Privacy Shield Framework',
            category: 'Security',
            icon: Shield,
            toc: [
                { id: 'compliance', text: 'Legal Compliance GDPR / CCPA' },
                { id: 'local-only', text: 'Local Sandbox Storage' }
            ],
            content: (
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Privacy Shield Framework
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '24px' }}>
                        CampusSync Edge AI is engineered with rigorous structural guarantees to ensure student credentials never face exposure.
                    </p>

                    <h2 id="compliance" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Legal Compliance GDPR / CCPA
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        By allowing all critical profile parsing and simulation scripts to run locally, the platform aligns naturally with strict legal criteria:
                    </p>
                    <ul style={{ paddingLeft: '20px', marginBottom: '24px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7 }}>
                        <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text)' }}>GDPR Right to Erasure:</strong> Wiping your data is instant. Head to settings to fully clear your IndexedDB state; zero backup lags remain.</li>
                        <li><strong style={{ color: 'var(--text)' }}>CCPA Data Control:</strong> Your professional records are strictly yours. Since data never logs in a central cloud storage, selling or sharing credentials is physically impossible.</li>
                    </ul>

                    <h2 id="local-only" style={{ fontSize: '20px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                        Local Sandbox Storage
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                        All generated improvement tracks, interview transcripts, and performance profiles are cached natively using securely sandboxed browser APIs. Your data stays in the boundaries of your local user profile.
                    </p>
                </div>
            )
        }
    ]

    const filteredPages = docPages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const activeDoc = docPages.find(p => p.id === activePage) || docPages[0]

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
                    <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>CampusSync Edge Docs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    v1.2.0 · Local AI Mode
                </div>
            </header>

            {/* Three-Column Shell */}
            <div style={{
                display: 'flex',
                flex: 1,
                maxWidth: '1440px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* ── COLUMN 1: LEFT SIDEBAR (Navigation) ── */}
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
                    {/* Search Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        position: 'relative'
                    }}>
                        <Search size={14} color="var(--muted)" />
                        <input
                            type="text"
                            placeholder="Search docs..."
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

                    {/* Hierarchy Navigation */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {['Getting Started', 'Core System', 'Security'].map(category => {
                            const categoryPages = filteredPages.filter(p => p.category === category)
                            if (categoryPages.length === 0) return null

                            return (
                                <div key={category}>
                                    <h4 style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'var(--muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginBottom: '10px'
                                    }}>
                                        {category}
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {categoryPages.map(page => {
                                            const PageIcon = page.icon
                                            const isSelected = activePage === page.id
                                            return (
                                                <li key={page.id}>
                                                    <button type="button"
                                                        onClick={() => setActivePage(page.id)}
                                                        style={{
                                                            width: '100%',
                                                            background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'none',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '8px 12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 10,
                                                            color: isSelected ? 'var(--blue)' : 'var(--text)',
                                                            fontWeight: isSelected ? 600 : 500,
                                                            fontSize: '13px',
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        className="docs-nav-btn"
                                                    >
                                                        <PageIcon size={14} color={isSelected ? 'var(--blue)' : 'var(--muted)'} />
                                                        {page.title}
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })}
                    </nav>
                </aside>

                {/* ── COLUMN 2: CENTER CONTENT (Main Reader) ── */}
                <main style={{
                    flex: 1,
                    padding: '48px 40px 80px',
                    maxWidth: '820px'
                }}>
                    <article>
                        {activeDoc.content}
                    </article>

                    {/* Help Section footer */}
                    <div style={{
                        marginTop: '60px',
                        paddingTop: '30px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16
                    }}>
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                            Was this page helpful?
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="button" style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                color: 'var(--text)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}>Yes</button>
                            <button type="button" style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                color: 'var(--text)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}>No</button>
                        </div>
                    </div>
                </main>

                {/* ── COLUMN 3: RIGHT SIDEBAR (On This Page) ── */}
                <aside style={{
                    width: '240px',
                    padding: '48px 24px',
                    height: 'calc(100vh - var(--navbar-h))',
                    position: 'sticky',
                    top: 'var(--navbar-h)',
                    overflowY: 'auto'
                }} className="docs-toc">
                    <h4 style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '16px'
                    }}>
                        On This Page
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {activeDoc.toc.map(item => (
                            <li key={item.id}>
                                <a
                                    href={`#${item.id}`}
                                    style={{
                                        color: 'var(--muted)',
                                        fontSize: '12.5px',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        transition: 'color 0.15s'
                                    }}
                                    className="toc-link"
                                >
                                    {item.text}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </div>
    )
}
