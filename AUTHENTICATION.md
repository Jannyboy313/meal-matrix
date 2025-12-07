# Authentication Setup Guide

## Overview
The app uses Firebase Authentication with Google Sign-In. The implementation is complete and includes:

- ✅ Google Sign-In popup flow with `signInWithPopup()`
- ✅ Automatic handling of 2FA and password entry
- ✅ User state management with Svelte stores
- ✅ Navigation bar with user profile
- ✅ Protected routes (ready to use)

## Firebase Console Setup Required

To enable Google authentication, you need to configure it in the Firebase Console:

### 1. Enable Google Sign-In Method

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable** to ON
6. Set the **Project support email** (required)
7. Click **Save**

### 2. Configure Authorized Domains

1. In the same **Sign-in method** tab
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (already added by default)
   - Your production domain (e.g., `meal-matrix.vercel.app`)

### 3. Environment Variables

Ensure your `.env` file has all Firebase configuration values:

```env
PUBLIC_FIREBASE_API_KEY=your_actual_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
```

Get these values from:
**Firebase Console** → **Project Settings** → **General** → **Your apps** → **Web app**

## How to Use

### Sign In
1. Navigate to `/login` or click "Sign In" in the navigation bar
2. Click the "Sign in with Google" button
3. Select your Google account in the popup
4. Complete any 2FA if enabled
5. You'll be redirected to the home page

### Sign Out
Click the "Sign Out" button in the navigation bar (visible when logged in)

## Components

- **`/login` page** - Dedicated login page with Google sign-in
- **`NavBar.svelte`** - Shows user profile and auth status
- **`Login.svelte`** - Reusable login component with Google authentication
- **`auth.ts` store** - Manages user state reactively

## Code Flow

1. **User clicks "Sign in with Google"**
   ```typescript
   const provider = new GoogleAuthProvider();
   await signInWithPopup(auth, provider);
   ```

2. **Firebase handles:**
   - Opens Google OAuth popup
   - User selects account
   - Handles password entry
   - Handles 2FA if enabled
   - Returns user credentials

3. **App updates:**
   - `onAuthStateChanged` listener fires
   - User store updates
   - UI reactively updates
   - User sees their profile in nav bar

## Testing

1. Start dev server: `yarn dev`
2. Visit `http://localhost:5173/login`
3. Click "Sign in with Google"
4. Complete authentication
5. Verify you see your profile in the nav bar

## Troubleshooting

### "auth/configuration-not-found"
- Enable Google sign-in method in Firebase Console

### "auth/unauthorized-domain"
- Add your domain to Authorized domains list

### Environment variables not loading
- Ensure `.env` file exists in project root
- Restart dev server after changing `.env`
- Check variable names start with `PUBLIC_`

### Popup blocked
- Allow popups for localhost in browser settings
- Try different browser

## Next Steps

- ✅ Authentication is ready to use
- Consider adding: email/password authentication
- Consider adding: session persistence options
- Consider adding: profile editing
- Consider adding: account deletion
