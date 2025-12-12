/**
 * Tag Service
 * Handles all tag-related Firestore operations following Single Responsibility Principle
 */

import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	query,
	where,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import type { Tag, Recipe, RecipeSummary, RecipeWithTags, RecipeSummaryWithTags } from '$lib/types';

/**
 * Fetch all tags from Firestore (global and user-specific)
 * @param userId - Optional user ID to include user-specific tags
 * @returns Promise that resolves with array of tags
 */
export async function getAllTags(userId?: string): Promise<Tag[]> {
	try {
		const tagsRef = collection(db, 'tags');

		if (userId) {
			// Fetch global tags and user's tags
			const globalQuery = query(tagsRef, where('isGlobal', '==', true));
			const userQuery = query(tagsRef, where('userId', '==', userId));

			const [globalSnapshot, userSnapshot] = await Promise.all([
				getDocs(globalQuery),
				getDocs(userQuery)
			]);

			const tags: Tag[] = [
				...globalSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Tag)),
				...userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Tag))
			];

			return tags;
		} else {
			// Only fetch global tags
			const globalQuery = query(tagsRef, where('isGlobal', '==', true));
			const snapshot = await getDocs(globalQuery);

			return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Tag));
		}
	} catch (error) {
		console.error('Error fetching tags:', error);
		return [];
	}
}

/**
 * Fetch a single tag by ID from Firestore
 * @param tagId - The tag ID to fetch
 * @returns Promise that resolves with the tag or null if not found
 */
export async function getTagById(tagId: string): Promise<Tag | null> {
	try {
		const tagDoc = await getDoc(doc(db, 'tags', tagId));

		if (!tagDoc.exists()) {
			return null;
		}

		return { id: tagDoc.id, ...tagDoc.data() } as Tag;
	} catch (error) {
		console.error('Error fetching tag:', error);
		return null;
	}
}

/**
 * Populate tag details for an array of tag IDs
 * @param tagIds - Array of tag IDs to populate
 * @returns Promise that resolves with array of populated tags
 */
export async function populateTags(tagIds: string[]): Promise<Tag[]> {
	if (!tagIds || tagIds.length === 0) {
		return [];
	}

	const tagPromises = tagIds.map((id) => getTagById(id));
	const tags = await Promise.all(tagPromises);

	// Filter out null values (tags that couldn't be found)
	return tags.filter((tag): tag is Tag => tag !== null);
}

/**
 * Convert RecipeSummary to RecipeSummaryWithTags by fetching tag details
 * @param recipe - Recipe summary with tag IDs
 * @returns Promise that resolves with recipe summary with populated tags
 */
export async function populateRecipeSummaryTags(
	recipe: RecipeSummary
): Promise<RecipeSummaryWithTags> {
	const tags = await populateTags(recipe.tagIds || []);
	const { tagIds, ...rest } = recipe;

	return {
		...rest,
		tags
	};
}

/**
 * Convert Recipe to RecipeWithTags by fetching tag details
 * @param recipe - Full recipe with tag IDs
 * @returns Promise that resolves with recipe with populated tags
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
 * Create a new tag in Firestore
 * @param tagData - Tag data (name, color)
 * @param userId - The user ID who owns the tag
 * @returns Promise that resolves with the created tag with ID
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
