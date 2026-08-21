<script lang="ts">
	import './layout.css';
	import PWAInstaller from '$lib/components/PWAInstaller.svelte';
	import { initAuthListener } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initAuthListener();
	});
</script>

<PWAInstaller />

<div class="flex min-h-screen flex-col bg-paper text-ink">
	<main class="flex-1">
		{@render children()}
	</main>
</div>
