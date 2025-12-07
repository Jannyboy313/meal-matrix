/**
 * Core type definitions for the recipe application
 * Optimized for Firebase/Firestore NoSQL database
 */

/**
 * Tag document - stored in separate 'tags' collection
 * Path: /tags/{tagId}
 */
export interface Tag {
	id: string; // UUID
	name: string;
	color: string;
	userId?: string; // Owner of the tag (optional for system/global tags)
	isGlobal?: boolean; // True for system tags available to all users
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
 * Stores only tag IDs to allow easy tag updates across all recipes
 */
export interface RecipeSummary {
	id: string; // UUID
	title: string;
	description: string;
	image: string;
	tagIds: string[]; // Array of tag IDs (references to /tags collection)
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
	userId?: string; // Owner of the recipe
}

/**
 * Recipe summary with populated tags (view model)
 * Used in UI when displaying recipes with full tag information
 */
export interface RecipeSummaryWithTags extends Omit<RecipeSummary, 'tagIds'> {
	tags: Tag[]; // Populated tag objects for display
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
 * Full recipe with populated tags (view model)
 * Used in UI when displaying full recipe with tag information
 */
export interface RecipeWithTags extends Omit<Recipe, 'tagIds'> {
	tags: Tag[]; // Populated tag objects for display
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
	tags: Tag[];
	servings: number[];
	currentServing: number;
	ingredients: { [serving: number]: Ingredient[] };
	steps: string[];
}
