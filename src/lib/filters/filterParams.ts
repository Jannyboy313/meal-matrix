/**
 * The filter as it travels through the URL.
 *
 * Categories are a closed set defined in code, so an unknown key is dropped on parse. Labels
 * are open-ended and user-created, so an unknown slug is deliberately kept: it yields an empty
 * result, which is an honest answer to a shared link, rather than silently discarding a filter
 * the user can read in their own address bar. See the spec for why sanitising was rejected.
 */

import { CATEGORIES } from '$lib/constants/categories';
import type { RecipeFilter } from './recipeFilter';

const QUERY_PARAM = 'q';
const CATEGORY_PARAM = 'category';
const LABEL_PARAM = 'label';

const VALID_CATEGORY_KEYS: ReadonlySet<string> = new Set(CATEGORIES.map((category) => category.key));

/**
 * Turn a label name into the token used in the URL and in matching.
 *
 * "Zonder gluten" -> "zonder-gluten", "Crème brûlée" -> "creme-brulee".
 *
 * Diacritics are stripped rather than dropped, so "crème" and "creme" reach the same slug.
 * Two labels that slugify to the same value therefore behave as one filter term, which is
 * what a user typing either spelling expects.
 */
export function slugify(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Split a comma-separated parameter, discarding empties and duplicates.
 *
 * Forgiving on purpose: the query string is user-editable, so "main,, bread ,main" has to mean
 * the same thing as "main,bread".
 */
function parseList(raw: string | null): string[] {
	if (!raw) return [];

	const values = new Set<string>();
	for (const part of raw.split(',')) {
		const value = part.trim();
		if (value) values.add(value);
	}

	return [...values];
}

/** Read the filter out of a query string. Never throws; unreadable input yields no constraint. */
export function parseFilterParams(params: URLSearchParams): RecipeFilter {
	return {
		query: params.get(QUERY_PARAM)?.trim() ?? '',
		categoryKeys: parseList(params.get(CATEGORY_PARAM)).filter((key) =>
			VALID_CATEGORY_KEYS.has(key)
		),
		labelSlugs: parseList(params.get(LABEL_PARAM)).map(slugify).filter(Boolean)
	};
}

/**
 * Encode the values but leave the comma separators alone.
 *
 * URLSearchParams would write "main%2Cbread". A comma is a legal sub-delimiter in a query
 * string, and this URL is meant to be read and shared, so it is kept literal.
 */
function encodeList(values: string[]): string {
	return values.map(encodeURIComponent).join(',');
}

/** Serialise the filter. Returns "" for the empty filter, so a clean overview has a clean URL. */
export function toSearchString(filter: RecipeFilter): string {
	const parts: string[] = [];

	const query = filter.query.trim();
	if (query) parts.push(`${QUERY_PARAM}=${encodeURIComponent(query)}`);
	if (filter.categoryKeys.length > 0) {
		parts.push(`${CATEGORY_PARAM}=${encodeList(filter.categoryKeys)}`);
	}
	if (filter.labelSlugs.length > 0) {
		parts.push(`${LABEL_PARAM}=${encodeList(filter.labelSlugs)}`);
	}

	return parts.length > 0 ? `?${parts.join('&')}` : '';
}
