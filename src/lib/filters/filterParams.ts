/**
 * The filter as it travels through the URL.
 *
 * Categories are a closed set defined in code, so an unknown key is dropped on parse. Labels
 * are open-ended and user-created, so an unknown slug is deliberately kept: it yields an empty
 * result, which is an honest answer to a shared link, rather than silently discarding a filter
 * the user can read in their own address bar. See the spec for why sanitising was rejected.
 */

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
