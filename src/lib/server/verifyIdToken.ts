/**
 * Verifies a Firebase ID token against Google's public keys, without firebase-admin or a
 * service account. Rules: https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 *
 * Needed because the `session` cookie is only checked for presence
 * (docs/issues/session-cookie-not-verified.md).
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';

const googleKeys = createRemoteJWKSet(
	new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/** Returns the user's uid, or undefined when the token is missing, expired or forged. */
export async function verifyIdToken(token: string | undefined): Promise<string | undefined> {
	if (!token) return undefined;
	try {
		const { payload } = await jwtVerify(token, googleKeys, {
			algorithms: ['RS256'],
			issuer: `https://securetoken.google.com/${PUBLIC_FIREBASE_PROJECT_ID}`,
			audience: PUBLIC_FIREBASE_PROJECT_ID
		});
		const authTime = payload.auth_time;
		if (!payload.sub || typeof authTime !== 'number' || authTime * 1000 > Date.now()) return undefined;
		return payload.sub;
	} catch {
		return undefined;
	}
}
