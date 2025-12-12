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
import type { Recipe, RecipeSummary, RecipeWithTags, RecipeSummaryWithTags } from '$lib/types';
import { populateRecipeTags, populateRecipeSummaryTags } from '$lib/services/tagService';

/**
 * Get a single recipe by ID from Firestore
 * @param recipeId - The recipe ID to fetch
 * @returns Promise that resolves with the recipe with populated tags, or null if not found
 */
export async function getRecipeById(recipeId: string): Promise<RecipeWithTags | null> {
	try {
		const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));

		if (!recipeDoc.exists()) {
			return null;
		}

		const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
		return await populateRecipeTags(recipe);
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
	callback: (recipes: RecipeSummaryWithTags[]) => void
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

			// Populate tags for all recipes
			const recipesWithTags = await Promise.all(
				recipes.map((recipe) => populateRecipeSummaryTags(recipe))
			);

			callback(recipesWithTags);
		},
		(error) => {
			console.error('Error subscribing to recipes:', error);
			callback([]);
		}
	);
}

/**
 * Create a new recipe in Firestore
 * @param recipeData - Recipe data including tags (Tag objects)
 * @param userId - The user ID who owns the recipe
 * @returns Promise that resolves with the created recipe ID
 */
export async function createRecipe(
	recipeData: Omit<RecipeWithTags, 'id' | 'tagIds' | 'createdAt' | 'updatedAt'>,
	userId: string
): Promise<string> {
	try {
		// Extract tag IDs from tag objects
		const tagIds = recipeData.tags?.map((tag) => tag.id) || [];
		const { tags, ...recipeWithoutTags } = recipeData;

		// Create the recipe document with Firestore timestamps
		const docRef = await addDoc(collection(db, 'recipes'), {
			...recipeWithoutTags,
			tagIds,
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
 * @param recipeData - Updated recipe data including tags (Tag objects)
 * @param userId - The user ID who owns the recipe (for validation)
 */
export async function updateRecipe(
	recipeId: string,
	recipeData: Omit<RecipeWithTags, 'id' | 'tagIds' | 'createdAt' | 'updatedAt' | 'userId'>,
	userId: string
): Promise<void> {
	try {
		// Extract tag IDs from tag objects
		const tagIds = recipeData.tags?.map((tag) => tag.id) || [];
		const { tags, ...recipeWithoutTags } = recipeData;

		// Update the recipe document
		await updateDoc(doc(db, 'recipes', recipeId), {
			...recipeWithoutTags,
			tagIds,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating recipe:', error);
		throw error;
	}
}
