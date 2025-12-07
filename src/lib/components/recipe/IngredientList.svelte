<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import IngredientInput from './IngredientInput.svelte';

	interface Ingredient {
		amount: string;
		name: string;
	}

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

		// Try to find amount from serving above
		for (let i = currentIndex + 1; i < sortedServings.length; i++) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		// Try to find amount from serving below
		for (let i = currentIndex - 1; i >= 0; i--) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		return 'Amount (e.g., 200g)';
	}

	const currentIngredients = $derived(ingredients[currentServing] || []);
	const canDelete = $derived(currentIngredients.length > 1);
</script>

<div class="space-y-3">
	<p class="text-sm opacity-75">
		Ingredients for <span class="font-semibold text-primary-500"
			>{currentServing} serving{currentServing !== 1 ? 's' : ''}</span
		>
	</p>

	{#each currentIngredients as ingredient, i}
		<IngredientInput
			bind:ingredient={ingredients[currentServing][i]}
			index={i}
			placeholder={getAmountPlaceholder(i)}
			errors={ingredientErrors[i]}
			{canDelete}
			onremove={() => onremoveingredient(i)}
		/>
	{/each}
</div>

<button type="button" onclick={onaddingredient} class="btn preset-tonal-primary w-full">
	<Plus size={20} class="mr-2" />
	Add Ingredient
</button>
