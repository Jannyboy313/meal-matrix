import { describe, expect, it } from 'vitest';
import { getCategoryByKey } from '$lib/constants/categories';
import type { Label, RecipeSummaryWithLabels } from '$lib/types';
import { activeFilterCount, filterRecipes, isFilterActive, type RecipeFilter } from './recipeFilter';

function label(name: string): Label {
	return { id: name, name };
}

function recipe(overrides: Partial<RecipeSummaryWithLabels> = {}): RecipeSummaryWithLabels {
	return {
		id: 'r1',
		title: 'Spaghetti Carbonara',
		description: 'A Roman classic',
		image: '',
		category: getCategoryByKey('main'),
		labels: [],
		...overrides
	};
}

function filter(overrides: Partial<RecipeFilter> = {}): RecipeFilter {
	return { query: '', categoryKeys: [], labelSlugs: [], ...overrides };
}

const carbonara = recipe({
	id: 'carbonara',
	title: 'Spaghetti Carbonara',
	description: 'A Roman classic',
	category: getCategoryByKey('main'),
	labels: [label('Vlees')]
});

const roti = recipe({
	id: 'roti',
	title: 'Roti',
	description: 'With green beans',
	category: getCategoryByKey('main'),
	labels: [label('Vega'), label('Surinaams')]
});

const sourdough = recipe({
	id: 'sourdough',
	title: 'Sourdough',
	description: 'Slow proofed',
	category: getCategoryByKey('bread'),
	labels: [label('Vega')]
});

const all = [carbonara, roti, sourdough];

function ids(recipes: RecipeSummaryWithLabels[]): string[] {
	return recipes.map((r) => r.id);
}

describe('filterRecipes', () => {
	it('returns every recipe for the empty filter', () => {
		expect(ids(filterRecipes(all, filter()))).toEqual(['carbonara', 'roti', 'sourdough']);
	});

	it('matches the query against the title, case-insensitively', () => {
		expect(ids(filterRecipes(all, filter({ query: 'ROTI' })))).toEqual(['roti']);
	});

	it('matches the query against the description', () => {
		expect(ids(filterRecipes(all, filter({ query: 'proofed' })))).toEqual(['sourdough']);
	});

	it('matches the query against a label name', () => {
		expect(ids(filterRecipes(all, filter({ query: 'surinaams' })))).toEqual(['roti']);
	});

	it('combines several categories as OR', () => {
		expect(ids(filterRecipes(all, filter({ categoryKeys: ['bread'] })))).toEqual(['sourdough']);
		expect(ids(filterRecipes(all, filter({ categoryKeys: ['main', 'bread'] })))).toEqual([
			'carbonara',
			'roti',
			'sourdough'
		]);
	});

	it('combines several labels as AND', () => {
		expect(ids(filterRecipes(all, filter({ labelSlugs: ['vega'] })))).toEqual([
			'roti',
			'sourdough'
		]);
		expect(ids(filterRecipes(all, filter({ labelSlugs: ['vega', 'surinaams'] })))).toEqual([
			'roti'
		]);
	});

	it('combines the three groups as AND', () => {
		const result = filterRecipes(
			all,
			filter({ query: 'green', categoryKeys: ['main'], labelSlugs: ['vega'] })
		);

		expect(ids(result)).toEqual(['roti']);
	});

	it('returns nothing for a label slug that matches no recipe', () => {
		expect(filterRecipes(all, filter({ labelSlugs: ['glutenvrij'] }))).toEqual([]);
	});

	it('excludes a recipe whose category did not resolve, but only when a category is asked for', () => {
		const orphan = recipe({ id: 'orphan', category: undefined });

		expect(ids(filterRecipes([orphan], filter()))).toEqual(['orphan']);
		expect(filterRecipes([orphan], filter({ categoryKeys: ['main'] }))).toEqual([]);
	});

	it('excludes a recipe with no labels, but only when a label is asked for', () => {
		expect(ids(filterRecipes([carbonara], filter()))).toEqual(['carbonara']);
		expect(filterRecipes([carbonara], filter({ labelSlugs: ['vega'] }))).toEqual([]);
	});

	it('ignores a query that is only whitespace', () => {
		expect(ids(filterRecipes(all, filter({ query: '   ' })))).toEqual([
			'carbonara',
			'roti',
			'sourdough'
		]);
	});
});

describe('isFilterActive', () => {
	it('is false for the empty filter and for a whitespace-only query', () => {
		expect(isFilterActive(filter())).toBe(false);
		expect(isFilterActive(filter({ query: '  ' }))).toBe(false);
	});

	it('is true when any group constrains the result', () => {
		expect(isFilterActive(filter({ query: 'roti' }))).toBe(true);
		expect(isFilterActive(filter({ categoryKeys: ['main'] }))).toBe(true);
		expect(isFilterActive(filter({ labelSlugs: ['vega'] }))).toBe(true);
	});
});

describe('activeFilterCount', () => {
	it('counts the selected chips and ignores the free-text query', () => {
		expect(activeFilterCount(filter({ query: 'roti' }))).toBe(0);
		expect(activeFilterCount(filter({ categoryKeys: ['main'], labelSlugs: ['vega'] }))).toBe(2);
	});
});
