<script lang="ts">
	import { Search, Plus } from 'lucide-svelte';
	import type { Tag, RecipeSummaryWithTags } from '$lib';
	import { subscribeToUserRecipes } from '$lib/firestore';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';

	let recipes = $state<RecipeSummaryWithTags[]>([]);
	let searchQuery = $state<string>('');
	let unsubscribe: (() => void) | null = null;

	// Subscribe to recipes when component mounts and user is available
	onMount(() => {
		const unsubscribeUser = user.subscribe(($user) => {
			// Clean up previous subscription if exists
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			// Only subscribe if user is logged in
			if ($user) {
				unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
					recipes = updatedRecipes;
				});
			} else {
				recipes = [];
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
	<title>Home - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-4 space-y-6 sm:p-6 md:p-8">
	<header class="text-center py-6 sm:py-8">
		<h1 class="h1 mb-2">Discover Delicious Recipes</h1>
		<p class="text-base sm:text-lg opacity-75">Explore our collection of amazing dishes</p>
	</header>

	<!-- Search Bar -->
	<div class="max-w-2xl mx-auto">
		<div class="relative">
			<div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
				<Search size={20} class="opacity-50" />
			</div>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search..."
				class="input rounded-lg pl-12 pr-4 py-3 shadow-md"
			/>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each filteredRecipes as recipe (recipe.id)}
			<a href="/recipes/{recipe.id}" class="block">
				<article class="card variant-filled-surface rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer shadow-lg">
					<header class="relative h-48 overflow-hidden">
						<img
							src={recipe.image}
							alt={recipe.title}
							class="w-full h-full object-cover"
						/>
					</header>
					<div class="p-4 space-y-2">
						{#if recipe.tags && recipe.tags.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each recipe.tags as tag}
									<span
										class="text-xs px-2.5 py-1 rounded-full text-white font-medium"
										style="background-color: {tag.color}"
									>
										{tag.name}
									</span>
								{/each}
							</div>
						{/if}
						<h2 class="h3">{recipe.title}</h2>
						{#if recipe.description}
							<p class="text-sm opacity-75">{recipe.description}</p>
						{/if}
					</div>
				</article>
			</a>
		{/each}
	</div>

	{#if filteredRecipes.length === 0}
		<div class="card variant-filled-surface rounded-xl p-8 text-center">
			<p class="text-base sm:text-lg opacity-75">
				{searchQuery ? 'No recipes found matching your search.' : 'No recipes available yet. Check back soon!'}
			</p>
		</div>
	{/if}
</div>

<!-- Create/Add Recipe Action Button -->
<a
	href="/recipes/new"
	class="btn variant-filled-primary fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 flex items-center justify-center bg-primary-500 p-3!"
	aria-label="Add new recipe"
>
	<Plus size={28} />
</a>
