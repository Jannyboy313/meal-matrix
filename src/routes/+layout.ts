import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { loadTranslations, locale, defaultLocale } from '$lib/i18n';

export const load: LayoutLoad = async ({ url }) => {
	locale.set(defaultLocale);
	await loadTranslations(defaultLocale, url.pathname);

	const publicRoutes = ['/login'];
	const isPublicRoute = publicRoutes.includes(url.pathname);
	const currentUser = get(user);

	if (!isPublicRoute && currentUser === null) {
		const returnTo = encodeURIComponent(url.pathname);
		throw redirect(303, `/login?returnTo=${returnTo}`);
	}

	return {};
};
