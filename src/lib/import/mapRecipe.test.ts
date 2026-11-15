import { describe, expect, it } from 'vitest';
import { cleanText, flattenInstructions, mapRecipe, parseDuration, parseYield, splitIngredient } from './mapRecipe';

describe('cleanText', () => {
	it('strips tags, decodes entities and collapses whitespace', () => {
		expect(cleanText('<b>Crème</b>&nbsp;br&ucirc;l&eacute;e &amp; &#39;meer&#x27;\n')).toBe("Crème br&ucirc;l&eacute;e & 'meer'");
	});

	it('returns an empty string for non-strings', () => {
		expect(cleanText(undefined)).toBe('');
		expect(cleanText(42)).toBe('');
	});
});

describe('parseDuration', () => {
	it.each([
		['PT15M', '15 min'],
		['PT1H', '1 u'],
		['PT1H30M', '1 u 30 min'],
		['PT90M', '1 u 30 min'],
		['P1DT2H', '26 u'],
		['pt20m', '20 min']
	])('%s → %s', (input, expected) => {
		expect(parseDuration(input)).toBe(expected);
	});

	it.each([['PT0M'], ['30 minutes'], [''], [undefined], ['P']])('%s → empty', (input) => {
		expect(parseDuration(input)).toBe('');
	});
});

describe('parseYield', () => {
	it.each([
		['4 personen', 4],
		[6, 6],
		[['2', '2 servings'], 2],
		['Serves 8-10', 8]
	])('%s → %s', (input, expected) => {
		expect(parseYield(input)).toBe(expected);
	});

	it('falls back to 4', () => {
		expect(parseYield(undefined)).toBe(4);
		expect(parseYield('een paar')).toBe(4);
		expect(parseYield('0')).toBe(4);
	});
});

describe('splitIngredient', () => {
	it.each([
		['200 g bloem', '200 g', 'bloem'],
		['200g bloem', '200g', 'bloem'],
		['200 gram bloem', '200 gram', 'bloem'],
		['1,5 l melk', '1,5 l', 'melk'],
		['1/2 tl zout', '1/2 tl', 'zout'],
		['½ ui', '½', 'ui'],
		['2-3 teentjes knoflook', '2-3 teentjes', 'knoflook'],
		['2 à 3 el olijfolie', '2 à 3 el', 'olijfolie'],
		['3 eieren', '3', 'eieren'],
		['2 limoenen', '2', 'limoenen'],
		['1 tbsp. soy sauce', '1 tbsp.', 'soy sauce']
	])('%s → [%s] [%s]', (line, amount, name) => {
		expect(splitIngredient(line)).toEqual({ amount, name });
	});

	it('leaves the amount empty without a leading quantity', () => {
		expect(splitIngredient('zout en peper')).toEqual({ amount: '', name: 'zout en peper' });
		expect(splitIngredient('snufje zout')).toEqual({ amount: '', name: 'snufje zout' });
	});
});

describe('flattenInstructions', () => {
	it('splits a single string on newlines and HTML breaks', () => {
		expect(flattenInstructions('Snijd de ui.\n\nBak de ui.<br>Serveer.')).toEqual(['Snijd de ui.', 'Bak de ui.', 'Serveer.']);
	});

	it('reads string arrays and HowToStep objects', () => {
		expect(flattenInstructions(['Stap een', { '@type': 'HowToStep', text: '<p>Stap twee</p>' }, { name: 'Stap drie' }])).toEqual([
			'Stap een',
			'Stap twee',
			'Stap drie'
		]);
	});

	it('flattens HowToSections and drops their names', () => {
		const sections = [
			{ '@type': 'HowToSection', name: 'Deeg', itemListElement: [{ '@type': 'HowToStep', text: 'Kneed' }] },
			{ '@type': 'HowToSection', name: 'Vulling', itemListElement: [{ '@type': 'HowToStep', text: 'Roer' }] }
		];
		expect(flattenInstructions(sections)).toEqual(['Kneed', 'Roer']);
	});

	it('drops empty steps and ignores unknown shapes', () => {
		expect(flattenInstructions([{ text: '  ' }, 5, null])).toEqual([]);
		expect(flattenInstructions(undefined)).toEqual([]);
	});
});

describe('mapRecipe', () => {
	it('maps a full Recipe node', () => {
		const result = mapRecipe({
			'@type': 'Recipe',
			name: 'Pasta &amp; pesto',
			description: '<p>Snel klaar</p>',
			image: [{ '@type': 'ImageObject', url: 'https://example.com/a.jpg' }, 'https://example.com/b.jpg'],
			prepTime: 'PT10M',
			cookTime: 'PT15M',
			recipeYield: '2 personen',
			recipeIngredient: ['250 g pasta', 'basilicum', 42, ''],
			recipeInstructions: [{ '@type': 'HowToStep', text: 'Kook de pasta.' }]
		});

		expect(result).toEqual({
			title: 'Pasta & pesto',
			description: 'Snel klaar',
			image: 'https://example.com/a.jpg',
			prepTime: '10 min',
			cookTime: '15 min',
			servings: 2,
			ingredients: [
				{ amount: '250 g', name: 'pasta' },
				{ amount: '', name: 'basilicum' }
			],
			steps: ['Kook de pasta.']
		});
	});

	it('returns empty fields for a bare node', () => {
		expect(mapRecipe({ '@type': 'Recipe' })).toEqual({
			title: '',
			description: '',
			image: '',
			prepTime: '',
			cookTime: '',
			servings: 4,
			ingredients: [],
			steps: []
		});
	});
});
