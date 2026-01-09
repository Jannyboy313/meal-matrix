<script lang="ts">
	import type { Tag, RecipeSummaryWithTags } from '$lib';
	import { subscribeToUserRecipes } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import { t } from '$lib/i18n';

	let recipes = $state<RecipeSummaryWithTags[]>([]);
	let searchQuery = $state<string>('');
	let loading = $state<boolean>(true);
	let hasLoadedOnce = $state<boolean>(false);
	let unsubscribe: (() => void) | null = null;

	// Subscribe to recipes when component mounts and user is available
	onMount(() => {
		const unsubscribeUser = user.subscribe(($user) => {
			// Skip if user state is still initializing (undefined)
			if ($user === undefined) {
				return;
			}

			// Clean up previous subscription if exists
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			// Only subscribe if user is logged in
			if ($user) {
				loading = true;
				hasLoadedOnce = false;
				unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
					recipes = updatedRecipes;
					// Only set loading to false after first data load
					if (!hasLoadedOnce) {
						hasLoadedOnce = true;
						loading = false;
					}
				});
			} else {
				recipes = [];
				loading = false;
				hasLoadedOnce = true;
			}
		});

		// Return cleanup function to unsubscribe from user store
		return () => {
			unsubscribeUser();
		};
	});

	// Clean up Firestore subscription when component is destroyed
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	const filteredRecipes = $derived(
		recipes.filter((recipe: RecipeSummaryWithTags) => {
			const query = searchQuery.toLowerCase();
			return (
				recipe.title.toLowerCase().includes(query) ||
				recipe.description?.toLowerCase().includes(query) ||
				recipe.tags?.some((tag: Tag) => tag.name.toLowerCase().includes(query))
			);
		})
	);
</script>

<svelte:head>
	<title>{$t('common.app.name')} - Home</title>
</svelte:head>

<div class="container mx-auto p-4 space-y-6 sm:p-6 md:p-8">
	<header class="text-center py-6 sm:py-8">
		<h1 class="h1 mb-2">{$t('common.app.name')}</h1>
		<p class="text-base sm:text-lg opacity-75">{$t('auth.subtitle')}</p>
	</header>

	<!-- Search Bar -->
	<SearchBar bind:value={searchQuery} placeholder={$t('recipe.placeholders.searchRecipes')} />

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
		</div>
	{:else}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filteredRecipes as recipe (recipe.id)}
			<RecipeCard
				id={recipe.id}
				title={recipe.title}
				description={recipe.description}
				image={recipe.image}
				tags={recipe.tags}
			/>
		{/each}
	</div>

	{#if filteredRecipes.length === 0 && !loading}
		<EmptyState
			message={searchQuery ? $t('common.empty.noResults') : $t('common.empty.startCreating')}
		/>
	{/if}
	{/if}
</div>

<!-- Create/Add Recipe Action Button -->
<FloatingActionButton href="/recipes/new" ariaLabel={$t('recipe.actions.addRecipe')} />
