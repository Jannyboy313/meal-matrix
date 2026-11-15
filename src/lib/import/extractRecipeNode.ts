/**
 * Finds the schema.org Recipe node in a page's JSON-LD blocks.
 * Sites embed it for search-engine rich results, so it is the one structured source that
 * works across recipe sites without per-site scraping.
 */

export type JsonLdNode = Record<string, unknown>;

const JSON_LD_BLOCK = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;

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
	for (const [, body] of html.matchAll(JSON_LD_BLOCK)) {
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
