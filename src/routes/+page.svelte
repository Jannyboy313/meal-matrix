<script lang="ts">
	import type { Label, RecipeSummaryWithLabels } from '$lib';
	import { subscribeToUserRecipes } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { parseFilterParams, slugify, toSearchString } from '$lib/filters/filterParams';
	import {
		activeFilterCount,
		EMPTY_FILTER,
		filterRecipes,
		isFilterActive,
		type RecipeFilter
	} from '$lib/filters/recipeFilter';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import FilterSheet from '$lib/components/FilterSheet.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import AccountMenu from '$lib/components/AccountMenu.svelte';
	import { t } from '$lib/i18n';

	/** Long enough that a normal typing burst writes the URL once, short enough to feel instant */
	const QUERY_WRITE_DELAY_MS = 250;

	let recipes = $state<RecipeSummaryWithLabels[]>([]);
	let loading = $state<boolean>(true);
	let hasLoadedOnce = $state<boolean>(false);
	let unsubscribe: (() => void) | null = null;

	let sheetOpen = $state<boolean>(false);
	let filterButton: HTMLButtonElement | undefined = $state();

	/**
	 * The search term is the one piece of filter state held locally, so typing responds without
	 * waiting on a URL write. Seeded from the URL once, at component init.
	 */
	let searchQuery = $state<string>(page.url.searchParams.get('q')?.trim() ?? '');
	let queryWriteTimer: ReturnType<typeof setTimeout> | undefined;

	/** The chip selections have no second copy: the URL is the only place they live */
	const urlFilter = $derived(parseFilterParams(page.url.searchParams));

	const filter = $derived<RecipeFilter>({ ...urlFilter, query: searchQuery });

	const filteredRecipes = $derived(filterRecipes(recipes, filter));

	/**
	 * Only labels that at least one recipe carries. Deriving costs no Firestore reads, and a
	 * chip that can only ever return nothing is noise. Deduplicated by slug, because that is
	 * what filtering compares.
	 */
	const availableLabels = $derived.by(() => {
		const bySlug = new Map<string, Label>();

		for (const recipe of recipes) {
			for (const label of recipe.labels ?? []) {
				const slug = slugify(label.name);
				if (slug && !bySlug.has(slug)) bySlug.set(slug, label);
			}
		}

		return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
	});

	/**
	 * Shallow routing: the URL changes without a navigation, so no load function re-runs, the
	 * grid does not scroll and focus stays where it is. replaceState rather than pushState
	 * because live filtering would otherwise put a history entry behind every tap and every
	 * typed character, making the back button useless for leaving the page. "Wis alles" is the
	 * intended undo.
	 */
	function writeFilter(next: RecipeFilter) {
		replaceState(`${page.url.pathname}${toSearchString(next)}`, page.state);
	}

	function toggleCategory(key: string) {
		const categoryKeys = filter.categoryKeys.includes(key)
			? filter.categoryKeys.filter((candidate) => candidate !== key)
			: [...filter.categoryKeys, key];

		writeFilter({ ...filter, categoryKeys });
	}

	function toggleLabel(slug: string) {
		const labelSlugs = filter.labelSlugs.includes(slug)
			? filter.labelSlugs.filter((candidate) => candidate !== slug)
			: [...filter.labelSlugs, slug];

		writeFilter({ ...filter, labelSlugs });
	}

	function clearFilter() {
		clearTimeout(queryWriteTimer);
		searchQuery = '';
		writeFilter(EMPTY_FILTER);
	}

	/**
	 * Focus goes back to the trigger, or a keyboard user is dropped at the top of the document
	 * every time they close the sheet. Same pattern as AccountMenu.
	 */
	function closeSheet() {
		sheetOpen = false;
		filterButton?.focus();
	}

	/**
	 * Only the URL write waits; filteredRecipes already reacted on this keystroke. The reads
	 * inside the timeout are untracked, so this effect depends on searchQuery alone and cannot
	 * loop against its own write.
	 */
	$effect(() => {
		const query = searchQuery;

		queryWriteTimer = setTimeout(() => {
			if (query.trim() === (page.url.searchParams.get('q')?.trim() ?? '')) return;
			writeFilter({ ...urlFilter, query });
		}, QUERY_WRITE_DELAY_MS);

		return () => clearTimeout(queryWriteTimer);
	});

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
			<span
				aria-live="polite"
				class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong"
			>
				{filteredRecipes.length} {$t('recipe.labels.recipesCount')}
			</span>
		</div>
		<AccountMenu />
	</header>

	<div class="flex items-stretch gap-3 px-[22px] pb-4">
		<div class="flex-1">
			<SearchBar bind:value={searchQuery} placeholder={$t('recipe.placeholders.searchRecipes')} />
		</div>
		<FilterButton
			bind:element={filterButton}
			activeCount={activeFilterCount(filter)}
			expanded={sheetOpen}
			onclick={() => (sheetOpen = true)}
		/>
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
			<div class="flex flex-col items-center gap-4 px-[22px] pt-2">
				<EmptyState
					message={isFilterActive(filter)
						? $t('common.empty.noResults')
						: $t('common.empty.startCreating')}
				/>
				{#if isFilterActive(filter)}
					<!-- Without this, a shared URL whose label slug matches nothing is a dead screen -->
					<button
						type="button"
						onclick={clearFilter}
						class="focus-ring border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
					>
						{$t('recipe.filters.clearAll')}
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if sheetOpen}
	<FilterSheet
		categoryKeys={filter.categoryKeys}
		labelSlugs={filter.labelSlugs}
		{availableLabels}
		resultCount={filteredRecipes.length}
		ontogglecategory={toggleCategory}
		ontogglelabel={toggleLabel}
		onclear={clearFilter}
		onclose={closeSheet}
	/>
{/if}

<FloatingActionButton href="/recipes/new" ariaLabel={$t('recipe.actions.addRecipe')} />
