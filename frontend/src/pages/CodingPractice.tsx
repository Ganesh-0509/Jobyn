import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import {
  getCodingProblems, getCodingProblem, submitCodeSolution,
  type CodingProblem, type SubmissionResult,
} from '../api/client'
import { awardXP } from '../utils/streakTracker'
import {
  Code, ArrowLeft, ArrowRight, Play, Send, CheckCircle, XCircle,
  Loader2, Clock, Tag, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
}

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go'] as const
type Language = typeof LANGUAGES[number]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'border-success/30 bg-success/5 text-success',
  medium: 'border-warning/30 bg-warning/5 text-warning',
  hard: 'border-destructive/30 bg-destructive/5 text-destructive',
}

export default function CodingPractice() {
  const navigate = useNavigate()
  const { analysis } = useResume()
  const { user } = useAuth()

  const [problems, setProblems] = useState<CodingProblem[]>([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null)
  const [problemLoading, setProblemLoading] = useState(false)
  const [difficulty, setDifficulty] = useState<string>('all')
  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [error, setError] = useState('')

  // Fetch problems
  useEffect(() => {
    if (!analysis) return
    const ctl = new AbortController()
    setProblemsLoading(true)
    const params = difficulty !== 'all' ? { difficulty } : undefined
    getCodingProblems(params)
      .then(data => { if (!ctl.signal.aborted) setProblems(data.problems) })
      .catch(() => {})
      .finally(() => { if (!ctl.signal.aborted) setProblemsLoading(false) })
    return () => ctl.abort()
  }, [analysis, difficulty])

  // Load problem detail
  const handleSelectProblem = useCallback(async (slug: string) => {
    setProblemLoading(true); setError(''); setResult(null)
    try {
      const problem = await getCodingProblem(slug)
      setSelectedProblem(problem)
      // Set starter code for the selected language
      const starter = problem.starter_code?.[language] || problem.starter_code?.python || ''
      setCode(starter)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load problem')
    } finally {
      setProblemLoading(false)
    }
  }, [language])

  // Update starter code when language changes
  useEffect(() => {
    if (selectedProblem) {
      const starter = selectedProblem.starter_code?.[language] || ''
      setCode(starter)
      setResult(null)
    }
  }, [language, selectedProblem])

  const handleSubmit = useCallback(async () => {
    if (!selectedProblem || !code.trim()) return
    setSubmitting(true); setError(''); setResult(null)
    try {
      const data = await submitCodeSolution(selectedProblem.id, language, code)
      setResult(data)
      // Award XP on accepted
      if (data.status === 'accepted' || data.passed === data.total) {
        const email = user?.email
        awardXP('project_verified', email, `coding-${selectedProblem.slug}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [selectedProblem, language, code, user?.email])

  const handleRun = useCallback(async () => {
    if (!selectedProblem || !code.trim()) return
    setSubmitting(true); setError(''); setResult(null)
    try {
      const data = await submitCodeSolution(selectedProblem.id, language, code)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Run failed')
    } finally {
      setSubmitting(false)
    }
  }, [selectedProblem, language, code])

  const getDiffBadge = (diff: string) => {
    const variant = DIFFICULTY_COLORS[diff.toLowerCase()] || ''
    return (
      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${variant}`}>
        {diff}
      </span>
    )
  }

  // Locked state
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <Code className="size-7 text-primary" />
        </div>
        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          Coding Practice
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Upload and analyze your resume first to access coding problems tailored to your skill gaps.
        </p>
        <Button size="lg" className="mt-6 gap-2" onClick={() => navigate('/resume-analyzer')}>
          <Code className="size-4" /> Analyze Resume First
        </Button>
      </div>
    )
  }

  // Problem Detail View
  if (selectedProblem) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Back Button */}
        <motion.div variants={item}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => { setSelectedProblem(null); setResult(null); setCode('') }}
          >
            <ArrowLeft className="size-3" /> Back to Problems
          </Button>
        </motion.div>

        {/* Problem Header */}
        <motion.div variants={item}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {selectedProblem.title}
                </h1>
                {getDiffBadge(selectedProblem.difficulty)}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {selectedProblem.skill_tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] gap-1">
                    <Tag className="size-2.5" /> {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Split Layout */}
        <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Problem Description */}
          <Card className="premium-hover-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground">
                <p>{selectedProblem.description}</p>
              </div>

              {/* Example */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Example</div>
                <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs">
                  <div><span className="text-muted-foreground">Input:</span> {selectedProblem.example_input}</div>
                  <div className="mt-1"><span className="text-muted-foreground">Output:</span> {selectedProblem.example_output}</div>
                </div>
                {selectedProblem.explanation && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Explanation:</span> {selectedProblem.explanation}
                  </div>
                )}
              </div>

              {/* Constraints */}
              {selectedProblem.constraints && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Constraints</div>
                  <div className="text-xs text-foreground">{selectedProblem.constraints}</div>
                </div>
              )}

              {/* Hints */}
              {selectedProblem.hints.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hints</div>
                  {selectedProblem.hints.map((hint, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                        Hint {i + 1}
                      </summary>
                      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Code Editor */}
          <div className="space-y-4">
            <Card className="premium-hover-card">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Solution</CardTitle>
                <Select value={language} onValueChange={v => setLanguage(v as Language)}>
                  <SelectTrigger size="sm" className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full min-h-[280px] rounded-lg border border-input bg-muted/30 p-4 font-mono text-sm leading-relaxed text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring/50"
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" className="gap-1.5" onClick={handleRun} disabled={submitting || !code.trim()}>
                    {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    Run Tests
                  </Button>
                  <Button className="gap-1.5" onClick={handleSubmit} disabled={submitting || !code.trim()}>
                    {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {result && (
              <Card className={`premium-hover-card ${result.status === 'accepted' || result.passed === result.total ? 'border-success/30' : 'border-destructive/30'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'accepted' || result.passed === result.total ? (
                        <CheckCircle className="size-4 text-success" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      <CardTitle className="text-base">
                        {result.status === 'accepted' || result.passed === result.total ? 'All Tests Passed!' : 'Some Tests Failed'}
                      </CardTitle>
                    </div>
                    <Badge variant={result.status === 'accepted' || result.passed === result.total ? 'default' : 'destructive'}>
                      {result.passed}/{result.total} Passed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.test_results.map((test, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${
                          test.passed
                            ? 'border border-success/10 bg-success/5 text-success'
                            : 'border border-destructive/10 bg-destructive/5 text-destructive'
                        }`}
                      >
                        {test.passed ? <CheckCircle className="size-3.5 shrink-0" /> : <XCircle className="size-3.5 shrink-0" />}
                        <span className="font-medium">Test {i + 1}</span>
                        {!test.passed && test.error && (
                          <span className="ml-auto truncate max-w-[60%]">{test.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {result.status === 'accepted' || result.passed === result.total ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/5 border border-success/10 px-3 py-2 text-xs text-success font-medium">
                      <CheckCircle className="size-3.5" /> +200 XP earned for solving this problem!
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
                <XCircle className="size-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // Problem List View
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <Badge variant="outline" className="gap-1.5 border-primary/20 text-[11px] uppercase tracking-wider">
          <Code className="size-3" /> Practice Arena
        </Badge>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Coding <span className="gradient-text">Practice</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solve problems tailored to your skill gaps. Earn XP for each accepted solution.
        </p>
      </motion.div>

      {/* Difficulty Filter */}
      <motion.div variants={item}>
        <Tabs value={difficulty} onValueChange={setDifficulty}>
          <TabsList variant="line">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="easy" className="text-xs">Easy</TabsTrigger>
            <TabsTrigger value="medium" className="text-xs">Medium</TabsTrigger>
            <TabsTrigger value="hard" className="text-xs">Hard</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Problem Grid */}
      <motion.div variants={item}>
        {problemsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : problems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map(problem => (
              <button
                key={problem.id}
                type="button"
                className="group flex flex-col rounded-xl border border-border/50 bg-muted/20 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                onClick={() => handleSelectProblem(problem.slug)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {problem.id}
                  </div>
                  {getDiffBadge(problem.difficulty)}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {problem.title}
                </h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {problem.skill_tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-[9px]">
                        {tag}
                      </Badge>
                    ))}
                    {problem.skill_tags.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{problem.skill_tags.length - 2}</span>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card className="premium-hover-card">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Code className="size-8" />
              <p className="text-sm">No problems found for this filter.</p>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDifficulty('all')}>
                Show All Problems
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  )
}
