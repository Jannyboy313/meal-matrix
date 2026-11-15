# Session cookie is only checked for presence

## Problem

`src/hooks.server.ts` treats any request with a `session` cookie as authenticated:
`const isAuthenticated = !!sessionCookie;`. The value is never verified, and
`src/routes/api/auth/session/+server.ts` stores whatever `token` the client posts.

Anyone can set `session=x` and pass the route guard. Today this only exposes page shells,
because data comes from Firestore under its own security rules. It becomes a real hole as soon
as a server route does work on the user's behalf (e.g. the planned URL import fetching foreign
pages).

The cookie also holds a Firebase ID token, which expires after one hour, while the cookie lives
seven days, so verifying it as-is would log users out after an hour.

## Fix

Either mint a Firebase session cookie (`firebase-admin` `createSessionCookie`, needs a service
account) and verify it in the hook, or verify a fresh ID token per server route as the import
plan does.

## Found

2026-11-15, while planning `docs/superpowers/plans/2026-11-15-recipe-import-from-url.md`.
