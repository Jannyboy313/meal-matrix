import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractRecipeNode } from '$lib/import/extractRecipeNode';
import { mapRecipe } from '$lib/import/mapRecipe';
import { fetchRecipePage, ImportError, parseImportUrl, type ImportErrorCode } from '$lib/server/fetchRecipePage';
import { verifyIdToken } from '$lib/server/verifyIdToken';

const STATUS: Record<ImportErrorCode, number> = {
	invalid_url: 400,
	unauthorized: 401,
	no_recipe: 422,
	unreachable: 502
};

/** POST { url } → ImportedRecipe, or { code } with the matching status. The client translates the code. */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
		if (!(await verifyIdToken(token))) throw new ImportError('unauthorized');

		const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
		const url = parseImportUrl(body?.url);

		const node = extractRecipeNode(await fetchRecipePage(url));
		if (!node) throw new ImportError('no_recipe');

		const recipe = mapRecipe(node);
		if (!recipe.title && recipe.ingredients.length === 0 && recipe.steps.length === 0) throw new ImportError('no_recipe');

		return json(recipe);
	} catch (error) {
		if (error instanceof ImportError) return json({ code: error.code }, { status: STATUS[error.code] });
		console.error('Recipe import failed:', error);
		return json({ code: 'unreachable' }, { status: 502 });
	}
};
