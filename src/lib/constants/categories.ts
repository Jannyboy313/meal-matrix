/**
 * Recipe categories
 *
 * A closed set defined here in code, not in Firestore. The constants own three things that
 * gain nothing from living in the database: the closed set itself (validation), the colour
 * mapping, and the options offered by the picker.
 *
 * What a recipe stores is `{ key, name }` — see StoredCategory below. The key is the stable
 * identifier the app reads; the name is denormalised alongside it so that the raw Firestore
 * JSON is readable on its own, without this file next to it.
 *
 * On the duplicated Dutch string: `name` here and `recipe.categories.*` in the nl locale hold
 * the same words. That is deliberate and it is the price of wanting both an i18n-driven UI and
 * a locale-independent export contract. `nameKey` wins for display, `name` wins for what gets
 * written to Firestore. Keep the two in sync when renaming a category.
 */

import type { PaletteToken } from './palette';

export type CategoryKey = 'starter' | 'main' | 'dessert' | 'bread' | 'baking';

export interface Category {
	/** Stable identifier; this is what the app reads and compares */
	key: CategoryKey;
	/** Canonical Dutch name, written to Firestore so the export reads on its own */
	name: string;
	/** i18n key, resolved with $t at the point of display */
	nameKey: string;
	/** Fixed color, referenced by palette token rather than by hex */
	color: PaletteToken;
}

/**
 * The category as stored on a recipe document.
 *
 * `key` is typed loosely on purpose: Firestore can hold anything, including a key from a
 * category that has since been removed, so it is validated on read rather than trusted.
 * `name` is a snapshot for external consumers — the app never reads it.
 */
export interface StoredCategory {
	key: string;
	name: string;
}

export const CATEGORIES: readonly Category[] = [
	{
		key: 'starter',
		name: 'Voorgerecht',
		nameKey: 'recipe.categories.starter',
		color: 'geel'
	},
	{
		key: 'main',
		name: 'Hoofdgerecht',
		nameKey: 'recipe.categories.main',
		color: 'limoen'
	},
	{
		key: 'dessert',
		name: 'Dessert',
		nameKey: 'recipe.categories.dessert',
		color: 'bes'
	},
	{
		key: 'bread',
		name: 'Brood',
		nameKey: 'recipe.categories.bread',
		color: 'violet'
	},
	{
		key: 'baking',
		name: 'Bakken',
		nameKey: 'recipe.categories.baking',
		color: 'kaneel'
	}
] as const;

/**
 * Resolve a category by its stored key.
 *
 * Returns undefined for a key that matches nothing — a recipe carrying a category that was
 * removed, or a typo from a migration, must still open. Every caller renders without a
 * category rather than throwing.
 */
export function getCategoryByKey(key: string | undefined): Category | undefined {
	if (!key) return undefined;
	return CATEGORIES.find((category) => category.key === key);
}

/**
 * Build the document field for a recipe, denormalising the name alongside the key.
 * Writing goes through here so the export field is produced in exactly one place.
 */
export function toStoredCategory(key: string): StoredCategory | undefined {
	const category = getCategoryByKey(key);
	if (!category) return undefined;

	return { key: category.key, name: category.name };
}
