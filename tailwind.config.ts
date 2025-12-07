import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	darkMode: 'selector',
	content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: { preset: ['skeleton'] }
		})
	]
} satisfies Config;
