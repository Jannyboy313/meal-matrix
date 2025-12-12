/**
 * Recipe Form Validation
 * Handles validation logic for recipe forms
 * Following Single Responsibility Principle
 */

import type { Ingredient } from '$lib/types';

export interface ValidationErrors {
	title?: string;
	ingredients?: { [key: number]: { name?: string; amount?: string } };
	steps?: { [key: number]: string };
	general?: string;
}

/**
 * Validate basic info step (title required)
 */
export function validateBasicInfo(title: string): ValidationErrors {
	const errors: ValidationErrors = {};

	if (!title.trim()) {
		errors.title = 'Recipe title is required';
	}

	return errors;
}

/**
 * Validate ingredients step
 */
export function validateIngredients(
	ingredients: Ingredient[],
	servingSize: number
): ValidationErrors {
	const errors: ValidationErrors = { ingredients: {} };

	if (ingredients.length === 0) {
		errors.general = 'Please add at least one ingredient';
		return errors;
	}

	ingredients.forEach((ing, i) => {
		const ingredientErrors: { name?: string; amount?: string } = {};

		if (!ing.name.trim()) {
			ingredientErrors.name = 'Name is required';
		}
		if (!ing.amount.trim()) {
			ingredientErrors.amount = 'Amount is required';
		}

		if (Object.keys(ingredientErrors).length > 0) {
			errors.ingredients![i] = ingredientErrors;
		}
	});

	if (Object.keys(errors.ingredients!).length === 0) {
		delete errors.ingredients;
	}

	return errors;
}

/**
 * Validate instructions step
 */
export function validateInstructions(steps: string[]): ValidationErrors {
	const errors: ValidationErrors = { steps: {} };

	if (steps.length === 0) {
		errors.general = 'Please add at least one instruction step';
		return errors;
	}

	steps.forEach((step, i) => {
		if (!step.trim()) {
			errors.steps![i] = 'Step description is required';
		}
	});

	if (Object.keys(errors.steps!).length === 0) {
		delete errors.steps;
	}

	return errors;
}

/**
 * Validate the entire form before submission
 */
export function validateCompleteForm(formData: {
	title: string;
	servings: number[];
	ingredients: { [serving: number]: Ingredient[] };
	steps: string[];
}): ValidationErrors {
	const errors: ValidationErrors = {};

	// Validate title
	if (!formData.title.trim()) {
		errors.general = 'Please enter a recipe title';
		return errors;
	}

	// Check all servings have ingredients with names
	for (const serving of formData.servings) {
		const ings = formData.ingredients[serving] || [];
		if (ings.some((ing) => !ing.name.trim())) {
			errors.general = 'Please fill in all ingredient names';
			return errors;
		}
	}

	// Validate steps
	if (formData.steps.some((step) => !step.trim())) {
		errors.general = 'Please fill in all steps';
		return errors;
	}

	return errors;
}

/**
 * Check if validation errors object has any errors
 */
export function hasErrors(errors: ValidationErrors): boolean {
	if (errors.general) return true;
	if (errors.title) return true;
	if (errors.ingredients && Object.keys(errors.ingredients).length > 0) return true;
	if (errors.steps && Object.keys(errors.steps).length > 0) return true;
	return false;
}
