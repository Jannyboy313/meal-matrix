import { describe, expect, it } from 'vitest';
import { extractRecipeNode } from './extractRecipeNode';

function page(...blocks: string[]): string {
	return `<html><head>${blocks.map((b) => `<script type="application/ld+json">${b}</script>`).join('')}</head></html>`;
}

describe('extractRecipeNode', () => {
	it('finds a top-level Recipe', () => {
		expect(extractRecipeNode(page('{"@type":"Recipe","name":"Pannenkoeken"}'))?.name).toBe('Pannenkoeken');
	});

	it('finds a Recipe inside @graph', () => {
		const html = page('{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"Soep"}]}');
		expect(extractRecipeNode(html)?.name).toBe('Soep');
	});

	it('finds a Recipe in a top-level array', () => {
		expect(extractRecipeNode(page('[{"@type":"Organization"},{"@type":"Recipe","name":"Taart"}]'))?.name).toBe('Taart');
	});

	it('accepts @type as an array', () => {
		expect(extractRecipeNode(page('{"@type":["Recipe","NewsArticle"],"name":"Brood"}'))?.name).toBe('Brood');
	});

	it('skips a broken block and reads the next one', () => {
		expect(extractRecipeNode(page('{broken', '{"@type":"Recipe","name":"Stamppot"}'))?.name).toBe('Stamppot');
	});

	it('matches the script tag with extra attributes and unquoted type', () => {
		const html = '<script id="x" type=application/ld+json class="y">{"@type":"Recipe","name":"Hutspot"}</script>';
		expect(extractRecipeNode(html)?.name).toBe('Hutspot');
	});

	it('returns undefined when there is no Recipe', () => {
		expect(extractRecipeNode(page('{"@type":"Article"}'))).toBeUndefined();
		expect(extractRecipeNode('<html></html>')).toBeUndefined();
	});
});
