# Android Testing Checklist

Use this checklist to verify PWA functionality on Android devices.

## Pre-Installation Testing

### Basic Functionality
- [ ] App loads correctly in mobile browser
- [ ] All routes are accessible
- [ ] Responsive design works on mobile screen sizes
- [ ] Touch interactions work smoothly
- [ ] Forms are mobile-friendly

### PWA Manifest
- [ ] Navigate to `/manifest.json` - file loads correctly
- [ ] Manifest contains correct app name
- [ ] Theme color displays correctly
- [ ] Icons are accessible at `/icon-192x192.png` and `/icon-512x512.png`

### Service Worker (Chrome DevTools)
1. Open Chrome DevTools (3-dot menu > More tools > Developer tools)
2. Go to Application tab
3. Check Service Workers section:
   - [ ] Service worker is registered
   - [ ] Status shows "activated and is running"
   - [ ] Update on reload is working

### Installability
- [ ] "Add to Home Screen" prompt appears
- [ ] OR Install button shows in Chrome menu (⋮ > Install app)
- [ ] Lighthouse audit shows PWA installable

## Installation Process

### Install via Chrome
1. [ ] Open app in Chrome
2. [ ] Tap 3-dot menu (⋮)
3. [ ] See "Install app" or "Add to Home screen" option
4. [ ] Tap to install
5. [ ] Confirm installation dialog
6. [ ] Icon appears on home screen

### Icon Verification
- [ ] App icon displays correctly on home screen
- [ ] Icon is not distorted or pixelated
- [ ] Maskable icon adapts to device theme (on Android 12+)

## Post-Installation Testing

### Launch Behavior
- [ ] Tap home screen icon launches app
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen displays (if configured)
- [ ] App loads quickly

### Standalone Mode Features
- [ ] No browser address bar visible
- [ ] No browser navigation buttons
- [ ] Full-screen app experience
- [ ] Status bar uses theme color (#10b981)
- [ ] App switcher shows correct icon and name

### Navigation
- [ ] App back button works correctly
- [ ] Deep links work from other apps
- [ ] All internal routes accessible
- [ ] External links open in browser

### Offline Functionality
1. Enable airplane mode or disconnect WiFi
2. [ ] Previously visited pages load
3. [ ] Cached images display
4. [ ] Offline fallback page shows for uncached routes
5. [ ] Appropriate offline message displays

### Caching Behavior
1. Visit all main routes while online
2. Turn off network
3. [ ] Home page loads offline
4. [ ] Recipe list loads (if cached)
5. [ ] Individual recipe pages load (if cached)
6. [ ] Static assets load instantly

### Background Sync (if implemented)
- [ ] Changes made offline sync when online
- [ ] No data loss during offline usage
- [ ] Sync indicator shows status

### App Shortcuts
1. Long-press app icon
2. [ ] Quick actions menu appears
3. [ ] "New Recipe" shortcut available
4. [ ] Tapping shortcut opens correct page

## Performance Testing

### Load Times
- [ ] First load < 3 seconds
- [ ] Subsequent loads < 1 second (cached)
- [ ] Time to interactive < 3 seconds

### Responsiveness
- [ ] Smooth scrolling
- [ ] No lag on interactions
- [ ] Animations run at 60fps
- [ ] No jank during navigation

### Memory Usage
- [ ] App doesn't crash on low-end devices
- [ ] No excessive memory warnings
- [ ] Background tabs don't consume excessive resources

## Lighthouse Audit

Run Lighthouse audit in Chrome DevTools:

### Target Scores
- [ ] Performance: 90+ (mobile)
- [ ] Accessibility: 100
- [ ] Best Practices: 100
- [ ] SEO: 100
- [ ] PWA: 100 (all checks pass)

### PWA Criteria
- [ ] Page load fast enough on mobile
- [ ] Web app manifest meets installability requirements
- [ ] Configured for a custom splash screen
- [ ] Sets a theme color for the address bar
- [ ] Content is sized correctly for viewport
- [ ] Has a `<meta name="viewport">` tag
- [ ] Provides a valid apple-touch-icon
- [ ] Manifest includes a maskable icon
- [ ] Service worker registered successfully

## Device-Specific Tests

### Android 13+
- [ ] Material You theming adapts to wallpaper
- [ ] Dynamic color support works
- [ ] Notification permissions work (if implemented)

### Android 12+
- [ ] Splash screen API works
- [ ] Adaptive icon displays correctly
- [ ] Theme follows system dark mode

### Samsung Internet
- [ ] App installs correctly
- [ ] Samsung's PWA features work
- [ ] No Samsung-specific bugs

### Chrome Android
- [ ] Install banner shows
- [ ] WebAPK generation works
- [ ] Updates download automatically

## Uninstall Testing

### Uninstall Process
- [ ] Long-press icon > Remove/Uninstall works
- [ ] Uninstall from Settings > Apps works
- [ ] All app data removed after uninstall
- [ ] Cache cleared on uninstall

### Reinstall
- [ ] Can reinstall after uninstalling
- [ ] Fresh install works correctly
- [ ] No leftover data from previous install

## Common Issues & Solutions

### Issue: Install option not showing
**Solutions:**
- Verify HTTPS is enabled
- Check manifest.json is valid
- Ensure icons are correct sizes
- Clear browser cache and retry

### Issue: Service worker not registering
**Solutions:**
- Check console for errors
- Verify HTTPS connection
- Clear site data and reload
- Check service worker scope

### Issue: Offline mode not working
**Solutions:**
- Verify service worker is active
- Check caching strategies in config
- Test with DevTools offline mode first
- Clear cache and re-cache pages

### Issue: App not full-screen
**Solutions:**
- Verify manifest display mode is "standalone"
- Check meta tags in app.html
- Reinstall the app
- Try different browser

## Testing Tools

### Chrome DevTools
- Application tab: Manifest, Service Workers, Storage
- Network tab: Offline mode testing
- Lighthouse: PWA audit

### Online Tools
- [Lighthouse CI](https://web.dev/lighthouse-ci/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Manifest Validator](https://manifest-validator.appspot.com/)

### Physical Devices
Test on at least:
- One budget Android device (Android 9+)
- One mid-range device (Android 12+)
- One flagship device (Android 13+)

## Sign-Off

### Tested By: _______________
### Date: _______________
### Devices Tested:
- [ ] Device 1: _______________
- [ ] Device 2: _______________
- [ ] Device 3: _______________

### Overall Result: ⬜ PASS ⬜ FAIL

### Notes:
_____________________________________
_____________________________________
_____________________________________
