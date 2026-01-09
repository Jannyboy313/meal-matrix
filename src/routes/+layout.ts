import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { loadTranslations, locale } from '$lib/i18n';

export const load: LayoutLoad = async ({ url }) => {
	// Only run on client side
	if (!browser) {
		return {};
	}

	// Initialize translations
	const lang = localStorage.getItem('locale') || 'en';
	locale.set(lang);
	await loadTranslations(lang, url.pathname);

	// Public routes that don't require authentication
	const publicRoutes = ['/login'];

	// Check if current route is public
	const isPublicRoute = publicRoutes.includes(url.pathname);

	// Get current user
	const currentUser = get(user);

	// If accessing any non-public route without authentication, redirect to login with return URL
	if (!isPublicRoute && currentUser === null) {
		const returnTo = encodeURIComponent(url.pathname);
		throw redirect(303, `/login?returnTo=${returnTo}`);
	}

	return {};
};
