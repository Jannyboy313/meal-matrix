<script lang="ts">
	import type { Label, RecipeSummaryWithLabels } from '$lib';
	import { subscribeToUserRecipes } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import AccountMenu from '$lib/components/AccountMenu.svelte';
	import { t } from '$lib/i18n';

	let recipes = $state<RecipeSummaryWithLabels[]>([]);
	let searchQuery = $state<string>('');
	let loading = $state<boolean>(true);
	let hasLoadedOnce = $state<boolean>(false);
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		const unsubscribeUser = user.subscribe(($user) => {
			if ($user === undefined) return;

			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			if ($user) {
				loading = true;
				hasLoadedOnce = false;
				unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
					recipes = updatedRecipes;
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

		return () => {
			unsubscribeUser();
		};
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	const filteredRecipes = $derived(
		recipes.filter((recipe: RecipeSummaryWithLabels) => {
			const query = searchQuery.toLowerCase();
			const categoryName = recipe.category ? $t(recipe.category.nameKey).toLowerCase() : '';

			return (
				recipe.title.toLowerCase().includes(query) ||
				recipe.description?.toLowerCase().includes(query) ||
				categoryName.includes(query) ||
				recipe.labels?.some((label: Label) => label.name.toLowerCase().includes(query))
			);
		})
	);
</script>

<svelte:head>
	<title>{$t('common.app.name')}</title>
</svelte:head>

<div class="min-h-dvh bg-paper pb-28">
	<header class="flex items-start justify-between px-[22px] pb-[18px] pt-3">
		<div class="flex flex-col gap-0.5">
			<span class="font-display text-[22px] font-black leading-none tracking-[-0.04em] text-ink">
				{$t('common.app.name')}
			</span>
			<span class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong">
				{filteredRecipes.length} {$t('recipe.labels.recipesCount')}
			</span>
		</div>
		<AccountMenu />
	</header>

	<div class="px-[22px] pb-4">
		<SearchBar bind:value={searchQuery} placeholder={$t('recipe.placeholders.searchRecipes')} />
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-x-[18px] gap-y-5 px-[22px] sm:grid-cols-3 lg:grid-cols-4">
			{#each filteredRecipes as recipe (recipe.id)}
				<RecipeCard
					id={recipe.id}
					title={recipe.title}
					image={recipe.image}
					category={recipe.category}
					time={recipe.cookTime}
				/>
			{/each}
		</div>

		{#if filteredRecipes.length === 0}
			<div class="px-[22px] pt-2">
				<EmptyState message={searchQuery ? $t('common.empty.noResults') : $t('common.empty.startCreating')} />
			</div>
		{/if}
	{/if}
</div>

<FloatingActionButton href="/recipes/new" ariaLabel={$t('recipe.actions.addRecipe')} />
