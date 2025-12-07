<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavBar from '$lib/components/NavBar.svelte';
	import PWAInstaller from '$lib/components/PWAInstaller.svelte';
	import { initAuthListener } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Initialize the auth state listener when app loads
		initAuthListener();
	});

	// Show navbar only on homepage
	const showNavBar = $derived($page.url.pathname === '/');
</script>

<PWAInstaller />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div data-theme="skeleton" class="min-h-screen flex flex-col">
	{#if showNavBar}
		<NavBar />
	{/if}
	<main class="flex-1">
		{@render children()}
	</main>
</div>
