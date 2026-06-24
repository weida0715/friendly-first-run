# Frontend Implementation

## Application Routing

The frontend uses the Next.js app router. Route entrypoints live under `frontend/app`, and most of them render a view from `frontend/views`.

Pseudocode:

```text
Procedure RenderRoute
  Load the route file for the current path.
  If the route is public:
    Render the view directly.
  If the route requires authentication:
    Wrap the view in RequireAuth.
  If the route requires a staff or admin role:
    Wrap the view in RequireRole.
End Procedure
```

The root `/` page checks authentication state. Authenticated users see the dashboard, while unauthenticated users see the landing page.

## Authentication Provider and Route Guard Implementation

`AuthProvider` stores the current user, loading state, authentication flag, refresh function, and logout function. It calls `/auth/me` through the API client when the app loads.

Pseudocode:

```text
Procedure AuthProvider
  Start with no user and loading set to true.
  Request the current user from the backend.
  If the backend returns a user:
    Store that user.
  If the backend returns unauthorized:
    Store no user.
  Mark loading as false.
  Expose user, isLoading, isAuthenticated, refreshUser, and logout to child components.
End Procedure
```

`RequireAuth` redirects unauthenticated users to login. `RequireRole` compares the current role rank against the minimum required role and redirects unauthorized users.

## Navigation and Application Shell

`AppShell` wraps the page content with the top bar and responsive mobile navigation. `frontend/lib/routes/nav.ts` defines the navigation items, icons, sections, and minimum role per item.

Pseudocode:

```text
Procedure BuildNavigation
  Read authentication status and user role.
  If the user is not authenticated:
    Return no app navigation items.
  Normalize the user role.
  Include each nav item whose minimum role is less than or equal to the user's role.
  Split visible items into core and admin sections.
End Procedure
```

## UI Component Implementation

Reusable UI components live under `frontend/components`. Layout components define page structure. UI primitives define buttons, cards, inputs, labels, and badges. State components define loading, empty, and error displays. Form components provide shared field rows, error text, date input, select input, number input, and tokenized parameter input.

This keeps view files focused on screen-specific state and behavior instead of repeating low-level markup.

## Registration and Login Views

`RegistrationView` and `LoginView` collect credentials and call the API client. Frontend validators in `frontend/lib/validators` check input shape before the request is submitted.

Pseudocode:

```text
Procedure SubmitLogin
  Read email and password from form state.
  Validate required fields.
  Send credentials through loginUser.
  If login succeeds:
    Refresh AuthProvider current user.
    Navigate to the requested next page or dashboard.
  If login fails:
    Show the backend error message.
End Procedure
```

## User Management and Profile Views

`UserProfileView` renders the current user's profile data. `UserManagementView` provides staff-facing user search, listing, creation, role update, status update, password reset, deletion, and audit viewing.

Pseudocode:

```text
Procedure LoadUsers
  Read search, role, status, page, and page size from view state.
  Call listUsers with those filters.
  Render returned users in the table.
  Show paging metadata.
  For each row:
    Enable only the actions allowed by the current role and backend response.
End Procedure
```

## Dashboard and Module Landing Pages

`DashboardView` is the main authenticated landing area. It combines backend health, market chart data, and module navigation into one overview. Other module landing pages include experiments, blueprints, models, public hub, jobs, system management, and documentation.

These views act as the frontend boundary for each module. They fetch data through the API client, hold local UI state, and render reusable components.

## Blueprint Wizard Implementation

`BlueprintWizardView` guides users through blueprint creation. It collects metadata, architecture choices, indicators, parameter ranges, and review information before submitting a draft blueprint.

Pseudocode:

```text
Procedure SubmitBlueprintDraft
  Collect metadata, selected architecture, selected indicators, and parameter ranges.
  Build a blueprint payload.
  Send payload to the create blueprint endpoint.
  If validation fails:
    Display field errors returned by the backend.
  If creation succeeds:
    Navigate to the created blueprint detail page.
End Procedure
```

## Blueprint Library and Detail Views

`BlueprintsLibraryView` lists owned and favorited blueprints. `BlueprintDetailView` renders blueprint metadata, architecture, indicators, version lineage, owner information, approval state, and favorite state.

Pseudocode:

```text
Procedure ToggleBlueprintFavorite
  Read the current favorite state.
  If favorited:
    Send delete favorite request.
  Else:
    Send create favorite request.
  Reload or update local detail state with the new favorite state.
End Procedure
```

## Blueprint Moderation View

`BlueprintModerationView` is a staff-facing view for pending blueprint review. It loads the moderation queue and calls approve, reject, or disapprove actions.

Pseudocode:

```text
Procedure ModerateBlueprint
  Load pending blueprint items.
  Staff user selects an action for one blueprint.
  Send the moderation action to the backend.
  If the action succeeds:
    Remove or update the item in the queue.
  If the action fails:
    Show the backend error.
End Procedure
```

## Experiment Wizard Boundary

`ExperimentWizardView` collects experiment basics, data range, split configuration, blueprint selection, parameter overrides, and review information. It is the frontend boundary for experiment creation, while validation and persistence remain backend responsibilities.

Pseudocode:

```text
Procedure SubmitExperiment
  Collect experiment name, date range or candle count, split settings, selected blueprint, and overrides.
  Send the payload to the experiment create endpoint.
  If backend validation returns field errors:
    Show errors beside the relevant wizard sections.
  If creation succeeds:
    Navigate to experiment or job detail.
End Procedure
```

## API Client and Frontend-Backend Integration

The API client lives in `frontend/lib/api/client.ts`. Endpoint paths are centralized in `frontend/lib/api/endpoints.ts`.

All requests use the configured API base URL. Browser requests default to the same-origin `/api/backend` proxy path unless a relative override is supplied. Requests include credentials so the backend session cookie is sent. Mutating requests fetch a CSRF token first and attach it as `X-CSRFToken`.

Pseudocode:

```text
Procedure SendMutatingRequest
  Fetch CSRF token from the backend.
  Build request headers with Accept, Content-Type, and CSRF token.
  Send request with credentials included.
  Parse JSON response.
  If response is not successful:
    Throw an ApiClientError with status and backend details.
End Procedure
```

## Market Chart Visualization Boundary

Market chart rendering is isolated in `frontend/components/charts`. `BTCUSDTPriceChart` renders candle data using Lightweight Charts. `useBTCUSDTChartData` fetches the required data from market-data endpoints and provides loading, empty, and error states to the chart component.

Pseudocode:

```text
Procedure RenderBTCUSDTChart
  Request BTCUSDT kline data for the selected range.
  If loading:
    Render chart loading state.
  If no rows are available:
    Render empty state.
  If the request fails:
    Render error state.
  Otherwise:
    Convert candles into chart series data.
    Render the price chart.
End Procedure
```
