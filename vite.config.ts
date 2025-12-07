import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Check if mkcert certificates exist
const certPath = path.resolve('.certs/cert.pem');
const keyPath = path.resolve('.certs/key.pem');
const hasMkcertCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		https: hasMkcertCerts
			? {
					key: fs.readFileSync(keyPath),
					cert: fs.readFileSync(certPath)
				}
			: undefined
	}
});
