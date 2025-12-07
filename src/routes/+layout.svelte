<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavBar from '$lib/components/NavBar.svelte';
	import { initAuthListener } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// Initialize the auth state listener when app loads
		initAuthListener();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div data-theme="skeleton" class="min-h-screen flex flex-col">
	<NavBar />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
