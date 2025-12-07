<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import BasicInfoStep from '$lib/components/recipe/BasicInfoStep.svelte';
	import TagsStep from '$lib/components/recipe/TagsStep.svelte';
	import IngredientsStep from '$lib/components/recipe/IngredientsStep.svelte';
	import InstructionsStep from '$lib/components/recipe/InstructionsStep.svelte';
	import StepNavigation from '$lib/components/recipe/StepNavigation.svelte';
	import ProgressIndicator from '$lib/components/recipe/ProgressIndicator.svelte';

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
	let tags = $state<Tag[]>([]);
	let servings = $state<number[]>([4]);
	let currentServing = $state<number>(4);
	let ingredients = $state<{ [serving: number]: Ingredient[] }>({ 4: [{ amount: '', name: '' }] });
	let steps = $state<string[]>(['']);

	// Flow state
	let currentStep = $state<number>(1);
	let isSubmitting = $state<boolean>(false);
	let error = $state<string>('');

	// Field-level errors
	let titleError = $state<string>('');
	let ingredientErrors = $state<{ [key: number]: { name?: string; amount?: string } }>({});
	let stepErrors = $state<{ [key: number]: string }>({});

	const stepTitles = ['Basic Info', 'Tags', 'Ingredients', 'Instructions'];
	const totalSteps = 4;

	// Event handlers
	function addTag(tag: Tag) {
		tags = [...tags, tag];
	}

	function removeTag(index: number) {
		tags = tags.filter((_, i) => i !== index);
	}

	function addServing() {
		// Function placeholder - actual logic in IngredientsStep component
	}

	function removeServing(serving: number) {
		if (servings.length > 1) {
			servings = servings.filter((s) => s !== serving);
			delete ingredients[serving];
			if (currentServing === serving) {
				currentServing = servings[0];
			}
		}
	}

	function changeServing(serving: number) {
		currentServing = serving;
	}

	function addIngredient() {
		if (!ingredients[currentServing]) {
			ingredients[currentServing] = [];
		}
		const newIng = { amount: '', name: '' };
		ingredients[currentServing] = [...ingredients[currentServing], newIng];

		// Add the same ingredient (name only) to other servings
		servings.forEach((serving) => {
			if (serving !== currentServing) {
				if (!ingredients[serving]) {
					ingredients[serving] = [];
				}
				ingredients[serving] = [...ingredients[serving], { amount: '', name: '' }];
			}
		});
	}

	function removeIngredient(index: number) {
		if ((ingredients[currentServing] || []).length > 1) {
			ingredients[currentServing] = ingredients[currentServing].filter((_, i) => i !== index);

			// Remove from all other servings too
			servings.forEach((serving) => {
				if (serving !== currentServing && ingredients[serving]) {
					ingredients[serving] = ingredients[serving].filter((_, i) => i !== index);
				}
			});
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

	// Validation
	function validateCurrentStep(): boolean {
		error = '';
		titleError = '';
		ingredientErrors = {};
		stepErrors = {};

		let isValid = true;

		if (currentStep === 1) {
			if (!title.trim()) {
				titleError = 'Recipe title is required';
				isValid = false;
			}
		} else if (currentStep === 3) {
			const currentIngredients = ingredients[currentServing] || [];
			if (currentIngredients.length === 0) {
				error = 'Please add at least one ingredient';
				isValid = false;
			}

			currentIngredients.forEach((ing, i) => {
				if (!ing.name.trim()) {
					ingredientErrors[i] = { ...ingredientErrors[i], name: 'Name is required' };
					isValid = false;
				}
				if (!ing.amount.trim()) {
					ingredientErrors[i] = { ...ingredientErrors[i], amount: 'Amount is required' };
					isValid = false;
				}
			});
		} else if (currentStep === 4) {
			if (steps.length === 0) {
				error = 'Please add at least one instruction step';
				isValid = false;
			}

			steps.forEach((step, i) => {
				if (!step.trim()) {
					stepErrors[i] = 'Step description is required';
					isValid = false;
				}
			});
		}

		return isValid;
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

		// Check all servings have ingredients with names
		for (const serving of servings) {
			const ings = ingredients[serving] || [];
			if (ings.some((ing) => !ing.name.trim())) {
				error = 'Please fill in all ingredient names';
				return false;
			}
		}

		if (steps.some((step) => !step.trim())) {
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
			onclick={() => (currentStep > 1 ? previousStep() : (window.location.href = '/'))}
			class="btn btn-icon preset-filled-surface-500 rounded-full shadow-lg"
			aria-label="Go back"
		>
			<ArrowLeft size={20} />
		</button>
		<div class="flex-1">
			<h1 class="h1">Create New Recipe</h1>
		</div>
	</div>

	<!-- Progress Indicator -->
	<div class="mb-6">
		<ProgressIndicator {currentStep} {totalSteps} {stepTitles} />
	</div>

	{#if error}
		<div class="variant-filled-error rounded-lg p-4 mb-6">
			<p>{error}</p>
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
				tags,
				ingredients,
				steps
			})}
		/>

		<!-- Step Components -->
		{#if currentStep === 1}
			<BasicInfoStep
				bind:title
				bind:image
				bind:prepTime
				bind:cookTime
				{titleError}
			/>
		{:else if currentStep === 2}
			<TagsStep
				bind:tags
				availableTags={data.availableTags}
				onaddtag={addTag}
				onremovetag={removeTag}
			/>
		{:else if currentStep === 3}
			<IngredientsStep
				bind:servings
				bind:ingredients
				bind:currentServing
				{ingredientErrors}
				onaddserving={addServing}
				onremoveserving={removeServing}
				onchangeserving={changeServing}
				onaddingredient={addIngredient}
				onremoveingredient={removeIngredient}
			/>
		{:else if currentStep === 4}
			<InstructionsStep
				bind:steps
				{stepErrors}
				onaddstep={addStep}
				onremovestep={removeStep}
			/>
		{/if}

		<!-- Navigation -->
		<StepNavigation
			{currentStep}
			{totalSteps}
			{isSubmitting}
			onprevious={previousStep}
			onnext={nextStep}
		/>
	</form>
</div>
