<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags, Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import { getRecipeById } from '$lib/services/recipeService';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let availableTags = $state<Tag[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			loading = true;
			const currentUser = $user;

			const [fetchedRecipe, fetchedTags] = await Promise.all([
				getRecipeById(data.recipeId),
				getAllTags(currentUser?.uid)
			]);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				availableTags = fetchedTags;
			} else {
				error = $t('recipe.validation.recipeNotFound');
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = $t('recipe.validation.recipeLoadFailed');
		} finally {
			loading = false;
		}
	});

	const initialData = $derived(
		recipe
			? {
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
				}
			: undefined
	);
</script>

<svelte:head>
	<title>{recipe ? `${$t('recipe.title.edit')} – ${recipe.title}` : $t('recipe.title.edit')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe && initialData}
	<div class="min-h-screen bg-paper">
		<RecipeForm
			{availableTags}
			storageKey={`recipe-edit-${data.recipeId}`}
			{initialData}
			isEditing={true}
			recipeId={data.recipeId}
			submitErrorMessage={$t('recipe.validation.saveFailed')}
		/>
	</div>
{/if}
