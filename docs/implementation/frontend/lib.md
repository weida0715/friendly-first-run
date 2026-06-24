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
