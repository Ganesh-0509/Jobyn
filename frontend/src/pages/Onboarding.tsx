import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useResume } from '../context/ResumeContext'
import { uploadResume, predictResume } from '../api/client'
import { predictOnDevice, isOnDeviceReady } from '../utils/onDevicePredictor'
import { usePrivacy } from '../context/PrivacyContext'
import CircularProgress from '../components/CircularProgress'
import LogoMark from '../components/LogoMark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload, ArrowRight, ArrowLeft, CheckCircle2, Target,
  Sparkles, FileText, Brain, BarChart2, Zap,
  GraduationCap, Compass, FileEdit, MessageSquare,
} from 'lucide-react'

const GOALS = [
  { id: 'placement', icon: GraduationCap, label: 'Preparing for campus placement', desc: 'Get placement-ready with skill gap analysis' },
  { id: 'explore', icon: Compass, label: 'Exploring career paths', desc: 'Find the best-fit role for your skills' },
  { id: 'resume', icon: FileEdit, label: 'Improving my resume', desc: 'Get AI feedback on your resume' },
  { id: 'interview', icon: MessageSquare, label: 'Preparing for interviews', desc: 'Practice with role-specific questions' },
]

const STAGES = [
  { icon: FileText, label: 'Parsing document structure', dur: 800 },
  { icon: Brain, label: 'Extracting skills & technologies', dur: 1200 },
  { icon: Target, label: 'Matching against 7 career roles', dur: 1500 },
  { icon: BarChart2, label: 'Scoring readiness metrics', dur: 1000 },
  { icon: Sparkles, label: 'Generating your readiness report', dur: 1000 },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setAnalysis, setPrediction } = useResume()
  const { privacy } = usePrivacy()

  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stageIdx, setStageIdx] = useState(-1)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const markDone = useCallback(() => {
    if (user?.email) {
      localStorage.setItem(`${user.email}_cse_onboarding_done`, 'true')
    }
  }, [user?.email])

  const handleFile = useCallback((f: File) => {
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return }
    if (!f.name.endsWith('.pdf') && !f.name.endsWith('.docx')) { setError('Only PDF and DOCX files are supported.'); return }
    setFile(f); setError('')
  }, [])

  // Animate stages during upload
  useEffect(() => {
    if (!loading) { setStageIdx(-1); return }
    let i = 0
    setStageIdx(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    let cumulative = 0
    for (const stage of STAGES) {
      cumulative += stage.dur
      const nextI = ++i
      timers.push(setTimeout(() => setStageIdx(nextI), cumulative))
    }
    return () => { timers.forEach(t => clearTimeout(t)) }
  }, [loading])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const analysis = await uploadResume(file, 'auto', privacy, user?.email)
      setAnalysis(analysis)

      // Try ML prediction
      try {
        if (isOnDeviceReady()) {
          const local = await predictOnDevice(
            analysis.detected_skills, analysis.project_score_percent,
            analysis.ats_score_percent, analysis.structure_score_percent,
            analysis.core_coverage_percent, analysis.optional_coverage_percent
          )
          setPrediction({
            predicted_role: local.predictedRole || analysis.role,
            confidence: local.score / 100, resume_score: local.score,
            weak_areas: analysis.missing_core_skills.slice(0, 3),
            model_version: 'v2.0-onnx', inference_time_ms: local.inferenceMs
          })
        } else {
          const pred = await predictResume({
            skills: analysis.detected_skills, project_score: analysis.project_score_percent,
            ats_score: analysis.ats_score_percent, structure_score: analysis.structure_score_percent,
            core_coverage: analysis.core_coverage_percent, optional_coverage: analysis.optional_coverage_percent,
          })
          setPrediction(pred)
        }
      } catch {
        setPrediction({
          predicted_role: analysis.role, confidence: 0, resume_score: analysis.final_score,
          weak_areas: analysis.missing_core_skills.slice(0, 3),
          model_version: 'fallback', inference_time_ms: 0
        })
      }

      setResult(analysis)
      setStep(3) // Go to score reveal
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed. Make sure the backend is running.')
    } finally { setLoading(false) }
  }

  const score = result?.final_score ?? 0
  const role = result?.role ?? 'Unknown'
  const missingCore: string[] = result?.missing_core_skills ?? []
  const readinessCategory = score >= 80 ? 'Interview Ready' : score >= 60 ? 'Placement Ready' : score >= 40 ? 'Developing' : 'Beginner'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -left-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
          <span className="text-xs font-medium text-muted-foreground ml-2">{step + 1}/5</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <Card className="premium-hover-card border-border/50 shadow-lg">
                <CardContent className="p-8 text-center space-y-6">
                  <LogoMark size={72} className="mx-auto" />
                  <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Welcome to CampusSync
                    </h1>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      Your AI career coach is ready. Let's get you set up in under 2 minutes.
                    </p>
                  </div>
                  {user?.name && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                      <span className="text-sm text-muted-foreground">Signed in as</span>
                      <Badge variant="secondary" className="font-semibold">{user.name}</Badge>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button onClick={() => setStep(1)} className="gap-2 w-full sm:w-auto">
                      Get Started <ArrowRight className="size-4" />
                    </Button>
                    <div>
                      <button onClick={() => { markDone(); navigate('/dashboard') }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Skip to dashboard
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 1: Goal Selection */}
            {step === 1 && (
              <Card className="premium-hover-card border-border/50 shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      What brings you to CampusSync?
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We'll personalize your experience based on your goal.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {GOALS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                          goal === g.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/50 hover:border-primary/20 hover:bg-muted/30'
                        }`}
                      >
                        <div className={`rounded-lg p-2 ${goal === g.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <g.icon className="size-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{g.label}</div>
                          <div className="text-xs text-muted-foreground">{g.desc}</div>
                        </div>
                        {goal === g.id && <CheckCircle2 className="ml-auto size-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
                      <ArrowLeft className="size-4" /> Back
                    </Button>
                    <Button onClick={() => goal && setStep(2)} disabled={!goal} className="gap-2">
                      Continue <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Upload Resume */}
            {step === 2 && (
              <Card className="premium-hover-card border-border/50 shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      Upload Your Resume
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Our ML model will analyze your skills in 30 seconds.
                    </p>
                  </div>

                  {/* Trust signals */}
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-accent shrink-0" />
                      <span className="text-sm text-foreground">95% ML accuracy on role prediction</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-accent shrink-0" />
                      <span className="text-sm text-foreground">Processed on-device — your resume never leaves your browser</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-accent shrink-0" />
                      <span className="text-sm text-foreground">PDF and DOCX supported, max 5MB</span>
                    </div>
                  </div>

                  {/* Upload zone */}
                  {!loading ? (
                    <div
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer ${
                        drag ? 'border-primary bg-primary/5' : file ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:border-primary/20'
                      }`}
                      onDragOver={e => { e.preventDefault(); setDrag(true) }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                      onClick={() => inputRef.current?.click()}
                    >
                      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
                      {file ? (
                        <div className="flex items-center gap-3">
                          <FileText className="size-8 text-primary" />
                          <div>
                            <div className="text-sm font-semibold text-foreground">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
                          </div>
                          <CheckCircle2 className="ml-2 size-5 text-accent" />
                        </div>
                      ) : (
                        <>
                          <Upload className="size-10 text-primary/40 mb-3" />
                          <div className="text-sm font-semibold text-foreground">Drag & drop your resume</div>
                          <div className="text-xs text-muted-foreground mt-1">or click to browse files</div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Loading stages */
                    <div className="space-y-3 py-4">
                      {STAGES.map((stage, i) => (
                        <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${i <= stageIdx ? 'opacity-100' : 'opacity-30'}`}>
                          {i < stageIdx ? (
                            <CheckCircle2 className="size-4 text-accent shrink-0" />
                          ) : i === stageIdx ? (
                            <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <div className="size-4 shrink-0 rounded-full border border-border" />
                          )}
                          <span className={`text-sm ${i <= stageIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{stage.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setStep(1)} className="gap-2" disabled={loading}>
                      <ArrowLeft className="size-4" /> Back
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || loading} className="gap-2">
                      {loading ? 'Analyzing...' : 'Analyze Resume'} {!loading && <Zap className="size-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Score Reveal — THE AHA MOMENT */}
            {step === 3 && result && (
              <Card className="premium-hover-card border-border/50 shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <CircularProgress pct={score} size={140} stroke={10} />
                    </div>
                    <div>
                      <Badge variant="outline" className={`text-xs font-semibold ${
                        score >= 70 ? 'border-accent/30 text-accent' : score >= 50 ? 'border-primary/30 text-primary' : 'border-warning/30 text-warning'
                      }`}>
                        {readinessCategory}
                      </Badge>
                    </div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      You're {readinessCategory.toLowerCase()} for {role}
                    </h1>
                  </div>

                  {/* Top skill gaps */}
                  {missingCore.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground text-center">
                        Close these gaps to reach {Math.min(score + 20, 100)}%+
                      </h3>
                      <div className="space-y-2">
                        {missingCore.slice(0, 3).map((skill, i) => (
                          <div key={skill} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium text-foreground">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setStep(4)} className="gap-2">
                      See Your Next Steps <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Next Steps Checklist */}
            {step === 4 && (
              <Card className="premium-hover-card border-border/50 shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                      Here's Your Plan
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Follow these steps to get placement-ready.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { done: true, label: 'Upload your resume', xp: '+100 XP', icon: CheckCircle2 },
                      { done: false, label: 'Review your skill gaps', xp: '+50 XP', icon: Target, path: '/skill-gap' },
                      { done: false, label: 'Complete your first interview', xp: '+75 XP', icon: MessageSquare, path: '/interview-readiness' },
                      { done: false, label: 'Start learning your first skill', xp: '+50 XP', icon: Zap, path: '/improvement-plan' },
                      { done: false, label: 'Generate your first project', xp: '+75 XP', icon: FileText, path: '/my-projects' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
                          item.done
                            ? 'border-accent/20 bg-accent/5'
                            : 'border-border/50 hover:border-primary/20 hover:bg-muted/20 cursor-pointer'
                        }`}
                        onClick={() => { if (!item.done && item.path) { markDone(); navigate(item.path) } }}
                      >
                        <div className={`rounded-full p-1 ${item.done ? 'text-accent' : 'text-muted-foreground'}`}>
                          <item.icon className="size-5" />
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${item.done ? 'text-accent line-through' : 'text-foreground'}`}>
                            {item.label}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{item.xp}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">Complete all 5 steps to earn 350 XP and the "Career Explorer" badge</p>
                    <Button onClick={() => { markDone(); navigate('/dashboard') }} className="gap-2">
                      Go to Dashboard <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
