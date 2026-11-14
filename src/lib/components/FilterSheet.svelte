<script lang="ts">
	import { browser } from '$app/environment';
	import { CATEGORIES } from '$lib/constants/categories';
	import { slugify } from '$lib/filters/filterParams';
	import { t } from '$lib/i18n';
	import type { Label } from '$lib/types';
	import FilterChip from './FilterChip.svelte';

	interface Props {
		categoryKeys: string[];
		labelSlugs: string[];
		/** Derived from the loaded recipes: only labels that at least one recipe carries */
		availableLabels: Label[];
		resultCount: number;
		ontogglecategory: (key: string) => void;
		ontogglelabel: (slug: string) => void;
		onclear: () => void;
		onclose: () => void;
	}

	let {
		categoryKeys,
		labelSlugs,
		availableLabels,
		resultCount,
		ontogglecategory,
		ontogglelabel,
		onclear,
		onclose
	}: Props = $props();

	let sheet: HTMLDivElement | undefined = $state();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
			return;
		}

		if (event.key !== 'Tab' || !sheet) return;

		/**
		 * The discard dialog in RecipeForm gets away without a focus trap because it holds two
		 * buttons. This sheet holds ten or more, and tabbing out into the grid behind it loses
		 * the user entirely. The backdrop button sits outside `sheet`, so it is not in here.
		 */
		const focusable = sheet.querySelectorAll<HTMLElement>('button:not([disabled])');
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;

		// The sheet itself holds focus right after opening; Shift+Tab from there must wrap too.
		if (event.shiftKey && (active === first || active === sheet)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	$effect(() => {
		if (!browser) return;

		// Focus the container rather than a control, so the dialog title is announced first.
		sheet?.focus();

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<button
	type="button"
	tabindex="-1"
	aria-label={$t('recipe.filters.dismiss')}
	onclick={onclose}
	class="fixed inset-0 z-40 bg-ink/40"
></button>

<!-- Capped and centred from sm up, so the sheet is not a full-width strip on a tablet -->
<div
	bind:this={sheet}
	role="dialog"
	aria-modal="true"
	aria-labelledby="filter-sheet-title"
	tabindex="-1"
	class="focus-ring fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-[560px] overflow-y-auto border-t-2 border-ink bg-paper px-[22px] pt-5 pb-[calc(22px+env(safe-area-inset-bottom))] sm:border-x-2"
>
	<div class="flex items-baseline justify-between">
		<h2
			id="filter-sheet-title"
			class="font-display text-[22px] font-black leading-none tracking-[-0.04em] text-ink"
		>
			{$t('recipe.filters.title')}
		</h2>
		<button
			type="button"
			onclick={onclear}
			class="focus-ring text-xs font-black uppercase tracking-[0.08em] text-ink underline"
		>
			{$t('recipe.filters.clearAll')}
		</button>
	</div>

	<div class="mt-6 flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-muted-strong">
			{$t('recipe.filters.category')}
		</span>
		<div class="flex flex-wrap gap-2">
			{#each CATEGORIES as category (category.key)}
				<FilterChip
					text={$t(category.nameKey)}
					selected={categoryKeys.includes(category.key)}
					color={category.color}
					onclick={() => ontogglecategory(category.key)}
				/>
			{/each}
		</div>
	</div>

	{#if availableLabels.length > 0}
		<div class="mt-6 flex flex-col gap-3">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-muted-strong">
				{$t('recipe.filters.label')}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each availableLabels as label (label.id)}
					{@const slug = slugify(label.name)}
					<FilterChip
						text={label.name}
						selected={labelSlugs.includes(slug)}
						onclick={() => ontogglelabel(slug)}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<button
		type="button"
		onclick={onclose}
		class="focus-ring mt-7 w-full border-2 border-ink offset-ink bg-accent py-[15px] text-[13px] font-black uppercase tracking-[0.08em] text-ink"
	>
		{resultCount === 0
			? $t('recipe.filters.close')
			: $t('recipe.filters.showResults', { count: resultCount } as Record<string, unknown>)}
	</button>
</div>
