# HTTPS Development Setup

## Overview
The application now runs with HTTPS in development using the `@vitejs/plugin-basic-ssl` plugin. This ensures secure cookies work properly in both development and production.

## What Changed

### 1. Vite Configuration (`vite.config.ts`)
Added the `basicSsl()` plugin which automatically generates a self-signed SSL certificate for local development.

```typescript
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl(), tailwindcss(), sveltekit()]
});
```

### 2. Cookie Settings (`/api/auth/session/+server.ts`)
Now uses `secure: true` consistently across all environments:

```typescript
cookies.set('session', token, {
  path: '/',
  httpOnly: true,
  secure: true,  // Works in dev now!
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
});
```

## Running the App

### Start Development Server
```bash
yarn dev
```

The app will now be available at:
- **`https://localhost:5173`** (instead of `http://localhost:5173`)

### First Time Setup
When you first visit `https://localhost:5173`, your browser will show a security warning because it's a self-signed certificate. This is expected and safe for local development.

**In Chrome/Edge:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**In Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

**In Safari:**
1. Click "Show Details"
2. Click "visit this website"

## Firebase Console Update

⚠️ **Important:** You need to add the HTTPS localhost URL to Firebase authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Scroll to **Authorized domains**
5. Verify these domains are listed:
   - `localhost` (already there by default)
   - Your production domain

Firebase automatically allows `localhost` on any port and protocol (HTTP/HTTPS), so no additional configuration is needed.

## Benefits

### ✅ Consistent Cookie Behavior
- Same `secure: true` flag in dev and production
- No conditional logic based on environment
- Cookies work exactly the same way locally and in production

### ✅ Security Testing
- Test secure cookie behavior locally
- Catch cookie-related issues before deployment
- Closer to production environment

### ✅ Service Worker Testing
- Service workers require HTTPS
- Can test PWA features locally
- Better offline functionality testing

### ✅ Modern Web APIs
- Many browser APIs require secure context (HTTPS)
- Camera, microphone, geolocation APIs
- Clipboard API, payment APIs, etc.

## Troubleshooting

### Browser Shows Certificate Warning
**Normal:** This is expected for self-signed certificates. Click "Advanced" → "Proceed" to continue.

### "This site can't provide a secure connection"
**Solution:** Clear browser cache and restart the dev server with `yarn dev`

### Firebase Auth Popup Blocked
**Solution:** Make sure you clicked through the certificate warning for `localhost:5173`

### Cookies Still Not Working
1. Check browser DevTools → Application → Cookies
2. Verify `session` cookie has `Secure` flag
3. Clear all cookies and try logging in again
4. Restart dev server

### Certificate Expired Error
**Solution:** The plugin generates new certificates automatically. Clear browser cache or use incognito mode.

## Production Deployment

No changes needed! Production hosting (Vercel, Netlify, etc.) automatically provides HTTPS with valid certificates.

The `secure: true` cookie flag will work seamlessly in production without any modifications.

## Technical Details

### Self-Signed Certificate
- Generated automatically by `@vitejs/plugin-basic-ssl`
- Valid for `localhost` only
- Recreated each time if needed
- Not suitable for production (use real certificates)

### Cookie Security Flags
- **httpOnly**: Prevents JavaScript access (XSS protection)
- **secure**: Only sent over HTTPS connections
- **sameSite: lax**: Prevents CSRF attacks
- **maxAge**: 7 days expiration

## Alternative: Use HTTP (Not Recommended)

If you absolutely need HTTP for some reason, you can:

1. Remove `basicSsl()` from `vite.config.ts`
2. Change cookie setting to `secure: process.env.NODE_ENV === 'production'`

However, this is **not recommended** as it creates environment-specific behavior and prevents testing of security features.
