import { db } from '$lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, type Unsubscribe } from 'firebase/firestore';
import type { Recipe, RecipeSummary, RecipeSummaryWithTags, RecipeWithTags, Tag } from '$lib/types';

/**
 * Fetch a single tag by ID from Firestore
 */
async function getTagById(tagId: string): Promise<Tag | null> {
	try {
		const tagDoc = await getDoc(doc(db, 'tags', tagId));
		if (tagDoc.exists()) {
			return tagDoc.data() as Tag;
		}
		return null;
	} catch (error) {
		console.error('Error fetching tag:', error);
		return null;
	}
}

/**
 * Populate tag details for an array of tag IDs
 */
async function populateTags(tagIds: string[]): Promise<Tag[]> {
	if (!tagIds || tagIds.length === 0) return [];

	const tagPromises = tagIds.map(id => getTagById(id));
	const tags = await Promise.all(tagPromises);

	// Filter out null values (tags that couldn't be found)
	return tags.filter((tag): tag is Tag => tag !== null);
}

/**
 * Convert RecipeSummary to RecipeSummaryWithTags by fetching tag details
 */
export async function populateRecipeSummaryTags(recipe: RecipeSummary): Promise<RecipeSummaryWithTags> {
	const tags = await populateTags(recipe.tagIds || []);
	const { tagIds, ...rest } = recipe;
	return {
		...rest,
		tags
	};
}

/**
 * Convert Recipe to RecipeWithTags by fetching tag details
 */
export async function populateRecipeTags(recipe: Recipe): Promise<RecipeWithTags> {
	const tags = await populateTags(recipe.tagIds || []);
	const { tagIds, ...rest } = recipe;
	return {
		...rest,
		tags
	};
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

	return onSnapshot(q, async (snapshot) => {
		const recipes: RecipeSummary[] = [];

		snapshot.forEach((doc) => {
			recipes.push({ id: doc.id, ...doc.data() } as RecipeSummary);
		});

		// Populate tags for all recipes
		const recipesWithTags = await Promise.all(
			recipes.map(recipe => populateRecipeSummaryTags(recipe))
		);

		callback(recipesWithTags);
	}, (error) => {
		console.error('Error subscribing to recipes:', error);
		callback([]);
	});
}

/**
 * Get a single recipe by ID from Firestore
 */
export async function getRecipeById(recipeId: string): Promise<RecipeWithTags | null> {
	try {
		const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
		if (recipeDoc.exists()) {
			const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
			return await populateRecipeTags(recipe);
		}
		return null;
	} catch (error) {
		console.error('Error fetching recipe:', error);
		return null;
	}
}
