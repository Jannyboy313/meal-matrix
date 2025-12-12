<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags } from '$lib';
	import { getRecipeById } from '$lib/services/recipeService';
	import { onMount } from 'svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import RecipeMetaInfo from '$lib/components/RecipeMetaInfo.svelte';
	import IngredientListDisplay from '$lib/components/IngredientListDisplay.svelte';
	import InstructionsList from '$lib/components/InstructionsList.svelte';
	import TagList from '$lib/components/TagList.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import RecipeHero from '$lib/components/RecipeHero.svelte';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	let selectedServings = $state<number>(4);

	// Fetch recipe from Firestore when component mounts
	onMount(async () => {
		try {
			loading = true;
			const fetchedRecipe = await getRecipeById(data.recipeId);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				selectedServings = fetchedRecipe.servings;
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

	let currentIngredients = $derived.by(() => {
		if (!recipe) return [];
		const ings = recipe.ingredients;
		// Use bracket notation with explicit check
		if (selectedServings === 2 && ings[2]) return ings[2];
		if (selectedServings === 4 && ings[4]) return ings[4];
		return ings[4] || [];
	});
</script>

<svelte:head>
	<title>{recipe?.title || 'Loading...'} - Recipe Collection</title>
</svelte:head>

{#if loading}
	<LoadingSpinner message="Loading recipe..." />
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="min-h-screen pb-8">
		<!-- Hero Header with Image -->
		<RecipeHero recipeId={recipe.id} title={recipe.title} image={recipe.image} />

		<!-- Title Section -->
		<div class="container mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
			<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4">
				<TagList tags={recipe.tags} />

				<h1 class="h1">{recipe.title}</h1>
				<p class="text-base sm:text-lg opacity-90">{recipe.description}</p>

				<!-- Recipe Meta Info -->
				<RecipeMetaInfo prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
			</div>
		</div>

		<!-- Main Content -->
		<div class="container mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
				<!-- Ingredients Section -->
				<div class="lg:col-span-1">
					<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4 lg:sticky lg:top-4">
						<!-- Serving Size Selector -->
						<label class="label">
							<span class="text-base font-medium">Servings:</span>
							<select
								bind:value={selectedServings}
								class="select rounded-lg"
							>
								{#each Object.keys(recipe.ingredients) as serving}
									<option value={parseInt(serving)}>
										{serving}
									</option>
								{/each}
							</select>
						</label>

						<h2 class="h2">Ingredients</h2>

						<IngredientListDisplay ingredients={currentIngredients} />
					</div>
				</div>

				<!-- Steps Section -->
				<div class="lg:col-span-2">
					<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-6">
						<h2 class="h2">Instructions</h2>
						<InstructionsList steps={recipe.steps} />
					</div>
				</div>
		</div>
	</div>

	<!-- Back Button -->
	<BackButton />
</div>
{/if}
