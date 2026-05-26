import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useResume } from '../context/ResumeContext'
import { BarChart2, AlertCircle, ArrowRight, Trophy, GitBranch, Eye, EyeOff } from 'lucide-react'
import SkillGraphViz from '../components/SkillGraphViz'
import ProjectGeneratorModal from '../components/ProjectGeneratorModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BASE } from '../api/client'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } } }

export default function SkillGap() {
  const navigate = useNavigate()
  const { analysis, masteredSkills } = useResume()
  const [deps, setDeps] = useState<Record<string, string[]>>({})
  const [depsError, setDepsError] = useState(false)
  const [showGraph, setShowGraph] = useState(true)
  const [activeProject, setActiveProject] = useState<{ role: string; skills: string[] } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${BASE}/interview/dependencies`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => setDeps(d))
      .catch((err) => {
        if (err.name !== 'AbortError') setDepsError(true)
      })
    return () => controller.abort()
  }, [])

  const coreMissing = (analysis?.missing_core_skills ?? []).filter((s: string) => !masteredSkills.includes(s))
  const optMissing = (analysis?.missing_optional_skills ?? []).filter((s: string) => !masteredSkills.includes(s))

  const gaps = analysis
    ? [
      ...coreMissing.map((s: string) => ({ skill: s, priority: 'Critical' as const, action: 'Start Learning' })),
      ...optMissing.map((s: string, i: number) => ({ skill: s, priority: i < 2 ? 'High' as const : 'Medium' as const, action: 'Explore' })),
    ]
    : []

  const getPrereqs = (skillName: string): string[] => deps[skillName.toLowerCase()] ?? []
  const detected = [...(analysis?.detected_skills ?? []), ...masteredSkills]
  const role = analysis?.role ?? ''

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="rounded-2xl bg-muted p-4">
          <GitBranch className="size-10 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Skill Gap Analysis Locked</h2>
        <p className="max-w-md text-sm text-muted-foreground">Upload your resume first to identify skill gaps.</p>
        <Button onClick={() => navigate('/resume-analyzer')} className="gap-2">
          <ArrowRight className="size-4" /> Analyze Your Resume Now
        </Button>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Adaptive Gap Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Prioritizing <span className="font-bold text-destructive">Critical</span> gaps for your {role} career path
        </p>
      </motion.div>

      {/* Dependencies Error */}
      {depsError && (
        <motion.div variants={item}>
          <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-4 py-2.5 text-sm text-warning">
            <AlertCircle className="size-4 shrink-0" /> Failed to load skill dependencies. Prerequisite data may be unavailable.
          </div>
        </motion.div>
      )}

      {/* Skill Dependency Graph */}
      <motion.div variants={item}>
        <Card className="premium-hover-card">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="size-4 text-primary" /> Skill Dependency Graph
              </CardTitle>
              <CardDescription>Your skills (green) vs gaps (red/orange)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowGraph(v => !v)}>
              {showGraph ? <><EyeOff className="size-3.5" /> Hide</> : <><Eye className="size-3.5" /> Show</>}
            </Button>
          </CardHeader>
          {showGraph && (
            <CardContent>
              <SkillGraphViz
                detected={detected}
                missingCore={coreMissing}
                missingOptional={optMissing}
                dependencies={deps}
                onNodeClick={(skill) => setActiveProject({ role, skills: [skill] })}
              />
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Active Gaps */}
      <motion.div variants={item}>
        <Card className="premium-hover-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Priority Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            {gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-success">
                <Trophy className="size-10" />
                <p className="text-sm font-medium">No critical skill gaps detected. You are ready for placement!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gaps.map((g, i) => {
                  const prereqs = getPrereqs(g.skill)
                  return (
                    <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/20">
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <BarChart2 className="size-4 shrink-0 text-primary" />
                        <span className="flex-1 text-sm font-semibold text-foreground">{g.skill}</span>
                        <Badge
                          variant={g.priority === 'Critical' ? 'destructive' : g.priority === 'High' ? 'secondary' : 'outline'}
                          className="text-[10px]"
                        >
                          {g.priority}
                        </Badge>
                        <Button size="sm" className="gap-1 text-xs" onClick={() => navigate('/improvement-plan', { state: { highlightSkill: g.skill } })}>
                          {g.action} <ArrowRight className="size-3" />
                        </Button>
                      </div>
                      {prereqs.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-9">
                          <span className="text-[11px] text-muted-foreground">Prerequisites:</span>
                          {prereqs.map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] font-normal">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Verified Skills */}
      {masteredSkills.length > 0 && (
        <motion.div variants={item}>
          <Card className="premium-hover-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-success">
                <Trophy className="size-4" /> Verified & Mastered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {masteredSkills.map(s => (
                  <Badge key={s} variant="outline" className="gap-1.5 border-success/30 bg-success/5 py-1 text-success">
                    <BarChart2 className="size-3" /> {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Capstone Project Modal */}
      {activeProject && (
        <ProjectGeneratorModal
          role={activeProject.role}
          skills={activeProject.skills}
          onClose={() => setActiveProject(null)}
        />
      )}
    </motion.div>
  )
}
