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
	let editingServings = $state<boolean>(false);
	let servingsInput = $state<string>('');
	let servingsError = $state<string>('');

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

	function confirmCustomServings() {
		const value = Number(servingsInput);
		if (availableServings.includes(value)) {
			selectedServings = value;
			servingsError = '';
			editingServings = false;
			servingsInput = '';
		} else {
			servingsError = $t('recipe.validation.servingsNotAvailable');
		}
	}
</script>

<svelte:head>
	<title>{recipe?.title || $t('common.app.name')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="flex min-h-screen flex-col bg-paper pb-[92px]">
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
				{#each availableServings as serving}
					<button
						type="button"
						onclick={() => (selectedServings = serving)}
						class="focus-ring min-w-[44px] flex-none border-2 border-ink px-2 py-[9px] text-sm font-black {selectedServings ===
						serving
							? 'bg-accent text-white'
							: 'bg-white text-ink'}"
					>
						{serving}
					</button>
				{/each}
				<button
					type="button"
					onclick={() => (editingServings = !editingServings)}
					class="focus-ring flex-1 border-2 border-ink bg-yellow px-2 py-[9px] text-xs font-black uppercase text-ink"
				>
					{$t('recipe.servings.edit')}
				</button>
			</div>

			{#if editingServings}
				<div class="mt-2 flex items-center gap-2">
					<input
						type="number"
						bind:value={servingsInput}
						min="1"
						placeholder={$t('recipe.servings.placeholder')}
						class="focus-ring h-9 w-16 border-2 border-ink bg-white text-center text-sm font-bold text-ink"
						onkeydown={(e) => e.key === 'Enter' && confirmCustomServings()}
					/>
					<button
						type="button"
						onclick={confirmCustomServings}
						class="focus-ring border-2 border-ink offset-teal bg-white px-3 py-2 text-xs font-black uppercase text-ink"
					>
						{$t('recipe.servings.confirm')}
					</button>
				</div>
				{#if servingsError}
					<p class="mt-1 text-xs font-semibold text-accent">{servingsError}</p>
				{/if}
			{/if}

			<div id="ingredients" class="mt-[14px] text-[13px] font-black uppercase tracking-[0.06em] text-ink">
				{$t('recipe.labels.ingredients')} · {currentIngredients.length}
			</div>
			<IngredientListDisplay ingredients={currentIngredients} />
		</div>

		<div class="fixed inset-x-0 bottom-0 z-40 flex gap-[10px] border-t-2 border-ink bg-white px-[22px] py-[14px] pb-6">
			<a
				href="#ingredients"
				class="focus-ring flex-none border-2 border-ink bg-white px-4 py-[14px] text-sm font-black uppercase text-ink"
			>
				{$t('recipe.actions.viewList')}
			</a>
			<a
				href="/recipes/{recipe.id}/cook"
				class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[14px] text-center text-[15px] font-black uppercase text-white"
			>
				{$t('recipe.actions.startCooking')}
			</a>
		</div>
	</div>
{/if}
