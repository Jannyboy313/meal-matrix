<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags, Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import { getRecipeById } from '$lib/services/recipeService';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let availableTags = $state<Tag[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	// Fetch recipe and tags from Firestore when component mounts
	onMount(async () => {
		try {
			loading = true;
			const currentUser = $user;

			// Fetch both recipe and tags in parallel
			const [fetchedRecipe, fetchedTags] = await Promise.all([
				getRecipeById(data.recipeId),
				getAllTags(currentUser?.uid)
			]);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				availableTags = fetchedTags;
			} else {
				error = 'Recipe not found';
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = 'Failed to load recipe';
		} finally {
			loading = false;
		}
	});

	// Prepare initial data from the existing recipe
	const initialData = $derived(recipe ? {
		title: recipe.title,
		description: recipe.description || '',
		image: recipe.image,
		prepTime: recipe.prepTime || '',
		cookTime: recipe.cookTime || '',
		tags: recipe.tags ? [...recipe.tags] : [],
		servings: Object.keys(recipe.ingredients).map(Number),
		currentServing: recipe.servings || Object.keys(recipe.ingredients).map(Number)[0],
		ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
		steps: [...recipe.steps]
	} : undefined);
</script>

<svelte:head>
	<title>{recipe ? `Edit ${recipe.title}` : 'Edit Recipe'} - Recipe Collection</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center space-y-4">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
			<p class="text-lg opacity-75">Loading recipe...</p>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div class="card variant-filled-surface rounded-xl p-8 text-center space-y-4 max-w-md">
			<p class="text-lg text-error-500">{error}</p>
			<a href="/" class="btn variant-filled-primary rounded-lg">
				Back to Recipes
			</a>
		</div>
	</div>
{:else if recipe && initialData}
	<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="h1">Edit Recipe</h1>
		</div>

		<RecipeForm
			{availableTags}
			storageKey={`recipe-edit-${data.recipeId}`}
			{initialData}
			isEditing={true}
			recipeId={data.recipeId}
			submitErrorMessage="Failed to update recipe. Please try again."
		/>
	</div>
{/if}
