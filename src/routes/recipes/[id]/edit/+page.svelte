<script lang="ts">
	import type { PageData } from './$types';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';

	let { data }: { data: PageData } = $props();

	// Prepare initial data from the existing recipe
	const initialData = $derived({
		title: data.recipe.title,
		image: data.recipe.image,
		prepTime: data.recipe.prepTime || '',
		cookTime: data.recipe.cookTime || '',
		tags: data.recipe.tags || [],
		servings: Object.keys(data.recipe.ingredients).map(Number),
		currentServing: data.recipe.servings || Object.keys(data.recipe.ingredients).map(Number)[0],
		ingredients: structuredClone(data.recipe.ingredients),
		steps: [...data.recipe.steps]
	});
</script>

<svelte:head>
	<title>Edit {data.recipe.title} - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="h1">Edit Recipe</h1>
	</div>

	<RecipeForm
		availableTags={data.availableTags}
		storageKey={`recipe-edit-${data.recipe.id}`}
		{initialData}
		isEditing={true}
		submitErrorMessage="Failed to update recipe. Please try again."
	/>
</div>
