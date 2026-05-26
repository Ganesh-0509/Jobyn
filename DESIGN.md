# DESIGN.md — CampusSync Edge

## Visual Theme
Professional SaaS dashboard. Linear/Stripe/Vercel inspired. Clean surfaces, proper elevation, tinted neutrals. NOT cyberpunk, NOT glassmorphism-first.

## Color System (OKLCH)

### Dark Theme
| Token | OKLCH | Usage |
|-------|-------|-------|
| background | oklch(0.145 0.005 285) | Page background |
| foreground | oklch(0.93 0.005 285) | Primary text |
| card | oklch(0.18 0.008 285) | Card surfaces |
| card-foreground | oklch(0.93 0.005 285) | Card text |
| primary | oklch(0.65 0.15 265) | Primary actions |
| primary-foreground | oklch(0.98 0 0) | Text on primary |
| secondary | oklch(0.25 0.01 285) | Secondary surfaces |
| secondary-foreground | oklch(0.85 0.01 285) | Secondary text |
| muted | oklch(0.25 0.008 285) | Muted backgrounds |
| muted-foreground | oklch(0.55 0.01 285) | Muted text |
| accent | oklch(0.55 0.18 290) | Violet accent |
| accent-foreground | oklch(0.95 0.02 290) | Text on accent |
| destructive | oklch(0.55 0.2 25) | Error/danger |
| border | oklch(0.28 0.01 285) | Borders |
| input | oklch(0.28 0.01 285) | Input borders |
| ring | oklch(0.65 0.15 265) | Focus rings |

### Light Theme
| Token | OKLCH | Usage |
|-------|-------|-------|
| background | oklch(0.985 0.003 285) | Page background |
| foreground | oklch(0.145 0.005 285) | Primary text |
| card | oklch(1 0 0) | Card surfaces |
| primary | oklch(0.45 0.18 265) | Primary actions |
| muted | oklch(0.94 0.005 285) | Muted backgrounds |
| border | oklch(0.90 0.008 285) | Borders |

## Typography
- **Display/Headings**: Clash Display (600-800 weight)
- **Body/UI**: Plus Jakarta Sans (400-600 weight)
- **Mono/Data**: JetBrains Mono (400-500 weight)

### Scale
| Level | Font | Weight | Size | Line Height |
|-------|------|--------|------|-------------|
| Display | Clash Display | 800 | clamp(2rem, 5vw, 3.5rem) | 1.1 |
| H1 | Clash Display | 700 | 2rem | 1.2 |
| H2 | Clash Display | 600 | 1.5rem | 1.3 |
| H3 | Plus Jakarta Sans | 600 | 1.25rem | 1.4 |
| Body | Plus Jakarta Sans | 400 | 0.875rem | 1.6 |
| Small | Plus Jakarta Sans | 400 | 0.8125rem | 1.5 |
| Mono | JetBrains Mono | 400 | 0.8125rem | 1.5 |

## Spacing
4px base grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

## Radius
- sm: 8px (inputs, badges)
- md: 12px (cards, buttons)
- lg: 16px (modals, sheets)
- xl: 24px (hero sections)

## Shadows (tinted, not pure black)
- sm: 0 1px 2px oklch(0.145 0.005 285 / 0.05)
- md: 0 4px 6px oklch(0.145 0.005 285 / 0.1)
- lg: 0 10px 15px oklch(0.145 0.005 285 / 0.1)

## Components
- shadcn/ui (Radix primitives + Tailwind)
- New York style variant
- CSS variables for theming

## Motion
- Duration: 150ms (micro), 200ms (standard), 300ms (emphasis)
- Easing: ease-out for enter, ease-in for exit
- Respect `prefers-reduced-motion: reduce`

## Layout
- Sidebar: 260px fixed (desktop), Sheet overlay (mobile)
- Navbar: 56px sticky top
- Content: fluid with max-width 1400px
- Cards: 12px radius, 20px padding

## Motion Language System

### Philosophy
Calm, intelligent, responsive — never performative. Motion guides attention and communicates state. It does NOT decorate.

### Hover Behavior
- Default: `translateY(-2px)`, 180ms, `cubic-bezier(0.16, 1, 0.3, 1)`
- Cards: border glow (accent at 15% opacity), no scale transform (prevents layout shift)
- Buttons: opacity shift + subtle lift
- Links: underline slide-in from left

### Transitions
| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | ease-out | Focus rings, opacity toggles |
| Standard | 200ms | cubic-bezier(0.16, 1, 0.3, 1) | Hover states, toggles |
| Emphasis | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Page transitions, modals |
| Spring (enter) | 400ms | spring(0.2, 0.9, 0.3) | Stagger children, dropdown menus |

### Glow Usage (STRICT)
- ONLY on interactive focus (keyboard nav, active states)
- NEVER decorative, NEVER on page load, NEVER on non-interactive elements
- Implementation: `box-shadow: 0 0 0 2px oklch(0.65 0.15 265 / 0.3)`
- Glow opacity: 20-30%, never more

### Scroll Behavior
- Fade-up reveal: `translateY(24px)` → `translateY(0)`, opacity 0.6 → 1
- Blur reveal: `blur(4px)` → `blur(0)` on hero elements only
- IntersectionObserver threshold: 0.1
- Only 2-3 scroll-triggered animations per viewport, not everything

### Animation Budget (STRICT)
Animate ONLY in these contexts:
1. Hero section (landing page)
2. Hover states (cards, buttons, links)
3. Route transitions (page enter/exit)
4. Onboarding moments (first-time states)
5. Critical state changes (loading → success, error → retry)

Everything else: instant state change. No animation.

### Reduced Motion
When `prefers-reduced-motion: reduce`:
- All transforms → instant
- All fades → instant (opacity jump)
- Spring → linear 100ms
- Scroll reveals → content visible immediately
- No blur animations

## Glassmorphism Policy (STRICT)

Glassmorphism is NOT the default surface style. Use it sparingly:
- Allowed: ONE glass element per viewport (e.g., floating nav, command palette)
- Allowed: `backdrop-filter: blur(12px)` + `background: oklch(0.145 0.005 285 / 0.8)`
- NEVER: glass cards as the primary card style
- NEVER: multiple layered glass elements
- NEVER: glass on glass (stacking)
- Default card: solid surface with tinted border, NOT translucent

## Data Density Philosophy

### Card Density
- Padding: 20px desktop, 16px mobile
- Internal spacing: 12px between elements within a card
- Max 4 metric cards per row (lg), 2 (md), 1 (sm)

### Information Hierarchy (4 levels max per card)
1. Title (what am I looking at?)
2. Value (the number)
3. Delta (change/context)
4. Action (what can I do?)

### Information Budget
Every element must earn its space. If it doesn't inform a decision, remove it.

### Whitespace Rules
- Between sections: 32-48px
- Between cards: 16px
- Within cards: 12-16px
- Inline spacing: 8px

### Table Density
- Row height: 40px compact, 48px comfortable
- Zebra striping: optional, use muted background for alternating rows
- Max 8 columns visible, hide extras in expandable row

### Chart Density
- Labeled axes (always)
- No chartjunk (gridlines at 8% opacity, no 3D, no shadows on data)
- Max 3 series per view
- Legend: inline, not floating

## Charts
- Use Recharts (lighter than Chart.js, React-native)
- Colors from the palette tokens
- Subtle grid lines, bold data lines

## Icons
- Lucide React (already in use)
- Never emoji as icons
- 16px default, 20px in headers
