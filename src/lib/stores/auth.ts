import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

/**
 * Writable store that holds the current authenticated user.
 * null means no user is logged in, undefined means loading.
 */
export const user = writable<User | null | undefined>(undefined);

/**
 * Initialize the auth state listener.
 * This sets up a listener that automatically updates the user store
 * whenever the authentication state changes.
 */
export function initAuthListener(): void {
	onAuthStateChanged(auth, (firebaseUser) => {
		user.set(firebaseUser);
	});
}
