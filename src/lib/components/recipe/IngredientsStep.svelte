<script lang="ts">
	import ServingSelector from './ServingSelector.svelte';
	import IngredientList from './IngredientList.svelte';

	interface Ingredient {
		amount: string;
		name: string;
	}

	interface Props {
		servings: number[];
		ingredients: { [serving: number]: Ingredient[] };
		currentServing: number;
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddserving: () => void;
		onremoveserving: (serving: number) => void;
		onchangeserving: (serving: number) => void;
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let {
		servings = $bindable(),
		ingredients = $bindable(),
		currentServing = $bindable(),
		ingredientErrors,
		onaddserving,
		onremoveserving,
		onchangeserving,
		onaddingredient,
		onremoveingredient
	}: Props = $props();

	function handleAddServing(newServing: number) {
		onaddserving();
		servings = [...servings, newServing].sort((a, b) => a - b);

		// Copy ingredient names from current serving
		if (ingredients[currentServing]) {
			ingredients[newServing] = ingredients[currentServing].map((ing) => ({
				name: ing.name,
				amount: ''
			}));
		} else {
			ingredients[newServing] = [];
		}

		// Switch to the newly added serving
		onchangeserving(newServing);
	}

	// Sync ingredient names across all servings when changed
	$effect(() => {
		const currentIngredients = ingredients[currentServing] || [];

		currentIngredients.forEach((ing, index) => {
			servings.forEach((serving) => {
				if (serving !== currentServing && ingredients[serving] && ingredients[serving][index]) {
					// Sync name but preserve amount
					ingredients[serving][index].name = ing.name;
				}
			});
		});
	});
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">Ingredients <span class="text-error-500">*</span></h2>

	<ServingSelector
		bind:servings
		{currentServing}
		{onchangeserving}
		onaddserving={handleAddServing}
		{onremoveserving}
	/>

	<IngredientList
		bind:ingredients
		{servings}
		{currentServing}
		{ingredientErrors}
		{onaddingredient}
		{onremoveingredient}
	/>
</div>
