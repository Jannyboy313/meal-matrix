import i18n, { type Config } from 'sveltekit-i18n';
import { browser } from '$app/environment';

export const defaultLocale = 'en';

// List of supported locales
export const supportedLocales = ['en', 'nl'];

/**
 * Detects the user's preferred language from the browser
 * @returns The detected locale or the default locale
 */
export function detectBrowserLocale(): string {
	if (!browser) {
		return defaultLocale;
	}

	// Get browser languages in order of preference
	const browserLanguages = navigator.languages || [navigator.language];

	// Try to find a supported locale that matches the browser's preference
	for (const lang of browserLanguages) {
		// Check exact match (e.g., 'nl')
		if (supportedLocales.includes(lang)) {
			return lang;
		}

		// Check language code without region (e.g., 'nl-NL' -> 'nl')
		const langCode = lang.split('-')[0];
		if (supportedLocales.includes(langCode)) {
			return langCode;
		}
	}

	// Fall back to default locale
	return defaultLocale;
}

export const config: Config = {
	translations: {
		en: { lang: 'en' },
		nl: { lang: 'nl' }
	},
	loaders: [
		{
			locale: 'en',
			key: 'common',
			loader: async () => (await import('./locales/en/common.json')).default
		},
		{
			locale: 'nl',
			key: 'common',
			loader: async () => (await import('./locales/nl/common.json')).default
		},
		{
			locale: 'en',
			key: 'auth',
			loader: async () => (await import('./locales/en/auth.json')).default
		},
		{
			locale: 'nl',
			key: 'auth',
			loader: async () => (await import('./locales/nl/auth.json')).default
		},
		{
			locale: 'en',
			key: 'recipe',
			loader: async () => (await import('./locales/en/recipe.json')).default
		},
		{
			locale: 'nl',
			key: 'recipe',
			loader: async () => (await import('./locales/nl/recipe.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
