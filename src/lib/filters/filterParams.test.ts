import { describe, expect, it } from 'vitest';
import { parseFilterParams, slugify, toSearchString } from './filterParams';
import { EMPTY_FILTER, type RecipeFilter } from './recipeFilter';

describe('slugify', () => {
	it('lowercases and trims', () => {
		expect(slugify('  Vega  ')).toBe('vega');
	});

	it('collapses whitespace to a single hyphen', () => {
		expect(slugify('Zonder   gluten')).toBe('zonder-gluten');
	});

	it('strips diacritics rather than dropping the letter', () => {
		expect(slugify('Crème brûlée')).toBe('creme-brulee');
	});

	it('drops characters that are neither letters, digits nor hyphens', () => {
		expect(slugify('Snel & simpel!')).toBe('snel-simpel');
	});

	it('returns an empty string for a name with nothing sluggable in it', () => {
		expect(slugify('!!!')).toBe('');
	});
});

describe('parseFilterParams', () => {
	function parse(search: string): RecipeFilter {
		return parseFilterParams(new URLSearchParams(search));
	}

	it('returns the empty filter for an empty query string', () => {
		expect(parse('')).toEqual(EMPTY_FILTER);
	});

	it('reads all three parameters', () => {
		expect(parse('q=pasta&category=main,bread&label=vega,surinaams')).toEqual({
			query: 'pasta',
			categoryKeys: ['main', 'bread'],
			labelSlugs: ['vega', 'surinaams']
		});
	});

	it('tolerates empty segments, stray whitespace and duplicates', () => {
		expect(parse('category=main,, bread ,main')).toEqual({
			query: '',
			categoryKeys: ['main', 'bread'],
			labelSlugs: []
		});
	});

	it('drops a category key that is not in the closed set', () => {
		expect(parse('category=main,pudding').categoryKeys).toEqual(['main']);
	});

	it('keeps a label slug that matches nothing, because it cannot be validated', () => {
		expect(parse('label=nietbestaand').labelSlugs).toEqual(['nietbestaand']);
	});

	it('re-slugs label values so a hand-typed URL still matches', () => {
		expect(parse('label=VEGA').labelSlugs).toEqual(['vega']);
	});
});

describe('toSearchString', () => {
	it('returns an empty string for the empty filter, so a clean overview has a clean URL', () => {
		expect(toSearchString(EMPTY_FILTER)).toBe('');
	});

	it('omits the groups that are empty', () => {
		expect(toSearchString({ query: 'pasta', categoryKeys: [], labelSlugs: [] })).toBe('?q=pasta');
	});

	it('leaves the comma separators unencoded, so the URL stays readable', () => {
		expect(toSearchString({ query: '', categoryKeys: ['main', 'bread'], labelSlugs: [] })).toBe(
			'?category=main,bread'
		);
	});

	it('round-trips through parseFilterParams', () => {
		const filter: RecipeFilter = {
			query: 'zomerse salade',
			categoryKeys: ['main', 'bread'],
			labelSlugs: ['vega', 'surinaams']
		};

		expect(parseFilterParams(new URLSearchParams(toSearchString(filter)))).toEqual(filter);
	});
});
