<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags } from '$lib';
	import { getRecipeById } from '$lib/services/recipeService';
	import { onMount } from 'svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import RecipeMetaInfo from '$lib/components/RecipeMetaInfo.svelte';
	import IngredientListDisplay from '$lib/components/IngredientListDisplay.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import RecipeHero from '$lib/components/RecipeHero.svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	let selectedServings = $state<number>(4);

	onMount(async () => {
		try {
			loading = true;
			const fetchedRecipe = await getRecipeById(data.recipeId);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				selectedServings = fetchedRecipe.servings;
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

	const availableServings = $derived(
		recipe ? Object.keys(recipe.ingredients).map(Number).sort((a, b) => a - b) : []
	);

	const currentIngredients = $derived.by(() => {
		if (!recipe) return [];
		return recipe.ingredients[selectedServings] || recipe.ingredients[recipe.servings] || [];
	});
</script>

<svelte:head>
	<title>{recipe?.title || $t('common.app.name')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-dvh items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="flex min-h-dvh flex-col bg-paper pb-[92px]">
		<RecipeHero recipeId={recipe.id} title={recipe.title} image={recipe.image} category={recipe.tags?.[0]} />

		<div class="px-[22px] pt-[26px]">
			<h1 class="font-display text-[32px] font-black leading-[0.98] tracking-[-0.05em] text-ink">
				{recipe.title}
			</h1>
		</div>

		<div class="px-[22px] pt-[18px]">
			<RecipeMetaInfo prepTime={recipe.prepTime} cookTime={recipe.cookTime} servings={selectedServings} />
		</div>

		<div class="flex-1 px-[22px] pt-5">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.servings.label')}</span>
			<div class="mt-2 flex items-stretch gap-2">
				{#each availableServings as serving (serving)}
					<button
						type="button"
						onclick={() => (selectedServings = serving)}
						aria-pressed={selectedServings === serving}
						class="focus-ring min-w-[44px] flex-none border-2 border-ink px-2 py-[9px] text-sm font-black {selectedServings ===
						serving
							? 'bg-accent text-white'
							: 'bg-white text-ink'}"
					>
						{serving}
					</button>
				{/each}
			</div>

			<div id="ingredients" class="mt-[14px] text-[13px] font-black uppercase tracking-[0.06em] text-ink">
				{$t('recipe.labels.ingredients')} · {currentIngredients.length}
			</div>
			<IngredientListDisplay ingredients={currentIngredients} />
		</div>

		<div class="fixed inset-x-0 bottom-0 z-40 flex gap-[10px] border-t-2 border-ink bg-white px-[22px] py-[14px] pb-6">
			<a
				href="/recipes/{recipe.id}/cook"
				class="focus-ring w-full border-2 border-ink offset-ink bg-accent py-[14px] text-center text-[15px] font-black uppercase text-white"
			>
				{$t('recipe.actions.startCooking')}
			</a>
		</div>
	</div>
{/if}
