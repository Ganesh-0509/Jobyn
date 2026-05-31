import { Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, ChevronRight, Play, Github, ExternalLink, Sparkles, Upload, FileText, CheckSquare, Award, ArrowUpRight, ShieldCheck, Database, Layers, Network, Star, Users, Briefcase
} from 'lucide-react'
import LogoMark from '../components/LogoMark'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'

/* ─── Mock Scenario Data ────────────────────────────────────── */

const STEPS = [
  {
    step: '01',
    title: 'Resume & Skill Diagnostics',
    highlight: 'Identify profile structural flaws',
    body: 'We dissect your engineering profile, locating structural omissions and key terms deficits before a recruiter ever reviews it.',
    fallbackMetric: '100% local profile parser'
  },
  {
    step: '02',
    title: 'Requirement Gap Analysis',
    highlight: 'Expose structural capability deficits',
    body: 'Continuous analysis monitors placement job sheets, matching missing framework concepts against active opportunities.',
    fallbackMetric: '12 standard paths supported'
  },
  {
    step: '03',
    title: 'Vocal Arena Sandbox',
    highlight: 'Construct verbal precision & response clarity',
    body: 'A physical voice simulator questions you on complex systems design, grading vocabulary density and conceptual accuracy.',
    fallbackMetric: 'Instant conceptual feedback'
  },
  {
    step: '04',
    title: 'Originality Signatures',
    highlight: 'Validate actual project footprints',
    body: 'Establish verified authorship by auditing commit footprints and codebase complexity directly onto your student profile.',
    fallbackMetric: 'GitHub attribution audit'
  }
]

const SPEECH_SCENARIOS = [
  {
    role: 'Backend SDE',
    question: 'How do you prevent database race conditions during concurrent account balance updates?',
    response: 'We enforce optimistic concurrency control using a version field, immediately aborting transactions attempting updates on stale rows and falling back to a queuing model for high-contention accounts.',
    precision: '96% Score',
    skills: ['Optimistic Concurrency', 'FIFO Queues', 'Transaction Isolation']
  },
  {
    role: 'Frontend Systems',
    question: 'Describe how structural reconciliation cycles update nested layouts efficiently.',
    response: 'The virtual diffing engine assigns stable key parameters to layout elements, bypassing full-tree DOM recalculation by only applying modifications to nodes whose content has mutated.',
    precision: '98% Score',
    skills: ['Reconciliation Keying', 'DOM Diffing', 'Fiber Architecture']
  },
  {
    role: 'Systems & Infrastructure',
    question: 'Explain the mechanism vertical pod autoscalers utilize to adjust CPU and memory footprints.',
    response: 'Metric collector agents track real-time container resource utilization, feeding back to control loops that dynamically scale container configurations without causing pod crashes.',
    precision: '94% Score',
    skills: ['Metric Collection', 'Dynamic Scaling', 'Out-Of-Memory Prevention']
  }
]

const COMPANY_PIPELINES = [
  { company: 'Stripe', role: 'Backend Engineer', applicantCount: 42, status: 'Auditing Profiles', color: 'bg-emerald-500' },
  { company: 'Vercel', role: 'Frontend Architect', applicantCount: 18, status: 'Speech Arena Prep', color: 'bg-amber-500' },
  { company: 'Airbnb', role: 'Systems SDE', applicantCount: 29, status: 'Originality Check', color: 'bg-primary' }
]

/* ─── High-Impact Placement Skill Matrix ────────────────────── */

const SKILL_DOMAINS = [
  {
    id: 'frontend',
    title: 'Frontend Architecture',
    desc: 'Verify web performance engineering and dynamic UI reconciliation capability.',
    icon: Layers,
    demand: '94%',
    advantage: '+18% placement rate',
    skills: ['Virtual DOM Diffing', 'Fiber Engine reconciliation', 'Hydration heuristics', 'Analytical bundle audits']
  },
  {
    id: 'backend',
    title: 'High-Performance Backend',
    desc: 'Validate database isolation levels, lock mechanics, and parallel processing.',
    icon: Network,
    demand: '98%',
    advantage: '+24% placement rate',
    skills: ['Optimistic Concurrency (OCC)', 'FIFO Message Queues', 'Distributed 2PC transactions', 'JSON Web Signatures']
  },
  {
    id: 'infra',
    title: 'Infrastructure & SRE',
    desc: 'Ensure automated pod scaling, metrics auditing, and reliable gateways.',
    icon: ShieldCheck,
    demand: '91%',
    advantage: '+15% placement rate',
    skills: ['Horizontal Pod Autoscalers', 'Terraform IaC blueprints', 'Container ingress logic', 'Redis rate-limiting']
  },
  {
    id: 'data',
    title: 'Data Systems Engineering',
    desc: 'Check indexing layout, schema structure, and analytical flow alignment.',
    icon: Database,
    demand: '89%',
    advantage: '+12% placement rate',
    skills: ['B-Tree Indexing optimizations', 'Change Data Capture (CDC)', 'Normalization normal forms', 'Kafka event processing']
  }
]

/* ─── Scroll-Driven Process Timeline ───────────────────────── */

function ScrollPipeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  const pathLength = useTransform(scrollYProgress, [0.15, 0.85], [0, 1])

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto px-6 py-24">
      {/* Central Terracotta Path Connector */}
      <div className="absolute left-[33px] md:left-1/2 top-0 bottom-0 w-[2px] bg-stone-200 hidden sm:block">
        <motion.div
          className="absolute top-0 left-0 right-0 bottom-0 origin-top bg-gradient-to-b from-primary via-accent to-transparent"
          style={{ scaleY: pathLength }}
        />
      </div>

      <div className="space-y-36">
        {STEPS.map((item, idx) => {
          const isEven = idx % 2 === 0
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col sm:flex-row items-start gap-8 sm:gap-20 relative ${
                isEven ? '' : 'sm:flex-row-reverse'
              }`}
            >
              {/* Central Dynamic Dot */}
              <div className="absolute left-[33px] sm:left-1/2 top-1 -translate-x-[50%] z-10 hidden sm:flex items-center justify-center size-9 rounded-full bg-white border border-stone-200 shadow-sm">
                <span className="font-heading text-xs font-bold text-primary">{item.step}</span>
              </div>

              {/* Information Panel */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">{item.highlight}</span>
                  <h3 className="font-heading text-2xl font-semibold text-foreground tracking-tight">{item.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-md font-medium">
                  {item.body}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-accent font-semibold tracking-widest uppercase bg-accent/5 px-2.5 py-1 rounded border border-accent/10">
                  {item.fallbackMetric}
                </div>
              </div>

              {/* Offset Balance */}
              <div className="flex-1 hidden sm:block" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Landing Page ─────────────────────────────────────── */

export default function Landing() {
  const { analysis } = useResume()
  const { user } = useAuth()

  const [speechIdx, setSpeechIdx] = useState(0)
  const [activeDomainIdx, setActiveDomainIdx] = useState(0)
  const [outputText, setOutputText] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [analyzingFile, setAnalyzingFile] = useState(false)
  const [analysisPercent, setAnalysisPercent] = useState(0)
  const [analysisCompleted, setAnalysisCompleted] = useState(false)

  const simIntervalRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current)
      }
    }
  }, [])

  // ─── Extract Live Platform State Data ─────────────────────
  const liveScore = useMemo(() => analysis?.final_score ?? 84, [analysis])
  const liveRole = useMemo(() => analysis?.role ?? 'Software Engineer', [analysis])
  const liveSkillsCount = useMemo(() => analysis?.detected_skills?.length ?? 12, [analysis])
  const liveCoverage = useMemo(() => analysis?.core_coverage_percent ?? 78, [analysis])
  const liveMissingCount = useMemo(() => {
    if (!analysis) return 5
    return (analysis.missing_core_skills?.length ?? 0) + (analysis.missing_optional_skills?.length ?? 0)
  }, [analysis])

  const startVoiceSimulator = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current)
    }
    setIsSimulating(true)
    setOutputText('')
    
    const fullSpeech = SPEECH_SCENARIOS[speechIdx].response || ''
    let currentText = ''
    let charI = 0
    
    simIntervalRef.current = setInterval(() => {
      if (charI < fullSpeech.length) {
        currentText += fullSpeech.charAt(charI)
        setOutputText(currentText)
        charI++
      } else {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current)
          simIntervalRef.current = null
        }
        setIsSimulating(false)
      }
    }, 15)
  }, [speechIdx])

  const onDragHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true)
    else if (e.type === 'dragleave') setIsDragging(false)
  }, [])

  const onDropHandler = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) startProfileAudits()
  }, [])

  const startProfileAudits = useCallback(() => {
    if (analyzingFile || analysisCompleted) return
    setAnalyzingFile(true)
    setAnalysisPercent(0)
    const iv = setInterval(() => {
      setAnalysisPercent(p => {
        if (p >= 100) {
          clearInterval(iv)
          setTimeout(() => { setAnalyzingFile(false); setAnalysisCompleted(true) }, 400)
          return 100
        }
        return p + 10
      })
    }, 100)
  }, [analyzingFile, analysisCompleted])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-background text-foreground selection:bg-primary/10 overflow-x-hidden"
    >
      {/* ── Minimalist Premium Header ───────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <div>
              <span className="font-heading text-sm font-bold tracking-tight text-foreground">CampusSync</span>
              <span className="ml-1 text-xs font-semibold uppercase tracking-widest text-primary">Edge OS</span>
            </div>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            <a href="#pipeline" className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 group">
              OS Pipeline
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#recruiters" className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 group">
              Recruiter Sync
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#skills" className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 group">
              Skill Matrix
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#speech" className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 group">
              Speech Arena
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a href="#attribution" className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1 group">
              Attribution Audit
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <Link to="/signup" className={buttonVariants({ size: "sm" }) + " shadow-sm text-xs font-semibold px-6 py-2.5 rounded-full flex items-center gap-1.5"}>
              Access Platform <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(v => !v)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </Button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-background md:hidden"
            >
              <div className="flex flex-col gap-1.5 p-4">
                <a href="#pipeline" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>OS Pipeline</a>
                <a href="#recruiters" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>Recruiter Sync</a>
                <a href="#skills" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>Skill Matrix</a>
                <a href="#speech" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>Speech Arena</a>
                <a href="#attribution" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>Attribution Audit</a>
                <Link to="/signup" className={buttonVariants({ size: "sm" }) + " mt-2 w-full text-center font-semibold flex justify-center gap-1.5"} onClick={() => setMobileMenuOpen(false)}>Access Platform <ArrowRight className="size-3.5" /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Section 1: Hero Gateway ────────────────── */}
      <section className="relative pt-28 pb-32 md:pt-40 md:pb-48 flex flex-col items-center justify-center bg-background">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-30%] left-[-10%] h-[650px] w-[650px] rounded-full bg-primary/4 blur-[130px]" />
          <div className="absolute top-[40%] right-[-15%] h-[550px] w-[550px] rounded-full bg-accent/4 blur-[110px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4.5 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Award className="size-3.5 text-primary" /> AI Career Intelligence for Engineers
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-heading text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl text-foreground max-w-4xl mx-auto"
          >
            57,100 resumes trained our AI. <span className="font-semibold italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Here's what it learned.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-muted-foreground font-medium"
          >
            ChatGPT gives text. We give a structured, tracked, verified roadmap.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="max-w-2xl mx-auto text-sm leading-relaxed text-muted-foreground/80"
          >
            Upload your resume. See your gaps. Close them before placement season. 95% ML accuracy — your resume data never leaves your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-5 pt-4"
          >
            <Link to="/signup" className={buttonVariants({ size: "lg" }) + " shadow-md font-semibold gap-2 rounded-full px-9 py-6 text-sm"}>Get Your Resume Score</Link>
            <Link to="/quick-score" className={buttonVariants({ variant: "outline", size: "lg" }) + " font-semibold rounded-full border-stone-200 bg-white hover:bg-stone-50 px-9 py-6 text-sm"}>Try Free — 30 Second Score</Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 pt-2"
          >
            {[
              { label: '95% ML Accuracy', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
              { label: 'Resume Never Leaves Browser', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
              { label: '57,100 Resumes Analyzed', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
            ].map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${b.color}`}>
                {b.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 2: Sandstone Process Funnel ────────────────── */}
      <section id="pipeline" className="relative py-28 border-t border-border bg-[#F4EFEA]/30">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-5 mb-24">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">OS Pipeline</span>
          <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
            A single connected experience.
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto font-medium leading-relaxed">
            We avoid disjointed tasks. Your diagnostics, missing requirements, and active repository audits interact as one pipeline.
          </p>
        </div>

        <ScrollPipeline />
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 3: Recruiter Connection Hub ──────── */}
      <section id="recruiters" className="relative py-28 border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 grid gap-16 md:grid-cols-2 items-center">
          {/* Text Description */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Recruiter Sync</span>
            <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
              Direct pipeline to active placements.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground font-medium">
              Eliminate arbitrary agency screeners. CampusSync continuously syncs your verified profile milestones directly to partnering company applicant databases.
            </p>

            <div className="space-y-5 pt-3">
              {[
                { title: 'Live recruiter dashboard sync', desc: 'Partnering recruitment teams query student profile diagnostics in real-time.' },
                { title: 'Pathways match index', desc: 'Instantly highlights matching roles based on your verified skill metrics.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded bg-primary/10 font-bold text-primary text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{item.title}</div>
                    <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed font-medium">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Placement Pipeline Visuals */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-stone-50 rounded-2xl p-7 border border-stone-200 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-5 mb-5">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-400">Live Workspace Footprint</span>
                  <h4 className="text-xs font-bold text-foreground mt-0.5">{user?.name ? `${user.name}'s Profile` : 'Active Auditor Profile'}</h4>
                </div>
                <Badge variant="outline" className="text-xs font-bold bg-white text-primary border-primary/20 px-2.5 py-0.5 rounded-full">CONNECTED</Badge>
              </div>

              {/* Dynamic Live Placement Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <div className="text-xs font-bold text-stone-400 uppercase">Readiness Score</div>
                  <div className="font-heading text-2xl font-bold text-primary mt-1">{liveScore}%</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Target: {liveRole}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <div className="text-xs font-bold text-stone-400 uppercase">Core Skills Map</div>
                  <div className="font-heading text-2xl font-bold text-accent mt-1">{liveSkillsCount} Detected</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">{liveCoverage}% Core Coverage</div>
                </div>
              </div>

              <div className="space-y-3">
                {COMPANY_PIPELINES.map(pipe => (
                  <div key={pipe.company} className="flex items-center justify-between bg-white px-4 py-3.5 rounded-xl border border-stone-200/60 shadow-sm">
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {pipe.company} <span className="text-xs text-stone-400 font-medium">• {pipe.role}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{pipe.applicantCount} candidates matched</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`size-1.5 rounded-full ${pipe.color}`} />
                      <span className="text-xs font-bold text-foreground">{pipe.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 4: Dynamic Skill Alignment Matrix (Brand New Interactive Core) ── */}
      <section id="skills" className="relative py-28 border-t border-border bg-[#F4EFEA]/30">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Skill Matrix</span>
            <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
              Engineered for absolute placement fit.
            </h2>
            <p className="text-base text-muted-foreground font-medium leading-relaxed">
              Ditch superficial bullet points. Interactive diagnostics verify real engineering capabilities that match actual firm constraints.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-5 items-stretch">
            {/* Interactive Domain List (Left Side - occupies 2/5ths) */}
            <div className="md:col-span-2 space-y-3">
              {SKILL_DOMAINS.map((domain, index) => {
                const Icon = domain.icon
                const isActive = activeDomainIdx === index
                return (
                  <button
                    key={domain.id}
                    type="button"
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex gap-4 items-start ${
                      isActive
                        ? 'bg-white border-primary/20 shadow-md translate-x-2'
                        : 'bg-transparent border-transparent hover:bg-stone-100/60'
                    }`}
                    onClick={() => setActiveDomainIdx(index)}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-stone-200/50 text-stone-500'}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-base font-bold text-foreground flex items-center gap-2">
                        {domain.title}
                        {isActive && (
                          <motion.span
                            layoutId="active-indicator"
                            className="size-1.5 rounded-full bg-primary"
                          />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground font-medium leading-relaxed">{domain.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Interactive Skill Indicator Panel (Right Side - occupies 3/5ths) */}
            <div className="md:col-span-3 flex">
              <div className="w-full bg-white rounded-2xl p-8 border border-stone-200 shadow-md relative flex flex-col justify-between overflow-hidden">
                {/* Background decorative path loops */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-primary pointer-events-none">
                  <LogoMark size={140} />
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Verifying Pathway Gaps</span>
                      <h3 className="font-heading text-2xl font-bold text-foreground mt-0.5">{SKILL_DOMAINS[activeDomainIdx].title}</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-transparent text-xs font-bold px-3 py-1 rounded-full">
                      {SKILL_DOMAINS[activeDomainIdx].demand} Placements Match
                    </Badge>
                  </div>

                  {/* Dynamic Floating Sub-Skills with spring entrance animation */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Required Architectural Signatures</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <AnimatePresence mode="wait">
                        {SKILL_DOMAINS[activeDomainIdx].skills.map((subSkill, subIdx) => (
                          <motion.div
                            key={subSkill}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, delay: subIdx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-stone-50 px-4 py-3 rounded-xl border border-stone-200/50 shadow-sm text-xs font-semibold text-foreground flex items-center gap-2.5"
                          >
                            <span className="size-1.5 rounded-full bg-accent" />
                            {subSkill}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Demand Index Metrics Footer */}
                <div className="border-t border-stone-200/60 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-stone-400">Placements Advantage</div>
                    <div className="font-heading text-xl font-bold text-accent mt-0.5">{SKILL_DOMAINS[activeDomainIdx].advantage}</div>
                  </div>
                  <Link
                    to="/signup"
                    className={buttonVariants({ variant: "outline", size: "sm" }) + " font-bold text-xs py-4 px-5 rounded-full border-stone-200 hover:bg-stone-50"}
                  >
                    Audit My {SKILL_DOMAINS[activeDomainIdx].title.split(' ')[0]} Skills <ArrowRight className="size-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 5: Pure Speech Arena Sandbox ───────────────── */}
      <section id="speech" className="relative py-28 border-t border-border bg-white">
        <div className="relative z-10 max-w-6xl mx-auto px-6 grid gap-16 md:grid-cols-2 items-center">
          {/* Interactive Console Sandbox */}
          <div className="bg-stone-50 rounded-2xl p-7 relative overflow-hidden shadow-sm border border-stone-200">
            <div className="space-y-6 relative z-10">
              {/* Simulated Console Header */}
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
                <div className="flex gap-1.5">
                  <div className="size-2 rounded-full bg-[#FF5F56]" />
                  <div className="size-2 rounded-full bg-[#FFBD2E]" />
                  <div className="size-2 rounded-full bg-[#27C93F]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground tracking-wider">vocal_arena_panel</span>
              </div>

              {/* Scenario selector tabs */}
              <div className="flex gap-1 bg-stone-200/50 p-1 rounded-xl">
                {SPEECH_SCENARIOS.map((tab, idx) => (
                  <button
                    key={tab.role}
                    type="button"
                    className={`flex-1 py-2.5 text-center rounded-lg font-heading text-xs font-bold transition-all duration-150 ${
                      speechIdx === idx
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (simIntervalRef.current) {
                        clearInterval(simIntervalRef.current)
                        simIntervalRef.current = null
                      }
                      setSpeechIdx(idx)
                      setOutputText('')
                      setIsSimulating(false)
                    }}
                  >
                    {tab.role.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Prompt</span>
                <div className="text-xs font-bold text-foreground leading-relaxed">{SPEECH_SCENARIOS[speechIdx].question}</div>
              </div>

              {/* Simulated response log */}
              <div className="min-h-[135px] rounded-xl bg-white p-4 border border-stone-200 overflow-y-auto">
                <p className="text-[11px] leading-relaxed text-foreground font-mono">
                  {outputText || <span className="italic text-stone-400">Trigger vocal practice simulation below...</span>}
                </p>
              </div>

              {/* Precision diagnostics */}
              <div className="flex justify-between items-center border-t border-stone-200/60 pt-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-400">Lexical Index</div>
                  <div className="font-heading text-lg font-bold text-primary mt-0.5">{SPEECH_SCENARIOS[speechIdx].precision}</div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                  {SPEECH_SCENARIOS[speechIdx].skills.map(c => (
                    <Badge key={c} variant="outline" className="border-accent/15 bg-accent/5 text-accent text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full font-bold text-xs py-4.5 rounded-xl border-stone-200 bg-white hover:bg-stone-50 gap-2"
                onClick={startVoiceSimulator}
                disabled={isSimulating}
              >
                <Play className="size-3 fill-current text-primary" />
                {isSimulating ? 'Calibrating speech inputs...' : 'Simulate mock verbal response'}
              </Button>
            </div>
          </div>

          {/* Narrative description */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Speech Arena</span>
            <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
              Perfect your technical articulation.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground font-medium">
              Improve verbal response flow in seconds. Our Vocal Arena measures lexical keyword coverage, architectural keyphrases, and conceptual clarity to grade spoken interview solutions dynamically.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 6: Authenticity Audit Logs ────────────────── */}
      <section id="attribution" className="relative py-28 border-t border-border bg-[#F4EFEA]/30">
        <div className="max-w-6xl mx-auto px-6 grid gap-16 md:grid-cols-2 items-center">
          {/* Narrative description */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80">Attribution Audit</span>
            <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
              Verify structural project authorship.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground font-medium">
              Stand out immediately in recruitment boards. CampusSync registers codebase attributions, verifying actual commit signatures, build success logs, and complexity audits directly to your student credentials.
            </p>
          </div>

          {/* Visual audit panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-7 border border-stone-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-2 border-b border-stone-200/60 pb-4 mb-4">
                <Github className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs text-muted-foreground">git_attribution_audit</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Authorship signature verification', status: 'VERIFIED', color: 'text-accent border-accent/15 bg-accent/5' },
                  { label: 'Commit history footprint check', status: 'VERIFIED', color: 'text-accent border-accent/15 bg-accent/5' },
                  { label: 'Project complexity diagnostic', status: 'VERIFIED', color: 'text-accent border-accent/15 bg-accent/5' },
                  { label: 'Plagiarism scan attribution', status: 'CLEAN', color: 'text-accent border-accent/15 bg-accent/5' }
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200/60">
                    <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
                    <Badge variant="outline" className={`${item.color} text-[8px] font-bold px-1.5 py-0.5 rounded-md`}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-stone-200/60 pt-4 text-xs font-bold text-accent flex items-center gap-2">
                <CheckCircle2 className="size-4 text-accent" /> ATTRIBUTION STAMP — Verified codebase footprints mapped
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Section 7: Gateway Sandbox CTA ───────────────────── */}
      <section className="relative py-28 border-t border-border bg-white">
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center space-y-8">
          <h2 className="font-heading text-4xl font-semibold text-foreground tracking-tight sm:text-5xl">
            Audit your placement status.
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
            Securely submit your engineering profile to audit layout deficits, missing keywords, and test conceptual verbal skills in under a minute.
          </p>

          {/* Interactive drop sandbox */}
          <div
            className={`relative p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              analysisCompleted ? 'border-primary bg-primary/5' :
              isDragging ? 'border-primary bg-primary/5' :
              'border-stone-300 bg-stone-50 hover:border-primary/40 hover:bg-stone-100/60'
            }`}
            onDragEnter={onDragHandler}
            onDragOver={onDragHandler}
            onDragLeave={onDragHandler}
            onDrop={onDropHandler}
            onClick={startProfileAudits}
          >
            {analyzingFile ? (
              <div className="space-y-4">
                <div className="text-xl animate-spin">⏳</div>
                <div className="text-[11px] font-bold text-foreground">Running layout parsing diagnostics ({analysisPercent}%)</div>
                <div className="h-1.5 w-36 mx-auto rounded-full bg-stone-200 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-150" style={{ width: `${analysisPercent}%` }} />
                </div>
              </div>
            ) : analysisCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-left space-y-4"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4.5 text-accent animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Audit Diagnostic Report</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none text-xs font-bold px-2 py-0.5 rounded-md">
                    Score: 81 / 100
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs text-stone-500 font-bold uppercase tracking-widest">Crucial Placement Deficits</div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 bg-red-50/50 border border-red-100 p-2.5 rounded-xl text-xs text-red-700">
                      <span className="font-bold shrink-0">CRITICAL:</span>
                      <span>Your resume layout uses a dual-column design which fails ATS scanner checks. We recommend converting to an elegant single-column schema.</span>
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-xs text-amber-700">
                      <span className="font-bold shrink-0">MISSING:</span>
                      <span>3 critical corporate backend SDE terms absent (optimistic locking, change data capture, distributed transaction isolation).</span>
                    </div>

                    <div className="flex items-start gap-2 bg-green-50/50 border border-green-100 p-2.5 rounded-xl text-xs text-green-700">
                      <span className="font-bold shrink-0">STAMPED:</span>
                      <span>Github authorships verified (attic repositories validated).</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs text-stone-400 font-mono border-t border-stone-100 mt-2">
                  <span>File: engineering_resume.pdf</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAnalysisCompleted(false)
                      setAnalysisPercent(0)
                    }}
                    className="hover:text-primary underline cursor-pointer font-bold transition-colors"
                  >
                    Re-upload resume
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto size-8 text-stone-400" />
                <div className="text-xs font-bold text-foreground">Drag and drop your engineering resume here</div>
                <div className="text-xs text-stone-500 font-semibold tracking-wider">LOCALIZED PROFILE DIAGNOSTIC HUB</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/signup" className={buttonVariants({ size: "lg" }) + " shadow-md font-semibold gap-2 rounded-full px-9 py-6 text-sm"}>Assess My Profile</Link>
            <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg" }) + " font-semibold gap-2 rounded-full border-stone-200 bg-white hover:bg-stone-50 px-9 py-6 text-sm"}>
              <Github className="size-4" /> View Repository <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Social Proof ────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6">
        <div className="mx-auto max-w-5xl">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {[
              { value: '57,100', label: 'Resumes Trained On', icon: FileText },
              { value: '95%', label: 'ML Accuracy', icon: Layers },
              { value: '7', label: 'Career Roles', icon: Briefcase },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-6 text-center">
                <s.icon className="size-5 text-primary" />
                <span className="font-heading text-2xl font-bold text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">What Beta Testers Say</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: 'The skill gap analysis alone saved me months of guessing what to learn. I went from 45% to 82% readiness in 3 weeks.',
                name: 'Priya Sharma',
                role: 'Final Year, Computer Science',
                rating: 5,
              },
              {
                quote: 'The interview simulator is brutally honest — exactly what I needed. My confidence during actual placement interviews shot up.',
                name: 'Arjun Mehta',
                role: 'Pre-Final Year, IT',
                rating: 5,
              },
              {
                quote: 'I love how it maps my resume against actual job requirements. No other tool does this with such precision for Indian engineering students.',
                name: 'Sneha Patel',
                role: 'Final Year, ECE',
                rating: 4,
              },
            ].map((t) => (
              <Card key={t.name} className="premium-hover-card bg-white">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3.5 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Section Divider */}
      <div className="w-full flex items-center justify-center py-2 bg-transparent">
        <div className="w-full max-w-6xl px-6 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-primary/10" />
          <LogoMark size={14} />
          <div className="h-[1px] flex-1 bg-primary/10" />
        </div>
      </div>

      {/* ── Editorial Footer ────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-12 relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={24} />
            <div>
              <div className="text-xs font-bold text-foreground">CampusSync Edge OS</div>
              <div className="text-xs text-stone-400 font-semibold uppercase tracking-widest mt-0.5">Continuous Placement Engine</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <a href="https://campussync-edge.onrender.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">Live App <ArrowUpRight className="inline size-3" /></a>
            <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">GitHub <ArrowUpRight className="inline size-3" /></a>
            <Link to="/privacy" className="hover:text-primary transition-colors flex items-center gap-1">Privacy <ArrowUpRight className="inline size-3" /></Link>
            <Link to="/docs" className="hover:text-primary transition-colors flex items-center gap-1">Docs <ArrowUpRight className="inline size-3" /></Link>
          </div>
          <div className="text-xs text-stone-400 font-medium">© 2026 CampusSync Edge • Placement OS</div>
        </div>
      </footer>
    </motion.div>
  )
}
