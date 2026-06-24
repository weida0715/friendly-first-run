# Frontend App Module

The `frontend/app` folder contains Next.js route entry points, the root layout, and global styles. Most route files are intentionally thin wrappers around view components.

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
