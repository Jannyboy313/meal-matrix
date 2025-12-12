/**
 * Authentication Store
 * Manages authentication state following Svelte store best practices
 * Separates concerns: store management vs Firebase implementation
 */

import { writable, type Readable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { browser } from '$app/environment';
import { updateSessionCookie } from '$lib/services/authService';

/**
 * Writable store that holds the current authenticated user.
 * - undefined: Loading/initializing authentication state
 * - null: No user is logged in
 * - User: Authenticated user object
 */
const { subscribe, set } = writable<User | null | undefined>(undefined);

/**
 * Exported readonly user store
 * Components should subscribe to this store to react to auth state changes
 */
export const user: Readable<User | null | undefined> = { subscribe };

/**
 * Initialize the auth state listener
 * Sets up Firebase auth state observer that updates the store automatically
 * Should be called once during app initialization
 */
export function initAuthListener(): void {
	// Only run in browser environment
	if (!browser) return;

	onAuthStateChanged(auth, async (firebaseUser) => {
		try {
			// Update session cookie first, then update store
			if (firebaseUser) {
				const idToken = await firebaseUser.getIdToken();
				await updateSessionCookie(idToken);
			} else {
				await updateSessionCookie(null);
			}

			// Update store after cookie is set
			set(firebaseUser);
		} catch (error) {
			console.error('Error in auth state change handler:', error);
			// Still update the user state even if cookie update fails
			set(firebaseUser);
		}
	});
}
