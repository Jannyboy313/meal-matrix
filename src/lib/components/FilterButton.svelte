<script lang="ts">
	import { SlidersHorizontal } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		activeCount: number;
		expanded: boolean;
		onclick: () => void;
		/**
		 * Exposed so the page can return focus here when the sheet closes. Same reason
		 * AccountMenu keeps a reference to its own trigger.
		 */
		element?: HTMLButtonElement;
	}

	let { activeCount, expanded, onclick, element = $bindable() }: Props = $props();

	// The badge is visual only, so the count is repeated in the accessible name.
	const ariaLabel = $derived(
		activeCount > 0
			? $t('recipe.filters.openWithCount', { count: activeCount } as Record<string, unknown>)
			: $t('recipe.filters.open')
	);
</script>

<button
	type="button"
	bind:this={element}
	{onclick}
	aria-label={ariaLabel}
	aria-haspopup="dialog"
	aria-expanded={expanded}
	class="focus-ring relative flex w-[52px] shrink-0 items-center justify-center border-2 border-ink offset-violet bg-white"
>
	<SlidersHorizontal size={20} class="text-ink" strokeWidth={2.5} />

	{#if activeCount > 0}
		<span
			aria-hidden="true"
			class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-accent px-1 text-[10px] font-black text-ink"
		>
			{activeCount}
		</span>
	{/if}
</button>
