<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let hasRedirected = false;

	onMount(() => {
		// Redirect to home or return URL if already logged in
		const unsubscribe = user.subscribe(async (currentUser) => {
			if (currentUser && !hasRedirected) {
				hasRedirected = true;
				// Wait to ensure session cookie is set
				await new Promise(resolve => setTimeout(resolve, 500));
				const returnTo = $page.url.searchParams.get('returnTo') || '/';
				goto(returnTo);
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Login - Meal Matrix</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<Login />
	</div>
</div>
