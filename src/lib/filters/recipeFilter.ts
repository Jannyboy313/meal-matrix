/**
 * Recipe filtering for the overview.
 *
 * Pure by design: no Svelte, no Firestore, no i18n. The free-text search deliberately does not
 * match the category name — categories have their own visible control now, and matching them
 * in the text box too would keep the invisible filter this work exists to remove. That also
 * keeps this module free of any dependency on the translation layer.
 */

import type { RecipeSummaryWithLabels } from '$lib/types';
import { slugify } from './filterParams';

export interface RecipeFilter {
	/** Free text; matched case-insensitively against title, description and label names */
	query: string;
	/** OR within the group. Empty means no constraint, not "match nothing" */
	categoryKeys: string[];
	/** AND within the group. Empty means no constraint. Slugs, not ids — see filterParams */
	labelSlugs: string[];
}

export const EMPTY_FILTER: RecipeFilter = {
	query: '',
	categoryKeys: [],
	labelSlugs: []
};

function matchesQuery(recipe: RecipeSummaryWithLabels, needle: string): boolean {
	if (!needle) return true;

	return (
		recipe.title.toLowerCase().includes(needle) ||
		(recipe.description?.toLowerCase().includes(needle) ?? false) ||
		(recipe.labels ?? []).some((label) => label.name.toLowerCase().includes(needle))
	);
}

/**
 * OR within the group. A recipe whose stored category key resolved to nothing has no category
 * to match, so it drops out — but only once a category is actually asked for.
 */
function matchesCategory(recipe: RecipeSummaryWithLabels, categoryKeys: string[]): boolean {
	if (categoryKeys.length === 0) return true;
	if (!recipe.category) return false;

	return categoryKeys.includes(recipe.category.key);
}

/** AND within the group: every selected label must be present on the recipe. */
function matchesLabels(recipe: RecipeSummaryWithLabels, labelSlugs: string[]): boolean {
	if (labelSlugs.length === 0) return true;

	const recipeSlugs = new Set((recipe.labels ?? []).map((label) => slugify(label.name)));

	return labelSlugs.every((slug) => recipeSlugs.has(slug));
}

/** The three groups combine as AND. */
export function filterRecipes(
	recipes: RecipeSummaryWithLabels[],
	filter: RecipeFilter
): RecipeSummaryWithLabels[] {
	const needle = filter.query.trim().toLowerCase();

	return recipes.filter(
		(recipe) =>
			matchesQuery(recipe, needle) &&
			matchesCategory(recipe, filter.categoryKeys) &&
			matchesLabels(recipe, filter.labelSlugs)
	);
}

/** True when any group constrains the result. Drives which empty-state message is shown. */
export function isFilterActive(filter: RecipeFilter): boolean {
	return (
		filter.query.trim() !== '' || filter.categoryKeys.length > 0 || filter.labelSlugs.length > 0
	);
}

/**
 * How many chips are selected, for the button badge. The free-text query is excluded: it is
 * already visible in the search bar, so counting it would double-report the same state.
 */
export function activeFilterCount(filter: RecipeFilter): number {
	return filter.categoryKeys.length + filter.labelSlugs.length;
}
