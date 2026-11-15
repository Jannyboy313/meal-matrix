/**
 * Finds the schema.org Recipe node in a page's JSON-LD blocks.
 * Sites embed it for search-engine rich results, so it is the one structured source that
 * works across recipe sites without per-site scraping.
 */

export type JsonLdNode = Record<string, unknown>;

/**
 * Linear scan with indexOf: a regex over untrusted HTML (up to 3 MB) backtracks
 * quadratically on inputs like thousands of `<script ` without a closing `>`.
 */
function* jsonLdBlocks(html: string): Generator<string> {
	const lower = html.toLowerCase();
	let from = 0;
	for (;;) {
		const open = lower.indexOf('<script', from);
		if (open === -1) return;
		const tagEnd = lower.indexOf('>', open);
		if (tagEnd === -1) return;
		const close = lower.indexOf('</script', tagEnd);
		if (close === -1) return;
		if (lower.slice(open, tagEnd).includes('application/ld+json')) yield html.slice(tagEnd + 1, close);
		from = close + 1;
	}
}

function isRecipe(node: JsonLdNode): boolean {
	const type = node['@type'];
	return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function findRecipe(value: unknown): JsonLdNode | undefined {
	if (Array.isArray(value)) {
		for (const item of value) {
			const found = findRecipe(item);
			if (found) return found;
		}
		return undefined;
	}
	if (value && typeof value === 'object') {
		const node = value as JsonLdNode;
		if (isRecipe(node)) return node;
		if ('@graph' in node) return findRecipe(node['@graph']);
	}
	return undefined;
}

export function extractRecipeNode(html: string): JsonLdNode | undefined {
	for (const body of jsonLdBlocks(html)) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(body);
		} catch {
			continue; // One broken block must not hide a valid Recipe in the next one
		}
		const recipe = findRecipe(parsed);
		if (recipe) return recipe;
	}
	return undefined;
}
