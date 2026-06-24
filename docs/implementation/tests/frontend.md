# Frontend Tests

Frontend tests use Jest and Testing Library to verify route wrappers, auth behavior, API client behavior, reusable components, and feature views.

## `frontend/tests/__mocks__/d3.ts`

Explanation: Provides a lightweight D3 mock for tests that import chart helpers without needing real D3 DOM behavior.

Pseudocode:

```text
export mocked D3 chainable methods
return safe no-op selection/scale/axis helpers
```

## `frontend/tests/admin-placeholder-views.test.tsx`

Explanation: Smoke-tests admin-related placeholder/section views for system management, blueprint moderation, and job detail lifecycle sections.

Pseudocode:

```text
render SystemManagementView with mocked APIs
expect system sections
render BlueprintModerationView with queue data
expect moderation sections
render JobDetailView with lifecycle data
expect job lifecycle sections
```

## `frontend/tests/api-client-csrf.test.ts`

Explanation: Verifies unsafe API methods fetch and attach CSRF tokens.

Pseudocode:

```text
mock fetch for csrf endpoint and target request
call apiPost/apiDelete wrapper
expect target request has X-CSRFToken
expect credentials are included
```

## `frontend/tests/auth-guards.test.tsx`

Explanation: Tests client auth guards for unauthenticated redirects, unauthorized role redirects, and allowed admin access.

Pseudocode:

```text
mock useAuth and router
render RequireAuth without user
expect redirect to login with next path
render RequireRole with low role
expect fallback redirect
render RequireRole with Admin
expect children visible
```

## `frontend/tests/base-and-states.test.tsx`

Explanation: Checks shared layout/state components render normal, loading, error, empty, default, and custom content states.

Pseudocode:

```text
render BaseView normal/loading/error
expect title/content/loading/error text
render EmptyState default and custom action
render LoadingState default and custom message
```

## `frontend/tests/blueprint-library-detail-moderation.test.tsx`

Explanation: Covers blueprint library tabs, blueprint detail status/lineage/favorite behavior, and moderation queue actions.

Pseudocode:

```text
mock blueprint APIs
render BlueprintsLibraryView
switch owned/favorited tabs and expect rows
render BlueprintDetailView
expect status, lineage, favorite toggle
render BlueprintModerationView
expect approve/reject/disapprove actions
```

## `frontend/tests/blueprint-wizard-view.test.tsx`

Explanation: Tests blueprint wizard navigation, validation, submission, backend validation display, metadata-backed parameter constraints, tokenized inputs, dropdown tokens, and architecture parameter validation.

Pseudocode:

```text
mock metadata and createBlueprint APIs
render BlueprintWizardView
navigate through steps
trigger invalid step and expect inline error
fill valid blueprint fields
submit and expect navigation to detail
mock API rejection and expect backend error
interact with tokenized indicator/architecture params
expect constraint validation behavior
```

## `frontend/tests/btcusdt-price-chart.test.tsx`

Explanation: Tests BTCUSDT chart states and lightweight-charts integration behavior.

Pseudocode:

```text
mock lightweight-charts
render loading, error, empty states
render with candles
expect candlestick data sent to series
rerender with updated latest bar
expect incremental update and scroll
unmount and expect chart cleanup
```

## `frontend/tests/dashboard-view.test.tsx`

Explanation: Checks dashboard cards, quick links, BTCUSDT interval selection, chart hook arguments, loading state, and fallback live stats.

Pseudocode:

```text
mock chart hook
render DashboardView
expect required cards and quick actions
change interval
expect hook called with selected interval
render loading/fallback data states
```

## `frontend/tests/dialog-and-responsive.test.tsx`

Explanation: Smoke-tests dialog open/close interaction and responsive app shell classes.

Pseudocode:

```text
render confirm dialog trigger/card
click open and close
expect dialog content toggles
render AppShell
expect responsive layout class names
```

## `frontend/tests/documentation-view.test.tsx`

Explanation: Verifies documentation list and selected document detail render from mocked backend responses.

Pseudocode:

```text
mock listDocumentation and getDocumentation
render DocumentationView
wait for list item
expect detail markdown content rendered
```

## `frontend/tests/experiment-detail-view.test.tsx`

Explanation: Tests experiment detail configuration rendering, expanded risk chart modal, leaderboard pagination, model detail popup, round-log CSV progress, and completed download actions.

Pseudocode:

```text
mock experiment detail and log APIs
render ExperimentDetailView
expect configuration section
open risk chart modal and expect guidance
page through model leaderboard
open model popup
trigger round-log CSV action and expect progress
expect completed download buttons
```

## `frontend/tests/experiment-list-view.test.tsx`

Explanation: Tests debounced experiment search/status filters and graceful network error rendering.

Pseudocode:

```text
mock listExperiments
render ExperimentListView
change search/status
advance debounce timers
expect API called with filters
mock rejection
expect error state
```

## `frontend/tests/experiment-wizard-view.test.tsx`

Explanation: Broad test coverage for the experiment wizard: dataset preview, reused model prefill, override normalization, blueprint selection/preview, grouped overrides, validation, cached bounds, intervals, split controls, deterministic seed, target preview, target constraints, metadata hydration, permutation caps, submit, back navigation, and backend field errors.

Pseudocode:

```text
mock metadata, blueprint options, target preview, createExperiment
render ExperimentWizardView
validate initial wizard shell and dataset preview
exercise model reuse query params
navigate basics -> blueprint -> target -> overrides -> split -> review
verify blocking errors for missing/invalid values
verify cached bounds and interval options
edit split range and seed
open target info and apply preview params
edit tokenized overrides
verify permutation cap warning
submit valid payload and expect detail redirect
mock 422 response and expect field errors
```

## `frontend/tests/job-detail-view.test.tsx`

Explanation: Tests job detail rendering and friendly not-found handling.

Pseudocode:

```text
mock getJobDetail success
render JobDetailView
expect job status/details
mock not found response
expect friendly missing job message
```

## `frontend/tests/login-view.test.tsx`

Explanation: Tests login validation, blocked invalid submit, successful submit, auth refresh, and dashboard redirect.

Pseudocode:

```text
render LoginView
submit empty form
expect validation errors
fill email/password
mock login success
submit
expect refreshCurrentUser and router push dashboard
```

## `frontend/tests/model-views.test.tsx`

Explanation: Tests model ranking and detail screens: ranking rows, detail links, sorting, search/filter serialization, filter operator restrictions, numeric formatting, API errors, include-incomplete toggle, optimistic unfavorite removal, and detail metric/log rendering.

Pseudocode:

```text
mock model ranking/highlight/detail APIs
render ModelsRankingsView
expect rows and sortable headings
edit search/filter rules and expect serialized query
switch column types and expect operator reset
toggle includeIncomplete
unfavorite model and expect row removal
mock ranking error and expect error state
render ModelDetailView and expect metrics/params/logs
```

## `frontend/tests/navigation.test.tsx`

Explanation: Tests visible nav items, route targets, role filtering, topbar sign-out routing, guest nav, and admin dropdown visibility.

Pseudocode:

```text
mock auth roles and router
render navigation/sidebar/topbar
expect authenticated labels and hrefs
verify role-protected items hide/show
click sign out and expect login route
render guest topbar and expect public links
render staff topbar and expect admin dropdown
```

## `frontend/tests/public-hub-view.test.tsx`

Explanation: Tests public hub data loading and tab switching.

Pseudocode:

```text
mock getPublicHub
render PublicHubView
wait for users tab data
click experiments/models/blueprints tabs
expect matching records render
```

## `frontend/tests/registration-view.test.tsx`

Explanation: Tests registration validation, blocked invalid submit, successful payload submit, and redirect to login.

Pseudocode:

```text
render RegistrationView
submit invalid form
expect validation errors
fill valid fields
mock register success
submit
expect API payload and router push login
```

## `frontend/tests/routes-rendering.test.tsx`

Explanation: Verifies major route components render and route wrappers use the expected auth or role guard.

Pseudocode:

```text
mock guards and views
render major page components
expect corresponding view output
inspect authenticated pages for RequireAuth
inspect public pages for no auth guard
inspect role pages for RequireRole and minimum role
```

## `frontend/tests/status-badges.test.tsx`

Explanation: Tests generic status badge tone mapping and user role/status wrapper normalization.

Pseudocode:

```text
render StatusBadge with known and unknown statuses
expect label and fallback styles
render UserRoleBadge for Admin/Moderator/User
render UserStatusBadge for Enabled/Disabled/unknown
```

## `frontend/tests/system-management-view.test.tsx`

Explanation: Tests system management queue display, empty queue state, settings controls, terminal truncation/download link, BTCUSDT cache controls, catch-up failure display, and stop catch-up behavior.

Pseudocode:

```text
mock queue/settings/events/metadata APIs
render SystemManagementView
expect queue cards and job rows
mock empty queue and expect empty state
edit settings and expect update call
provide many terminal rows and expect visible cap plus download URL
click BTCUSDT catch-up/clear/stop controls
expect cache update notifications and error handling
```

## `frontend/tests/user-management-view.test.tsx`

Explanation: Tests user-management RBAC UI: create errors, hidden normal-user actions, moderator-limited actions, full admin actions, list endpoint errors, and audit trail rendering.

Pseudocode:

```text
mock auth actor and user APIs
render UserManagementView
simulate create-user failure and expect error
render as normal user and expect staff actions hidden
render as moderator and expect limited actions
render as admin and expect full action set
mock list failure and expect error
open audit trail and expect events
```

## `frontend/tests/wizard-view.test.tsx`

Explanation: Tests shared wizard layout: step chips, current step header, summary/footer slots, and responsive structure.

Pseudocode:

```text
render WizardView with steps
expect current/completed/upcoming chips
expect current title and description
render summary and footer slots
expect responsive class structure
```
