/**
 * Recipe Service
 * Handles all recipe-related Firestore operations following Single Responsibility Principle
 */

import {
	collection,
	doc,
	getDoc,
	addDoc,
	updateDoc,
	query,
	where,
	onSnapshot,
	serverTimestamp,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import type {
	Ingredient,
	Label,
	Recipe,
	RecipeSummary,
	RecipeWithLabels,
	RecipeSummaryWithLabels
} from '$lib/types';
import { populateLabels } from '$lib/services/labelService';
import { getCategoryById } from '$lib/constants/categories';

/**
 * What the recipe form submits. Distinct from RecipeWithLabels: the form holds a categoryId,
 * not a resolved category, and labels as objects rather than ids.
 */
export interface RecipeInput {
	title: string;
	description: string;
	image: string;
	prepTime: string;
	cookTime: string;
	servings: number;
	categoryId: string;
	labels: Label[];
	ingredients: { [key: number]: Ingredient[] };
	steps: string[];
}

/**
 * Build the summary view model: labels fetched from Firestore, category resolved from
 * constants. The category costs no read.
 */
async function toRecipeSummaryWithLabels(
	recipe: RecipeSummary
): Promise<RecipeSummaryWithLabels> {
	const labels = await populateLabels(recipe.labelIds || []);
	const { categoryId, labelIds, ...rest } = recipe;

	return { ...rest, category: getCategoryById(categoryId), labels };
}

/** Build the full view model. See toRecipeSummaryWithLabels. */
async function toRecipeWithLabels(recipe: Recipe): Promise<RecipeWithLabels> {
	const labels = await populateLabels(recipe.labelIds || []);
	const { categoryId, labelIds, ...rest } = recipe;

	return { ...rest, category: getCategoryById(categoryId), labels };
}

/**
 * Get a single recipe by ID from Firestore
 * @param recipeId - The recipe ID to fetch
 * @returns Promise that resolves with the recipe with populated labels, or null if not found
 */
export async function getRecipeById(recipeId: string): Promise<RecipeWithLabels | null> {
	try {
		const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));

		if (!recipeDoc.exists()) {
			return null;
		}

		const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
		return await toRecipeWithLabels(recipe);
	} catch (error) {
		console.error('Error fetching recipe:', error);
		throw error;
	}
}

/**
 * Subscribe to recipes for a specific user with real-time updates
 * @param userId - The user ID to filter recipes by
 * @param callback - Function called with updated recipes whenever data changes
 * @returns Unsubscribe function to stop listening to updates
 */
export function subscribeToUserRecipes(
	userId: string,
	callback: (recipes: RecipeSummaryWithLabels[]) => void
): Unsubscribe {
	const recipesRef = collection(db, 'recipes');
	const q = query(recipesRef, where('userId', '==', userId));

	return onSnapshot(
		q,
		async (snapshot) => {
			const recipes: RecipeSummary[] = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			} as RecipeSummary));

			// Populate labels and resolve the category for all recipes
			const recipesWithLabels = await Promise.all(
				recipes.map((recipe) => toRecipeSummaryWithLabels(recipe))
			);

			callback(recipesWithLabels);
		},
		(error) => {
			console.error('Error subscribing to recipes:', error);
			callback([]);
		}
	);
}

/**
 * Create a new recipe in Firestore
 * @param recipeData - Recipe data including labels (Label objects)
 * @param userId - The user ID who owns the recipe
 * @returns Promise that resolves with the created recipe ID
 */
export async function createRecipe(recipeData: RecipeInput, userId: string): Promise<string> {
	try {
		// Extract label IDs from label objects
		const labelIds = recipeData.labels?.map((label) => label.id) || [];
		const { labels, ...recipeWithoutLabels } = recipeData;

		// Create the recipe document with Firestore timestamps
		const docRef = await addDoc(collection(db, 'recipes'), {
			...recipeWithoutLabels,
			labelIds,
			userId,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		return docRef.id;
	} catch (error) {
		console.error('Error creating recipe:', error);
		throw error;
	}
}

/**
 * Update an existing recipe in Firestore
 * @param recipeId - The recipe ID to update
 * @param recipeData - Updated recipe data including labels (Label objects)
 * @param userId - The user ID who owns the recipe (for validation)
 */
export async function updateRecipe(
	recipeId: string,
	recipeData: RecipeInput,
	userId: string
): Promise<void> {
	try {
		// Extract label IDs from label objects
		const labelIds = recipeData.labels?.map((label) => label.id) || [];
		const { labels, ...recipeWithoutLabels } = recipeData;

		// Update the recipe document
		await updateDoc(doc(db, 'recipes', recipeId), {
			...recipeWithoutLabels,
			labelIds,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating recipe:', error);
		throw error;
	}
}
