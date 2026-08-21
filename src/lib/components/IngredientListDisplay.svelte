<script lang="ts">
	import type { Ingredient } from '$lib';

	interface Props {
		ingredients: Ingredient[];
	}

	let { ingredients }: Props = $props();
</script>

<div>
	{#each ingredients as ingredient, i}
		<div class="flex items-baseline justify-between border-ink py-[11px] {i === 0 ? 'border-t-2' : 'border-t'}">
			<span class="text-[15px] font-semibold text-ink">{ingredient.name}</span>
			<span class="text-sm font-black text-ink">{ingredient.amount}</span>
		</div>
	{/each}
</div>
