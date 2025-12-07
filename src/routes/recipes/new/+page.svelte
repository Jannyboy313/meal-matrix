<script lang="ts">
	import { ArrowLeft, Plus, X, ChevronRight, ChevronLeft } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	interface Tag {
		name: string;
		color: string;
	}

	interface Ingredient {
		amount: string;
		name: string;
	}

	let { data }: { data: PageData } = $props();

	// Form data
	let title = $state<string>('');
	let image = $state<string>('');
	let prepTime = $state<string>('');
	let cookTime = $state<string>('');
	let servings = $state<number>(4);

	let tags = $state<Tag[]>([]);
	let newTagName = $state<string>('');
	let newTagColor = $state<string>('#4CAF50');
	let showCustomTag = $state<boolean>(false);

	let ingredients = $state<Ingredient[]>([{ amount: '', name: '' }]);
	let steps = $state<string[]>(['']);

	// Flow state
	let currentStep = $state<number>(1);
	let isSubmitting = $state<boolean>(false);
	let error = $state<string>('');

	const stepTitles = ['Basic Info', 'Tags', 'Ingredients', 'Instructions'];
	const totalSteps = 4;

	function addExistingTag(tag: Tag) {
		if (!tags.some(t => t.name === tag.name)) {
			tags = [...tags, tag];
		}
	}

	function addCustomTag() {
		if (newTagName.trim()) {
			tags = [...tags, { name: newTagName.trim(), color: newTagColor }];
			newTagName = '';
			showCustomTag = false;
		}
	}

	function removeTag(index: number) {
		tags = tags.filter((_, i) => i !== index);
	}

	function addIngredient() {
		ingredients = [...ingredients, { amount: '', name: '' }];
	}

	function removeIngredient(index: number) {
		if (ingredients.length > 1) {
			ingredients = ingredients.filter((_, i) => i !== index);
		}
	}

	function addStep() {
		steps = [...steps, ''];
	}

	function removeStep(index: number) {
		if (steps.length > 1) {
			steps = steps.filter((_, i) => i !== index);
		}
	}

	function validateCurrentStep(): boolean {
		error = '';

		if (currentStep === 1) {
			if (!title.trim()) {
				error = 'Please enter a recipe title';
				return false;
			}
		} else if (currentStep === 3) {
			if (ingredients.some(ing => !ing.name.trim())) {
				error = 'Please fill in all ingredient names';
				return false;
			}
		} else if (currentStep === 4) {
			if (steps.some(step => !step.trim())) {
				error = 'Please fill in all steps';
				return false;
			}
		}

		return true;
	}

	function nextStep() {
		if (!validateCurrentStep()) {
			return;
		}
		if (currentStep < totalSteps) {
			currentStep++;
			error = '';
		}
	}

	function previousStep() {
		if (currentStep > 1) {
			currentStep--;
			error = '';
		}
	}

	function validateForm(): boolean {
		error = '';

		if (!title.trim()) {
			error = 'Please enter a recipe title';
			return false;
		}

		if (ingredients.some(ing => !ing.name.trim())) {
			error = 'Please fill in all ingredient names';
			return false;
		}

		if (steps.some(step => !step.trim())) {
			error = 'Please fill in all steps';
			return false;
		}

		return true;
	}

	// Scroll to top when changing steps
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		currentStep; // dependency
	});
</script>

<svelte:head>
	<title>Create New Recipe - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6">
		<button
			type="button"
			onclick={() => currentStep > 1 ? previousStep() : window.location.href = '/'}
			class="btn btn-icon bg-white/90 hover:bg-white text-black rounded-full shadow-lg"
			aria-label="Go back"
		>
			<ArrowLeft size={20} />
		</button>
		<div class="flex-1">
			<h1 class="h1">Create New Recipe</h1>
			<p class="text-sm opacity-75 mt-1">
				Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
			</p>
		</div>
	</div>

	<!-- Progress Indicator -->
	<div class="mb-6">
		<div class="flex gap-2">
			{#each Array(totalSteps) as _, i}
				<div
					class="flex-1 h-2 rounded-full transition-all duration-300"
					class:bg-primary-500={i < currentStep}
					class:bg-surface-700={i >= currentStep}
				></div>
			{/each}
		</div>
	</div>

	{#if error}
		<div class="card variant-filled-error rounded-lg p-4 mb-6">
			<p class="text-white">{error}</p>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			if (!validateForm()) {
				return async () => {};
			}
			isSubmitting = true;
			return async ({ update, result }) => {
				await update();
				isSubmitting = false;
				if (result.type === 'failure') {
					error = 'Failed to create recipe. Please try again.';
				}
			};
		}}
		class="space-y-6"
	>
		<input
			type="hidden"
			name="data"
			value={JSON.stringify({
				title,
				image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
				prepTime,
				cookTime,
				servings,
				tags,
				ingredients: {
					[servings]: ingredients
				},
				steps
			})}
		/>

		<!-- Step 1: Basic Information -->
		{#if currentStep === 1}
		<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4">
			<h2 class="h2">Basic Information</h2>

			<label class="label">
				<span class="font-semibold">Title *</span>
				<input
					type="text"
					bind:value={title}
					placeholder="e.g., Spaghetti Carbonara"
					class="input rounded-lg mt-2"
					required
				/>
			</label>

			<label class="label">
				<span class="font-semibold">Image URL</span>
				<input
					type="url"
					bind:value={image}
					placeholder="https://example.com/image.jpg"
					class="input rounded-lg mt-2"
				/>
				<p class="text-sm opacity-75 mt-1">Leave empty for default image</p>
			</label>

			{#if image}
				<div class="rounded-lg overflow-hidden max-h-48">
					<img
						src={image}
						alt="Recipe preview"
						class="w-full h-48 object-cover"
						onerror={(e) => {
							const target = e.target as HTMLImageElement;
							target.style.display = 'none';
						}}
					/>
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<label class="label">
					<span class="font-semibold">Prep Time</span>
					<input
						type="text"
						bind:value={prepTime}
						placeholder="15 min"
						class="input rounded-lg mt-2"
					/>
				</label>

				<label class="label">
					<span class="font-semibold">Cook Time</span>
					<input
						type="text"
						bind:value={cookTime}
						placeholder="30 min"
						class="input rounded-lg mt-2"
					/>
				</label>

				<label class="label">
					<span class="font-semibold">Servings</span>
					<input
						type="number"
						bind:value={servings}
						min="1"
						class="input rounded-lg mt-2"
					/>
				</label>
			</div>
		</div>
		{/if}

		<!-- Step 2: Tags -->
		{#if currentStep === 2}
		<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4">
			<h2 class="h2">Tags</h2>

			<!-- Selected Tags -->
			{#if tags.length > 0}
				<div>
					<p class="text-sm font-semibold mb-2 opacity-75">Selected:</p>
					<div class="flex flex-wrap gap-2">
						{#each tags as tag, i}
							<span
								class="badge rounded-full px-3 py-1 text-sm font-medium text-white flex items-center gap-2"
								style="background-color: {tag.color};"
							>
								{tag.name}
								<button
									type="button"
									onclick={() => removeTag(i)}
									class="hover:opacity-75"
									aria-label="Remove tag"
								>
									<X size={14} />
								</button>
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Available Tags -->
			<div>
				<p class="text-sm font-semibold mb-2 opacity-75">Choose from existing tags:</p>
				<div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-surface-900/20 rounded-lg">
					{#each data.availableTags as tag}
						{@const isSelected = tags.some(t => t.name === tag.name)}
						<button
							type="button"
							onclick={() => addExistingTag(tag)}
							class="badge rounded-full px-3 py-1 text-sm font-medium text-white transition-opacity"
							class:opacity-40={isSelected}
							class:cursor-not-allowed={isSelected}
							class:hover:opacity-90={!isSelected}
							style="background-color: {tag.color};"
							disabled={isSelected}
						>
							{tag.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- Custom Tag -->
			<div>
				{#if !showCustomTag}
					<button
						type="button"
						onclick={() => showCustomTag = true}
						class="btn variant-ghost rounded-lg w-full text-sm"
					>
						<Plus size={16} class="mr-2" />
						Create Custom Tag
					</button>
				{:else}
					<div class="space-y-2">
						<p class="text-sm font-semibold opacity-75">Create custom tag:</p>
						<div class="flex gap-2 flex-wrap sm:flex-nowrap">
							<input
								type="text"
								bind:value={newTagName}
								placeholder="Tag name"
								class="input rounded-lg flex-1"
								onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
							/>
							<input
								type="color"
								bind:value={newTagColor}
								class="input w-16 h-10 rounded-lg cursor-pointer"
							/>
							<button
								type="button"
								onclick={addCustomTag}
								class="btn variant-filled-primary rounded-lg whitespace-nowrap"
							>
								Add
							</button>
							<button
								type="button"
								onclick={() => { showCustomTag = false; newTagName = ''; }}
								class="btn variant-ghost rounded-lg"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
		{/if}

		<!-- Step 3: Ingredients -->
		{#if currentStep === 3}
		<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4">
			<h2 class="h2">Ingredients *</h2>

			<div class="space-y-3">
				{#each ingredients as ingredient, i}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={ingredient.amount}
							placeholder="Amount (e.g., 200g)"
							class="input rounded-lg w-32 sm:w-40"
						/>
						<input
							type="text"
							bind:value={ingredient.name}
							placeholder="Ingredient name"
							class="input rounded-lg flex-1"
							required
						/>
						<button
							type="button"
							onclick={() => removeIngredient(i)}
							class="btn btn-icon variant-filled-error rounded-lg"
							disabled={ingredients.length === 1}
							aria-label="Remove ingredient"
						>
							<X size={20} />
						</button>
					</div>
				{/each}
			</div>

			<button
				type="button"
				onclick={addIngredient}
				class="btn variant-filled-primary rounded-lg w-full"
			>
				<Plus size={20} class="mr-2" />
				Add Ingredient
			</button>
		</div>
		{/if}

		<!-- Step 4: Instructions -->
		{#if currentStep === 4}
		<div class="card variant-filled-surface rounded-xl p-4 sm:p-6 space-y-4">
			<h2 class="h2">Instructions *</h2>

			<div class="space-y-3">
				{#each steps as step, i}
					<div class="flex gap-2">
						<span class="text-lg font-bold pt-3 w-8">{i + 1}.</span>
						<textarea
							bind:value={steps[i]}
							placeholder="Describe this step..."
							rows="2"
							class="textarea rounded-lg flex-1"
							required
						></textarea>
						<button
							type="button"
							onclick={() => removeStep(i)}
							class="btn btn-icon variant-filled-error rounded-lg self-start"
							disabled={steps.length === 1}
							aria-label="Remove step"
						>
							<X size={20} />
						</button>
					</div>
				{/each}
			</div>

			<button
				type="button"
				onclick={addStep}
				class="btn variant-filled-primary rounded-lg w-full"
			>
				<Plus size={20} class="mr-2" />
				Add Step
			</button>
		</div>
		{/if}

		<!-- Navigation Buttons -->
		<div class="flex gap-4 flex-col sm:flex-row sticky bottom-4 bg-surface-50 dark:bg-surface-900 p-4 rounded-xl shadow-xl">
			{#if currentStep > 1}
				<button
					type="button"
					onclick={previousStep}
					class="btn variant-ghost rounded-lg flex-1 flex items-center justify-center gap-2"
				>
					<ChevronLeft size={20} />
					Previous
				</button>
			{:else}
				<a
					href="/"
					class="btn variant-ghost rounded-lg flex-1 text-center"
				>
					Cancel
				</a>
			{/if}

			{#if currentStep < totalSteps}
				<button
					type="button"
					onclick={nextStep}
					class="btn variant-filled-primary rounded-lg flex-1 flex items-center justify-center gap-2"
				>
					Next
					<ChevronRight size={20} />
				</button>
			{:else}
				<button
					type="submit"
					class="btn variant-filled-primary rounded-lg flex-1"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Creating...' : 'Create Recipe'}
				</button>
			{/if}
		</div>
	</form>
</div>
