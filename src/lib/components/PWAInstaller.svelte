<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		try {
			const { pwaInfo } = await import('virtual:pwa-info');
			if (pwaInfo) {
				const { registerSW } = await import('virtual:pwa-register');
				registerSW({
					immediate: true,
					onRegistered(registration: ServiceWorkerRegistration | undefined) {
						console.log('SW Registered:', registration);
					},
					onRegisterError(error: Error) {
						console.log('SW registration error', error);
					}
				});
			}
		} catch (e) {
			// PWA not available in development
			console.log('PWA features not available');
		}
	});
</script>
