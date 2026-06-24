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
