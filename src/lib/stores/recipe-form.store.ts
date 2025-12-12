/**
 * Recipe Form Store
 * Manages recipe form state and localStorage persistence
 * Following Svelte store best practices and Single Responsibility Principle
 */

import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { RecipeFormData, Tag, Ingredient } from '$lib/types';

/**
 * Create a persistent recipe form store that syncs with localStorage
 * @param storageKey - The localStorage key to use for persistence
 * @param initialData - Optional initial form data
 * @returns Writable store with additional methods
 */
export function createRecipeFormStore(storageKey: string, initialData?: RecipeFormData) {
	// Default initial state
	const defaultState: RecipeFormData = {
		title: '',
		description: '',
		image: '',
		prepTime: '',
		cookTime: '',
		tags: [],
		servings: [4],
		currentServing: 4,
		ingredients: { 4: [{ amount: '', name: '' }] },
		steps: ['']
	};

	// Load from localStorage if available
	let persistedData: RecipeFormData | null = null;
	if (browser) {
		const stored = localStorage.getItem(storageKey);
		if (stored) {
			try {
				persistedData = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse stored form data:', e);
			}
		}
	}

	// Merge initial data with persisted data (persisted takes priority)
	const initialState = {
		...defaultState,
		...initialData,
		...persistedData
	};

	const { subscribe, set, update } = writable<RecipeFormData>(initialState);

	// Save to localStorage whenever store changes
	if (browser) {
		subscribe((state) => {
			try {
				localStorage.setItem(storageKey, JSON.stringify(state));
			} catch (e) {
				console.error('Failed to save form data to localStorage:', e);
			}
		});
	}

	return {
		subscribe,
		set,
		update,

		/** Add a tag to the form */
		addTag: (tag: Tag) => {
			update((state) => ({
				...state,
				tags: [...state.tags, tag]
			}));
		},

		/** Remove a tag by index */
		removeTag: (index: number) => {
			update((state) => ({
				...state,
				tags: state.tags.filter((_, i) => i !== index)
			}));
		},

		/** Change the current serving size */
		changeServing: (serving: number) => {
			update((state) => ({
				...state,
				currentServing: serving
			}));
		},

		/** Remove a serving size */
		removeServing: (serving: number) => {
			update((state) => {
				const newServings = state.servings.filter((s) => s !== serving);
				if (newServings.length === 0) return state; // Don't allow removing all servings

				const newIngredients = { ...state.ingredients };
				delete newIngredients[serving];

				return {
					...state,
					servings: newServings,
					currentServing: state.currentServing === serving ? newServings[0] : state.currentServing,
					ingredients: newIngredients
				};
			});
		},

		/** Add an ingredient to the current serving */
		addIngredient: (currentServing: number, allServings: number[]) => {
			update((state) => {
				const newIngredients = { ...state.ingredients };

				// Add to current serving
				if (!newIngredients[currentServing]) {
					newIngredients[currentServing] = [];
				}
				newIngredients[currentServing] = [
					...newIngredients[currentServing],
					{ amount: '', name: '' }
				];

				// Add to other servings
				allServings.forEach((serving) => {
					if (serving !== currentServing) {
						if (!newIngredients[serving]) {
							newIngredients[serving] = [];
						}
						newIngredients[serving] = [
							...newIngredients[serving],
							{ amount: '', name: '' }
						];
					}
				});

				return {
					...state,
					ingredients: newIngredients
				};
			});
		},

		/** Remove an ingredient by index from all servings */
		removeIngredient: (index: number, currentServing: number, allServings: number[]) => {
			update((state) => {
				const currentIngredients = state.ingredients[currentServing] || [];
				if (currentIngredients.length <= 1) return state; // Don't allow removing the last ingredient

				const newIngredients = { ...state.ingredients };

				// Remove from all servings
				allServings.forEach((serving) => {
					if (newIngredients[serving]) {
						newIngredients[serving] = newIngredients[serving].filter((_, i) => i !== index);
					}
				});

				return {
					...state,
					ingredients: newIngredients
				};
			});
		},

		/** Add a step */
		addStep: () => {
			update((state) => ({
				...state,
				steps: [...state.steps, '']
			}));
		},

		/** Remove a step by index */
		removeStep: (index: number) => {
			update((state) => {
				if (state.steps.length <= 1) return state; // Don't allow removing the last step
				return {
					...state,
					steps: state.steps.filter((_, i) => i !== index)
				};
			});
		},

		/** Clear the stored form data */
		clearStorage: () => {
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		},

		/** Reset to default state */
		reset: () => {
			set(defaultState);
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		}
	};
}

export type RecipeFormStore = ReturnType<typeof createRecipeFormStore>;
