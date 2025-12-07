# mkcert HTTPS Setup

## Overview
The application uses **mkcert** to generate locally-trusted SSL certificates for development. This provides a better development experience compared to self-signed certificates (no browser warnings).

## Prerequisites

### Install mkcert

**macOS (Homebrew):**
```bash
brew install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Arch
sudo pacman -S mkcert
```

**Windows (Chocolatey):**
```bash
choco install mkcert
```

For other installation methods, see: https://github.com/FiloSottile/mkcert#installation

## Setup

### 1. Generate Certificates

Run the setup script:
```bash
yarn setup:certs
```

This will:
1. ✅ Check if mkcert is installed
2. ✅ Install the local Certificate Authority (CA) in your system trust store
3. ✅ Generate certificates for `localhost`, `127.0.0.1`, and `::1`
4. ✅ Save certificates to `.certs/` directory

### 2. Start Development Server

```bash
yarn dev
```

The app will now run at **`https://localhost:5173`** with a valid, trusted certificate! 🎉

No browser warnings, no "Proceed anyway" clicks needed.

## How It Works

### Certificate Generation
The setup script creates two files in `.certs/`:
- **`cert.pem`** - SSL certificate
- **`key.pem`** - Private key

These files are:
- ✅ Locally trusted by your browser
- ✅ Valid for localhost development
- ✅ Automatically ignored by git (in `.gitignore`)
- ❌ NOT suitable for production

### Vite Configuration
The `vite.config.ts` automatically detects and uses mkcert certificates:

```typescript
const hasMkcertCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
  server: {
    https: hasMkcertCerts
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        }
      : undefined
  }
});
```

**Fallback:** If certificates don't exist, the server runs on HTTP (for environments without mkcert).

## Benefits Over Self-Signed Certificates

### ✅ No Browser Warnings
- Certificates are trusted by your system
- No "Not Secure" warnings
- No need to click "Advanced" → "Proceed"

### ✅ Better Developer Experience
- Works exactly like production HTTPS
- No certificate exceptions to accept
- Cleaner browser console (no cert errors)

### ✅ Works Across All Browsers
- Chrome/Edge ✓
- Firefox ✓
- Safari ✓
- All browsers trust the same CA

### ✅ Service Worker Testing
- Service workers require HTTPS or localhost
- Test PWA features properly
- Offline functionality works as expected

### ✅ Secure Context APIs
- Camera/microphone access
- Geolocation
- Clipboard API
- Payment Request API
- All require secure context (HTTPS)

## Team Setup

Each developer needs to:
1. Install mkcert
2. Run `yarn setup:certs`

The certificates are **not committed** to git (they're in `.gitignore`), so each developer generates their own trusted certificates.

## Troubleshooting

### "mkcert: command not found"
**Solution:** Install mkcert using the instructions above

### Certificates not trusted
**Solution:** Run the setup script again:
```bash
yarn setup:certs
```

This will reinstall the local CA.

### Still seeing HTTP (not HTTPS)
**Cause:** Certificates weren't generated
**Solution:**
1. Check if `.certs/cert.pem` and `.certs/key.pem` exist
2. If not, run `yarn setup:certs`
3. Restart dev server: `yarn dev`

### "Error: ENOENT: no such file or directory"
**Cause:** `.certs` directory or certificate files missing
**Solution:** Run `yarn setup:certs` to generate them

### Port already in use
**Solution:** Kill existing process:
```bash
lsof -ti:5173 | xargs kill
yarn dev
```

### Certificates expired
**Note:** mkcert certificates are valid for 10 years, so this shouldn't happen often.
**Solution:** Delete `.certs/` and run `yarn setup:certs` again

## Removing mkcert CA

If you want to uninstall the local CA from your system:

```bash
mkcert -uninstall
```

This removes the root CA from your system's trust store.

## Production Deployment

⚠️ **Important:** mkcert certificates are for **local development only**.

For production:
- Use proper SSL certificates from your hosting provider
- Vercel, Netlify, etc. provide automatic HTTPS
- Don't deploy mkcert certificates to production

The app's cookie and security settings work the same in both development (with mkcert) and production (with real certificates).

## Files

```
meal-matrix/
├── .certs/               # Generated certificates (git-ignored)
│   ├── cert.pem         # SSL certificate
│   └── key.pem          # Private key
├── scripts/
│   └── setup-certs.fish # Certificate generation script
└── vite.config.ts       # Vite config with HTTPS support
```

## Security Notes

### ✅ Safe for Development
- Certificates only valid for localhost
- Private keys never leave your machine
- CA only trusted on your computer

### ❌ Don't Share
- Don't commit certificates to git (already in `.gitignore`)
- Don't share your private key
- Each developer generates their own

### 🔐 System Trust Store
The setup script installs a local CA in your system's trust store. This is safe because:
- Only valid for certificates signed by mkcert on your machine
- Can be removed anytime with `mkcert -uninstall`
- Only affects your development environment

## Additional Resources

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Why HTTPS for development?](https://web.dev/when-to-use-local-https/)
- [Secure contexts (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
