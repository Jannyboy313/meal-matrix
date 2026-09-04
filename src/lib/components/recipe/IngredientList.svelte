<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import type { Ingredient } from '$lib';
	import IngredientInput from './IngredientInput.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		servings: number[];
		ingredients: { [serving: number]: Ingredient[] };
		currentServing: number;
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let {
		ingredients = $bindable(),
		servings,
		currentServing,
		ingredientErrors,
		onaddingredient,
		onremoveingredient
	}: Props = $props();

	function getAmountPlaceholder(ingredientIndex: number): string {
		const sortedServings = [...servings].sort((a, b) => a - b);
		const currentIndex = sortedServings.indexOf(currentServing);

		for (let i = currentIndex + 1; i < sortedServings.length; i++) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		for (let i = currentIndex - 1; i >= 0; i--) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		return $t('recipe.placeholders.ingredientAmount');
	}

	const currentIngredients = $derived(ingredients[currentServing] || []);
	const canDelete = $derived(currentIngredients.length > 1);
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-[9px] text-[10px] font-black uppercase tracking-[0.08em] text-muted-strong">
		<span class="w-[92px] flex-none">{$t('recipe.ingredients.quantity')}</span>
		<span>{$t('recipe.ingredients.name')}</span>
	</div>

	{#each currentIngredients as ingredient, i (i)}
		<IngredientInput
			bind:ingredient={ingredients[currentServing][i]}
			index={i}
			placeholder={getAmountPlaceholder(i)}
			errors={ingredientErrors[i]}
			{canDelete}
			onremove={() => onremoveingredient(i)}
		/>
	{/each}

	<button
		type="button"
		onclick={onaddingredient}
		class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
	>
		+ {$t('recipe.ingredients.addLine')}
	</button>
</div>
