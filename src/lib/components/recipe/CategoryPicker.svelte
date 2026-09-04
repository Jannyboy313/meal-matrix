<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { t } from '$lib/i18n';

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
			{@const isSelected = categoryKey === category.key}
			<button
				type="button"
				onclick={() => (categoryKey = category.key)}
				aria-pressed={isSelected}
				class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
					? 'bg-accent font-black text-ink'
					: 'bg-white font-extrabold text-ink'}"
			>
				{$t(category.nameKey)}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="text-xs font-semibold text-accent">{error}</p>
	{/if}
</div>
