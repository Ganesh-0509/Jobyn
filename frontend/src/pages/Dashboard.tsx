import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useResume } from '../context/ResumeContext'
import { useAuth } from '../context/AuthContext'
import { getAnalytics } from '../api/client'
import { loadHistory, getHistoryOrDemo } from '../utils/history'
import { Upload, AlertCircle, Lightbulb, Activity, TrendingUp, Trophy, ArrowRight, BarChart2, Zap, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
}

export default function Dashboard() {
  const { analysis, prediction, bestFit, masteredSkills, loading } = useResume()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  useEffect(() => {
    const ctl = new AbortController()
    getAnalytics()
      .then(d => { if (!ctl.signal.aborted) setAnalytics(d) })
      .catch(err => { if (!ctl.signal.aborted) setAnalyticsError(err?.message || 'Failed to load analytics') })
    return () => ctl.abort()
  }, [])

  const chartHistory = useMemo(() => getHistoryOrDemo(loadHistory(user?.email)), [user?.email])
  const score = analysis?.final_score ?? 0
  const readiness = analysis?.readiness_category ?? 'Unknown'
  const masteredLower = useMemo(() => new Set(masteredSkills.map(s => s.toLowerCase())), [masteredSkills])
  const skills = useMemo(() => {
    const base = analysis?.detected_skills ?? []
    const extra = masteredSkills.filter(s => !base.some(b => b.toLowerCase() === s.toLowerCase()))
    return [...base, ...extra]
  }, [analysis, masteredSkills])
  const missingCore = useMemo(() => (analysis?.missing_core_skills ?? []).filter(s => !masteredLower.has(s.toLowerCase())), [analysis, masteredLower])
  const missingOpt = useMemo(() => (analysis?.missing_optional_skills ?? []).filter(s => !masteredLower.has(s.toLowerCase())), [analysis, masteredLower])
  const missingCount = missingCore.length + missingOpt.length
  const originalCorePct = analysis?.core_coverage_percent ?? 0
  const totalCoreSkills = (analysis?.detected_skills?.length ?? 0) + (analysis?.missing_core_skills?.length ?? 0)
  const newlyMasteredCore = (analysis?.missing_core_skills ?? []).filter(s => masteredLower.has(s.toLowerCase())).length
  const corePct = analysis ? Math.min(100, Math.round(originalCorePct + (totalCoreSkills > 0 ? (newlyMasteredCore / totalCoreSkills) * 100 : 0))) : 0

  const { SKILL_COVERAGE, TOP_MISSING } = useMemo(() => {
    const skillsLower = new Set(skills.map(x => x.toLowerCase()))
    const hasSkill = (list: string[]) => list.filter(s => skillsLower.has(s)).length
    const coverage = [
      { label: 'Programming Languages', pct: analysis ? Math.min(100, Math.round(hasSkill(['python', 'java', 'javascript', 'typescript', 'c', 'c++', 'go', 'rust', 'kotlin']) / 9 * 100)) : 0, color: 'bg-blue-500' },
      { label: 'Frameworks', pct: analysis ? Math.min(100, Math.round(hasSkill(['react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'spring', 'express', 'next']) / 9 * 100)) : 0, color: 'bg-cyan' },
      { label: 'Core CS Concepts', pct: analysis ? Math.min(100, Math.round(hasSkill(['dsa', 'sql', 'git', 'api', 'rest', 'testing', 'debugging', 'algorithms', 'data structures']) / 9 * 100)) : 0, color: 'bg-success' },
      { label: 'Tools & Platforms', pct: analysis ? Math.min(100, Math.round(hasSkill(['docker', 'aws', 'gcp', 'kubernetes', 'linux', 'git', 'ci/cd', 'terraform']) / 8 * 100)) : 0, color: 'bg-violet' },
    ]
    const missing = analysis ? [
      ...missingCore.slice(0, 3).map(s => ({ skill: s, priority: 'Critical' as const })),
      ...missingOpt.slice(0, 2).map(s => ({ skill: s, priority: 'High' as const })),
    ] : []
    return { SKILL_COVERAGE: coverage, TOP_MISSING: missing }
  }, [analysis, skills, missingCore, missingOpt])

  const METRICS = useMemo(() => [
    { label: 'Readiness Score', value: analysis ? `${score}%` : '--', sub: analysis ? (chartHistory.length > 1 ? `+${score - chartHistory[0].value}% overall` : 'First analysis') : 'No analysis yet', pct: score, icon: Activity, accent: 'text-primary' },
    { label: 'Core Skill Coverage', value: analysis ? `${corePct}%` : '--', sub: analysis ? `${skills.length} skills detected` : 'Upload resume', pct: corePct, icon: Lightbulb, accent: 'text-cyan' },
    { label: 'Missing Skills', value: analysis ? String(missingCount) : '--', sub: analysis ? `${Math.min(missingCount, 3)} high priority` : 'Pending analysis', pct: analysis ? Math.min(100, (missingCount / 10) * 100) : 0, icon: AlertCircle, accent: 'text-warning' },
    { label: 'Interview Readiness', value: analysis ? readiness : '--', sub: analysis ? (analytics?.total_analyses ? `${analytics.total_analyses} analyses` : 'First analysis') : 'Ready to start', pct: analysis ? score * 0.8 : 0, icon: BarChart2, accent: 'text-violet' },
  ], [analysis, score, corePct, missingCount, readiness, skills, chartHistory, analytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero */}
      <motion.div variants={item}>
        <Card className="premium-hover-card relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-violet/5">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Measure. Improve. <span className="gradient-text">Achieve.</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {user ? `Welcome back, ${user.name}! ` : ''}AI-powered career readiness intelligence for engineering students.
              </p>
            </div>
            <Button onClick={() => navigate('/resume-analyzer')} className="gap-2 shrink-0">
              <Upload className="size-4" />
              {analysis ? 'Re-Upload Resume' : 'Upload Resume'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Error */}
      {analyticsError && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {analyticsError}
          </div>
        </motion.div>
      )}

      {/* Metric Cards */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const Icon = m.icon
          return (
            <Card key={m.label} className="premium-hover-card relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg bg-muted p-1.5 ${m.accent}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className="font-heading text-2xl font-bold tracking-tight text-foreground">{m.value}</span>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground">{m.label}</div>
                  <Progress value={m.pct} className="mt-1.5 h-1.5" />
                  <div className="mt-1 text-[11px] text-muted-foreground/70">{m.sub}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Skill Coverage + Skill Gaps */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Skill Coverage */}
        <motion.div variants={item}>
          <Card className="premium-hover-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Skill Coverage</CardTitle>
              <CardDescription>Your proficiency across key areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SKILL_COVERAGE.map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">{s.pct}%</span>
                  </div>
                  <Progress value={s.pct} className="h-2" />
                </div>
              ))}
              {!analysis && (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <AlertCircle className="mr-2 size-4" /> Pending Analysis
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skill Gaps */}
        <motion.div variants={item}>
          <Card className="premium-hover-card h-full">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Skill Gaps</CardTitle>
                <CardDescription>Top critical skills to focus on</CardDescription>
              </div>
              {analysis && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/skill-gap')}>
                  View All <ArrowRight className="size-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {TOP_MISSING.length > 0 ? (
                <div className="space-y-2.5">
                  {TOP_MISSING.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 text-sm font-medium text-foreground">{item.skill}</span>
                      <Badge variant={item.priority === 'Critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : analysis ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-success">
                  <Trophy className="size-8" />
                  <p className="text-sm font-medium">All skill gaps resolved!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="size-8" />
                  <p className="text-sm">Analyze a resume to see skill gaps</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Best Fit Recommendation */}
      {bestFit && (bestFit.predicted_role !== analysis?.role || (score < 50 && bestFit.confidence > 0.6)) && (
        <motion.div variants={item}>
          <Card className="premium-hover-card border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">AI Best Fit Recommendation</CardTitle>
                  <CardDescription>Cross-Role Comparison</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="ml-auto border-primary/20 text-[10px] uppercase tracking-wider">Skill Similarity</Badge>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">Your highest potential role is:</div>
                <div className="mt-1 font-heading text-lg font-bold text-primary">{bestFit.predicted_role}</div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Match Confidence</span>
                    <span className="tabular-nums font-semibold text-primary">{bestFit.confidence ? `${Math.round(bestFit.confidence * 100)}%` : 'N/A'}</span>
                  </div>
                  <Progress value={(bestFit.confidence ?? 0) * 100} className="h-2" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {bestFit.reasoning || `Based on your skill profile, you are a much stronger match for ${bestFit.predicted_role} than your currently selected path.`}
                </p>
              </div>
              <Button className="mt-4 w-full gap-2" onClick={() => navigate('/resume-analyzer')}>
                Switch to Recommended Path <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Upload Resume', icon: Upload, to: '/resume-analyzer', desc: 'Analyze a new resume' },
          { label: 'Start Interview', icon: Zap, to: '/interview-readiness', desc: 'Practice interview questions' },
          { label: 'Study Hub', icon: BookOpen, to: '/improvement-plan', desc: 'Follow your improvement plan' },
        ].map((a) => (
          <Card key={a.to} className="premium-hover-card group cursor-pointer" onClick={() => navigate(a.to)}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <a.icon className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.desc}</div>
              </div>
              <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  )
}
