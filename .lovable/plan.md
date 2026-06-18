## Goal

Bring `frontend/` visually and ergonomically in line with the `archive/src_old` prototype: dark-first quant aesthetic, multi-theme + light-mode support, animated gradients, polished cards, mobile/tablet-safe layouts, and a snappier render path. Backend is untouched. New files only when SOLID demands it (one new ThemeProvider; everything else is in-place edits).

## Scope

In-scope: `frontend/app/**`, `frontend/components/layout/**`, `frontend/components/ui/**` (only minor variant tweaks), all `frontend/views/*View.tsx`, `frontend/app/globals.css`, `frontend/tailwind.config.ts`.

Out of scope: `backend/`, API clients (`frontend/lib/api`), validators, data fetching, route URLs (kept unchanged so backend routing is unaffected).

## Changes

### 1. Design system port (`globals.css` + `tailwind.config.ts`)
- Replace `globals.css` with prototype tokens: `data-theme` (cyan default, plus emerald/violet/amber/rose/blue/sunset/midnight/aurora) and `data-mode="light"` overrides. Keep dark-first baseline.
- Add prototype utilities: `bg-gradient-hero/card/accent`, `text-gradient`, `glow-*`, `animate-aurora/float/drift/pulse-glow`, `bg-grid`, `touch-optimizations` (disables ambient animations on coarse pointers — prevents jank on tablet/mobile).
- Extend `tailwind.config.ts` with `success`/`warning`/`sidebar*` color tokens, `gradient-hero`/`gradient-accent` backgroundImages, and `keyframes`/`animation` entries so utility classes work via Tailwind too.

### 2. Theme infrastructure (single new file: `lib/theme/ThemeProvider.tsx`)
- Justified by SOLID (separates theming from `AuthProvider`); reads/writes `data-theme` + `data-mode` on `<html>`, persists in `localStorage`, exposes `useTheme`.
- Mount in `app/layout.tsx` above `AuthProvider`. Set `<html data-theme="cyan">` default and `suppressHydrationWarning`.
- Update existing `TopBar` to host a compact theme + mode switcher (port `ThemeSwitcher` UI inline — no new component file).

### 3. Layout refresh (`components/layout/*`, no new files)
- `AppShell`: replace plain `bg-muted/30` shell with `bg-background` + decorative `bg-grid` and aurora gradient layer (pointer-events-none, hidden on `touch-optimizations`). Detect coarse pointer once, toggle class on root div.
- `TopBar`: glassy `backdrop-blur` + `border-b border-border/60`, condense mobile actions, ensure `min-w-0` on title slot to prevent overlap on 360px screens.
- `SidebarNav`: adopt sidebar tokens (`bg-sidebar-background`, `text-sidebar-foreground`, active row uses `bg-sidebar-accent`), collapsible-icon mode at `lg`, full sheet on mobile (already mounted via `MobileSidebar`).
- `Breadcrumbs`/`PageHeader`/`PageShell`: enforce responsive grid pattern (`grid-cols-[minmax(0,1fr)_auto]` → `sm:flex`), `truncate` on titles, `shrink-0` on action buttons. Fixes overlap reported.

### 4. Per-page refinement (all `views/*View.tsx`)
For each view, apply the same recipe (no new files, replace markup in place):
- Page wrapper switches to `bg-gradient-hero` or `bg-background` with optional `bg-grid` overlay.
- Headers/section titles use `text-gradient` for the H1 accent word.
- Cards switch to `bg-gradient-card border-border/60 hover:border-primary/40 hover:shadow-[var(--glow-primary)] transition`.
- Stats / KPI tiles get `rounded-2xl`, glow on hover, icon chip with `bg-primary/10 text-primary`.
- Tables: sticky header, zebra rows via `even:bg-muted/30`, horizontal scroll wrapper `overflow-x-auto` so wide tables don't break tablet layouts.
- Forms: two-column on `md:`, single column on mobile; labels `text-sm font-medium`, inputs `h-10`.
- All buttons use existing `Button` variants; add a `hero` variant in `components/ui/button.tsx` (gradient + glow) — needed because LandingPageView already references it.

Views touched: `LandingPageView`, `LoginView`, `RegistrationView`, `DashboardView`, `BlueprintsLibraryView`, `BlueprintDetailView`, `BlueprintWizardView`, `BlueprintModerationView`, `ExperimentListView`, `ExperimentDetailView`, `ExperimentWizardView`, `WizardView` (shared), `JobListView`, `JobDetailView`, `ModelsRankingsView`, `ModelDetailView`, `ModelDetailsView`, `PublicHubView`, `DocumentationView`, `UserProfileView`, `UserManagementView`, `SystemManagementView`, `BaseView`.

### 5. Landing parity with prototype
- Port aurora/float/drift background layers from `archive/src_old/screens/Landing.tsx` into `LandingPageView` (cursor spotlight disabled on touch).
- Match feature grid, "research-first" CTA card, footer band, and section spacing.

### 6. Performance & cleanup
- Add `dynamic = 'force-static'` where pages are pure presentational (landing, docs index) to skip per-request render.
- Wrap heavy view bodies (charts, tables) with `React.memo` and stabilize prop objects in their parents via `useMemo`. No new files — edit in place.
- Replace ad-hoc inline `style={{}}` color strings in views with token classes (fewer re-renders, no recalculation of dynamic styles).
- Defer non-critical decorations with `next/dynamic` + `{ ssr: false }` (aurora layer, theme switcher dropdown) so first paint stays fast.
- Remove duplicate icon imports and dead `useState` flags discovered while editing.
- Add `prefers-reduced-motion` guard to all `animate-*` utilities (one block in `globals.css`).

### 7. Responsive guarantees
- Audit every header row in the listed views using the project's `grid-cols-[minmax(0,1fr)_auto] sm:flex` recipe; add `truncate`/`shrink-0` to prevent text overlap on 360-414px widths.
- Tables wrapped in `overflow-x-auto`; long badges use `whitespace-nowrap`.
- Verify with `preview_ui--set_preview_device_viewport` (mobile, tablet, desktop) after build.

## Out-of-scope confirmations

- No backend file changes, no API surface changes, no route URL changes.
- No new view files, no new layout files (only `lib/theme/ThemeProvider.tsx` — required by SoC).
- shadcn UI primitives unchanged except `button.tsx` gaining a `hero` variant already referenced by code.

## Verification

1. `bun run build` (harness runs it) — must pass.
2. Open preview at desktop / tablet / mobile viewports, hit each route group (`/`, `/dashboard`, `/blueprints`, `/experiments`, `/models`, `/jobs`, `/hub`, `/docs`, `/profile`, `/admin/users`, `/system`, `/login`, `/register`).
3. Toggle every theme + light/dark via the new switcher; confirm no contrast regressions.
4. Check console + network panels for runtime errors.
