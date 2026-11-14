# Home filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the overview be filtered by category and label alongside the existing name search, with the whole filter state readable and shareable in the URL.

**Architecture:** Two pure modules hold all the logic — `recipeFilter.ts` decides what matches, `filterParams.ts` translates between the filter and the query string. Three new Svelte components render the interface, and none of them touch the router: `+page.svelte` owns every URL read and write, using SvelteKit's shallow-routing `replaceState` so no filter change re-runs `load` or creates a history entry.

**Tech Stack:** SvelteKit 2 with Svelte 5 runes, TypeScript, Tailwind CSS 4, sveltekit-i18n, Vitest (added by Task 1), lucide-svelte.

**Spec:** `docs/superpowers/specs/2026-09-18-home-filters-design.md`

---

## Before you start

Read the spec. It records *why* several of these decisions went the way they did — in particular why the chip border stays ink, why labels are matched by slug, and why unknown slugs are not sanitised away. Do not "improve" those without reading it.

Two conventions from `CLAUDE.md` that apply to every task:

- **All code, comments, commit messages and docs are in English.** Only the user-facing strings in `src/lib/i18n/locales/nl/` are Dutch.
- Tabs for indentation, single quotes, semicolons — match the surrounding files.

## File structure

**Create:**

| File | Responsibility |
| --- | --- |
| `src/lib/filters/recipeFilter.ts` | The `RecipeFilter` type and the matching rules. Pure — no Svelte, no Firestore, no i18n |
| `src/lib/filters/recipeFilter.test.ts` | Matching rules, including the empty-group and missing-data cases |
| `src/lib/filters/filterParams.ts` | `slugify`, plus `RecipeFilter` ↔ query string. Pure |
| `src/lib/filters/filterParams.test.ts` | Slugging, parsing tolerance, round-trip |
| `src/lib/components/FilterChip.svelte` | One toggleable chip. The only place chip styling lives after Task 10 |
| `src/lib/components/FilterButton.svelte` | The button next to the search bar, with its active-count badge |
| `src/lib/components/FilterSheet.svelte` | The bottom sheet. Presentational: values in, callbacks out, no navigation |

**Modify:**

| File | Change |
| --- | --- |
| `src/routes/+page.svelte` | Filter state, URL reads and writes, the search row, the empty state |
| `src/lib/i18n/locales/nl/recipe.json` | New `filters` block |
| `src/lib/i18n/locales/en/recipe.json` | Same block, English |
| `src/lib/components/recipe/CategoryPicker.svelte` | Onto `FilterChip` |
| `src/lib/components/recipe/LabelPicker.svelte` | Onto `FilterChip` |
| `package.json` | Vitest devDependency and scripts |
| `vite.config.ts` | Vitest `test` block |

---

### Task 1: Add Vitest

The project has no test runner. The filter and URL logic are the first code here with enough branching to regress silently, so they get one. Component tests stay out of scope — that would pull in `jsdom` and `@testing-library/svelte` for no return at this size.

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts:13` (the `defineConfig` object)

- [ ] **Step 1: Install Vitest**

```bash
yarn add --dev vitest@^3.2.4
```

- [ ] **Step 2: Add the test scripts to `package.json`**

In the `"scripts"` block, after `"setup:certs"`:

```json
		"setup:certs": "fish scripts/setup-certs.fish",
		"test": "vitest run",
		"test:watch": "vitest"
```

- [ ] **Step 3: Add the `test` block to `vite.config.ts`**

Add as a sibling of `plugins` and `server`, at the end of the `defineConfig` object:

```ts
	server: {
		https: hasMkcertCerts
			? {
					key: fs.readFileSync(keyPath),
					cert: fs.readFileSync(certPath)
				}
			: undefined
	},
	test: {
		// Only the pure modules under src/lib/filters are covered. Component tests would need
		// jsdom and a testing library, which is more setup than this codebase earns today.
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
```

- [ ] **Step 4: Verify the runner starts**

Run: `yarn test`

Expected: exit code 0 with `No test files found, exiting with code 0`. A stack trace here means the config is wrong; fix it before moving on.

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts yarn.lock
git commit -m "Added vitest for the pure filter modules" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `slugify`

Labels are matched and serialised by a slug of their name, never by their Firestore id. This function is the whole contract, so it gets pinned down first.

**Files:**
- Create: `src/lib/filters/filterParams.ts`
- Create: `src/lib/filters/filterParams.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/filters/filterParams.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test`

Expected: FAIL — `Failed to resolve import "./filterParams"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/filters/filterParams.ts`:

```ts
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
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/filters/filterParams.ts src/lib/filters/filterParams.test.ts
git commit -m "Added slugify for label filter tokens" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The `RecipeFilter` type and the URL contract

`RecipeFilter` is declared in `recipeFilter.ts` and imported here as a type only, so there is no runtime import cycle between the two modules.

**Files:**
- Create: `src/lib/filters/recipeFilter.ts` (type and `EMPTY_FILTER` only; the matching lands in Task 4)
- Modify: `src/lib/filters/filterParams.ts`
- Modify: `src/lib/filters/filterParams.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/filters/filterParams.test.ts`, and extend the import at the top of the file to `import { parseFilterParams, slugify, toSearchString } from './filterParams';`:

```ts
import { EMPTY_FILTER, type RecipeFilter } from './recipeFilter';

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test`

Expected: FAIL — `Failed to resolve import "./recipeFilter"`.

- [ ] **Step 3: Create the type module**

Create `src/lib/filters/recipeFilter.ts`:

```ts
/**
 * Recipe filtering for the overview.
 *
 * Pure by design: no Svelte, no Firestore, no i18n. The free-text search deliberately does not
 * match the category name — categories have their own visible control now, and matching them
 * in the text box too would keep the invisible filter this work exists to remove. That also
 * keeps this module free of any dependency on the translation layer.
 */

export interface RecipeFilter {
	/** Free text; matched case-insensitively against title, description and label names */
	query: string;
	/** OR within the group. Empty means no constraint, not "match nothing" */
	categoryKeys: string[];
	/** AND within the group. Empty means no constraint. Slugs, not ids — see filterParams */
	labelSlugs: string[];
}

export const EMPTY_FILTER: RecipeFilter = {
	query: '',
	categoryKeys: [],
	labelSlugs: []
};
```

- [ ] **Step 4: Add parsing and serialisation to `filterParams.ts`**

Add the imports at the top of `src/lib/filters/filterParams.ts`, below the file comment:

```ts
import { CATEGORIES } from '$lib/constants/categories';
import type { RecipeFilter } from './recipeFilter';

const QUERY_PARAM = 'q';
const CATEGORY_PARAM = 'category';
const LABEL_PARAM = 'label';

const VALID_CATEGORY_KEYS: ReadonlySet<string> = new Set(CATEGORIES.map((category) => category.key));
```

Then append below the existing `slugify` function:

```ts
/**
 * Split a comma-separated parameter, discarding empties and duplicates.
 *
 * Forgiving on purpose: the query string is user-editable, so "main,, bread ,main" has to mean
 * the same thing as "main,bread".
 */
function parseList(raw: string | null): string[] {
	if (!raw) return [];

	const values = new Set<string>();
	for (const part of raw.split(',')) {
		const value = part.trim();
		if (value) values.add(value);
	}

	return [...values];
}

/** Read the filter out of a query string. Never throws; unreadable input yields no constraint. */
export function parseFilterParams(params: URLSearchParams): RecipeFilter {
	return {
		query: params.get(QUERY_PARAM)?.trim() ?? '',
		categoryKeys: parseList(params.get(CATEGORY_PARAM)).filter((key) =>
			VALID_CATEGORY_KEYS.has(key)
		),
		labelSlugs: parseList(params.get(LABEL_PARAM)).map(slugify).filter(Boolean)
	};
}

/**
 * Encode the values but leave the comma separators alone.
 *
 * URLSearchParams would write "main%2Cbread". A comma is a legal sub-delimiter in a query
 * string, and this URL is meant to be read and shared, so it is kept literal.
 */
function encodeList(values: string[]): string {
	return values.map(encodeURIComponent).join(',');
}

/** Serialise the filter. Returns "" for the empty filter, so a clean overview has a clean URL. */
export function toSearchString(filter: RecipeFilter): string {
	const parts: string[] = [];

	const query = filter.query.trim();
	if (query) parts.push(`${QUERY_PARAM}=${encodeURIComponent(query)}`);
	if (filter.categoryKeys.length > 0) {
		parts.push(`${CATEGORY_PARAM}=${encodeList(filter.categoryKeys)}`);
	}
	if (filter.labelSlugs.length > 0) {
		parts.push(`${LABEL_PARAM}=${encodeList(filter.labelSlugs)}`);
	}

	return parts.length > 0 ? `?${parts.join('&')}` : '';
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test`

Expected: PASS, 15 tests.

If the round-trip test fails on `zomerse salade`, check that `encodeURIComponent` is applied to the query — it writes `%20`, which `URLSearchParams.get` decodes back to a space.

- [ ] **Step 6: Commit**

```bash
git add src/lib/filters/filterParams.ts src/lib/filters/filterParams.test.ts src/lib/filters/recipeFilter.ts
git commit -m "Added the URL contract for the overview filter" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The matching rules

**Files:**
- Modify: `src/lib/filters/recipeFilter.ts`
- Create: `src/lib/filters/recipeFilter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/filters/recipeFilter.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/lib/filters/recipeFilter.test.ts`

Expected: FAIL — the module exists but provides none of `filterRecipes`, `isFilterActive` or `activeFilterCount` yet.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/filters/recipeFilter.ts`:

```ts
import type { RecipeSummaryWithLabels } from '$lib/types';
import { slugify } from './filterParams';

function matchesQuery(recipe: RecipeSummaryWithLabels, needle: string): boolean {
	if (!needle) return true;

	return (
		recipe.title.toLowerCase().includes(needle) ||
		(recipe.description?.toLowerCase().includes(needle) ?? false) ||
		(recipe.labels ?? []).some((label) => label.name.toLowerCase().includes(needle))
	);
}

/**
 * OR within the group. A recipe whose stored category key resolved to nothing has no category
 * to match, so it drops out — but only once a category is actually asked for.
 */
function matchesCategory(recipe: RecipeSummaryWithLabels, categoryKeys: string[]): boolean {
	if (categoryKeys.length === 0) return true;
	if (!recipe.category) return false;

	return categoryKeys.includes(recipe.category.key);
}

/** AND within the group: every selected label must be present on the recipe. */
function matchesLabels(recipe: RecipeSummaryWithLabels, labelSlugs: string[]): boolean {
	if (labelSlugs.length === 0) return true;

	const recipeSlugs = new Set((recipe.labels ?? []).map((label) => slugify(label.name)));

	return labelSlugs.every((slug) => recipeSlugs.has(slug));
}

/** The three groups combine as AND. */
export function filterRecipes(
	recipes: RecipeSummaryWithLabels[],
	filter: RecipeFilter
): RecipeSummaryWithLabels[] {
	const needle = filter.query.trim().toLowerCase();

	return recipes.filter(
		(recipe) =>
			matchesQuery(recipe, needle) &&
			matchesCategory(recipe, filter.categoryKeys) &&
			matchesLabels(recipe, filter.labelSlugs)
	);
}

/** True when any group constrains the result. Drives which empty-state message is shown. */
export function isFilterActive(filter: RecipeFilter): boolean {
	return (
		filter.query.trim() !== '' || filter.categoryKeys.length > 0 || filter.labelSlugs.length > 0
	);
}

/**
 * How many chips are selected, for the button badge. The free-text query is excluded: it is
 * already visible in the search bar, so counting it would double-report the same state.
 */
export function activeFilterCount(filter: RecipeFilter): number {
	return filter.categoryKeys.length + filter.labelSlugs.length;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test`

Expected: PASS, 29 tests across both files (15 in `filterParams.test.ts`, 14 here).

- [ ] **Step 5: Verify types**

Run: `yarn check`

Expected: `0 errors`. Pre-existing warnings elsewhere are fine; errors in `src/lib/filters/` are not.

- [ ] **Step 6: Commit**

```bash
git add src/lib/filters/recipeFilter.ts src/lib/filters/recipeFilter.test.ts
git commit -m "Added the overview filter matching rules" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Translations

Done before the components so they have their strings when they are written. Both locales get the block; the English one is currently unreachable (see `docs/issues/unreachable-en-locale.md`), but leaving it out would widen a gap this work did not create.

The plural form uses the `sveltekit-i18n` modifier syntax (`{{count; 1:…; default:…;}}`). Do not copy `recipe.ingredients.forServings`: its JS-ternary placeholder is not evaluated by the parser (see `docs/issues/broken-plural-in-for-servings.md`).

**Files:**
- Modify: `src/lib/i18n/locales/nl/recipe.json`
- Modify: `src/lib/i18n/locales/en/recipe.json`

- [ ] **Step 1: Add the Dutch block**

In `src/lib/i18n/locales/nl/recipe.json`, insert after the `"placeholders"` block:

```json
	"filters": {
		"title": "Filters",
		"clearAll": "Wis alles",
		"category": "Categorie",
		"label": "Label",
		"open": "Filters openen",
		"openWithCount": "Filters openen, {{count}} actief",
		"showResults": "Toon {{count}} {{count; 1:recept; default:recepten;}}",
		"close": "Sluiten",
		"dismiss": "Filters sluiten"
	},
```

- [ ] **Step 2: Add the English block**

In `src/lib/i18n/locales/en/recipe.json`, in the same position:

```json
	"filters": {
		"title": "Filters",
		"clearAll": "Clear all",
		"category": "Category",
		"label": "Label",
		"open": "Open filters",
		"openWithCount": "Open filters, {{count}} active",
		"showResults": "Show {{count}} {{count; 1:recipe; default:recipes;}}",
		"close": "Close",
		"dismiss": "Close filters"
	},
```

- [ ] **Step 3: Verify the JSON parses**

Run: `yarn check`

Expected: `0 errors`. A trailing comma or a missing brace shows up here as a build failure.

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "Added filter translations" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `FilterChip`

One chip, three visual states. After Task 10 this is the only place chip styling lives.

**Read the spec section "Why the border stays ink" before changing anything here.** The border is ink and not the category colour on purpose: `limoen` (#9BDE1E) on white reaches about 1,6:1 against WCAG's 3:1 minimum for non-text UI. The colour lives in the fill, where `paletteStyle()` pairs it with a compliant text colour.

**Files:**
- Create: `src/lib/components/FilterChip.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
	import { paletteStyle, type PaletteToken } from '$lib/constants/palette';

	interface Props {
		text: string;
		selected: boolean;
		/**
		 * Category chips only. Labels carry no colour by design — see the comment on Label in
		 * src/lib/types.ts.
		 */
		color?: PaletteToken;
		onclick: () => void;
	}

	let { text, selected, color, onclick }: Props = $props();

	/**
	 * paletteStyle emits the background plus the one text colour that reaches AA on it. An
	 * inline style beats a utility class, so the pairing cannot be broken from the outside.
	 */
	const style = $derived(selected && color ? paletteStyle(color) : undefined);

	const fill = $derived.by(() => {
		if (!selected) return 'bg-white';
		// Selected with a colour: the inline style paints it. Selected without one: a label chip.
		return color ? '' : 'bg-accent';
	});
</script>

<button
	type="button"
	{onclick}
	{style}
	aria-pressed={selected}
	class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase text-ink {fill} {selected
		? 'font-black'
		: 'font-extrabold'}"
>
	{text}
</button>
```

- [ ] **Step 2: Verify types**

Run: `yarn check`

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/FilterChip.svelte
git commit -m "Added FilterChip" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `FilterButton`

**Files:**
- Create: `src/lib/components/FilterButton.svelte`

- [ ] **Step 1: Write the component**

```svelte
<script lang="ts">
	import { SlidersHorizontal } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		activeCount: number;
		expanded: boolean;
		onclick: () => void;
		/**
		 * Exposed so the page can return focus here when the sheet closes. Same reason
		 * AccountMenu keeps a reference to its own trigger.
		 */
		element?: HTMLButtonElement;
	}

	let { activeCount, expanded, onclick, element = $bindable() }: Props = $props();

	// The badge is visual only, so the count is repeated in the accessible name.
	const ariaLabel = $derived(
		activeCount > 0
			? $t('recipe.filters.openWithCount', { count: activeCount })
			: $t('recipe.filters.open')
	);
</script>

<button
	type="button"
	bind:this={element}
	{onclick}
	aria-label={ariaLabel}
	aria-haspopup="dialog"
	aria-expanded={expanded}
	class="focus-ring relative flex w-[52px] shrink-0 items-center justify-center border-2 border-ink offset-violet bg-white"
>
	<SlidersHorizontal size={20} class="text-ink" strokeWidth={2.5} />

	{#if activeCount > 0}
		<span
			aria-hidden="true"
			class="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-accent px-1 text-[10px] font-black text-ink"
		>
			{activeCount}
		</span>
	{/if}
</button>
```

The button has no fixed height: Task 9 puts it in a row with `items-stretch`, so it matches the search input without a magic number.

- [ ] **Step 2: Verify types**

Run: `yarn check`

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/FilterButton.svelte
git commit -m "Added FilterButton with an active-count badge" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: `FilterSheet`

Presentational. It receives values and callbacks and performs no navigation — `+page.svelte` owns every URL write. The parent renders it conditionally, so the `$effect` cleanup that restores body scrolling is tied to the component's lifetime.

**Files:**
- Create: `src/lib/components/FilterSheet.svelte`

- [ ] **Step 1: Write the script block**

```svelte
<script lang="ts">
	import { browser } from '$app/environment';
	import { CATEGORIES } from '$lib/constants/categories';
	import { slugify } from '$lib/filters/filterParams';
	import { t } from '$lib/i18n';
	import type { Label } from '$lib/types';
	import FilterChip from './FilterChip.svelte';

	interface Props {
		categoryKeys: string[];
		labelSlugs: string[];
		/** Derived from the loaded recipes: only labels that at least one recipe carries */
		availableLabels: Label[];
		resultCount: number;
		ontogglecategory: (key: string) => void;
		ontogglelabel: (slug: string) => void;
		onclear: () => void;
		onclose: () => void;
	}

	let {
		categoryKeys,
		labelSlugs,
		availableLabels,
		resultCount,
		ontogglecategory,
		ontogglelabel,
		onclear,
		onclose
	}: Props = $props();

	let sheet: HTMLDivElement | undefined = $state();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
			return;
		}

		if (event.key !== 'Tab' || !sheet) return;

		/**
		 * The discard dialog in RecipeForm gets away without a focus trap because it holds two
		 * buttons. This sheet holds ten or more, and tabbing out into the grid behind it loses
		 * the user entirely. The backdrop button sits outside `sheet`, so it is not in here.
		 */
		const focusable = sheet.querySelectorAll<HTMLElement>('button:not([disabled])');
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	$effect(() => {
		if (!browser) return;

		// Focus the container rather than a control, so the dialog title is announced first.
		sheet?.focus();

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />
```

- [ ] **Step 2: Write the markup**

Append to the same file, below the `<svelte:window>` line:

```svelte
<button
	type="button"
	tabindex="-1"
	aria-label={$t('recipe.filters.dismiss')}
	onclick={onclose}
	class="fixed inset-0 z-40 bg-ink/40"
></button>

<div
	bind:this={sheet}
	role="dialog"
	aria-modal="true"
	aria-labelledby="filter-sheet-title"
	tabindex="-1"
	class="focus-ring fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto border-t-2 border-ink bg-paper px-[22px] pt-5 pb-[calc(22px+env(safe-area-inset-bottom))]"
>
	<div class="flex items-baseline justify-between">
		<h2
			id="filter-sheet-title"
			class="font-display text-[22px] font-black leading-none tracking-[-0.04em] text-ink"
		>
			{$t('recipe.filters.title')}
		</h2>
		<button
			type="button"
			onclick={onclear}
			class="focus-ring text-xs font-black uppercase tracking-[0.08em] text-ink underline"
		>
			{$t('recipe.filters.clearAll')}
		</button>
	</div>

	<div class="mt-6 flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-muted-strong">
			{$t('recipe.filters.category')}
		</span>
		<div class="flex flex-wrap gap-2">
			{#each CATEGORIES as category (category.key)}
				<FilterChip
					text={$t(category.nameKey)}
					selected={categoryKeys.includes(category.key)}
					color={category.color}
					onclick={() => ontogglecategory(category.key)}
				/>
			{/each}
		</div>
	</div>

	{#if availableLabels.length > 0}
		<div class="mt-6 flex flex-col gap-3">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-muted-strong">
				{$t('recipe.filters.label')}
			</span>
			<div class="flex flex-wrap gap-2">
				{#each availableLabels as label (label.id)}
					{@const slug = slugify(label.name)}
					<FilterChip
						text={label.name}
						selected={labelSlugs.includes(slug)}
						onclick={() => ontogglelabel(slug)}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<button
		type="button"
		onclick={onclose}
		class="focus-ring mt-7 w-full border-2 border-ink offset-ink bg-accent py-[15px] text-[13px] font-black uppercase tracking-[0.08em] text-ink"
	>
		{resultCount === 0
			? $t('recipe.filters.close')
			: $t('recipe.filters.showResults', { count: resultCount })}
	</button>
</div>
```

The confirm button says `SLUITEN` at zero results; "Toon 0 recepten" reads as a dead end. Corners stay square — nothing else in the app uses a border radius.

- [ ] **Step 3: Verify types and accessibility warnings**

Run: `yarn check`

Expected: `0 errors`. The backdrop is a real `<button>`, so no `a11y_click_events_have_key_events` warning should appear for it.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/FilterSheet.svelte
git commit -m "Added the filter bottom sheet" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Wire the overview up

The load-bearing task. `+page.svelte` becomes the only place that reads and writes the URL.

Two things to get right:

- **`replaceState` from `$app/navigation`, not `goto`.** This is SvelteKit's shallow routing: it changes the URL and updates `page.url` without navigating, so no `load` re-runs, the grid does not scroll, and focus stays in the search input. `goto(..., { replaceState: true })` would re-run `load` on every keystroke.
- **The list filters on every keystroke; only the URL write is debounced.** If you debounce the list too, typing feels broken.

**Files:**
- Modify: `src/routes/+page.svelte` (the whole file is replaced)

- [ ] **Step 1: Replace the script block**

```svelte
<script lang="ts">
	import type { Label, RecipeSummaryWithLabels } from '$lib';
	import { subscribeToUserRecipes } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { parseFilterParams, slugify, toSearchString } from '$lib/filters/filterParams';
	import {
		activeFilterCount,
		EMPTY_FILTER,
		filterRecipes,
		isFilterActive,
		type RecipeFilter
	} from '$lib/filters/recipeFilter';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import FilterSheet from '$lib/components/FilterSheet.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import AccountMenu from '$lib/components/AccountMenu.svelte';
	import { t } from '$lib/i18n';

	/** Long enough that a normal typing burst writes the URL once, short enough to feel instant */
	const QUERY_WRITE_DELAY_MS = 250;

	let recipes = $state<RecipeSummaryWithLabels[]>([]);
	let loading = $state<boolean>(true);
	let hasLoadedOnce = $state<boolean>(false);
	let unsubscribe: (() => void) | null = null;

	let sheetOpen = $state<boolean>(false);
	let filterButton: HTMLButtonElement | undefined = $state();

	/**
	 * The search term is the one piece of filter state held locally, so typing responds without
	 * waiting on a URL write. Seeded from the URL once, at component init.
	 */
	let searchQuery = $state<string>(page.url.searchParams.get('q')?.trim() ?? '');
	let queryWriteTimer: ReturnType<typeof setTimeout> | undefined;

	/** The chip selections have no second copy: the URL is the only place they live */
	const urlFilter = $derived(parseFilterParams(page.url.searchParams));

	const filter = $derived<RecipeFilter>({ ...urlFilter, query: searchQuery });

	const filteredRecipes = $derived(filterRecipes(recipes, filter));

	/**
	 * Only labels that at least one recipe carries. Deriving costs no Firestore reads, and a
	 * chip that can only ever return nothing is noise. Deduplicated by slug, because that is
	 * what filtering compares.
	 */
	const availableLabels = $derived.by(() => {
		const bySlug = new Map<string, Label>();

		for (const recipe of recipes) {
			for (const label of recipe.labels ?? []) {
				const slug = slugify(label.name);
				if (slug && !bySlug.has(slug)) bySlug.set(slug, label);
			}
		}

		return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
	});

	/**
	 * Shallow routing: the URL changes without a navigation, so no load function re-runs, the
	 * grid does not scroll and focus stays where it is. replaceState rather than pushState
	 * because live filtering would otherwise put a history entry behind every tap and every
	 * typed character, making the back button useless for leaving the page. "Wis alles" is the
	 * intended undo.
	 */
	function writeFilter(next: RecipeFilter) {
		replaceState(`${page.url.pathname}${toSearchString(next)}`, page.state);
	}

	function toggleCategory(key: string) {
		const categoryKeys = filter.categoryKeys.includes(key)
			? filter.categoryKeys.filter((candidate) => candidate !== key)
			: [...filter.categoryKeys, key];

		writeFilter({ ...filter, categoryKeys });
	}

	function toggleLabel(slug: string) {
		const labelSlugs = filter.labelSlugs.includes(slug)
			? filter.labelSlugs.filter((candidate) => candidate !== slug)
			: [...filter.labelSlugs, slug];

		writeFilter({ ...filter, labelSlugs });
	}

	function clearFilter() {
		clearTimeout(queryWriteTimer);
		searchQuery = '';
		writeFilter(EMPTY_FILTER);
	}

	/**
	 * Focus goes back to the trigger, or a keyboard user is dropped at the top of the document
	 * every time they close the sheet. Same pattern as AccountMenu.
	 */
	function closeSheet() {
		sheetOpen = false;
		filterButton?.focus();
	}

	/**
	 * Only the URL write waits; filteredRecipes already reacted on this keystroke. The reads
	 * inside the timeout are untracked, so this effect depends on searchQuery alone and cannot
	 * loop against its own write.
	 */
	$effect(() => {
		const query = searchQuery;

		queryWriteTimer = setTimeout(() => {
			if (query.trim() === (page.url.searchParams.get('q')?.trim() ?? '')) return;
			writeFilter({ ...urlFilter, query });
		}, QUERY_WRITE_DELAY_MS);

		return () => clearTimeout(queryWriteTimer);
	});

	onMount(() => {
		const unsubscribeUser = user.subscribe(($user) => {
			if ($user === undefined) return;

			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			if ($user) {
				loading = true;
				hasLoadedOnce = false;
				unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
					recipes = updatedRecipes;
					if (!hasLoadedOnce) {
						hasLoadedOnce = true;
						loading = false;
					}
				});
			} else {
				recipes = [];
				loading = false;
				hasLoadedOnce = true;
			}
		});

		return () => {
			unsubscribeUser();
		};
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>
```

- [ ] **Step 2: Replace the markup**

```svelte
<svelte:head>
	<title>{$t('common.app.name')}</title>
</svelte:head>

<div class="min-h-dvh bg-paper pb-28">
	<header class="flex items-start justify-between px-[22px] pb-[18px] pt-3">
		<div class="flex flex-col gap-0.5">
			<span class="font-display text-[22px] font-black leading-none tracking-[-0.04em] text-ink">
				{$t('common.app.name')}
			</span>
			<span
				aria-live="polite"
				class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong"
			>
				{filteredRecipes.length} {$t('recipe.labels.recipesCount')}
			</span>
		</div>
		<AccountMenu />
	</header>

	<div class="flex items-stretch gap-3 px-[22px] pb-4">
		<div class="flex-1">
			<SearchBar bind:value={searchQuery} placeholder={$t('recipe.placeholders.searchRecipes')} />
		</div>
		<FilterButton
			bind:element={filterButton}
			activeCount={activeFilterCount(filter)}
			expanded={sheetOpen}
			onclick={() => (sheetOpen = true)}
		/>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-x-[18px] gap-y-5 px-[22px] sm:grid-cols-3 lg:grid-cols-4">
			{#each filteredRecipes as recipe (recipe.id)}
				<RecipeCard
					id={recipe.id}
					title={recipe.title}
					image={recipe.image}
					category={recipe.category}
					time={recipe.cookTime}
				/>
			{/each}
		</div>

		{#if filteredRecipes.length === 0}
			<div class="flex flex-col items-center gap-4 px-[22px] pt-2">
				<EmptyState
					message={isFilterActive(filter)
						? $t('common.empty.noResults')
						: $t('common.empty.startCreating')}
				/>
				{#if isFilterActive(filter)}
					<!-- Without this, a shared URL whose label slug matches nothing is a dead screen -->
					<button
						type="button"
						onclick={clearFilter}
						class="focus-ring border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
					>
						{$t('recipe.filters.clearAll')}
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if sheetOpen}
	<FilterSheet
		categoryKeys={filter.categoryKeys}
		labelSlugs={filter.labelSlugs}
		{availableLabels}
		resultCount={filteredRecipes.length}
		ontogglecategory={toggleCategory}
		ontogglelabel={toggleLabel}
		onclear={clearFilter}
		onclose={closeSheet}
	/>
{/if}

<FloatingActionButton href="/recipes/new" ariaLabel={$t('recipe.actions.addRecipe')} />
```

Note the empty-state condition changed from `searchQuery` to `isFilterActive(filter)` — a category-only filter with no results used to show "Begin met het maken van je eerste recept!".

- [ ] **Step 3: Verify types**

Run: `yarn check`

Expected: `0 errors`.

- [ ] **Step 4: Verify in the browser**

Run: `yarn dev`, sign in, and walk through:

1. Type in the search bar → the grid narrows immediately; about a quarter-second later `?q=` appears in the address bar.
2. Open the sheet, tap a category → the badge on the button shows 1, `?category=main` appears, the button in the sheet shows the new count.
3. Tap two labels → `?label=a,b`, and only recipes carrying **both** remain.
4. Copy the URL, open it in a new tab → the same recipes, with the same chips selected and the same text in the search bar.
5. Press Escape → the sheet closes and focus returns to the filter button (press Enter to confirm it reopens).
6. Tab repeatedly inside the sheet → focus cycles and never reaches the grid behind it.
7. Scroll while the sheet is open → the page behind does not scroll. Close it → scrolling works again.
8. Select a filter that matches nothing → the empty state plus a working "Wis alles".
9. Press the browser back button once from a filtered overview → you leave the page rather than stepping back through filter changes.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "Added overview filtering by category and label with URL state" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Move the two pickers onto `FilterChip`

`CategoryPicker` and `LabelPicker` each hold their own copy of the chip markup, which `FilterChip` has now made a third copy of. This collapses them to one.

**This step is separable.** It has one visible consequence: a selected category in the recipe wizard becomes its category colour instead of accent, so categories look the same everywhere in the app. If that is not wanted, skip the task — nothing else depends on it.

**Files:**
- Modify: `src/lib/components/recipe/CategoryPicker.svelte:18-32`
- Modify: `src/lib/components/recipe/LabelPicker.svelte:56-70`

- [ ] **Step 1: Rewrite the chip row in `CategoryPicker.svelte`**

Add to the script block:

```ts
	import FilterChip from '$lib/components/FilterChip.svelte';
```

Replace the `<div class="flex flex-wrap gap-2">` block (lines 18-32) with:

```svelte
	<div class="flex flex-wrap gap-2">
		{#each CATEGORIES as category (category.key)}
			<FilterChip
				text={$t(category.nameKey)}
				selected={categoryKey === category.key}
				color={category.color}
				onclick={() => (categoryKey = category.key)}
			/>
		{/each}
	</div>
```

- [ ] **Step 2: Rewrite the chip row in `LabelPicker.svelte`**

Add to the script block:

```ts
	import FilterChip from '$lib/components/FilterChip.svelte';
```

Replace the `<div class="flex flex-wrap gap-2">` block (lines 56-70) with:

```svelte
			<div class="flex flex-wrap gap-2">
				{#each availableLabels as label (label.id)}
					<FilterChip
						text={label.name}
						selected={labels.some((l) => l.id === label.id)}
						onclick={() => toggleLabel(label)}
					/>
				{/each}
			</div>
```

`FilterChip` takes no `color`, so a selected label keeps its accent fill — unchanged from today.

- [ ] **Step 3: Verify types**

Run: `yarn check`

Expected: `0 errors`.

- [ ] **Step 4: Verify in the browser**

Run: `yarn dev` and open `/recipes/new`, step 4 (Categorie & labels):

1. Tap each of the five categories in turn → each fills with its own colour, and the text stays readable on every one. Check `bes` and `kaneel` in particular: those two carry white text where the other three carry ink.
2. Tap a label → it fills with accent, as before.
3. Save the recipe → the category still stores correctly and the card on the overview shows it.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/recipe/CategoryPicker.svelte src/lib/components/recipe/LabelPicker.svelte
git commit -m "Updated recipe pickers to use FilterChip" \
	-m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `yarn test` → 29 tests pass
- [ ] `yarn check` → 0 errors
- [ ] `yarn build` → completes without error
- [ ] The browser walkthrough in Task 9, Step 4 passes end to end
