import { describe, expect, it } from 'vitest';
import { slugify } from './filterParams';

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
