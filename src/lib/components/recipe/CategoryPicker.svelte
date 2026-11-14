<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { t } from '$lib/i18n';
	import FilterChip from '$lib/components/FilterChip.svelte';

	interface Props {
		categoryKey: string;
		error?: string;
	}

	let { categoryKey = $bindable(), error = '' }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
		{$t('recipe.labels.category')} <span class="text-accent">{$t('common.required')}</span>
	</span>

	<div class="flex flex-wrap gap-2">
		{#each CATEGORIES as category (category.key)}
			<FilterChip
				text={$t(category.nameKey)}
				selected={categoryKey === category.key}
				color={category.color}
				onclick={() => (categoryKey = category.key)}
			/>
		{/each}
	</div>

	{#if error}
		<p class="text-xs font-semibold text-accent">{error}</p>
	{/if}
</div>
