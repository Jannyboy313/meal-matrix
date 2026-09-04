/**
 * Recipe categories
 *
 * A closed set defined here in code, not in Firestore. A recipe stores only the `id`, so a
 * display name can change without touching data and the set cannot drift per user.
 *
 * The UUIDs below are the contract with the data migration. They must not change once the
 * migration has run.
 */

import type { PaletteToken } from './palette';

export type CategoryKey = 'starter' | 'main' | 'dessert' | 'bread' | 'baking';

export interface Category {
	/** Stable UUID; the only part of a category that reaches Firestore */
	id: string;
	/** For referring to a category from code */
	key: CategoryKey;
	/** i18n key, resolved with $t at the point of display */
	nameKey: string;
	/** Fixed color, referenced by palette token rather than by hex */
	color: PaletteToken;
}

export const CATEGORIES: readonly Category[] = [
	{
		id: 'b7c9e1a4-3f52-4d8e-9a16-2c5d7e8f0b31',
		key: 'starter',
		nameKey: 'recipe.categories.starter',
		color: 'geel'
	},
	{
		id: 'd4e2f8a1-6b39-4c7e-8f52-1a9d3c6b4e78',
		key: 'main',
		nameKey: 'recipe.categories.main',
		color: 'limoen'
	},
	{
		id: 'f1a3c5e7-9d24-4b6f-a83c-5e7f1b9d2a46',
		key: 'dessert',
		nameKey: 'recipe.categories.dessert',
		color: 'bes'
	},
	{
		id: 'a9d7b3f5-2e18-4c6a-b47d-8f3e1c5a9b62',
		key: 'bread',
		nameKey: 'recipe.categories.bread',
		color: 'violet'
	},
	{
		id: '4d90571e-df59-4820-89a7-e6b1cc2c3e64',
		key: 'baking',
		nameKey: 'recipe.categories.baking',
		color: 'kaneel'
	}
] as const;

/**
 * Resolve a category by its stored id.
 *
 * Returns undefined for an id that matches nothing — a recipe whose category was mistyped
 * during migration must still open, so every caller renders without a category rather than
 * throwing.
 */
export function getCategoryById(id: string | undefined): Category | undefined {
	if (!id) return undefined;
	return CATEGORIES.find((category) => category.id === id);
}
