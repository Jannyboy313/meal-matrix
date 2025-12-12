/**
 * Authentication Service
 * Handles all authentication-related operations following Single Responsibility Principle
 */

import {
	GoogleAuthProvider,
	signInWithPopup,
	signOut as firebaseSignOut,
	type User
} from 'firebase/auth';
import { auth } from '$lib/firebase';

/**
 * Sign in with Google OAuth provider
 * @returns Promise that resolves with the authenticated user
 * @throws Error if sign-in fails
 */
export async function signInWithGoogle(): Promise<User> {
	try {
		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);
		return result.user;
	} catch (error) {
		console.error('Error signing in with Google:', error);
		throw error;
	}
}

/**
 * Sign out the current user
 * @throws Error if sign-out fails
 */
export async function signOut(): Promise<void> {
	try {
		await firebaseSignOut(auth);
	} catch (error) {
		console.error('Error signing out:', error);
		throw error;
	}
}

/**
 * Set or clear session cookie via API endpoint
 * @param idToken - Firebase ID token or null to clear session
 */
export async function updateSessionCookie(idToken: string | null): Promise<void> {
	try {
		if (idToken) {
			await fetch('/api/auth/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: idToken })
			});
		} else {
			await fetch('/api/auth/session', {
				method: 'DELETE'
			});
		}
	} catch (error) {
		console.error('Error updating session cookie:', error);
		throw error;
	}
}
