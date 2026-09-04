/**
 * Label Service
 * Handles all label-related Firestore operations following Single Responsibility Principle
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
import type { Label } from '$lib/types';

/**
 * Fetch all labels from Firestore (global and user-specific)
 * @param userId - Optional user ID to include user-specific labels
 * @returns Promise that resolves with array of labels
 */
export async function getAllLabels(userId?: string): Promise<Label[]> {
	try {
		const labelsRef = collection(db, 'labels');

		if (userId) {
			// Fetch global labels and user's labels
			const globalQuery = query(labelsRef, where('isGlobal', '==', true));
			const userQuery = query(labelsRef, where('userId', '==', userId));

			const [globalSnapshot, userSnapshot] = await Promise.all([
				getDocs(globalQuery),
				getDocs(userQuery)
			]);

			const labels: Label[] = [
				...globalSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Label)),
				...userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Label))
			];

			return labels;
		} else {
			// Only fetch global labels
			const globalQuery = query(labelsRef, where('isGlobal', '==', true));
			const snapshot = await getDocs(globalQuery);

			return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Label));
		}
	} catch (error) {
		console.error('Error fetching labels:', error);
		return [];
	}
}

/**
 * Fetch a single label by ID from Firestore
 * @param labelId - The label ID to fetch
 * @returns Promise that resolves with the label or null if not found
 */
export async function getLabelById(labelId: string): Promise<Label | null> {
	try {
		const labelDoc = await getDoc(doc(db, 'labels', labelId));

		if (!labelDoc.exists()) {
			return null;
		}

		return { id: labelDoc.id, ...labelDoc.data() } as Label;
	} catch (error) {
		console.error('Error fetching label:', error);
		return null;
	}
}

/**
 * Populate label details for an array of label IDs
 * @param labelIds - Array of label IDs to populate
 * @returns Promise that resolves with array of populated labels
 */
export async function populateLabels(labelIds: string[]): Promise<Label[]> {
	if (!labelIds || labelIds.length === 0) {
		return [];
	}

	const labelPromises = labelIds.map((id) => getLabelById(id));
	const labels = await Promise.all(labelPromises);

	// Filter out null values (labels that couldn't be found)
	return labels.filter((label): label is Label => label !== null);
}

/**
 * Create a new label in Firestore
 * @param labelData - Label data (name, color)
 * @param userId - The user ID who owns the label
 * @returns Promise that resolves with the created label with ID
 */
export async function createLabel(
	labelData: { name: string; color: string },
	userId: string
): Promise<Label> {
	try {
		const docRef = await addDoc(collection(db, 'labels'), {
			name: labelData.name,
			color: labelData.color,
			userId,
			isGlobal: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		return {
			id: docRef.id,
			name: labelData.name,
			color: labelData.color,
			userId,
			isGlobal: false
		};
	} catch (error) {
		console.error('Error creating label:', error);
		throw error;
	}
}
