/**
 * Recipe filtering for the overview.
 *
 * Pure by design: no Svelte, no Firestore, no i18n. The free-text search deliberately does not
 * match the category name — categories have their own visible control now, and matching them
 * in the text box too would keep the invisible filter this work exists to remove. That also
 * keeps this module free of any dependency on the translation layer.
 */

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
