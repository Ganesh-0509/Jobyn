# Design Context for Agents

## Design Tokens (Dark Theme - Default)
- Background: #0A0B0F
- Surface/Card: #12131A
- Surface Elevated: #1A1B24
- Primary/Accent: #00F2FE (cyan)
- Secondary: #9B51E0 (violet)
- Success/Mint: #05FFC5
- Warning/Amber: #F59E0B
- Destructive/Crimson: #FF3F6C
- Text Primary/Foreground: #F0F0F2
- Text Muted: #8B8D97
- Border: rgba(255,255,255,0.08)
- Input: rgba(255,255,255,0.10)
- Sidebar: #0D0E13

## Fonts
- Headings: Clash Display (font-heading)
- Body: Satoshi (font-sans)
- Code/Data: DM Mono (font-mono)

## Shadcn Components Available
All imported from `@/components/ui/[name]`:
- button (Button, buttonVariants)
- card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- input (Input)
- badge (Badge)
- dialog (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter)
- tabs (Tabs, TabsList, TabsTrigger, TabsContent)
- select (Select, SelectTrigger, SelectValue, SelectContent, SelectItem)
- avatar (Avatar, AvatarFallback)
- tooltip (Tooltip, TooltipTrigger, TooltipContent, TooltipProvider)
- skeleton (Skeleton)
- progress (Progress)
- separator (Separator)
- scroll-area (ScrollArea, ScrollBar)
- dropdown-menu (DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator)
- label (Label)
- textarea (Textarea)
- switch (Switch)
- sonner (Toaster)
- sheet (Sheet, SheetTrigger, SheetContent, SheetTitle)
- command (Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem)
- input-group (InputGroup, InputGroupText)

## Utility
```tsx
import { cn } from "@/lib/utils"
```

## Animation Pattern
```tsx
import { motion } from 'framer-motion'
<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
```

## Existing Primitives (in src/components/primitives/)
```tsx
import { FadeIn, StaggerContainer, StaggerItem, HoverLift, GlowBorder, MagneticButton } from '@/components/primitives/motion'
import { SectionContainer, GridSystem, ContentRail, BentoLayout, PageHeader } from '@/components/primitives/layout'
import { GlassCard, MetricCard, FloatingPanel, SpotlightCard, DataCard } from '@/components/primitives/surface'
import { EmptyState, ErrorState, LoadingSkeleton, SuccessState, InlineStatus } from '@/components/primitives/feedback'
import { ProgressRing, SparkLine, ReadinessIndicator, SkillBar, ScoreGauge } from '@/components/primitives/viz'
```
- FadeIn: scroll-triggered fade+blur animation with delay prop
- StaggerContainer + StaggerItem: staggered children animations
- HoverLift: hover Y translation
- GlowBorder: focus-within glow ring
- MetricCard: pre-built metric display card
- ProgressRing: SVG circular progress
- SparkLine: mini line chart
- ScoreGauge: score visualization
- SkillBar: horizontal skill progress bar

## CSS Utility Classes
- `glow-cyan` - cyan glow shadow on dark
- `glow-border` - glowing cyan border
- `gradient-accent` - cyan to violet gradient background
- `gradient-text` - gradient text (cyan to violet)
- `glass` - glass morphism effect

## Tailwind Custom Colors
- `text-cyan`, `bg-cyan` - #00F2FE
- `text-violet`, `bg-violet` - #9B51E0
- `text-mint`, `bg-mint` - #05FFC5
- `text-crimson`, `bg-crimson` - #FF3F6C
- `text-amber`, `bg-amber` - #F59E0B
- `bg-surface`, `bg-surface-elevated`

## Context Hooks
```tsx
import { useAuth } from '@/context/AuthContext'
// { user: { name, email, isAdmin }, login, signup, loginWithGoogle, logout, loading }

import { useResume } from '@/context/ResumeContext'
// { analysis, prediction, bestFit, masteredSkills, completedTasks, dailyCommitment, currentFile, setAnalysis, setPrediction, markSkillMastered, toggleTask, setDailyCommitment, clear, loading }

import { useToast } from '@/context/ToastContext'
// { toast(message, type?: 'success'|'error'|'info'|'warning') }

import { usePrivacy } from '@/context/PrivacyContext'
// { privacy }
```

## API Client
```tsx
import { uploadResume, predictResume, getAnalytics, getLatestSession, BASE } from '@/api/client'
```

## Design Principles
1. Data speaks first - lead with most important number/insight
2. Earned familiarity - use established patterns, execute at higher level
3. Density matches intent - dense for dashboards, breathing room for auth/landing
4. Motion with purpose - 150-300ms, ease-out, never blocking
5. Dark by default, readable always - 4.5:1 contrast minimum

## Typography Rules
- h1: Clash Display, 2.25rem, 700 weight
- h2: Clash Display, 1.75rem, 700 weight
- h3: Clash Display, 1.375rem, 600 weight
- Body: Satoshi, 0.875rem, 400 weight
- All headings use font-heading (Clash Display), letter-spacing -0.02em
- Never use Inter/Roboto/Arial for display text
