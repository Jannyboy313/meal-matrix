import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { loadTranslations, locale, detectBrowserLocale, defaultLocale } from '$lib/i18n';

export const load: LayoutLoad = async ({ url }) => {
	// Initialize translations based on environment
	let lang = defaultLocale;

	if (browser) {
		// Client-side: use stored locale, or detect from browser, or use default
		const storedLocale = localStorage.getItem('locale');
		lang = storedLocale || detectBrowserLocale();
		locale.set(lang);

		// Store the detected locale if none was stored
		if (!storedLocale) {
			localStorage.setItem('locale', lang);
		}
	} else {
		// Server-side: use default locale
		locale.set(defaultLocale);
	}

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
