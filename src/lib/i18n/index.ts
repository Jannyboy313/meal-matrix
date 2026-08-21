import i18n, { type Config } from 'sveltekit-i18n';

export const defaultLocale = 'nl';

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
