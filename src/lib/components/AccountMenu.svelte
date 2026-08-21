<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { signOut } from '$lib/services/authService';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	let isOpen = $state(false);
	let loading = $state(false);

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

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.account-menu')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (browser && isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	async function handleSignOut(): Promise<void> {
		loading = true;
		try {
			await signOut();
			await goto('/login');
		} finally {
			loading = false;
		}
	}
</script>

<div class="account-menu relative">
	<button
		type="button"
		onclick={toggle}
		aria-label="Account"
		class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-violet bg-white font-display text-xs font-extrabold text-ink"
	>
		{initials}
	</button>

	{#if isOpen}
		<div class="absolute right-0 z-50 mt-2 w-48 border-2 border-ink offset-ink bg-white">
			<div class="border-b border-ink px-4 py-3">
				<p class="truncate text-sm font-semibold text-ink">{$user?.displayName || $user?.email}</p>
			</div>
			<button
				type="button"
				onclick={handleSignOut}
				disabled={loading}
				class="focus-ring w-full px-4 py-3 text-left text-sm font-black uppercase tracking-wide text-ink disabled:opacity-[.45]"
			>
				{loading ? $t('common.loading.authentication') : $t('common.nav.signOut')}
			</button>
		</div>
	{/if}
</div>
