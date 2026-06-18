## Goal

Take the already-themed `frontend/` to a more premium, modern, non-boring feel. Focus on small-detail polish (tables, buttons, badges, inputs, cards, empty/error states, charts) and glassmorphism. No backend changes, no new routes, no new files unless a SOLID split demands it.

## Scope (frontend-only)

### 1. Core primitives — `components/ui/*`
- **button.tsx**: add `glass` and `ghost-glow` variants (backdrop-blur, ring-on-hover, subtle gradient sweep on `hero`). Add `loading` state with spinner slot. Tighter focus ring using `--ring`.
- **card.tsx**: introduce `variant="glass" | "solid" | "outline"`. Glass = `bg-card/60 backdrop-blur-xl border-border/50 shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.25)]`. Hover lift `-translate-y-0.5` + border glow.
- **input.tsx / label.tsx**: floating focus ring, soft inner shadow, invalid state with `aria-invalid` styling, subtle backdrop blur in glass contexts.
- **badge.tsx**: add `tone` variants (success/warning/info/destructive) with low-alpha tinted backgrounds + colored border, not flat fills.

### 2. Tables — `components/tables/*`
- **DataTable.tsx**: sticky header with `backdrop-blur` + `bg-background/70`, zebra rows via `even:bg-muted/30`, row hover `bg-primary/5`, rounded outer wrapper with `border-border/60`, `overflow-x-auto` scroll shadow, column sort icons, density toggle (compact/comfortable), per-row focus ring for a11y.
- **TableToolbar.tsx**: glass pill container, search input with `Cmd+K` hint, filter chips with removable `X`.
- **TableEmptyRow.tsx**: centered illustration slot + CTA, not a plain "No data".

### 3. Layout — `components/layout/*`
- **TopBar.tsx**: stronger glass (`bg-background/55 backdrop-blur-2xl`), bottom hairline gradient, theme switcher gets animated swatch ring, add command-menu launcher button.
- **SidebarNav.tsx**: active item gets gradient pill `bg-gradient-to-r from-primary/15 to-transparent` + left accent bar, hover slide-in icon, group labels in `text-xs uppercase tracking-wider`.
- **PageHeader.tsx**: optional `eyebrow`, `text-gradient` title accent, action area uses `sm:flex` recipe (already in place — verify all consumers).
- **Breadcrumbs.tsx**: chevron separators, last crumb in `text-foreground`, rest `text-muted-foreground hover:text-foreground`.
- **AppShell.tsx**: keep aurora layer; add subtle noise overlay (`bg-[url(noise.svg)] opacity-[0.03]`) for texture, `prefers-reduced-motion` already respected.

### 4. States — `components/states/*`
- **LoadingState.tsx**: skeleton shimmer using `bg-gradient-to-r from-muted via-muted/60 to-muted animate-[shimmer_2s_infinite]` (add shimmer keyframe to `globals.css`).
- **EmptyState.tsx** & **ErrorState.tsx**: glass card, icon in tinted circle, primary + secondary action slot.

### 5. Status — `components/status/*`
- **StatusBadge / UserRoleBadge / UserStatusBadge**: unified tonal style (dot + label + tinted bg), pulsing dot for "live"/"running" states.
- **BackendHealthStatus**: tiny glass pill in TopBar with colored dot + tooltip.

### 6. Forms — `components/forms/*`
- Consistent `FormFieldRow` spacing, helper text `text-xs text-muted-foreground`, error in destructive tone with icon, `SelectField` gets shadcn-like trigger styling with chevron, `TokenizedParameterInput` chips get glass tone.

### 7. Charts — `components/charts/*`
- `BTCUSDTPriceChart`: card wrapper switches to glass, gridlines `stroke-border/40`, tooltip uses `bg-popover/80 backdrop-blur border-border/60`, gradient area fill `from-primary/40 to-transparent`.

### 8. Per-view polish — `views/*View.tsx`
Pass over every view and apply:
- Hero/landing/auth (`Landing/Login/Registration`): refine aurora positions, add floating glass cards in hero, CTA gets `hero` button with shimmer.
- Dashboard (`DashboardView`): stat cards become glass tiles with sparkline + trend chip; section headers get eyebrow + accent rule.
- List views (`JobList/ExperimentList/BlueprintsLibrary/ModelsRankings/UserManagement`): adopt new DataTable + glass toolbar; filters become chip row.
- Detail views (`Blueprint/Experiment/Job/Model* Detail`, `UserProfile`): two-column on `lg:`, side panel as sticky glass card, tabs use underline-grow animation.
- Wizard views (`Wizard/BlueprintWizard/ExperimentWizard`): step indicator becomes connected gradient progress; current step glows.
- Hub/Public/Docs/SystemManagement: section cards, anchored sub-nav, code blocks with `bg-muted/40 border` + copy button.

### 9. Global polish — `app/globals.css` + `tailwind.config.ts`
- Add keyframes: `shimmer`, `gradient-x`, `ring-pulse`.
- Utility classes: `.glass`, `.glass-strong`, `.hover-lift`, `.surface-hairline` (top gradient border).
- Tweak `--radius` rhythm (cards 1rem, inputs 0.625rem, pills 999px).
- Tighten shadow tokens: `--shadow-glass`, `--shadow-glow-primary`.

## Performance & responsiveness guardrails
- All glass layers gated by `@media (min-width: 768px)` or skipped when `prefers-reduced-transparency`.
- Continue `prefers-reduced-motion` guard for aurora/shimmer.
- Audit every header for `grid-cols-[minmax(0,1fr)_auto] sm:flex` + `truncate` + `shrink-0`.
- `React.memo` heavy detail panels; `useMemo` table column defs.

## Out of scope
- No backend / API / route URL changes.
- No new views or new files unless a primitive needs splitting (none anticipated).
- No copy/content rewrites beyond eyebrows/labels needed for layout.

## Files touched (estimate)
`components/ui/*` (5), `components/tables/*` (3), `components/layout/*` (5), `components/states/*` (3), `components/status/*` (4), `components/forms/*` (4–6), `components/charts/BTCUSDTPriceChart.tsx`, `views/*` (~20), `app/globals.css`, `tailwind.config.ts`.
