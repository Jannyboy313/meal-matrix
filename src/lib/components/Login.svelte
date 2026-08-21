<script lang="ts">
	import { onMount } from 'svelte';
	import { user, initAuthListener } from '$lib/stores/auth';
	import { signInWithGoogle, signOut } from '$lib/services/authService';
	import { t } from '$lib/i18n';

	let loading = $state<boolean>(false);
	let error = $state<string>('');

	onMount(() => {
		initAuthListener();
	});

	async function handleGoogleSignIn(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signInWithGoogle();
		} catch (err) {
			console.error('Sign-in error:', err);
			error = err instanceof Error ? err.message : $t('common.errors.signInFailed');
		} finally {
			loading = false;
		}
	}

	async function handleSignOut(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signOut();
		} catch (err) {
			console.error('Sign-out error:', err);
			error = err instanceof Error ? err.message : $t('common.errors.signOutFailed');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center gap-4 border-2 border-ink offset-accent bg-white p-6">
	{#if $user === undefined}
		<span class="text-sm font-semibold text-ink">{$t('common.loading.authentication')}</span>
	{:else if $user}
		<div class="flex flex-col items-center gap-4">
			{#if $user.photoURL}
				<img src={$user.photoURL} alt={$user.displayName || $t('common.nav.user')} class="h-16 w-16 border-2 border-ink object-cover" />
			{/if}
			<div class="text-center">
				<p class="text-lg font-black text-ink">{$user.displayName || $t('auth.anonymousUser')}</p>
				<p class="text-sm font-semibold text-muted">{$user.email || ''}</p>
			</div>
			<button
				onclick={handleSignOut}
				disabled={loading}
				class="focus-ring border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-[.45]"
			>
				{loading ? $t('common.loading.authentication') : $t('auth.signOut')}
			</button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4">
			<h2 class="font-display text-xl font-black text-ink">{$t('auth.title')}</h2>
			<p class="text-sm font-semibold text-muted">{$t('auth.subtitle')}</p>
			<button
				onclick={handleGoogleSignIn}
				disabled={loading}
				class="focus-ring flex items-center gap-2 border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-[.45]"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
				{loading ? $t('common.loading.authentication') : $t('auth.signInWithGoogle')}
			</button>
		</div>
	{/if}

	{#if error}
		<div class="border-2 border-ink bg-accent p-3 text-white">
			<p class="text-sm font-semibold">{error}</p>
		</div>
	{/if}
</div>
