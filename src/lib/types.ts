/**
 * Core type definitions for the recipe application
 */

export interface Tag {
	id: string;
	name: string;
	color: string;
}

export interface Ingredient {
	amount: string;
	name: string;
}

export interface RecipeSummary {
	id: number;
	title: string;
	description: string;
	image: string;
	tags: Tag[];
}

export interface Recipe extends RecipeSummary {
	prepTime: string;
	cookTime: string;
	servings: number;
	ingredients: {
		[key: number]: Ingredient[];
	};
	steps: string[];
}

export interface RecipeFormData {
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
