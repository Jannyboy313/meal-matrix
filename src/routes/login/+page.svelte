<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to home if already logged in
		const unsubscribe = user.subscribe((currentUser) => {
			if (currentUser) {
				goto('/');
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
