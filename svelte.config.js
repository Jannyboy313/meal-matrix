import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() },
	onwarn: (warning, handler) => {
		// Suppress Svelte 5 warnings from SvelteKit's generated files
		if (warning.code === 'state_referenced_locally') return;
		handler(warning);
	}
};

export default config;
