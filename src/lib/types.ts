/**
 * Core type definitions for the recipe application
 * Optimized for Firebase/Firestore NoSQL database
 */

import type { Category, StoredCategory } from '$lib/constants/categories';

/**
 * Label document - stored in separate 'labels' collection
 * Path: /labels/{labelId}
 *
 * Deliberately has no colour. Unlike a category, a label is never rendered as a filled area —
 * it appears only as one typographic line on the detail page — so a colour field would carry
 * no meaning. See .github/design_handoff_meal_matrix_labels/README.md
 */
export interface Label {
	id: string; // UUID
	name: string; // stored in sentence case; uppercased by CSS at display time
	userId?: string; // Owner of the label (optional for system/global labels)
	isGlobal?: boolean; // True for system labels available to all users
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
}

/**
 * Ingredient with amount for a specific serving size
 */
export interface Ingredient {
	amount: string;
	name: string;
}

/**
 * Ingredient set for a specific number of servings
 */
export interface ServingIngredients {
	servings: number;
	ingredients: Ingredient[];
}

/**
 * Recipe summary for list views (database format)
 * Stores only label IDs to allow easy label updates across all recipes
 */
export interface RecipeSummary {
	id: string; // UUID
	title: string;
	description: string;
	image: string;
	category: StoredCategory; // { key, name } — name is denormalised so the export reads alone
	labelIds: string[]; // Array of label IDs (references to /labels collection)
	prepTime?: string;
	cookTime?: string;
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
	userId?: string; // Owner of the recipe
}

/**
 * Recipe summary with populated labels (view model)
 * Used in UI when displaying recipes with full label information
 */
export interface RecipeSummaryWithLabels extends Omit<RecipeSummary, 'category' | 'labelIds'> {
	category?: Category; // Resolved from constants; undefined if the key matches nothing
	labels: Label[]; // Populated label objects for display
}

/**
 * Full recipe document - stored in 'recipes' collection (database format)
 * Path: /recipes/{recipeId}
 */
export interface Recipe extends RecipeSummary {
	prepTime: string;
	cookTime: string;
	servings: number; // Default/base serving size

	// Legacy format (current) - object with serving numbers as keys
	// TODO: Migrate to servingOptions array format
	ingredients: {
		[key: number]: Ingredient[];
	};

	// New format (Firebase-optimized) - array of serving options
	// servingOptions?: ServingIngredients[];

	steps: string[];
}

/**
 * Full recipe with populated labels (view model)
 * Used in UI when displaying full recipe with label information
 */
export interface RecipeWithLabels extends Omit<Recipe, 'category' | 'labelIds'> {
	category?: Category; // Resolved from constants; undefined if the key matches nothing
	labels: Label[]; // Populated label objects for display
}

/**
 * Form data structure (UI state, not stored in database)
 * Used for recipe creation/editing forms
 */
export interface RecipeFormData {
	title: string;
	description: string;
	image: string;
	prepTime: string;
	cookTime: string;
	categoryKey: string;
	labels: Label[];
	servings: number[];
	currentServing: number;
	ingredients: { [serving: number]: Ingredient[] };
	steps: string[];
}
