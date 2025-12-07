<script>
	let { data } = $props();
</script>

<svelte:head>
	<title>Home - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6 sm:p-8">
	<header class="text-center py-8">
		<h1 class="h1 mb-2">Discover Delicious Recipes</h1>
		<p class="text-lg opacity-75">Explore our collection of amazing dishes</p>
	</header>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each data.recipes as recipe (recipe.id)}
			<a href="/recipes/{recipe.id}" class="block">
				<article class="card variant-filled-surface overflow-hidden hover:scale-105 transition-transform cursor-pointer">
					<header class="relative h-48 overflow-hidden">
						<img
							src={recipe.image}
							alt={recipe.title}
							class="w-full h-full object-cover"
						/>
					</header>
					<div class="p-4 space-y-2">
						{#if recipe.tags && recipe.tags.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each recipe.tags as tag}
									<span
										class="text-xs px-2 py-1 rounded text-white font-medium"
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

	{#if data.recipes.length === 0}
		<div class="card variant-filled-surface p-8 text-center">
			<p class="text-lg opacity-75">No recipes available yet. Check back soon!</p>
		</div>
	{/if}
</div>
