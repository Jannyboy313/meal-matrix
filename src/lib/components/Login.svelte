<script lang="ts">
	import { onMount } from 'svelte';
	import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { user, initAuthListener } from '$lib/stores/auth';

	let loading = false;
	let error = '';

	onMount(() => {
		// Initialize the auth state listener when component mounts
		initAuthListener();
	});

	async function handleGoogleSignIn(): Promise<void> {
		loading = true;
		error = '';

		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} catch (err) {
			console.error('Error signing in with Google:', err);
			error = err instanceof Error ? err.message : 'Failed to sign in';
		} finally {
			loading = false;
		}
	}

	async function handleSignOut(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signOut(auth);
		} catch (err) {
			console.error('Error signing out:', err);
			error = err instanceof Error ? err.message : 'Failed to sign out';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center gap-4 p-6 card variant-filled-surface rounded-lg">
	{#if $user === undefined}
		<!-- Loading state -->
		<div class="flex items-center gap-2">
			<span class="text-sm">Loading authentication...</span>
		</div>
	{:else if $user}
		<!-- Logged in state -->
		<div class="flex flex-col items-center gap-4">
			{#if $user.photoURL}
				<img
					src={$user.photoURL}
					alt={$user.displayName || 'User'}
					class="w-16 h-16 rounded-full"
				/>
			{/if}
			<div class="text-center">
				<p class="text-lg font-semibold">{$user.displayName || 'Anonymous User'}</p>
				<p class="text-sm opacity-75">{$user.email || ''}</p>
			</div>
			<button
				on:click={handleSignOut}
				disabled={loading}
				class="btn variant-filled-primary rounded-lg"
			>
				{loading ? 'Signing out...' : 'Sign Out'}
			</button>
		</div>
	{:else}
		<!-- Not logged in state -->
		<div class="flex flex-col items-center gap-4">
			<h2 class="text-xl font-bold">Welcome to Meal Matrix</h2>
			<p class="text-sm opacity-75">Sign in to manage your recipes</p>
			<button
				on:click={handleGoogleSignIn}
				disabled={loading}
				class="btn preset-filled-primary-500 rounded-lg flex items-center gap-2"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				{loading ? 'Signing in...' : 'Sign in with Google'}
			</button>
		</div>
	{/if}

	{#if error}
		<div class="alert variant-filled-error rounded-lg p-3 mt-2">
			<p class="text-sm">{error}</p>
		</div>
	{/if}
</div>
