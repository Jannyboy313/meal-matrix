<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { Label, Ingredient, RecipeFormData } from '$lib';
	import { getCategoryByKey } from '$lib/constants/categories';
	import { createRecipe, updateRecipe } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { X } from 'lucide-svelte';
	import BasicInfoStep from '$lib/components/recipe/BasicInfoStep.svelte';
	import CategoryPicker from '$lib/components/recipe/CategoryPicker.svelte';
	import LabelPicker from '$lib/components/recipe/LabelPicker.svelte';
	import IngredientsStep from '$lib/components/recipe/IngredientsStep.svelte';
	import InstructionsStep from '$lib/components/recipe/InstructionsStep.svelte';
	import StepNavigation from '$lib/components/recipe/StepNavigation.svelte';
	import ProgressIndicator from '$lib/components/recipe/ProgressIndicator.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		availableLabels: Label[];
		storageKey: string;
		initialData?: RecipeFormData;
		isEditing?: boolean;
		recipeId?: string;
		submitErrorMessage?: string;
		onSuccess?: () => void;
	}

	let {
		availableLabels,
		storageKey,
		initialData,
		isEditing = false,
		recipeId,
		submitErrorMessage = $t('recipe.validation.saveFailed'),
		onSuccess
	}: Props = $props();

	// Form data
	let title = $state<string>('');
	let description = $state<string>('');
	let image = $state<string>('');
	let prepTime = $state<string>('');
	let cookTime = $state<string>('');
	let categoryKey = $state<string>('');
	let labels = $state<Label[]>([]);
	let servings = $state<number[]>([4]);
	let currentServing = $state<number>(4);
	let ingredients = $state<{ [serving: number]: Ingredient[] }>({ 4: [{ amount: '', name: '' }] });
	let steps = $state<string[]>(['']);

	// Flow state
	let currentStep = $state<number>(1);
	let isSubmitting = $state<boolean>(false);
	let error = $state<string>('');
	let isInitialized = $state<boolean>(false);
	let showCloseConfirm = $state<boolean>(false);
	let initialSnapshot = $state<string>('');
	let closeButton: HTMLButtonElement | undefined = $state();
	let discardCancelButton: HTMLButtonElement | undefined = $state();

	// Field-level errors
	let titleError = $state<string>('');
	let categoryError = $state<string>('');
	let ingredientErrors = $state<{ [key: number]: { name?: string; amount?: string } }>({});
	let stepErrors = $state<{ [key: number]: string }>({});

	const stepTitles = $derived([
		$t('recipe.steps.basicInfo'),
		$t('recipe.steps.categoryLabels'),
		$t('recipe.steps.ingredients'),
		$t('recipe.steps.instructions')
	]);
	const totalSteps = 4;

	// Initialize from URL and localStorage
	$effect(() => {
		if (typeof window === 'undefined' || isInitialized) return;

		// Initialize from initial data (if provided)
		if (initialData) {
			title = initialData.title;
			description = initialData.description || '';
			image = initialData.image;
			prepTime = initialData.prepTime;
			cookTime = initialData.cookTime;
			categoryKey = initialData.categoryKey;
			labels = initialData.labels;
			servings = initialData.servings;
			currentServing = initialData.currentServing;
			ingredients = initialData.ingredients;
			steps = initialData.steps;
		}

		initialSnapshot = JSON.stringify({
			title,
			description,
			image,
			prepTime,
			cookTime,
			categoryKey,
			labels,
			steps,
			ingredients
		});

		// Get step from URL
		const urlStep = parseInt($page.url.searchParams.get('step') || '1', 10);
		if (urlStep >= 1 && urlStep <= totalSteps) {
			currentStep = urlStep;
		}

		// Load draft data from localStorage (overrides initial data)
		const savedDraft = localStorage.getItem(storageKey);
		if (savedDraft) {
			try {
				const draft: RecipeFormData = JSON.parse(savedDraft);
				title = draft.title || title;
				description = draft.description || description;
				image = draft.image || image;
				prepTime = draft.prepTime || prepTime;
				cookTime = draft.cookTime || cookTime;
				categoryKey = draft.categoryKey || categoryKey;
				labels = draft.labels || labels;
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
			description,
			image,
			prepTime,
			cookTime,
			categoryKey,
			labels,
			servings,
			currentServing,
			ingredients,
			steps
		};

		localStorage.setItem(storageKey, JSON.stringify(formData));

		// Track dependencies
		title;
		description;
		image;
		prepTime;
		cookTime;
		categoryKey;
		labels;
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
	function addLabel(label: Label) {
		labels = [...labels, label];
	}

	function removeLabel(index: number) {
		labels = labels.filter((_, i) => i !== index);
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
		categoryError = '';
		ingredientErrors = {};
		stepErrors = {};

		let isValid = true;

		if (currentStep === 1) {
			if (!title.trim()) {
				titleError = $t('recipe.validation.nameRequired');
				isValid = false;
			}
		} else if (currentStep === 2) {
			// Checks that the key resolves, not just that it is set: a stale draft can carry a
			// key whose category has since been removed, and that must not reach Firestore.
			if (!getCategoryByKey(categoryKey)) {
				categoryError = $t('recipe.validation.categoryRequired');
				isValid = false;
			}
		} else if (currentStep === 3) {
			const currentIngredients = ingredients[currentServing] || [];
			if (currentIngredients.length === 0) {
				error = $t('recipe.validation.ingredientsRequired');
				isValid = false;
			}

			currentIngredients.forEach((ing, i) => {
				if (!ing.name.trim()) {
					ingredientErrors[i] = { ...ingredientErrors[i], name: $t('recipe.validation.ingredientNameRequired') };
					isValid = false;
				}
				if (!ing.amount.trim()) {
					ingredientErrors[i] = { ...ingredientErrors[i], amount: $t('recipe.validation.ingredientAmountRequired') };
					isValid = false;
				}
			});
		} else if (currentStep === 4) {
			if (steps.length === 0) {
				error = $t('recipe.validation.instructionsRequired');
				isValid = false;
			}

			steps.forEach((step, i) => {
				if (!step.trim()) {
					stepErrors[i] = $t('recipe.validation.stepDescriptionRequired');
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
			localStorage.removeItem(storageKey);
		}
	}

	function isDirty(): boolean {
		// Key order must match initialSnapshot: the two strings are compared directly.
		const current = JSON.stringify({
			title,
			description,
			image,
			prepTime,
			cookTime,
			categoryKey,
			labels,
			steps,
			ingredients
		});
		return current !== initialSnapshot;
	}

	function requestClose() {
		if (isDirty()) {
			showCloseConfirm = true;
		} else {
			discardAndClose();
		}
	}

	function discardAndClose() {
		clearDraft();
		showCloseConfirm = false;
		goto(isEditing && recipeId ? `/recipes/${recipeId}` : '/');
	}

	function validateForm(): boolean {
		error = '';

		if (!title.trim()) {
			error = $t('recipe.validation.titleRequired');
			return false;
		}

		if (!getCategoryByKey(categoryKey)) {
			error = $t('recipe.validation.categoryRequired');
			return false;
		}

		// Check all servings have ingredients with names
		for (const serving of servings) {
			const ings = ingredients[serving] || [];
			if (ings.some((ing) => !ing.name.trim())) {
				error = $t('recipe.validation.fillAllIngredients');
				return false;
			}
		}

		if (steps.some((step) => !step.trim())) {
			error = $t('recipe.validation.fillAllSteps');
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

	function handleDiscardDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			showCloseConfirm = false;
		}
	}

	// Manage focus and Escape-to-close for the discard-confirmation dialog
	$effect(() => {
		if (browser && showCloseConfirm) {
			document.addEventListener('keydown', handleDiscardDialogKeydown);
			discardCancelButton?.focus();
			return () => {
				document.removeEventListener('keydown', handleDiscardDialogKeydown);
				closeButton?.focus();
			};
		}
	});
</script>

<div class="flex items-center justify-between px-[22px] pt-12">
	<span class="font-display text-xl font-black tracking-[-0.04em] text-ink">
		{isEditing ? $t('recipe.title.edit') : $t('recipe.title.createNew')}
	</span>
	<button
		type="button"
		bind:this={closeButton}
		onclick={requestClose}
		aria-label={$t('common.actions.cancel')}
		class="focus-ring flex h-[34px] w-[34px] items-center justify-center border-2 border-ink text-ink"
	>
		<X size={18} />
	</button>
</div>

<div class="px-[22px] pt-[14px]">
	<ProgressIndicator {currentStep} {totalSteps} {stepTitles} />
</div>

{#if error}
	<div class="mx-[22px] mt-[18px] border-2 border-ink offset-accent bg-accent px-4 py-3 text-white">
		<p class="text-sm font-semibold">{error}</p>
	</div>
{/if}

<form
	onsubmit={async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		// Check if user is authenticated
		const currentUser = $user;
		if (!currentUser) {
			error = $t('recipe.validation.mustBeLoggedIn');
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const recipeData = {
				title,
				description: description || '',
				image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
				prepTime,
				cookTime,
				servings: servings[0] || 4,
				categoryKey,
				labels,
				ingredients,
				steps
			};

			if (isEditing && recipeId) {
				// Update existing recipe
				await updateRecipe(recipeId, recipeData, currentUser.uid);

				// Clear draft after successful submission
				clearDraft();

				// Navigate back to recipe detail
				await goto(`/recipes/${recipeId}`);
			} else {
				// Create new recipe
				const newRecipeId = await createRecipe(recipeData, currentUser.uid);

				// Clear draft after successful submission
				clearDraft();

				// Navigate to the new recipe
				await goto(`/recipes/${newRecipeId}`);
			}

			// Call success callback if provided
			onSuccess?.();
		} catch (err) {
			console.error('Error saving recipe:', err);
			error = submitErrorMessage;
		} finally {
			isSubmitting = false;
		}
	}}
	class="flex flex-col gap-[18px] px-[22px] pb-[120px] pt-[20px]"
>
	{#if currentStep === 1}
		<BasicInfoStep bind:title bind:description bind:image bind:prepTime bind:cookTime {titleError} />
	{:else if currentStep === 2}
		<CategoryPicker bind:categoryKey error={categoryError} />
		<LabelPicker
			bind:labels
			{availableLabels}
			onaddlabel={addLabel}
			onremovelabel={removeLabel}
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

	<StepNavigation
		{currentStep}
		{totalSteps}
		{isSubmitting}
		{isEditing}
		onprevious={previousStep}
		onnext={nextStep}
		oncancel={requestClose}
	/>
</form>

{#if showCloseConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-[22px]">
		<div
			class="w-full max-w-sm border-2 border-ink offset-ink bg-white p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="discard-dialog-title"
		>
			<p id="discard-dialog-title" class="text-base font-semibold text-ink">{$t('recipe.wizard.discardTitle')}</p>
			<p class="mt-2 text-sm text-muted">{$t('recipe.wizard.discardBody')}</p>
			<div class="mt-5 flex gap-[10px]">
				<button
					type="button"
					bind:this={discardCancelButton}
					onclick={() => (showCloseConfirm = false)}
					class="focus-ring flex-1 border-2 border-ink bg-white py-3 text-sm font-black uppercase text-ink"
				>
					{$t('recipe.wizard.discardCancel')}
				</button>
				<button
					type="button"
					onclick={discardAndClose}
					class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-3 text-sm font-black uppercase text-white"
				>
					{$t('recipe.wizard.discardConfirm')}
				</button>
			</div>
		</div>
	</div>
{/if}
