# Route Guards Implementation

## Overview
The application now has comprehensive authentication guards that protect routes requiring user authentication and automatically redirect users to the login page.

## Protected Routes

The following routes require authentication:
- `/recipes/new` - Create new recipe
- `/recipes/[id]/edit` - Edit existing recipe

**Any user attempting to access these routes without being authenticated will be automatically redirected to `/login` with a return URL.**

## Implementation Details

### 1. Server-Side Guards (`hooks.server.ts`)
- Intercepts all requests before they reach the route
- Checks for session cookie to verify authentication
- Redirects unauthenticated users to `/login?returnTo=[original-url]`
- Prevents authenticated users from accessing `/login` (redirects to home)

### 2. Client-Side Guards (`+layout.ts`)
- Provides additional client-side protection
- Uses the user store to check authentication state
- Handles client-side navigation between protected routes
- Works in conjunction with server-side guards

### 3. Session Management (`/api/auth/session/+server.ts`)
- Sets HTTP-only secure cookies when user signs in
- Clears cookies when user signs out
- Cookie expires after 7 days
- Uses secure flags for production safety

### 4. Auth Store Updates (`stores/auth.ts`)
- Automatically updates session cookie when auth state changes
- Syncs Firebase authentication with SvelteKit session
- Handles token refresh and updates

## User Flow

### Accessing Protected Route (Not Authenticated)
1. User navigates to `/recipes/new`
2. Server hook checks session cookie → Not found
3. User is redirected to `/login?returnTo=/recipes/new`
4. User signs in with Google
5. User is automatically redirected back to `/recipes/new`

### Accessing Protected Route (Authenticated)
1. User navigates to `/recipes/new`
2. Server hook checks session cookie → Found
3. Request proceeds normally to the route
4. Page loads successfully

### Accessing Login Page (Already Authenticated)
1. User navigates to `/login`
2. Server hook checks session cookie → Found
3. User is redirected to `/`
4. Prevents unnecessary login flow

## Adding New Protected Routes

To protect a new route, add it to the `protectedRoutes` array in both:

**1. `src/hooks.server.ts`:**
```typescript
const protectedRoutes = [
  '/recipes/new',
  '/recipes/[id]/edit',
  '/your-new-route'  // Add here
];
```

**2. `src/routes/+layout.ts`:**
```typescript
const protectedRoutes = [
  '/recipes/new',
  '/recipes/[id]/edit',
  '/your-new-route'  // Add here
];
```

### Dynamic Routes
For routes with parameters (e.g., `/recipes/[id]/edit`), the guard automatically handles pattern matching using regex.

## Security Features

### 🔒 Session Cookies
- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite: Lax**: CSRF protection
- **Max-Age**: 7 days expiration

### 🛡️ Dual-Layer Protection
- Server-side guards prevent unauthorized API access
- Client-side guards provide immediate feedback
- Both layers work together for comprehensive security

### 🔄 Automatic Token Refresh
- Firebase ID token is automatically refreshed
- Session cookie is updated with new token
- Seamless authentication persistence

## Testing

### Test Unauthenticated Access
1. Ensure you're signed out
2. Try to access: `http://localhost:5173/recipes/new`
3. ✅ Should redirect to `/login?returnTo=/recipes/new`

### Test Authenticated Access
1. Sign in with Google
2. Try to access: `http://localhost:5173/recipes/new`
3. ✅ Should load the page successfully

### Test Return URL
1. Sign out
2. Navigate to a protected route
3. Sign in when redirected
4. ✅ Should return to the original protected route

### Test Login Bypass
1. Sign in with Google
2. Try to access: `http://localhost:5173/login`
3. ✅ Should redirect to `/`

## Architecture

```
User Request → Server Hook (hooks.server.ts)
                    ↓
            Check Session Cookie
                    ↓
        ┌───────────┴───────────┐
        │                       │
   Authenticated          Not Authenticated
        │                       │
        ↓                       ↓
   Allow Access         Redirect to /login
                              ↓
                        User Signs In
                              ↓
                    Set Session Cookie (API route)
                              ↓
                    Redirect to Return URL
```

## Environment Variables Required

Ensure these Firebase config variables are set in `.env`:
```env
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
```

## Production Considerations

### Deploy Checklist
- ✅ Environment variables configured
- ✅ HTTPS enabled (required for secure cookies)
- ✅ Firebase authorized domains updated
- ✅ Session cookie secure flag enabled in production
- ✅ CORS properly configured

### Performance
- Session cookie check is extremely fast (no database query)
- Server-side guards prevent unnecessary page loads
- Client-side guards provide instant navigation feedback

## Troubleshooting

### Infinite Redirect Loop
**Cause**: Session cookie not being set properly
**Solution**: Check browser console for API errors, verify `/api/auth/session` endpoint

### Always Redirecting to Login
**Cause**: Session cookie not persisting
**Solution**: Check cookie settings, ensure HTTPS in production

### "Cannot GET /login" Error
**Cause**: Missing login page route
**Solution**: Verify `/routes/login/+page.svelte` exists

### Protected Route Still Accessible
**Cause**: Route not added to protectedRoutes array
**Solution**: Add route to both `hooks.server.ts` and `+layout.ts`

## Future Enhancements

Consider implementing:
- [ ] Role-based access control (admin, user, etc.)
- [ ] Email verification requirements
- [ ] Session expiration warnings
- [ ] Remember me functionality
- [ ] Multiple authentication providers (email/password, GitHub, etc.)
