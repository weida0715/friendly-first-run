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
