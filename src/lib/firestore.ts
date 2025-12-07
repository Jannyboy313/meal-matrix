import { db } from '$lib/firebase';
import {
	collection,
	query,
	where,
	onSnapshot,
	doc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	serverTimestamp,
	type Unsubscribe
} from 'firebase/firestore';
import type { Recipe, RecipeSummary, RecipeSummaryWithTags, RecipeWithTags, Tag } from '$lib/types';

/**
 * Fetch all tags from Firestore
 * Returns both global tags and user-specific tags
 */
export async function getAllTags(userId?: string): Promise<Tag[]> {
	try {
		const tagsRef = collection(db, 'tags');
		let q;

		if (userId) {
			// Fetch global tags and user's tags
			q = query(
				tagsRef,
				where('isGlobal', '==', true)
			);
			const globalSnapshot = await getDocs(q);

			const userQuery = query(
				tagsRef,
				where('userId', '==', userId)
			);
			const userSnapshot = await getDocs(userQuery);

			const tags: Tag[] = [];
			globalSnapshot.forEach((doc) => {
				tags.push({ id: doc.id, ...doc.data() } as Tag);
			});
			userSnapshot.forEach((doc) => {
				tags.push({ id: doc.id, ...doc.data() } as Tag);
			});

			return tags;
		} else {
			// Only fetch global tags
			q = query(tagsRef, where('isGlobal', '==', true));
			const snapshot = await getDocs(q);
			const tags: Tag[] = [];
			snapshot.forEach((doc) => {
				tags.push({ id: doc.id, ...doc.data() } as Tag);
			});
			return tags;
		}
	} catch (error) {
		console.error('Error fetching tags:', error);
		return [];
	}
}

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
 * Create a new tag in Firestore
 * @param tagData - Tag data (name, color)
 * @param userId - The user ID who owns the tag
 * @returns The created tag with ID
 */
export async function createTag(
	tagData: { name: string; color: string },
	userId: string
): Promise<Tag> {
	try {
		const docRef = await addDoc(collection(db, 'tags'), {
			name: tagData.name,
			color: tagData.color,
			userId,
			isGlobal: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		return {
			id: docRef.id,
			name: tagData.name,
			color: tagData.color,
			userId,
			isGlobal: false
		};
	} catch (error) {
		console.error('Error creating tag:', error);
		throw error;
	}
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

/**
 * Create a new recipe in Firestore
 * @param recipeData - Recipe data including tags (Tag objects)
 * @param userId - The user ID who owns the recipe
 * @returns The created recipe ID
 */
export async function createRecipe(
	recipeData: Omit<RecipeWithTags, 'id' | 'tagIds' | 'createdAt' | 'updatedAt'>,
	userId: string
): Promise<string> {
	try {
		// Extract tag IDs from tag objects
		const tagIds = recipeData.tags?.map(tag => tag.id) || [];

		// Remove tags property and add tagIds
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
		const tagIds = recipeData.tags?.map(tag => tag.id) || [];

		// Remove tags property and add tagIds
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
