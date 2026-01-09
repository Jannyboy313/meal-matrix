<script lang="ts">
	import { locale, locales } from '$lib/i18n';
	import { Languages } from 'lucide-svelte';
	import { browser } from '$app/environment';

	const availableLanguages = [
		{ code: 'en', name: 'English', flag: '🇬🇧' },
		{ code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
	];

	let isOpen = $state(false);

	function switchLanguage(lang: string): void {
		locale.set(lang);
		if (browser) {
			localStorage.setItem('locale', lang);
		}
		isOpen = false;
	}

	function toggleDropdown(): void {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-switcher')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (browser && isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="language-switcher relative">
	<button
		type="button"
		onclick={toggleDropdown}
		class="btn preset-tonal-primary rounded-lg p-2 hover:preset-filled-primary transition-colors"
		aria-label="Change language"
	>
		<Languages size={20} />
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2 w-48 rounded-lg bg-white dark:bg-surface-800 border border-surface-300-600-token shadow-lg z-50"
		>
			<ul class="py-2">
				{#each availableLanguages as lang}
					{@const isActive = $locale === lang.code}
					<li>
						<button
							type="button"
							onclick={() => switchLanguage(lang.code)}
							class="w-full px-4 py-2 text-left hover:bg-primary-500/10 flex items-center gap-3 transition-colors {isActive ? 'bg-primary-500/20' : ''}"
						>
							<span class="text-2xl">{lang.flag}</span>
							<span class="text-sm font-medium">{lang.name}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
