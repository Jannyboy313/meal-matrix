import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { browser } from '$app/environment';

/**
 * Writable store that holds the current authenticated user.
 * null means no user is logged in, undefined means loading.
 */
export const user = writable<User | null | undefined>(undefined);

/**
 * Set or clear the session cookie
 */
async function updateSessionCookie(idToken: string | null): Promise<void> {
	if (!browser) return;

	try {
		if (idToken) {
			// Set session cookie
			await fetch('/api/auth/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: idToken })
			});
		} else {
			// Clear session cookie
			await fetch('/api/auth/session', {
				method: 'DELETE'
			});
		}
	} catch (error) {
		console.error('Error updating session cookie:', error);
	}
}

/**
 * Initialize the auth state listener.
 * This sets up a listener that automatically updates the user store
 * whenever the authentication state changes.
 */
export function initAuthListener(): void {
	onAuthStateChanged(auth, async (firebaseUser) => {
		// Update session cookie first, then update store
		if (firebaseUser) {
			const idToken = await firebaseUser.getIdToken();
			await updateSessionCookie(idToken);
		} else {
			await updateSessionCookie(null);
		}

		// Set user after cookie is updated
		user.set(firebaseUser);
	});
}
