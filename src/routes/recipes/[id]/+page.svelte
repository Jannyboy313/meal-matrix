<script>
	let { data } = $props();
	const recipe = $derived(data.recipe);

	let selectedServings = $state(4);
	$effect(() => {
		selectedServings = recipe.servings;
	});

	let currentIngredients = $derived.by(() => {
		const ings = recipe.ingredients;
		// Use bracket notation with explicit check
		if (selectedServings === 2 && ings[2]) return ings[2];
		if (selectedServings === 4 && ings[4]) return ings[4];
		return ings[4] || [];
	});
</script>

<svelte:head>
	<title>{recipe.title} - Recipe Collection</title>
</svelte:head>

<div class="min-h-screen pb-8">
	<!-- Hero Header with Image -->
	<header class="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
		<img
			src={recipe.image}
			alt={recipe.title}
			class="w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
	</header>

	<!-- Title Section -->
	<div class="container mx-auto px-4 sm:px-6 -mt-16 relative z-10">
		<div class="card variant-filled-surface p-6 space-y-4">
			<div class="flex flex-wrap gap-2">
				{#each recipe.tags as tag}
					<span
						class="text-xs px-3 py-1 rounded-full text-white font-medium"
						style="background-color: {tag.color}"
					>
						{tag.name}
					</span>
				{/each}
			</div>

			<h1 class="h1">{recipe.title}</h1>
			<p class="text-lg opacity-90">{recipe.description}</p>

			<!-- Recipe Meta Info -->
			<div class="flex flex-wrap gap-6 pt-4 border-t border-surface-300-600-token">
				{#if recipe.prepTime}
					<div class="flex flex-col">
						<span class="text-xs uppercase opacity-75">Prep Time</span>
						<span class="font-semibold">{recipe.prepTime}</span>
					</div>
				{/if}
				{#if recipe.cookTime}
					<div class="flex flex-col">
						<span class="text-xs uppercase opacity-75">Cook Time</span>
						<span class="font-semibold">{recipe.cookTime}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="container mx-auto px-4 sm:px-6 space-y-8">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Ingredients Section -->
			<div class="lg:col-span-1">
				<div class="card variant-filled-surface p-6 space-y-4 sticky top-4">
					<!-- Serving Size Selector -->
					<label class="label">
						<span class="text-base font-medium">Servings:</span>
						<select
							bind:value={selectedServings}
							class="select"
						>
							{#each Object.keys(recipe.ingredients) as serving}
								<option value={parseInt(serving)}>
									{serving}
								</option>
							{/each}
						</select>
					</label>

					<h2 class="h2">Ingredients</h2>

					<div class="space-y-2">
						{#each currentIngredients as ingredient}
							<div class="flex gap-3 items-baseline">
								<span class="text-sm font-bold text-primary-500 uppercase tracking-wide min-w-20 shrink-0 whitespace-nowrap">
									{ingredient.amount}
								</span>
								<span class="text-base">
									{ingredient.name}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Steps Section -->
			<div class="lg:col-span-2">
				<div class="card variant-filled-surface p-6 space-y-6">
					<h2 class="h2">Instructions</h2>
					<ol class="space-y-6">
						{#each recipe.steps as step, index}
							<li class="flex gap-4">
								<span
									class="shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm"
								>
									{index + 1}
								</span>
								<p class="pt-1 leading-relaxed">{step}</p>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</div>

		<!-- Back Button -->
		<div class="text-center pt-8">
			<a
				href="/"
				class="btn variant-filled-primary"
			>
				← Back to Recipes
			</a>
		</div>
	</div>
</div>
