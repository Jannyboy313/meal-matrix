import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/session'];

export const handle: Handle = async ({ event, resolve }) => {
	// Get the session cookie (we'll set this from the client)
	const sessionCookie = event.cookies.get('session');

	// Check if user is authenticated
	const isAuthenticated = !!sessionCookie;

	// Get the pathname
	const { pathname } = event.url;

	// Check if the current route is public
	const isPublicRoute = publicRoutes.includes(pathname);

	// Redirect to login if accessing any non-public route without auth
	if (!isPublicRoute && !isAuthenticated) {
		const returnTo = encodeURIComponent(pathname);
		throw redirect(303, `/login?returnTo=${returnTo}`);
	}

	// Redirect to home if accessing login while authenticated
	if (pathname === '/login' && isAuthenticated) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
