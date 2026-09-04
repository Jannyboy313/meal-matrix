/**
 * Main library exports
 * Re-exports commonly used types, stores, and services
 */

// Export types
export type {
	Label,
	Ingredient,
	ServingIngredients,
	Recipe,
	RecipeSummary,
	RecipeSummaryWithLabels,
	RecipeWithLabels,
	RecipeFormData
} from './types';

// Export stores
export { user, initAuthListener } from './stores/auth';

// Export services (grouped by domain)
export * from './services';

// Export Firebase instances (for service layer use only)
export { auth, db } from './firebase';
