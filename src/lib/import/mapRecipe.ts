/**
 * Maps a schema.org Recipe node to the fields the recipe form can be pre-filled with.
 * Every field is best effort: anything unparsable comes back empty so the form's own
 * validation points the user at it.
 */

import type { ImportedRecipe, Ingredient } from '$lib/types';
import type { JsonLdNode } from './extractRecipeNode';

const DEFAULT_SERVINGS = 4;
const MAX_SERVINGS = 100;

// The entities recipe sites actually emit; a full HTML5 table (2000+ names) is not worth it.
const ENTITIES: Record<string, string> = {
	amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
	lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…',
	deg: '°', times: '×', frac12: '½', frac14: '¼', frac34: '¾',
	aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
	iacute: 'í', icirc: 'î', iuml: 'ï', oacute: 'ó', ocirc: 'ô', ouml: 'ö', uacute: 'ú', ucirc: 'û',
	uuml: 'ü', ccedil: 'ç', ntilde: 'ñ', szlig: 'ß'
};

function decodeCodePoint(match: string, point: number): string {
	return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
}

/** Strips tags, decodes the common HTML entities and collapses whitespace. */
export function cleanText(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value
		.replace(/<[^<>]*>/g, ' ') // [^<>] not [^>]: a run of '<' without '>' would backtrack quadratically
		.replace(/&(#x[0-9a-f]{1,8}|#\d{1,8}|[a-z0-9]+);/gi, (match, code: string) => {
			if (code[0] === '#') {
				const hex = code[1].toLowerCase() === 'x';
				return decodeCodePoint(match, parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
			}
			return ENTITIES[code.toLowerCase()] ?? match;
		})
		.replace(/\s+/g, ' ')
		.trim();
}

/** ISO 8601 duration (`PT1H30M`) to the form's free-text style (`1 u 30 min`). */
export function parseDuration(value: unknown): string {
	if (typeof value !== 'string') return '';
	const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+(?:\.\d+)?S)?)?$/i.exec(value.trim());
	if (!match) return '';
	const [, days, hours, minutes] = match;
	const totalMinutes = Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0);
	if (totalMinutes === 0) return '';
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	return [h ? `${h} u` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

/** First positive integer in `recipeYield` (`"4 personen"`, `4`, `["4", "4 servings"]`). */
export function parseYield(value: unknown): number {
	const first = Array.isArray(value) ? value[0] : value;
	const match = /\d+/.exec(String(first ?? ''));
	const servings = match ? parseInt(match[0], 10) : 0;
	return servings > 0 && servings <= MAX_SERVINGS ? servings : DEFAULT_SERVINGS;
}

const FRACTION = '[½⅓⅔¼¾⅛]';
// Mixed numbers (`1 1/2`, `1½`) come first, or the regex would stop after the whole part.
const NUMBER = String.raw`(?:\d+\s+\d+\s*\/\s*\d+|\d+\s*${FRACTION}|\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|${FRACTION})`;
const QUANTITY = String.raw`${NUMBER}(?:\s*(?:-|–|à|tot)\s*${NUMBER})?`;
const UNIT = String.raw`(?:kg|g|gr|gram|mg|ml|cl|dl|l|liter|el|tl|eetlepels?|theelepels?|snufje|snuf|teentjes?|teen|stuks?|blikjes?|blik|zakjes?|bosjes?|bos|takjes?|plakjes?|cups?|tbsp|tsp|oz|lb)\.?`;
const INGREDIENT = new RegExp(String.raw`^(${QUANTITY}(?:\s*${UNIT}(?=\s|$))?)\s+(.+)$`, 'i');

/**
 * Splits `"200 g bloem"` into amount and name. Without a leading quantity the amount stays
 * empty, which the form's ingredient validation then flags for the user to fill in.
 */
export function splitIngredient(line: string): Ingredient {
	const text = cleanText(line);
	const match = INGREDIENT.exec(text);
	return match ? { amount: match[1].replace(/\s+/g, ' '), name: match[2] } : { amount: '', name: text };
}

/** Flattens every `recipeInstructions` shape sites use into a list of step texts. */
export function flattenInstructions(value: unknown): string[] {
	if (typeof value === 'string') {
		return value
			.split(/\r?\n|<br\s*\/?>|<\/p>|<\/li>/i)
			.map(cleanText)
			.filter(Boolean);
	}
	if (Array.isArray(value)) return value.flatMap(flattenInstructions);
	if (value && typeof value === 'object') {
		const node = value as JsonLdNode;
		if ('itemListElement' in node) return flattenInstructions(node.itemListElement); // HowToSection
		const text = cleanText(node.text ?? node.name);
		return text ? [text] : [];
	}
	return [];
}

function firstImageUrl(value: unknown): string {
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return firstImageUrl(value[0]);
	if (value && typeof value === 'object') return firstImageUrl((value as JsonLdNode).url);
	return '';
}

export function mapRecipe(node: JsonLdNode): ImportedRecipe {
	const ingredients = Array.isArray(node.recipeIngredient)
		? node.recipeIngredient.filter((line): line is string => typeof line === 'string').map(splitIngredient)
		: [];

	return {
		title: cleanText(node.name),
		description: cleanText(node.description),
		image: firstImageUrl(node.image),
		prepTime: parseDuration(node.prepTime),
		cookTime: parseDuration(node.cookTime),
		servings: parseYield(node.recipeYield),
		ingredients: ingredients.filter((ingredient) => ingredient.name),
		steps: flattenInstructions(node.recipeInstructions)
	};
}
