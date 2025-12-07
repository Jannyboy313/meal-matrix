# PWA Setup Guide

Meal Matrix is now a fully functional Progressive Web App (PWA) that works seamlessly on Android and other platforms!

## Features

✅ **Install to Home Screen** - Add Meal Matrix to your Android home screen like a native app
✅ **Offline Support** - Access your recipes even without internet connection
✅ **Fast Loading** - Cached assets load instantly
✅ **App-like Experience** - Full-screen mode with no browser UI
✅ **Background Sync** - Automatic updates when online
✅ **Push Notifications Ready** - Infrastructure in place for future notifications

## Android Installation

### Method 1: Chrome (Recommended)
1. Open Meal Matrix in Chrome on your Android device
2. Tap the three-dot menu (⋮) in the top right
3. Select "Install app" or "Add to Home screen"
4. Confirm the installation
5. The app icon will appear on your home screen

### Method 2: Browser Prompt
1. Visit the Meal Matrix website
2. Look for the "Add to Home Screen" prompt at the bottom
3. Tap "Install" or "Add"

## Features for Mobile Users

### Standalone Mode
When installed, the app runs in standalone mode:
- No browser address bar
- Full-screen experience
- App-like navigation
- Smooth animations

### Offline Functionality
The app caches:
- All pages and routes
- Images and icons
- API responses (5-minute cache)
- Static assets (fonts, CSS, JS)

### App Shortcuts
Long-press the app icon to access quick actions:
- **New Recipe** - Jump directly to recipe creation

## Technical Details

### Manifest
The web app manifest (`manifest.json`) defines:
- App name: Meal Matrix
- Theme color: #10b981 (emerald green)
- Display mode: standalone
- Icons: 192x192 and 512x512 (regular + maskable)

### Service Worker
Powered by Workbox with intelligent caching strategies:
- **Cache First** - Images, fonts (long cache)
- **Network First** - API calls (5-minute fallback)
- **Stale While Revalidate** - Dynamic content

### Icons
PWA icons are generated in multiple formats:
- `icon-192x192.png` - Standard icon
- `icon-192x192-maskable.png` - Maskable icon (adaptive)
- `icon-512x512.png` - High-res icon
- `icon-512x512-maskable.png` - High-res maskable

To regenerate icons:
```bash
yarn generate:icons
```

## Development

### Testing PWA Features Locally

1. Build the production version:
```bash
yarn build
```

2. Preview the build:
```bash
yarn preview
```

3. Open Chrome DevTools:
   - Go to **Application** tab
   - Check **Manifest** section
   - Verify **Service Workers** are registered
   - Use **Lighthouse** to audit PWA score

### PWA Configuration

The PWA is configured in `vite.config.ts` using `@vite-pwa/sveltekit`:

```typescript
SvelteKitPWA({
  manifest: { ... },
  workbox: {
    runtimeCaching: [ ... ],
    cleanupOutdatedCaches: true
  }
})
```

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome Android | 90+ | ✅ Full |
| Samsung Internet | 14+ | ✅ Full |
| Firefox Android | 88+ | ✅ Full |
| Edge Android | 90+ | ✅ Full |
| Safari iOS | 15+ | ⚠️ Partial* |

*iOS Safari has limited PWA support (no background sync, limited storage)

## Lighthouse Score

Target metrics for production:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- PWA: 100

## Troubleshooting

### Service Worker Not Registering
1. Ensure you're using HTTPS (required for SW)
2. Check browser console for errors
3. Clear site data and reload
4. Verify build output includes `sw.js`

### App Not Installing
1. Check manifest.json is accessible
2. Verify icons exist and are correct size
3. Ensure HTTPS is enabled
4. Try different browser (Chrome recommended)

### Offline Mode Not Working
1. Check Service Worker is active (DevTools > Application)
2. Verify caching strategies in `vite.config.ts`
3. Test with DevTools offline mode first
4. Clear cache and re-test

## Future Enhancements

Planned PWA features:
- [ ] Push notifications for recipe reminders
- [ ] Background sync for offline edits
- [ ] Share target API (share recipes from other apps)
- [ ] Periodic background sync
- [ ] Web share API integration

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
