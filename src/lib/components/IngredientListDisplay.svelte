<script lang="ts">
	import type { Ingredient } from '$lib';

	interface Props {
		ingredients: Ingredient[];
	}

	let { ingredients }: Props = $props();
</script>

<div class="space-y-2.5">
	{#each ingredients as ingredient}
		<div class="flex gap-2 sm:gap-3 items-baseline">
			<span class="badge preset-tonal-primary text-xs sm:text-sm font-bold uppercase tracking-wide min-w-16 sm:min-w-20 shrink-0 rounded-lg">
				{ingredient.amount}
			</span>
			<span class="text-sm sm:text-base">
				{ingredient.name}
			</span>
		</div>
	{/each}
</div>
