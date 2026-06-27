# Frontend App Module

The `frontend/app` folder contains Next.js route entry points, the root layout, and global styles. Most route files are intentionally thin wrappers around view components.

## Current implementation evidence

The frontend implementation is covered by Jest/Testing Library view tests and TypeScript typechecking. The latest evidence pass fixed type-only mismatches around the dashboard chart hook mock, metadata-backed Blueprint architecture options, and the `createBlueprint` request shape used by the Blueprint wizard.

Latest verified commands:

```text
cd frontend && npm test -- --runInBand
cd frontend && npm run typecheck
```

Latest verified results:

```text
24 test suites passed, 113 tests passed
typecheck passed
```

## `frontend/app/layout.tsx`

Explanation: Defines the root HTML layout, app metadata, global CSS import, theme provider, auth provider, and application shell wrapper.

Pseudocode:

```text
export metadata
RootLayout(children):
  render html with default theme/mode attributes
  wrap children in ThemeProvider
  wrap children in AuthProvider
  wrap children in AppShell
```

## `frontend/app/page.tsx`

Explanation: Client root page. It reads auth state and shows the dashboard for authenticated users or the landing page for guests.

Pseudocode:

```text
Page():
  auth = useAuth()
  if auth is loading: render nothing
  if authenticated: render DashboardView
  else: render LandingPageView
```

## `frontend/app/globals.css`

Explanation: Global stylesheet for Tailwind, theme variables, base body/page styles, scrollbars, focus styles, and shared utility classes.

Pseudocode:

```text
load Tailwind layers
define CSS variables for themes and modes
style html/body/root backgrounds and text
define reusable component utility classes
define responsive/global behavior
```

## `frontend/app/(auth)/login/page.tsx`

Explanation: Public login route.

Pseudocode:

```text
Page():
  render LoginView
```

## `frontend/app/(auth)/register/page.tsx`

Explanation: Public registration route.

Pseudocode:

```text
Page():
  render RegistrationView
```

## `frontend/app/admin/users/page.tsx`

Explanation: Staff user-management route. It requires at least `Moderator` role and redirects unauthorized users to `/dashboard`.

Pseudocode:

```text
Page():
  RequireRole minimumRole Moderator fallback /dashboard:
    render UserManagementView
```

## `frontend/app/blueprints/page.tsx`

Explanation: Authenticated blueprint library route.

Pseudocode:

```text
Page():
  RequireAuth:
    render BlueprintsLibraryView
```

## `frontend/app/blueprints/[id]/page.tsx`

Explanation: Authenticated blueprint detail route.

Pseudocode:

```text
Page():
  RequireAuth:
    render BlueprintDetailView
```

## `frontend/app/blueprints/new/page.tsx`

Explanation: Authenticated create/edit blueprint wizard route. It reads async search params to choose create or edit mode and passes the optional source blueprint ID into the view.

Pseudocode:

```text
Page(searchParams):
  params = await searchParams
  mode = params.mode == edit ? edit : create
  blueprintId = params.blueprintId
  RequireAuth:
    render BlueprintWizardView(mode, blueprintId)
```

## `frontend/app/blueprints/moderation/page.tsx`

Explanation: Authenticated blueprint moderation route.

Pseudocode:

```text
Page():
  RequireAuth:
    render BlueprintModerationView
```

## `frontend/app/dashboard/page.tsx`

Explanation: Authenticated dashboard route.

Pseudocode:

```text
Page():
  RequireAuth:
    render DashboardView
```

## `frontend/app/docs/page.tsx`

Explanation: Documentation route. It renders the documentation browser view directly.

Pseudocode:

```text
Page():
  render DocumentationView
```

## `frontend/app/experiments/page.tsx`

Explanation: Authenticated experiment list route.

Pseudocode:

```text
Page():
  RequireAuth:
    render ExperimentListView
```

## `frontend/app/experiments/[id]/page.tsx`

Explanation: Authenticated experiment detail route.

Pseudocode:

```text
Page():
  RequireAuth:
    render ExperimentDetailView
```

## `frontend/app/experiments/new/page.tsx`

Explanation: Authenticated experiment creation wizard route.

Pseudocode:

```text
Page():
  RequireAuth:
    render ExperimentWizardView
```

## `frontend/app/hub/page.tsx`

Explanation: Public hub route for public users, experiments, models, and blueprints.

Pseudocode:

```text
Page():
  render PublicHubView
```

## `frontend/app/jobs/page.tsx`

Explanation: Authenticated queue job list route.

Pseudocode:

```text
Page():
  RequireAuth:
    render JobListView
```

## `frontend/app/jobs/[id]/page.tsx`

Explanation: Authenticated queue job detail route.

Pseudocode:

```text
Page():
  RequireAuth:
    render JobDetailView
```

## `frontend/app/landing/page.tsx`

Explanation: Public landing route.

Pseudocode:

```text
Page():
  render LandingPageView
```

## `frontend/app/models/page.tsx`

Explanation: Authenticated model rankings route.

Pseudocode:

```text
Page():
  RequireAuth:
    render ModelsRankingsView
```

## `frontend/app/models/[id]/page.tsx`

Explanation: Authenticated model detail route.

Pseudocode:

```text
Page():
  RequireAuth:
    render ModelDetailView
```

## `frontend/app/profile/page.tsx`

Explanation: Authenticated current-user profile route.

Pseudocode:

```text
Page():
  RequireAuth:
    render UserProfileView
```

## `frontend/app/system/page.tsx`

Explanation: Admin-only system management route. Unauthorized users are sent to `/dashboard`.

Pseudocode:

```text
Page():
  RequireRole minimumRole Admin fallback /dashboard:
    render SystemManagementView
```

# Frontend Components Module

The `frontend/components` folder contains reusable UI primitives, layout pieces, form controls, status badges, tables, and BTCUSDT chart components.

## `frontend/components/charts/BTCUSDTPriceChart.tsx`

Explanation: Renders a lightweight-charts candlestick chart. It handles loading/error/empty states, creates the chart instance, updates data incrementally, loads older candles near the left edge, and cleans up on unmount.

Pseudocode:

```text
BTCUSDTPriceChart(points, loading, error, onLoadOlder):
  if loading/error/empty: render state
  create chart and candlestick series
  convert points to series data
  if new data extends current data:
    update latest bar
  else:
    replace series data
  subscribe visible range changes
  if user scrolls near left edge: call onLoadOlder
  on unmount: remove chart
```

## `frontend/components/charts/index.ts`

Explanation: Barrel file that exports chart component and chart hook types.

Pseudocode:

```text
export BTCUSDTPriceChart
export BTCUSDT chart types
export BTCUSDT range type
```

## `frontend/components/charts/useBTCUSDTChartData.ts`

Explanation: Fetches BTCUSDT kline data for a date range and interval, tracks loading/error state, normalizes points, supports loading older candles, and refreshes when cache update events fire.

Pseudocode:

```text
getDefaultBTCUSDTRange(now):
  return recent default date range

useBTCUSDTChartData(range, interval):
  state = points/loading/error
  fetch klines with start/end/interval/limit
  normalize ascending unique points
  subscribe to cache update events
  loadOlder():
    fetch earlier range before first point
    prepend normalized points
  return state and loadOlder
```

## `frontend/components/charts/utils.ts`

Explanation: Shared BTCUSDT chart helpers for sorting/deduping points and broadcasting cache update events across the app.

Pseudocode:

```text
normalizeAscUnique(points):
  sort by timestamp
  keep last point per timestamp
  return ascending list

notifyBTCUSDTCacheUpdated():
  write timestamp to localStorage
  dispatch browser event

subscribeBTCUSDTCacheUpdates(callback):
  listen for storage and custom events
  return unsubscribe function
```

## `frontend/components/forms/DateInput.tsx`

Explanation: Thin wrapper around the shared input component with `type="date"`.

Pseudocode:

```text
DateInput(props):
  render Input type date with props
```

## `frontend/components/forms/FormErrorText.tsx`

Explanation: Renders a small error message when a form field has an error.

Pseudocode:

```text
FormErrorText(message):
  if no message: render null
  render paragraph with error styling
```

## `frontend/components/forms/FormFieldRow.tsx`

Explanation: Standard form row layout with label, required marker, optional help text, error text, and field content.

Pseudocode:

```text
FormFieldRow(label, required, helpText, error, children):
  render label row
  render child control
  render help text if present
  render FormErrorText(error)
```

## `frontend/components/forms/NumberInput.tsx`

Explanation: Thin wrapper around the shared input component with `type="number"`.

Pseudocode:

```text
NumberInput(props):
  render Input type number with props
```

## `frontend/components/forms/SelectField.tsx`

Explanation: Reusable select input that receives options and reports selected values through `onValueChange`.

Pseudocode:

```text
SelectField(options, onValueChange, props):
  render select
  for each option: render option
  on change: call onValueChange(value)
```

## `frontend/components/forms/TokenizedParameterInput.tsx`

Explanation: Token input for comma-separated parameter values. It parses tokens, validates type/range/allowed values, supports discrete dropdown insertion, and renders removable token chips.

Pseudocode:

```text
tokensFromValue(value):
  split comma string into trimmed tokens

validateParamToken(token, param):
  enforce numeric/integer/boolean/string type
  enforce min/max and allowed values

TokenizedParameterInput(value, param, onChange):
  render existing tokens as chips
  render input or allowed-value select
  on token add/remove:
    validate token
    update comma-separated value
  render constraint hint and error
```

## `frontend/components/layout/AppShell.tsx`

Explanation: Main application frame. It renders the top bar, desktop sidebar, mobile sidebar overlay, and page content.

Pseudocode:

```text
AppShell(children):
  mobileOpen = false
  render TopBar(openMobileNav)
  render desktop SidebarNav
  if mobileOpen: render MobileSidebar with SidebarNav
  render main content area with children
```

## `frontend/components/layout/Breadcrumbs.tsx`

Explanation: Builds breadcrumbs from the current pathname with nicer labels for known route segments.

Pseudocode:

```text
Breadcrumbs():
  pathname = usePathname()
  split path into segments
  for each segment:
    build href up to segment
    label = known label or title-cased segment
  render breadcrumb links
```

## `frontend/components/layout/Navbar.tsx`

Explanation: Legacy/simple navbar component with static navigation links.

Pseudocode:

```text
Navbar():
  for each static nav item:
    render link with active styling
```

## `frontend/components/layout/PageHeader.tsx`

Explanation: Shared page heading component with optional eyebrow, breadcrumbs, description, and action slot.

Pseudocode:

```text
PageHeader(props):
  render breadcrumbs if supplied
  render eyebrow if supplied
  render title and description
  render actions on the right if supplied
```

## `frontend/components/layout/PageShell.tsx`

Explanation: Simple width/padding wrapper for page content.

Pseudocode:

```text
PageShell(children):
  render constrained content container
```

## `frontend/components/layout/SidebarNav.tsx`

Explanation: Role-aware sidebar navigation. It reads auth state, filters nav items by authentication and role, groups section nav, and supports mobile rendering.

Pseudocode:

```text
SidebarNav(mobile):
  auth = useAuth()
  items = getVisibleNavItems(auth)
  sectionItems = getSectionNavItems(current path, auth)
  render main nav links
  render section links when available
```

## `frontend/components/layout/TopBar.tsx`

Explanation: Header bar with mobile menu button, brand link, backend health, theme switcher, user status, admin dropdown, and sign-out.

Pseudocode:

```text
TopBar(onOpenMobileNav):
  auth = useAuth()
  render mobile nav button and brand
  render BackendHealthStatus
  render ThemeSwitcher
  if authenticated:
    render user identity, admin menu when staff, sign out button
  else:
    render login/register links
```

## `frontend/components/states/EmptyState.tsx`

Explanation: Reusable empty-state block with title, description, and optional action.

Pseudocode:

```text
EmptyState(title, description, action):
  render empty message and action if present
```

## `frontend/components/states/ErrorState.tsx`

Explanation: Reusable error block with message and optional recovery action.

Pseudocode:

```text
ErrorState(message, action):
  render error panel
  render action if present
```

## `frontend/components/states/LoadingState.tsx`

Explanation: Reusable loading skeleton/message component with inline or block variants.

Pseudocode:

```text
LoadingState(message, variant, lines):
  if inline: render compact spinner/message
  else: render skeleton lines and message
```

## `frontend/components/status/BackendHealthStatus.tsx`

Explanation: Polls the backend health endpoint and renders healthy/loading/error status in the top bar.

Pseudocode:

```text
BackendHealthStatus():
  on mount: call getBackendHealth
  if success: state = healthy with version/env
  if failure: state = error message
  render status dot and label
```

## `frontend/components/status/StatusBadge.tsx`

Explanation: Generic status badge with a normalized status string, tone mapping, and optional pulsing dot.

Pseudocode:

```text
StatusBadge(status, label, map):
  normalized = lowercase status
  tone = map[normalized] or outline
  render dot and label with tone classes
```

## `frontend/components/status/UserRoleBadge.tsx`

Explanation: Role-specific badge wrapper for user roles.

Pseudocode:

```text
UserRoleBadge(role):
  normalize role to User/Moderator/Admin
  render StatusBadge with role map
```

## `frontend/components/status/UserStatusBadge.tsx`

Explanation: Status-specific badge wrapper for enabled/disabled users.

Pseudocode:

```text
UserStatusBadge(status):
  normalize status to Enabled/Disabled/Other
  render StatusBadge with user-status map
```

## `frontend/components/tables/DataTable.tsx`

Explanation: Reusable table wrapper with scroll container, table styling, and optional dense mode.

Pseudocode:

```text
DataTable(children, dense):
  render overflow container
  render table with dense/default spacing
```

## `frontend/components/tables/TableEmptyRow.tsx`

Explanation: Renders a full-width empty table row.

Pseudocode:

```text
TableEmptyRow(colSpan, message):
  render tr
  render td spanning all columns with message
```

## `frontend/components/tables/TableToolbar.tsx`

Explanation: Layout wrapper for table filters/actions.

Pseudocode:

```text
TableToolbar(children):
  render flex toolbar with children
```

## `frontend/components/ui/ConfirmDialogCard.tsx`

Explanation: Small card used inside confirmation dialogs.

Pseudocode:

```text
ConfirmDialogCard(title, children):
  render card
  render title
  render children
```

## `frontend/components/ui/badge.tsx`

Explanation: Base badge primitive with class-variance variants.

Pseudocode:

```text
Badge(variant, className, props):
  compute classes from variant
  render div with merged classes
```

## `frontend/components/ui/button.tsx`

Explanation: Base button primitive with variants, sizes, loading state, optional spinner, and class merging.

Pseudocode:

```text
Button(variant, size, loading, children):
  compute variant classes
  if loading: render spinner and disable
  render button with children
```

## `frontend/components/ui/card.tsx`

Explanation: Card primitive and subcomponents for header, title, description, and content.

Pseudocode:

```text
Card(variant):
  render div with variant classes
CardHeader/CardTitle/CardDescription/CardContent:
  render semantic section with merged classes
```

## `frontend/components/ui/input.tsx`

Explanation: Base input primitive with shared styling and forwarded ref.

Pseudocode:

```text
Input(type, props, ref):
  render input with shared classes and ref
```

## `frontend/components/ui/label.tsx`

Explanation: Base label primitive with shared form label styling.

Pseudocode:

```text
Label(props):
  render label with merged classes
```

# Frontend Lib Module

The `frontend/lib` folder holds API access, auth state, route metadata, theme state, utility helpers, and form validation.

## `frontend/lib/api/client.ts`

Explanation: Typed frontend API client. It wraps `fetch`, builds URLs, includes cookies, fetches CSRF tokens for unsafe requests, normalizes JSON/network errors, and exports endpoint functions for auth, users, blueprints, experiments, jobs, models, public hub, docs, system events/settings, and BTCUSDT market data.

Pseudocode:

```text
fetchCsrfToken():
  GET auth csrf endpoint with credentials
  return token or null

withCsrfHeaders(init, method):
  if method is safe: add Accept header only
  else:
    token = fetchCsrfToken()
    add Accept, Content-Type, and X-CSRFToken

parseJsonResponse(response):
  parse JSON when content-type is JSON
  if response not ok: throw ApiClientError
  return typed payload

apiGet/apiPost/apiPatch/apiDelete(path):
  call fetch(buildApiUrl(path)) with credentials
  attach CSRF headers for writes
  parse response
  convert network failures to ApiClientError

feature functions:
  call apiGet/apiPost/apiPatch/apiDelete with API_ENDPOINTS
  serialize query strings when needed
  return typed Promise payloads
```

## `frontend/lib/api/endpoints.ts`

Explanation: Defines the API base URL and centralized endpoint constants used by the API client.

Pseudocode:

```text
configuredApiBaseUrl = NEXT_PUBLIC_API_BASE_URL without trailing slash
API_BASE_URL = configured value or local default
API_ENDPOINTS = nested object of backend paths

buildApiUrl(path):
  if path is absolute: return path
  join API_BASE_URL and path
```

## `frontend/lib/auth/AuthProvider.tsx`

Explanation: React context provider for authentication. It loads the current user on mount, stores user/loading state, exposes `refreshCurrentUser()`, and logs out through the API before clearing state.

Pseudocode:

```text
AuthProvider(children):
  user = null
  isLoading = true

  refreshCurrentUser():
    call getCurrentUser()
    if ok: set user
    else: set user null
    set loading false

  logout():
    call logoutUser()
    set user null

  on mount: refreshCurrentUser()
  provide user, isAuthenticated, isLoading, refresh, logout

useAuth():
  read context
  throw if missing provider
```

## `frontend/lib/auth/current-user.ts`

Explanation: Defines the minimal current-user TypeScript interface shared by auth code.

Pseudocode:

```text
CurrentUser:
  id
  username
  email
  name
  role
  status
```

## `frontend/lib/auth/guards.tsx`

Explanation: Client-side auth and role guards. They redirect unauthenticated users to login and redirect authenticated but underprivileged users to a fallback path.

Pseudocode:

```text
RequireAuth(children):
  auth = useAuth()
  if loading: render null
  if not authenticated:
    redirect to /login?next=currentPath
    render null
  render children

RequireRole(minimumRole, fallbackTo, children):
  auth = useAuth()
  if loading: render null
  if not authenticated: redirect to login
  if role rank < minimum rank: redirect fallback
  render children
```

## `frontend/lib/auth/useAuth.ts`

Explanation: Re-export of the `useAuth` hook from `AuthProvider` so imports can use the auth module path consistently.

Pseudocode:

```text
export useAuth from AuthProvider
```

## `frontend/lib/routes/nav.ts`

Explanation: Defines navigation items, role ranking, and helpers that filter navigation by authentication and role.

Pseudocode:

```text
navItems = route label/href/icon/minimumRole metadata

canAccessNavItem(userRole, minimumRole):
  compare role ranks

getVisibleNavItems({ isAuthenticated, role }):
  hide private items for guests
  hide role-protected items below role rank
  return visible items

getSectionNavItems(args):
  infer current route section
  return section-specific nav children
```

## `frontend/lib/theme/ThemeProvider.tsx`

Explanation: React context for theme color and light/dark mode. It loads settings from local storage, applies them to `document.documentElement`, and exposes setters.

Pseudocode:

```text
applyAttrs(theme, mode):
  set html data-theme and data-mode

ThemeProvider(children):
  default theme/mode
  on mount:
    read localStorage
    apply attrs
  setTheme/setMode:
    update state
    persist to localStorage
    apply attrs
  provide theme, mode, setters

useTheme():
  read context or throw
```

## `frontend/lib/utils.ts`

Explanation: Utility helper for merging conditional class names with Tailwind conflict resolution.

Pseudocode:

```text
cn(...inputs):
  clsx(inputs)
  tailwindMerge(result)
  return className
```

## `frontend/lib/validators/login.ts`

Explanation: Validates login form fields before submit.

Pseudocode:

```text
validateLoginForm(values):
  errors = {}
  if email missing: errors.email
  if password missing: errors.password
  return errors
```

## `frontend/lib/validators/registration.ts`

Explanation: Validates registration form fields: name, username, email, password, confirmation, and username format.

Pseudocode:

```text
validateRegistrationForm(values):
  errors = {}
  require name
  require username, lowercase alphanumeric only
  require valid email shape
  require password length
  require password confirmation match
  return errors
```

# Frontend Views Module

The `frontend/views` folder contains feature screens. Route files in `frontend/app` mostly delegate here.

## `frontend/views/BaseView.tsx`

Explanation: Shared page wrapper for title, description, breadcrumbs, actions, loading state, error state, and content.

Pseudocode:

```text
BaseView(props):
  if loading: render BaseViewLoading
  if error: render BaseViewError
  render page shell
  render header with title/description/actions/breadcrumbs
  render children
```

## `frontend/views/BlueprintDetailView.tsx`

Explanation: Shows one blueprint, including metadata, approval state, architecture summary, indicator summaries, favorite controls, and owner/action affordances.

Pseudocode:

```text
BlueprintDetailView():
  read blueprint id from route params
  fetch blueprint detail
  track loading/error/favorite state
  if loading/error: render BaseView state
  render blueprint title, status, version, lineage
  render architecture and indicator summaries
  on favorite/unfavorite: call API and update local state
  render request/edit/moderation actions when applicable
```

## `frontend/views/BlueprintModerationView.tsx`

Explanation: Displays the moderation queue and lets staff approve, reject, or disapprove blueprints.

Pseudocode:

```text
BlueprintModerationView():
  fetch moderation queue
  render queue table/cards
  for each item:
    render status and owner metadata
    render approve/reject/disapprove buttons
  on action:
    call moderation API
    refresh queue
```

## `frontend/views/BlueprintWizardView.tsx`

Explanation: Create/edit blueprint wizard. It manages selected indicators, indicator parameters, output scalers, architecture settings, review summary, validation, metadata loading, and save/update submission.

Pseudocode:

```text
BlueprintWizardView(mode, sourceBlueprintId):
  load blueprint metadata
  if edit mode: load source blueprint and hydrate form
  maintain step, field errors, selected indicators, architecture params
  step 1: collect blueprint basics
  step 2: choose indicators and tokenized params/scalers
  step 3: choose architecture and params
  step 4: review summary
  on next: validate current step
  on submit:
    build blueprint config payload
    call create/update blueprint API
    navigate to blueprint detail or show backend errors
```

## `frontend/views/BlueprintsLibraryView.tsx`

Explanation: Lists owned and favorited blueprints with tabs, filters, loading/error states, and links to detail/edit flows.

Pseudocode:

```text
BlueprintsLibraryView():
  tab = owned or favorited
  fetch list for active tab and filters
  render filters and create button
  render empty/loading/error states
  render blueprint rows/cards
  switch tab: refetch matching list
```

## `frontend/views/DashboardView.tsx`

Explanation: Dashboard screen with summary cards, recent activity/object widgets, quick links, and BTCUSDT chart interval controls.

Pseudocode:

```text
DashboardView(data):
  use provided data or defaults
  selectedInterval = 1m
  chartData = useBTCUSDTChartData(defaultRange, selectedInterval)
  render metric cards
  render recent experiments/models/blueprints/jobs widgets
  render quick action links
  render interval selector and BTCUSDTPriceChart
```

## `frontend/views/DocumentationView.tsx`

Explanation: Documentation browser. It fetches the doc list/detail and renders markdown-like content with custom heading, paragraph, list, table, code, and inline formatting support.

Pseudocode:

```text
DocumentationView():
  fetch documentation list
  choose selected slug
  fetch selected doc detail
  render sidebar/list of docs
  render Markdown(body)

Markdown(body):
  split body into lines
  detect headings, lists, code blocks, tables, paragraphs
  render matching React elements
```

## `frontend/views/ExperimentDetailView.tsx`

Explanation: Experiment detail and analysis screen. It displays configuration, status/progress, model leaderboard, selected model popup, metrics/log summaries, risk charts, round logs, and download actions.

Pseudocode:

```text
ExperimentDetailView():
  read experiment id from route params
  fetch experiment detail
  track selected model, pagination, modal state, round-log loading
  render config/status/progress cards
  render model leaderboard and select/view actions
  render metrics, confusion, backtest, parameter correlations
  render risk scatter charts and expanded modal
  on download/log actions: call API or build download URL
  on cancel/retry/delete: call API and update/navigate
```

## `frontend/views/ExperimentListView.tsx`

Explanation: Lists experiments with status/search filters, debounced API calls, loading/error/empty states, and navigation to details.

Pseudocode:

```text
ExperimentListView():
  state = search, status, items, loading, error
  debounce search/status changes
  fetch listExperiments(params)
  render filters and new experiment link
  render table/list of experiments
  render empty or error state when needed
```

## `frontend/views/ExperimentWizardView.tsx`

Explanation: Multi-step experiment creation wizard. It selects dataset range, blueprint, target strategy/params, parameter overrides, split settings, seed/permutation controls, preview metrics, and submits an experiment.

Pseudocode:

```text
ExperimentWizardView():
  load BTCUSDT metadata and blueprint options
  maintain draft, current step, errors, selected blueprint, target params, overrides
  step basics: name, date range/candlestick amount, interval
  step blueprint: search/select approved blueprint and preview config
  step target: select target, edit params, request backend preview
  step overrides: tokenized architecture/indicator/scaler overrides
  step split: adjust train/validation/test and strategy
  step review: show computed permutation count and payload summary
  validate each step before moving forward
  on submit:
    build CreateExperimentRequest
    call createExperiment
    navigate to detail or map backend 422 errors to fields
```

## `frontend/views/JobDetailView.tsx`

Explanation: Displays one queue job, including lifecycle metadata, payload, status, error/result details, and cancellation controls where available.

Pseudocode:

```text
JobDetailView():
  read job id from route params
  fetch job detail
  render loading/error/not-found states
  render job status, timestamps, payload, result/error
  on cancel: call cancelJob and refresh detail
```

## `frontend/views/JobListView.tsx`

Explanation: Lists visible queue jobs and links to job details.

Pseudocode:

```text
JobListView():
  fetch listJobs
  render loading/error/empty states
  render job rows with status and detail links
```

## `frontend/views/LandingPageView.tsx`

Explanation: Public entry screen with product overview, feature cards, and navigation to login/register.

Pseudocode:

```text
LandingPageView():
  render hero/title/copy
  render feature highlights
  render login/register calls to action
```

## `frontend/views/LoginView.tsx`

Explanation: Login form view. It validates email/password, submits credentials, refreshes auth state, and redirects to the requested next path or dashboard.

Pseudocode:

```text
LoginView():
  state = form values, errors, submit error, loading
  on submit:
    validateLoginForm
    if errors: show errors
    call loginUser
    refreshCurrentUser
    router.push(next or /dashboard)
    on API error: show message
```

## `frontend/views/ModelDetailView.tsx`

Explanation: Shows model metadata, linked experiment/blueprint/owner details, parameters, latest classification/backtest metrics, and raw log summaries.

Pseudocode:

```text
ModelDetailView():
  read model id from route params
  fetch model detail
  render loading/error states
  render key metadata
  render parameters recursively
  find latest relevant logs
  render classification/backtest metric rows
```

## `frontend/views/ModelDetailsView.tsx`

Explanation: Compatibility alias that exports `ModelDetailView` under the older pluralized name.

Pseudocode:

```text
ModelDetailsView = ModelDetailView
```

## `frontend/views/ModelsRankingsView.tsx`

Explanation: Model rankings and library screen. It loads highlight cards and ranked rows, supports search, filters, sorting, include-incomplete toggle, pagination, favorite removal, and detail links.

Pseudocode:

```text
ModelsRankingsView():
  fetch model highlights
  maintain query filters, sort, search, pagination, includeIncomplete
  serialize filters into API query
  fetch getModelRankings
  render highlights
  render filter builder with operators by column type
  render sortable rankings table
  on favorite toggle: call API and update rows
```

## `frontend/views/PublicHubView.tsx`

Explanation: Public discovery view for users, experiments, models, and blueprints with tab switching and basic item formatting.

Pseudocode:

```text
PublicHubView():
  activeTab = users
  fetch public hub data
  render tabs
  render items for active tab
  itemTitle/itemDetail choose labels by item fields
```

## `frontend/views/RegistrationView.tsx`

Explanation: Registration form view. It validates account fields, submits registration, and redirects to login on success.

Pseudocode:

```text
RegistrationView():
  state = form values, errors, submit error, loading
  on submit:
    validateRegistrationForm
    if errors: show errors
    call registerUser
    router.push(/login)
    on API error: show message
```

## `frontend/views/SystemManagementView.tsx`

Explanation: Admin system screen for queue snapshot, runtime settings, BTCUSDT cache metadata/actions, catch-up status, and system event terminal/download.

Pseudocode:

```text
SystemManagementView():
  fetch active queue, settings, BTCUSDT metadata, system events
  poll terminal and catch-up status on intervals
  render queue cards and active jobs
  render settings form and save action
  render BTCUSDT catch-up/stop/clear controls
  render metadata timestamp bounds
  render terminal rows capped to visible limit
  provide system events download URL
```

## `frontend/views/UserManagementView.tsx`

Explanation: Staff/admin user-management screen. It lists users with filters and supports create user, status change, password reset, role change, username update, audit popup, and delete based on actor role.

Pseudocode:

```text
UserManagementView():
  auth = useAuth()
  fetch users with filters
  derive allowed actions from actor role and target role
  render user table and filters
  create user modal/form:
    call createManagedUser
  row actions:
    update status, reset password, update role, update username, delete
  audit action:
    fetch user audit trail
    show popup
  refresh list after mutations
```

## `frontend/views/UserProfileView.tsx`

Explanation: Current-user profile screen. It fetches the user's profile and displays identity, role/status, and account metadata.

Pseudocode:

```text
UserProfileView():
  fetch getMyProfile
  render loading/error states
  render name, username, email, role, status, id
```

## `frontend/views/WizardView.tsx`

Explanation: Shared wizard shell used by create flows. It renders step status chips, the current step header, summary slot, content slot, and footer slot.

Pseudocode:

```text
WizardView(steps, children, summary, footer):
  render BaseView wrapper
  for each step:
    compute class from upcoming/current/completed
    render numbered/completed icon and label
  render current step title/description
  render children content
  render summary if provided
  render footer if provided
```
