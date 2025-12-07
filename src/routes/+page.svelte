<script>
	import { Search } from 'lucide-svelte';

	let { data } = $props();
	let searchQuery = $state('');

	const filteredRecipes = $derived(
		data.recipes.filter((recipe) => {
			const query = searchQuery.toLowerCase();
			return (
				recipe.title.toLowerCase().includes(query) ||
				recipe.description?.toLowerCase().includes(query) ||
				recipe.tags?.some((tag) => tag.name.toLowerCase().includes(query))
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
