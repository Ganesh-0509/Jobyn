import { Link } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  BarChart2, FileText, Zap, MessageSquare, GitCompare, Shield,
  Upload, ChevronRight, ArrowRight, CheckCircle2, AlertTriangle,
  Play, Github, ExternalLink, Sparkles
} from 'lucide-react'
import LogoMark from '../components/LogoMark'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

/* ─── Data ─────────────────────────────────────────────────── */

const STATS = [
  { val: '82.1%', lbl: 'ML model accuracy', icon: BarChart2 },
  { val: '7', lbl: 'Engineering roles scored', icon: FileText },
  { val: '30+', lbl: 'Interview questions', icon: MessageSquare },
  { val: '16k+', lbl: 'Skill connections mapped', icon: Zap },
]

const SIMULATOR_QUESTIONS = [
  {
    role: 'Backend SDE',
    question: 'Explain the difference between optimistic and pessimistic locking in database transaction management.',
    simulatedAnswer: 'Optimistic locking assumes transactions can complete without conflict - it checks before committing. Pessimistic locking blocks the resource upfront, preventing concurrent updates from happening at all.',
    score: '84%',
    conceptsCovered: ['ACID', 'Concurrency', 'Dist. Consensus'],
  },
  {
    role: 'Frontend SDE',
    question: 'What is the Virtual DOM reconciliation algorithm in React, and how does the key prop optimize array rendering performance?',
    simulatedAnswer: 'The Virtual DOM compares the virtual tree with the actual tree using diffing. The key prop helps React uniquely identify elements across renders, avoiding unnecessary DOM re-creation.',
    score: '91%',
    conceptsCovered: ['Fiber', 'Diffing', 'Key Reconciliation'],
  },
  {
    role: 'Data Engineer',
    question: 'Describe how Apache Spark handles lazy evaluation and action execution in a distributed cluster network.',
    simulatedAnswer: 'Spark builds a Directed Acyclic Graph (DAG) when transformations are declared. It does not run them immediately. Only when an action like count() or collect() is called, does it optimize the graph and trigger execution.',
    score: '64%',
    conceptsCovered: ['DAG Engine', 'Lazy Eval', 'Transformations'],
  }
]

const STEPS = [
  { num: '01', title: 'Upload Resume', desc: 'Submit your resume in seconds. No signup required to get started.' },
  { num: '02', title: 'AI Analysis', desc: 'Advanced models extract your complete profile and identify gaps instantly.' },
  { num: '03', title: 'Get Your Roadmap', desc: 'Receive a personalized learning path built specifically for your goals.' },
]

const TESTIMONIALS = [
  { initials: 'SK', author: 'Siddharth Kapoor', role: 'Infrastructure Engineer, Bangalore', quote: 'It flagged that my distributed databases scaling was a critical gap. I fixed it, cleared the SDE-1 placement round, and the interviewer asked almost exactly the question CampusSync predicted.' },
  { initials: 'AN', author: 'Aparna Nair', role: 'Frontend Engineer, Hyderabad', quote: "The voice interview simulator is genuinely useful. Speaking answers out loud is completely different from typing them. It caught that I couldn't explain transaction concurrency under pressure." },
  { initials: 'RG', author: 'Rohan Gupta', role: 'ML Engineer, Pune', quote: 'The GitHub verifier is something I didn\'t know I needed. I used it to verify my capstone project before submitting job applications - the VERIFIED badge actually came up in my interview.' },
]

const SKILL_BARS = [
  { label: 'Systems Design', pct: 82, color: 'bg-success' },
  { label: 'Algorithms / DSA', pct: 74, color: 'bg-primary' },
  { label: 'Frontend Eng', pct: 91, color: 'bg-success' },
  { label: 'Cloud / Pipelines', pct: 45, color: 'bg-amber' },
]

/* ─── Helpers ──────────────────────────────────────────────── */

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <section id={id} ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </section>
  )
}

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [count, setCount] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const numMatch = target.match(/([\d.]+)/)
    if (!numMatch) { setCount(target); return }
    const num = parseFloat(numMatch[1])
    const prefix = target.slice(0, target.indexOf(numMatch[1]))
    const rest = target.slice(target.indexOf(numMatch[1]) + numMatch[1].length)
    const isFloat = target.includes('.')
    let frame = 0
    const totalFrames = 40
    const interval = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = num * eased
      setCount(`${prefix}${isFloat ? current.toFixed(1) : Math.round(current)}${rest}${suffix}`)
      if (frame >= totalFrames) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [isInView, target, suffix])

  return <span ref={ref}>{count}</span>
}

/* ─── Component ────────────────────────────────────────────── */

export default function Landing() {
  const [activeSimIndex, setActiveSimIndex] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simText, setSimText] = useState('')
  const [showBars, setShowBars] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFinished, setUploadFinished] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const barsInView = useInView(heroRef, { once: true, margin: '-100px' })

  useEffect(() => {
    if (barsInView) {
      const t = setTimeout(() => setShowBars(true), 400)
      return () => clearTimeout(t)
    }
  }, [barsInView])

  const startSimulatingText = useCallback(() => {
    setIsSimulating(true)
    setSimText('')
    const fullAnswer = SIMULATOR_QUESTIONS[activeSimIndex].simulatedAnswer
    let i = 0
    const iv = setInterval(() => {
      if (i < fullAnswer.length) {
        setSimText(prev => prev + fullAnswer.charAt(i))
        i++
      } else {
        clearInterval(iv)
        setIsSimulating(false)
      }
    }, 25)
  }, [activeSimIndex])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) simulateUpload()
  }, [])

  const simulateUpload = useCallback(() => {
    if (isUploading || uploadFinished) return
    setIsUploading(true)
    setUploadProgress(0)
    const iv = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(iv)
          setTimeout(() => { setIsUploading(false); setUploadFinished(true) }, 600)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }, [isUploading, uploadFinished])

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <div>
              <span className="font-heading text-sm font-bold tracking-tight">CampusSync</span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-primary">Edge AI</span>
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#simulator" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Interview Prep</a>
            <Button size="sm" className="shadow-sm font-semibold gap-1.5" render={<Link to="/signup" />}>Scan Resume Free <ArrowRight className="size-3.5" /></Button>
          </div>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNav(v => !v)} aria-label="Toggle menu">
            {mobileNav ? '✕' : '☰'}
          </Button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-background md:hidden"
            >
              <div className="flex flex-col gap-1 p-4 shadow-lg">
                <a href="#how" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted" onClick={() => setMobileNav(false)}>How it works</a>
                <a href="#features" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted" onClick={() => setMobileNav(false)}>Features</a>
                <a href="#simulator" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted" onClick={() => setMobileNav(false)}>Interview Prep</a>
                <Link to="/signup" className={buttonVariants({ size: "sm" }) + " mt-2 w-full text-center font-semibold flex justify-center gap-1.5"} onClick={() => setMobileNav(false)}>Scan Resume Free <ArrowRight className="size-3.5" /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        {/* Background mesh grid and orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
          <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-violet/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
              <Badge variant="outline" className="gap-1.5 border-primary/25 bg-primary/5 text-primary text-[11px] font-semibold py-1 px-3 rounded-full">
                <Sparkles className="size-3 text-primary animate-pulse" /> 82.1% Accurate ML Scoring Model
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-heading text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem] text-slate-900"
            >
              Know <span className="gradient-text">exactly</span> where you stand before placement season.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-lg text-[16px] leading-relaxed text-muted-foreground font-medium"
            >
              Upload your engineering resume. CampusSync analyzes your skills against 7 engineering career tracks, exposes missing critical capabilities, and builds a custom roadmap — zero guesswork.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link to="/signup" className={buttonVariants({ size: "lg" }) + " shadow-md font-semibold gap-2"}><ArrowRight className="size-4" /> Check my readiness</Link>
              <a href="#how" className={buttonVariants({ variant: "outline", size: "lg" }) + " font-semibold bg-white/60 backdrop-blur-xs"}>See how it works</a>
            </motion.div>
          </div>

          {/* Right Column — Readiness Report Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Floating badge */}
            <div className="absolute -top-3.5 -right-2.5 z-10 animate-bounce-slow">
              <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-3.5 py-1 text-[11px] font-bold text-success shadow-md backdrop-blur-md">
                <CheckCircle2 className="size-3.5 text-success" /> Live ML Auditor Active
              </div>
            </div>

            <Card className="border-border/60 shadow-xl bg-white/95 backdrop-blur-md p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">Ready Track Analyzer</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Backend SDE Track · Mapped in 0.4s</div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-4xl font-extrabold text-primary leading-none">78</div>
                  <div className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mt-1">/ 100 Readiness</div>
                </div>
              </div>

              <div className="space-y-4">
                {SKILL_BARS.map((bar, i) => (
                  <div key={bar.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">{bar.label}</span>
                      <span className="font-mono text-slate-700">{bar.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
                      <motion.div
                        className={`h-full rounded-full ${bar.color === 'bg-success' ? 'bg-success' : bar.color === 'bg-primary' ? 'bg-primary' : 'bg-amber'}`}
                        initial={{ width: 0 }}
                        animate={{ width: showBars ? `${bar.pct}%` : 0 }}
                        transition={{ delay: i * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Badge variant="outline" className="gap-1 border-error/30 bg-error/5 text-error text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <AlertTriangle className="size-3" /> Apache Spark missing
                </Badge>
                <Badge variant="outline" className="gap-1 border-amber/30 bg-amber/5 text-amber text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Next.js Routing gap
                </Badge>
                <Badge variant="outline" className="gap-1 border-success/30 bg-success/5 text-success text-[10px] font-bold px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="size-3" /> Algorithms 91%
                </Badge>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Strip ────────────────────────────────────── */}
      <Section className="border-y border-border/60 bg-white/50 backdrop-blur-md relative z-10 shadow-xs">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.lbl} className="text-center space-y-1">
              <div className="font-heading text-3xl font-extrabold text-slate-800 md:text-4xl">
                <AnimatedCounter target={stat.val} />
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.lbl}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How It Works ───────────────────────────────────── */}
      <Section id="how" className="px-6 py-24 md:py-32 bg-slate-50/40 relative">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-primary">Simple Workflow</div>
          <h2 className="text-center font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            From resume to placement roadmap <span className="gradient-text">in minutes.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[15px] text-muted-foreground font-medium">
            Zero sign-up fee to scan. Get a direct, transparent look at your core skill coverage instantly.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="relative h-full border-border/60 bg-white transition-all hover:shadow-md hover:border-slate-300 p-6">
                  <CardContent className="space-y-4 p-0">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 font-heading text-lg font-bold text-primary">
                      {step.num}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-800">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground font-medium">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Features Bento Grid ───────────────────────────────── */}
      <Section id="features" className="border-y border-border bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-primary">CampusSync Loop</div>
          <h2 className="text-center font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            A cohesive, connected growth loop.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[15px] text-muted-foreground font-medium">
            Preparation isn't separate stages. It's a continuous, AI-synchronized roadmap built entirely for your career engineering goals.
          </p>

          {/* Bento Grid */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {/* Box 1: Resume Analysis (md:col-span-2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="md:col-span-2"
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="flex flex-col md:flex-row h-full p-0">
                  <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-slate-800">Resume Analysis</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                        Deep ATS scanning, formatting structure check, and automated skill extraction in under five seconds.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">ATS Compatibility</Badge>
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Format Validation</Badge>
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Keyword Matching</Badge>
                    </div>
                  </div>
                  {/* Right side graphic */}
                  <div className="bg-slate-50/50 border-t md:border-t-0 md:border-l border-border/60 flex items-center justify-center p-6 md:w-64 shrink-0">
                    <div className="w-full space-y-3 rounded-lg border border-border/60 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">resume_parsed.pdf</span>
                        <Badge className="bg-success text-white hover:bg-success/90 text-[9px] font-bold px-1.5 py-0">94 Score</Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                        <div className="h-1.5 w-1/2 rounded bg-slate-100" />
                        <div className="h-1.5 w-5/6 rounded bg-slate-100" />
                      </div>
                      <Separator className="my-1.5 bg-slate-100" />
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-bold bg-primary/5 text-primary px-1.5 py-0.5 rounded">React</span>
                        <span className="text-[9px] font-bold bg-primary/5 text-primary px-1.5 py-0.5 rounded">Python</span>
                        <span className="text-[9px] font-bold bg-primary/5 text-primary px-1.5 py-0.5 rounded">SQL</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 2: Readiness Score (col-span-1) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <BarChart2 className="size-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-800">Readiness Score</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                      Automated calculations mapped against real engineering role benchmarks.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-center py-2">
                    <div className="relative flex items-center justify-center size-24 rounded-full border-4 border-primary/10">
                      <div className="absolute font-heading text-2xl font-extrabold text-primary">78%</div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-slow" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 3: Skill Gap Detection (col-span-1) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <Zap className="size-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-800">Skill Gap Detection</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                      Exposes missing software capabilities directly compared to active role listings.
                    </p>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs rounded-md border border-success/20 bg-success/5 px-2.5 py-1.5">
                      <span className="font-bold text-success">Docker & AWS</span>
                      <span className="text-[10px] font-bold text-success/80">Covered</span>
                    </div>
                    <div className="flex items-center justify-between text-xs rounded-md border border-amber/20 bg-amber/5 px-2.5 py-1.5">
                      <span className="font-bold text-amber">FastAPI / Redis</span>
                      <span className="text-[10px] font-bold text-amber/80">Missing Gap</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 4: Interview Simulator (md:col-span-2) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="md:col-span-2"
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="flex flex-col md:flex-row h-full p-0">
                  <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <MessageSquare className="size-5 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-slate-800">Interview Simulator</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                        On-device speech analyzer allows you to practice answering technical challenges under real-time constraints.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Web Speech API</Badge>
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Instant Grading</Badge>
                    </div>
                  </div>
                  {/* Right side mock speech bubble */}
                  <div className="bg-slate-50/50 border-t md:border-t-0 md:border-l border-border/60 flex items-center justify-center p-6 md:w-64 shrink-0">
                    <div className="w-full space-y-2">
                      <div className="rounded-lg bg-primary text-white p-3 text-[11px] font-medium shadow-sm">
                        Optimistic locking manages concurrency by...
                      </div>
                      <div className="rounded-lg bg-white border border-border/60 p-3 text-[10px] font-bold text-muted-foreground shadow-sm">
                        🎙️ Grade: 84% Concept Coverage
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 5: Resume Comparison (col-span-1) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="p-6 md:p-8 flex flex-col justify-between h-full">
                  <div>
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                      <GitCompare className="size-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-800">Resume Comparison</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                      Track scoring changes and skill trends across structural drafts.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border border-slate-200/80 rounded-lg p-3 bg-white shadow-xs">
                    <div className="text-center flex-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">v1 draft</div>
                      <div className="text-base font-extrabold text-amber font-heading mt-0.5">64</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">v2 final</div>
                      <div className="text-base font-extrabold text-success font-heading mt-0.5">82</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Box 6: GitHub Verifier (md:col-span-3) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="md:col-span-3"
            >
              <Card className="group h-full overflow-hidden border-border/60 bg-slate-50/20 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardContent className="flex flex-col md:flex-row h-full p-0">
                  <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                    <div>
                      <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <Shield className="size-5 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-slate-800">GitHub Project Authenticity Verifier</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-medium">
                        Automatically audits and ranks linked public repositories to verify authorship, validate project complexity, and guarantee project authenticity directly to recruiter portals.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Plagiarism Analysis</Badge>
                      <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold">Commit Auditing</Badge>
                    </div>
                  </div>
                  {/* Right side mock audits list */}
                  <div className="bg-slate-50/50 border-t md:border-t-0 md:border-l border-border/60 flex items-center justify-center p-6 md:w-80 shrink-0">
                    <div className="w-full space-y-2 text-left font-mono text-[10px] text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex justify-between border-b pb-1.5 border-slate-100">
                        <span className="font-bold text-primary">Repo Scan</span>
                        <span className="text-success font-extrabold">VERIFIED</span>
                      </div>
                      <div className="flex justify-between text-[9px] pt-1">
                        <span>Original Complexity:</span>
                        <span className="font-semibold text-success">Grade A-</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span>Copied Check:</span>
                        <span className="font-semibold text-success">Passed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── Interview Simulator ────────────────────────────── */}
      <Section id="simulator" className="px-6 py-24 md:py-32 bg-slate-50/30">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          {/* Left Text */}
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Speech Training</div>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
              Practice until <span className="gradient-text">technical answers feel natural.</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground font-medium">
              Immediate feedback on concept accuracy. The simulator calculates vocabulary alignment instantly and grades answers based on industry expectations.
            </p>

            <div className="space-y-5 pt-2">
              {[
                { title: 'Track-specific question banks', desc: 'Covering Frontend, Backend, Machine Learning, Systems, and Data Engineering paths.' },
                { title: 'Interactive speech input', desc: 'Evaluate your oral delivery under interview pressure using the Web Speech API.' },
                { title: 'Granular concept feedback', desc: 'AI pinpoints exact terms covered correctly and details critical definitions omitted.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-0.5 flex size-6.5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    <ChevronRight className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{item.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Interactive Terminal Mockup */}
          <Card className="border-border/60 overflow-hidden shadow-xl bg-white">
            {/* Title Bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-error/70" />
                <div className="size-2.5 rounded-full bg-amber/70" />
                <div className="size-2.5 rounded-full bg-success/70" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-muted-foreground font-semibold">
                arena_console · {SIMULATOR_QUESTIONS[activeSimIndex].role}
              </span>
            </div>

            <CardContent className="space-y-5 p-5">
              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-slate-100/80 p-1">
                {SIMULATOR_QUESTIONS.map((q, idx) => (
                  <button
                    key={q.role}
                    type="button"
                    className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold tracking-tight transition-all duration-150 ${
                      activeSimIndex === idx
                        ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                        : 'text-muted-foreground hover:text-slate-800'
                    }`}
                    onClick={() => { setActiveSimIndex(idx); setSimText(''); setIsSimulating(false) }}
                  >
                    {q.role}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Topic Challenge</div>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">{SIMULATOR_QUESTIONS[activeSimIndex].question}</p>
              </div>

              {/* Sandbox Answer Area */}
              <div className="min-h-[90px] rounded-lg border border-slate-200/60 bg-slate-50/40 p-4 shadow-inner">
                <p className="text-xs leading-relaxed text-slate-600 font-medium">
                  {simText || <span className="italic text-muted-foreground">Select simulating response below to preview performance grading...</span>}
                </p>
              </div>

              {/* Stats & Results */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evaluation Score</div>
                  <div className="font-heading text-xl font-extrabold text-primary mt-0.5">{SIMULATOR_QUESTIONS[activeSimIndex].score}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[60%]">
                  {SIMULATOR_QUESTIONS[activeSimIndex].conceptsCovered.map(c => (
                    <Badge key={c} variant="outline" className="border-success/20 bg-success/5 text-success text-[10px] font-bold px-2 py-0.5 rounded-md">{c}</Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full font-bold shadow-xs py-5 border-slate-200 hover:bg-slate-50 hover:text-slate-800 gap-2"
                disabled={isSimulating}
                onClick={startSimulatingText}
              >
                <Play className="size-3.5 fill-current" />
                {isSimulating ? 'Analyzing audio streams...' : 'Simulate voice practice input'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── GitHub Verifier Panel ────────────────────────────── */}
      <Section className="border-y border-border bg-white px-6 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          {/* Left Panel */}
          <div className="order-2 md:order-1">
            <Card className="border-border/60 overflow-hidden shadow-xl bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <Github className="size-4 text-muted-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground font-semibold">github.com/ganesh-0509/campus-sync-edge-ai</span>
              </div>
              <CardContent className="space-y-3 p-5">
                {[
                  { label: 'Original structure checking', verdict: 'PASS', color: 'text-success border-success/20 bg-success/5' },
                  { label: 'Stack signature alignment', verdict: 'PASS', color: 'text-success border-success/20 bg-success/5' },
                  { label: 'Non-trivial architectural files', verdict: 'PASS', color: 'text-success border-success/20 bg-success/5' },
                  { label: 'Complexity evaluation thresholds', verdict: 'PASS', color: 'text-success border-success/20 bg-success/5' },
                  { label: 'Template boilerplate detection', verdict: 'NO FLAG', color: 'text-success border-success/20 bg-success/5' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/40 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-700">{row.label}</span>
                    <Badge variant="outline" className={`${row.color} text-[10px] font-bold px-2 py-0.5 rounded-md`}>
                      {row.verdict}
                    </Badge>
                  </div>
                ))}
                <Separator className="bg-slate-100 my-2" />
                <div className="flex items-center gap-2 text-sm font-bold text-success">
                  <CheckCircle2 className="size-4.5 text-success" /> AI AUDIT SUCCESS — Project is authentic
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="order-1 md:order-2 space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Plagiarism Verification</div>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
              Prove your projects are <span className="gradient-text">genuinely yours.</span>
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground font-medium">
              Eliminate boilerplate template skepticism. CampusSync parses architecture configurations, checks commit histories, and marks your code as authentic directly on recruiter-shareable sheets.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="border-success/30 bg-success/10 text-success font-bold px-3 py-1 rounded-full">VERIFIED</Badge>
              <Badge variant="outline" className="border-amber/30 bg-amber/10 text-amber font-bold px-3 py-1 rounded-full">Boilerplate flagged</Badge>
              <Badge variant="outline" className="border-error/30 bg-error/10 text-error font-bold px-3 py-1 rounded-full">Suspicious attribution</Badge>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <Section className="px-6 py-24 md:py-32 bg-slate-50/30">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Student feedback</div>
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            From students who <span className="gradient-text">actually got placed.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[15px] text-muted-foreground font-medium">
            Read comments from seniors who used CampusSync to target and patch their learning deficits.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="h-full border-border/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <CardContent className="space-y-6 p-0 flex flex-col justify-between h-full">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, j) => (
                        <span key={j} className="text-amber text-sm font-bold">★</span>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 font-medium italic">"{t.quote}"</p>
                    <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
                      <div className="flex size-9.5 items-center justify-center rounded-full bg-primary/10 font-heading text-xs font-bold text-primary">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{t.author}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <Section className="border-t border-border bg-white px-6 py-24 md:py-32 relative">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/5 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center space-y-6">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            Ready to find out where you stand?
          </h2>
          <p className="mx-auto max-w-xl text-[15px] text-muted-foreground font-medium leading-relaxed">
            Upload your resume now to generate an immediate, comprehensive readiness report mapping 7 developer and engineering paths — takes less than 60 seconds.
          </p>

          {/* Dropzone */}
          <div
            className={`relative mx-auto max-w-xl cursor-pointer rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
              uploadFinished ? 'border-success bg-success/5' :
              dragActive ? 'border-primary bg-primary/5' :
              'border-slate-200 bg-slate-50/50 hover:border-primary/45 hover:bg-slate-50'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={simulateUpload}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="text-3xl animate-bounce">⏳</div>
                <div className="text-sm font-bold text-slate-700">Analyzing resume structures ({uploadProgress}%)</div>
                <Progress value={uploadProgress} className="mx-auto h-2 w-48 bg-slate-100" />
              </div>
            ) : uploadFinished ? (
              <div className="flex flex-col items-center justify-center gap-3 text-sm font-bold text-success">
                <CheckCircle2 className="size-6 text-success animate-pulse" />
                <span>Resume parsed successfully. Redirecting to matching scorecards...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto size-9 text-slate-400 group-hover:text-primary transition-colors" />
                <div className="text-sm font-bold text-slate-700">Drag & drop your resume files here</div>
                <div className="text-[11px] text-muted-foreground font-medium">Supports PDF or DOCX format · Fully encrypted at rest</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/signup" className={buttonVariants({ size: "lg" }) + " shadow-md font-semibold gap-2"}><ArrowRight className="size-4" /> Scan Resume Free</Link>
            <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg" }) + " font-semibold gap-2 bg-white shadow-xs"}>
              <Github className="size-4" /> View on GitHub <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-slate-50 py-12 relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={24} />
            <div>
              <div className="text-sm font-bold text-slate-800">CampusSync Edge AI</div>
              <div className="text-[11px] text-muted-foreground font-medium">Career Intelligence for Engineering placements</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="https://campussync-edge.onrender.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Live App <ExternalLink className="inline size-3" /></a>
            <a href="https://github.com/Ganesh-0509/Campus-Sync-Edge-Ai" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub <ExternalLink className="inline size-3" /></a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <div className="text-xs text-muted-foreground font-medium">© 2026 CampusSync Edge AI · Built by Ganesh</div>
        </div>
      </footer>
    </div>
  )
}
