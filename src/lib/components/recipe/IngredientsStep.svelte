<script lang="ts">
	import type { Ingredient } from '$lib';
	import ServingSelector from './ServingSelector.svelte';
	import IngredientList from './IngredientList.svelte';

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

		if (ingredients[currentServing]) {
			ingredients[newServing] = ingredients[currentServing].map((ing) => ({
				name: ing.name,
				amount: ''
			}));
		} else {
			ingredients[newServing] = [];
		}

		onchangeserving(newServing);
	}

	$effect(() => {
		const currentIngredients = ingredients[currentServing] || [];

		currentIngredients.forEach((ing, index) => {
			servings.forEach((serving) => {
				if (serving !== currentServing && ingredients[serving] && ingredients[serving][index]) {
					ingredients[serving][index].name = ing.name;
				}
			});
		});
	});
</script>

<div class="flex flex-col gap-5">
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
