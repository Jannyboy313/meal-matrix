<script lang="ts">
	import type { PageData } from './$types';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Create New Recipe - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="h1">Create New Recipe</h1>
	</div>

	<RecipeForm
		availableTags={data.availableTags}
		storageKey="recipe-draft"
		submitErrorMessage="Failed to create recipe. Please try again."
	/>
</div>
