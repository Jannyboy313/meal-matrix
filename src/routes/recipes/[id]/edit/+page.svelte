<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
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

	interface RecipeFormData {
		title: string;
		image: string;
		prepTime: string;
		cookTime: string;
		tags: Tag[];
		servings: number[];
		currentServing: number;
		ingredients: { [serving: number]: Ingredient[] };
		steps: string[];
	}

	let { data }: { data: PageData } = $props();

	const STORAGE_KEY = $derived(`recipe-edit-${data.recipe.id}`);

	// Form data - initialized from the existing recipe
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
	let isInitialized = $state<boolean>(false);

	// Field-level errors
	let titleError = $state<string>('');
	let ingredientErrors = $state<{ [key: number]: { name?: string; amount?: string } }>({});
	let stepErrors = $state<{ [key: number]: string }>({});

	const stepTitles = ['Basic Info', 'Tags', 'Ingredients', 'Instructions'];
	const totalSteps = 4;

	// Initialize from URL and localStorage
	$effect(() => {
		if (typeof window === 'undefined' || isInitialized) return;

		// Initialize from existing recipe data
		title = data.recipe.title;
		image = data.recipe.image;
		prepTime = data.recipe.prepTime || '';
		cookTime = data.recipe.cookTime || '';
		tags = data.recipe.tags || [];
		servings = Object.keys(data.recipe.ingredients).map(Number);
		currentServing = data.recipe.servings || servings[0];
		ingredients = structuredClone(data.recipe.ingredients);
		steps = [...data.recipe.steps];

		// Get step from URL
		const urlStep = parseInt($page.url.searchParams.get('step') || '1', 10);
		if (urlStep >= 1 && urlStep <= totalSteps) {
			currentStep = urlStep;
		}

		// Load draft data from localStorage if available (overrides loaded recipe)
		const savedDraft = localStorage.getItem(STORAGE_KEY);
		if (savedDraft) {
			try {
				const draft: RecipeFormData = JSON.parse(savedDraft);
				title = draft.title || title;
				image = draft.image || image;
				prepTime = draft.prepTime || prepTime;
				cookTime = draft.cookTime || cookTime;
				tags = draft.tags || tags;
				servings = draft.servings || servings;
				currentServing = draft.currentServing || currentServing;
				ingredients = draft.ingredients || ingredients;
				steps = draft.steps || steps;
			} catch (e) {
				console.error('Failed to load draft:', e);
			}
		}

		isInitialized = true;
	});

	// Save form data to localStorage whenever it changes
	$effect(() => {
		if (!isInitialized || typeof window === 'undefined') return;

		const formData: RecipeFormData = {
			title,
			image,
			prepTime,
			cookTime,
			tags,
			servings,
			currentServing,
			ingredients,
			steps
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

		// Track dependencies
		title;
		image;
		prepTime;
		cookTime;
		tags;
		servings;
		currentServing;
		ingredients;
		steps;
	});

	// Update URL when step changes
	$effect(() => {
		if (!isInitialized || typeof window === 'undefined') return;

		const url = new URL(window.location.href);
		url.searchParams.set('step', currentStep.toString());
		goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });
	});

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

	function clearDraft() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(STORAGE_KEY);
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
	<title>Edit {data.recipe.title} - Recipe Collection</title>
</svelte:head>

<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="h1">Edit Recipe</h1>
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
					error = 'Failed to update recipe. Please try again.';
				} else if (result.type === 'success') {
					// Clear draft after successful submission
					clearDraft();
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
			<BasicInfoStep bind:title bind:image bind:prepTime bind:cookTime {titleError} />
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
			<InstructionsStep bind:steps {stepErrors} onaddstep={addStep} onremovestep={removeStep} />
		{/if}

		<!-- Navigation -->
		<StepNavigation
			{currentStep}
			{totalSteps}
			{isSubmitting}
			isEditing={true}
			onprevious={previousStep}
			onnext={nextStep}
		/>
	</form>
</div>
