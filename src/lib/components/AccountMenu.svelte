<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { signOut } from '$lib/services/authService';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	let isOpen = $state(false);
	let loading = $state(false);
	let triggerButton: HTMLButtonElement | undefined = $state();
	let signOutButton: HTMLButtonElement | undefined = $state();

	const initials = $derived(
		($user?.displayName || $user?.email || '?')
			.trim()
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	function toggle() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
		triggerButton?.focus();
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.account-menu')) {
			closeMenu();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeMenu();
		}
	}

	$effect(() => {
		if (browser && isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
			signOutButton?.focus();
			return () => {
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});

	async function handleSignOut(): Promise<void> {
		loading = true;
		try {
			await signOut();
			await goto('/login');
		} catch (err) {
			console.error('Sign-out error:', err);
		} finally {
			loading = false;
			closeMenu();
		}
	}
</script>

<div class="account-menu relative">
	<button
		type="button"
		bind:this={triggerButton}
		onclick={toggle}
		aria-label="Account"
		aria-haspopup="menu"
		aria-expanded={isOpen}
		class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-violet bg-white font-display text-xs font-extrabold text-ink"
	>
		{initials}
	</button>

	{#if isOpen}
		<div class="absolute right-0 z-50 mt-2 w-48 border-2 border-ink offset-ink bg-white" role="menu">
			<div class="border-b border-ink px-4 py-3">
				<p class="truncate text-sm font-semibold text-ink">{$user?.displayName || $user?.email}</p>
			</div>
			<button
				type="button"
				bind:this={signOutButton}
				role="menuitem"
				onclick={handleSignOut}
				disabled={loading}
				class="focus-ring w-full px-4 py-3 text-left text-sm font-black uppercase tracking-wide text-ink disabled:opacity-[.45]"
			>
				{loading ? $t('common.loading.authentication') : $t('common.nav.signOut')}
			</button>
		</div>
	{/if}
</div>
