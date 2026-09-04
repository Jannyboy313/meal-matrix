# Labels and Categories Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `Tag` concept into a closed set of code-defined categories and an open set of user-created labels, so a recipe's category no longer depends on array order.

**Architecture:** Categories are `readonly` constants in `src/lib/constants/`, referenced from Firestore only by a stable UUID and resolved synchronously — no database read. Labels keep the existing Firestore document shape and are renamed from `tags` to `labels` in both code and the collection. Step 2 of the wizard becomes two independent picker components rendered side by side by `RecipeForm`.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), TypeScript, Tailwind CSS 4 (`@theme` tokens in CSS), Firebase Firestore, `sveltekit-i18n`.

**Spec:** `docs/superpowers/specs/2026-09-04-labels-categories-separation-design.md`

---

## Two deviations from the default workflow

Read these before starting; they change how every task is verified.

**1. There is no TDD, because there is no test runner.** `package.json` has no vitest, no
Playwright, and no test files exist anywhere in `src/`. Its only scripts are `dev`, `build`,
`preview`, `check` and `setup:certs`. Adding test tooling is a separate piece of work and is
explicitly out of scope for this change. Every task therefore verifies with:

```bash
yarn check
```

which runs `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`. Because this change
renames a type used across roughly a dozen files, `yarn check` is the primary safety net and
must be clean at the end of every task unless a task says otherwise. Tasks that change
behaviour rather than types add a named manual check.

**2. Do not run `git commit`.** The repository owner's command allowlist
(`~/.claude/rules/allowlist.md`) permits only `git status`, `log`, `diff`, `grep` and `show`.
Commit steps below are written for the owner to run by hand. An agent executing this plan
should stop at each commit step, report that the task is complete and what to commit, and let
the owner do it.

## File structure

**Created**

| File | Responsibility |
| --- | --- |
| `src/lib/constants/palette.ts` | The ten category colors: CSS variable name + the one text color that reaches AA on it |
| `src/lib/constants/categories.ts` | The four categories and `getCategoryById` |
| `src/lib/components/recipe/CategoryPicker.svelte` | Single-select of one category |
| `src/lib/components/recipe/LabelPicker.svelte` | Multi-select and creation of labels |

**Modified**

| File | Change |
| --- | --- |
| `src/routes/layout.css` | Six new colors in the `@theme` block |
| `src/lib/types.ts` | `Tag` → `Label`; `tagIds` → `categoryId` + `labelIds`; view models |
| `src/lib/index.ts` | Re-export the renamed types |
| `src/lib/services/tagService.ts` → `labelService.ts` | Rename; collection `tags` → `labels`; loses view-model assembly |
| `src/lib/services/recipeService.ts` | Owns view-model assembly; `RecipeInput` type |
| `src/lib/services/index.ts` | Point at `labelService` |
| `src/lib/components/recipe/RecipeForm.svelte` | Form state, step 2, validation, draft key |
| `src/lib/components/RecipeCard.svelte` | Takes `Category` |
| `src/lib/components/RecipeHero.svelte` | Takes `Category`; fixed text color |
| `src/routes/+page.svelte` | Passes resolved category; search predicate |
| `src/routes/recipes/[id]/+page.svelte` | Passes resolved category |
| `src/routes/recipes/[id]/cook/+page.svelte` | Type rename only |
| `src/routes/recipes/new/+page.svelte` | `getAllLabels`; draft key v2 |
| `src/routes/recipes/[id]/edit/+page.svelte` | `getAllLabels`; draft key v2; `categoryId` in initial data |
| `src/lib/i18n/locales/{nl,en}/recipe.json` | Category names, label-picker block, new validation string |
| `src/lib/i18n/locales/{nl,en}/common.json` | `loading.tags` → `loading.labels` |

**Deleted**

| File | Why |
| --- | --- |
| `src/lib/components/recipe/TagsStep.svelte` | Replaced by the two pickers |
| `src/lib/stores/recipe-form.store.ts` | Dead code that imports `Tag`, so the rename forces the issue |
| `src/routes/recipes/new/+page.ts` | Dead: returns 35 hardcoded English tags the page never reads |
| `src/routes/recipes/new/+page.server.ts` | Contains only a comment saying it is unused |

**Note on `src/lib/stores/recipe-form.store.ts`:** this store is dead code — `RecipeForm.svelte`
manages its own `$state` and reads `localStorage` directly, and nothing imports
`createRecipeFormStore`. It is deleted in Task 4 rather than later, because it imports `Tag`
and would otherwise break that task's type-check.

---

### Task 1: Palette colors in CSS and constants

**Files:**
- Modify: `src/routes/layout.css:3-16`
- Create: `src/lib/constants/palette.ts`

- [ ] **Step 1: Add the six new colors to the `@theme` block**

The `@theme` block currently ends at `--color-hero`. Add the six palette colors after it, so
the block reads:

```css
@theme {
	--font-display: 'Archivo', sans-serif;

	--color-ink: #17150f;
	--color-paper: #fffdf7;
	--color-surface: #ffffff;
	--color-accent: #ff5c35;
	--color-yellow: #ffc400;
	--color-teal: #2ed3b7;
	--color-violet: #6c5ce7;
	--color-muted: #8d8878;
	--color-image: #efeadc;
	--color-hero: #2a2318;

	/* Category colors 5-10. See design/Meal Matrix - kleurenpalet.dc.html */
	--color-roze: #ff6fa5;
	--color-limoen: #9bde1e;
	--color-hemel: #4cc3f5;
	--color-bes: #9b1b6e;
	--color-bosgroen: #16714a;
	--color-kaneel: #7a4a1e;
}
```

Do not touch `--color-muted` or `--color-accent`. Both have known contrast problems that are
tracked in `docs/issues/palette-contrast-rollout.md` and are out of scope here.

- [ ] **Step 2: Create the palette constants**

Create `src/lib/constants/palette.ts`:

```ts
/**
 * Category color palette
 *
 * Hex values live in the `@theme` block in src/routes/layout.css, which is the single source
 * of truth. This file holds the CSS variable name plus the one text color that reaches WCAG AA
 * on it. That pairing is fixed per color and follows from the contrast ratio, not from
 * context, so it belongs next to the color rather than at the call site.
 *
 * Six colors carry ink, four carry white. See design/Meal Matrix - kleurenpalet.dc.html
 */

export type OnColor = 'ink' | 'white';

export interface PaletteColor {
	/** CSS custom property declared in layout.css */
	cssVar: string;
	/** The only text color that reaches AA on this background */
	on: OnColor;
}

export const PALETTE = {
	koraal: { cssVar: '--color-accent', on: 'ink' },
	geel: { cssVar: '--color-yellow', on: 'ink' },
	teal: { cssVar: '--color-teal', on: 'ink' },
	violet: { cssVar: '--color-violet', on: 'white' },
	roze: { cssVar: '--color-roze', on: 'ink' },
	limoen: { cssVar: '--color-limoen', on: 'ink' },
	hemel: { cssVar: '--color-hemel', on: 'ink' },
	bes: { cssVar: '--color-bes', on: 'white' },
	bosgroen: { cssVar: '--color-bosgroen', on: 'white' },
	kaneel: { cssVar: '--color-kaneel', on: 'white' }
} as const satisfies Record<string, PaletteColor>;

export type PaletteToken = keyof typeof PALETTE;

const ON_COLOR_VAR: Record<OnColor, string> = {
	ink: '--color-ink',
	white: '--color-surface'
};

/**
 * Inline style for a filled surface in a palette color, carrying its fixed text color.
 * Used for the category badge, where the color comes from data rather than from a class.
 */
export function paletteStyle(token: PaletteToken): string {
	const { cssVar, on } = PALETTE[token];
	return `background-color: var(${cssVar}); color: var(${ON_COLOR_VAR[on]});`;
}
```

- [ ] **Step 3: Verify**

```bash
yarn check
```

Expected: no errors. Nothing imports the new file yet, so this only confirms it compiles.

- [ ] **Step 4: Commit** *(owner runs this)*

```bash
git add src/routes/layout.css src/lib/constants/palette.ts
git commit -m "feat: add the six new category colors to the palette"
```

---

### Task 2: Category constants

**Files:**
- Create: `src/lib/constants/categories.ts`

- [ ] **Step 1: Create the category constants**

Create `src/lib/constants/categories.ts`:

```ts
/**
 * Recipe categories
 *
 * A closed set defined here in code, not in Firestore. A recipe stores only the `id`, so a
 * display name can change without touching data and the set cannot drift per user.
 *
 * The UUIDs below are the contract with the data migration. They must not change once the
 * migration has run.
 */

import type { PaletteToken } from './palette';

export type CategoryKey = 'starter' | 'main' | 'dessert' | 'bread';

export interface Category {
	/** Stable UUID; the only part of a category that reaches Firestore */
	id: string;
	/** For referring to a category from code */
	key: CategoryKey;
	/** i18n key, resolved with $t at the point of display */
	nameKey: string;
	/** Fixed color, referenced by palette token rather than by hex */
	color: PaletteToken;
}

// TODO(owner): confirm the four colors. The values below are the mapping the palette document
// shows in its own swatches. Ten tokens are available: koraal, geel, teal, violet, roze,
// limoen, hemel, bes, bosgroen, kaneel. Note that koraal doubles as the action color, and
// palette rule 01 warns against a category taking that role on the same screen — so 'main'
// is the one worth a second look.
export const CATEGORIES: readonly Category[] = [
	{
		id: 'b7c9e1a4-3f52-4d8e-9a16-2c5d7e8f0b31',
		key: 'starter',
		nameKey: 'recipe.categories.starter',
		color: 'roze'
	},
	{
		id: 'd4e2f8a1-6b39-4c7e-8f52-1a9d3c6b4e78',
		key: 'main',
		nameKey: 'recipe.categories.main',
		color: 'koraal'
	},
	{
		id: 'f1a3c5e7-9d24-4b6f-a83c-5e7f1b9d2a46',
		key: 'dessert',
		nameKey: 'recipe.categories.dessert',
		color: 'geel'
	},
	{
		id: 'a9d7b3f5-2e18-4c6a-b47d-8f3e1c5a9b62',
		key: 'bread',
		nameKey: 'recipe.categories.bread',
		color: 'violet'
	}
] as const;

/**
 * Resolve a category by its stored id.
 *
 * Returns undefined for an id that matches nothing — a recipe whose category was mistyped
 * during migration must still open, so every caller renders without a category rather than
 * throwing.
 */
export function getCategoryById(id: string | undefined): Category | undefined {
	if (!id) return undefined;
	return CATEGORIES.find((category) => category.id === id);
}
```

- [ ] **Step 2: Verify**

```bash
yarn check
```

Expected: no errors.

- [ ] **Step 3: Commit** *(owner runs this)*

```bash
git add src/lib/constants/categories.ts
git commit -m "feat: define the four recipe categories as constants"
```

---

### Task 3: i18n keys

**Files:**
- Modify: `src/lib/i18n/locales/nl/recipe.json`
- Modify: `src/lib/i18n/locales/en/recipe.json`
- Modify: `src/lib/i18n/locales/nl/common.json:22-26`
- Modify: `src/lib/i18n/locales/en/common.json`

Both locales change. The English locale is currently unreachable — see
`docs/issues/unreachable-en-locale.md` — but the two files are in exact key parity today and
keeping that costs a handful of lines.

Be careful with one collision: `recipe.labels.*` is **already** the block of form *field*
labels (`labels.name`, `labels.description`, `labels.category`). The label-picker strings
cannot move there. They get their own `recipe.labelPicker.*` block.

- [ ] **Step 1: Add the category names to `nl/recipe.json`**

Insert a new top-level `categories` block after the `title` block:

```json
	"categories": {
		"starter": "Voorgerecht",
		"main": "Hoofdgerecht",
		"dessert": "Dessert",
		"bread": "Brood",
		"baking": "Bakken"
	},
```

- [ ] **Step 2: Update the `labels` and `steps` blocks in `nl/recipe.json`**

In `labels`, replace the line `"tags": "Tags",` with `"labels": "Labels",`. The
`"category": "Categorie"` line stays exactly as it is — it now finally means what it says.

In `steps`, replace the line `"tags": "Tags",` with `"categoryLabels": "Categorie & labels",`.

- [ ] **Step 3: Replace the `tags` block with `labelPicker` in `nl/recipe.json`**

Replace the whole `"tags": { ... }` block with:

```json
	"labelPicker": {
		"namePlaceholder": "Labelnaam",
		"adding": "Toevoegen...",
		"createError": "Label maken mislukt. Probeer het opnieuw.",
		"newLabel": "Nieuw label",
		"colorLabel": "Kleur",
		"addLabel": "Label toevoegen",
		"newLabelHint": "Labels zijn vrije trefwoorden, bijvoorbeeld pittig of glutenvrij.",
		"swatchColors": {
			"accent": "Oranje",
			"yellow": "Geel",
			"teal": "Teal",
			"violet": "Paars"
		}
	},
```

The old `newCategoryHint` promised "Nieuwe categorieën komen ook in het filter op het
overzicht". There is no filter, and categories are no longer user-created, so it is replaced
rather than moved.

- [ ] **Step 4: Add the validation string to `nl/recipe.json`**

In the `validation` block, add:

```json
		"categoryRequired": "Kies een categorie",
```

- [ ] **Step 5: Rename the loading key in `nl/common.json`**

In the `loading` block, replace `"tags": "Laden..."` with `"labels": "Laden..."`.

- [ ] **Step 6: Mirror all five changes in the `en/` files**

`en/recipe.json`:

```json
	"categories": {
		"starter": "Starter",
		"main": "Main course",
		"dessert": "Dessert",
		"bread": "Bread"
	},
```

In `labels`: `"tags": "Tags",` → `"labels": "Labels",`.
In `steps`: `"tags": "Tags",` → `"categoryLabels": "Category & labels",`.

```json
	"labelPicker": {
		"namePlaceholder": "Label name",
		"adding": "Adding...",
		"createError": "Failed to create label. Please try again.",
		"newLabel": "New label",
		"colorLabel": "Color",
		"addLabel": "Add label",
		"newLabelHint": "Labels are free-form keywords, for example spicy or gluten-free.",
		"swatchColors": {
			"accent": "Orange",
			"yellow": "Yellow",
			"teal": "Teal",
			"violet": "Purple"
		}
	},
```

In `validation`: `"categoryRequired": "Please choose a category",`.
In `en/common.json`, `loading`: `"tags"` → `"labels"`.

- [ ] **Step 7: Verify both files are valid JSON and in parity**

```bash
node -e "const n=require('./src/lib/i18n/locales/nl/recipe.json'),e=require('./src/lib/i18n/locales/en/recipe.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=f(n).sort(),b=f(e).sort();console.log('nl',a.length,'en',b.length);console.log('diff',a.filter(k=>!b.includes(k)).concat(b.filter(k=>!a.includes(k))))"
```

Expected: equal counts and `diff []`. A non-empty diff means a key was missed in one locale.

`yarn check` will still pass here, because `$t` keys are plain strings and not type-checked.
That is exactly why this parity check is run by hand.

- [ ] **Step 8: Commit** *(owner runs this)*

```bash
git add src/lib/i18n/locales
git commit -m "feat: add category names and label-picker copy to both locales"
```

---

### Task 4: Rename Tag to Label in the type layer

This task is mechanical and touches many files. It keeps the existing behaviour — including
the `labels[0]`-as-category hack — so that `yarn check` is clean at the end. The category
replaces that hack in Task 5.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/index.ts`
- Rename: `src/lib/services/tagService.ts` → `src/lib/services/labelService.ts`
- Modify: `src/lib/services/index.ts`
- Modify: `src/lib/services/recipeService.ts`
- Modify: `src/lib/components/recipe/TagsStep.svelte`, `RecipeForm.svelte`
- Modify: `src/lib/components/RecipeCard.svelte`, `RecipeHero.svelte`
- Modify: `src/routes/+page.svelte`, `src/routes/recipes/[id]/+page.svelte`,
  `src/routes/recipes/[id]/cook/+page.svelte`, `src/routes/recipes/new/+page.svelte`,
  `src/routes/recipes/[id]/edit/+page.svelte`

- [ ] **Step 1: Rename the interface and the fields in `src/lib/types.ts`**

Replace the `Tag` interface with:

```ts
/**
 * Label document - stored in the 'labels' collection
 * Path: /labels/{labelId}
 */
export interface Label {
	id: string; // UUID
	name: string;
	color: string; // hex
	userId?: string; // Owner of the label (absent for system/global labels)
	isGlobal?: boolean; // True for system labels available to all users
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
}
```

In `RecipeSummary`, replace `tagIds: string[]` with `labelIds: string[]`, and update the
comment above the interface to say label ids.

Rename the two view models, keeping their shape for now:

```ts
export interface RecipeSummaryWithLabels extends Omit<RecipeSummary, 'labelIds'> {
	labels: Label[];
}

export interface RecipeWithLabels extends Omit<Recipe, 'labelIds'> {
	labels: Label[];
}
```

In `RecipeFormData`, replace `tags: Tag[]` with `labels: Label[]`.

- [ ] **Step 2: Update the re-exports in `src/lib/index.ts`**

```ts
export type {
	Label,
	Ingredient,
	ServingIngredients,
	Recipe,
	RecipeSummary,
	RecipeSummaryWithLabels,
	RecipeWithLabels,
	RecipeFormData
} from './types';
```

- [ ] **Step 3: Rename the service file and its exports**

```bash
git mv src/lib/services/tagService.ts src/lib/services/labelService.ts
```

If the owner has not authorised `git mv`, create `labelService.ts` and delete
`tagService.ts` with the Write tool instead.

In the new file, rename throughout: `getAllTags` → `getAllLabels`, `getTagById` →
`getLabelById`, `populateTags` → `populateLabels`, `createTag` → `createLabel`,
`populateRecipeTags` → `populateRecipeLabels`, `populateRecipeSummaryTags` →
`populateRecipeSummaryLabels`. Change every `collection(db, 'tags')` and
`doc(db, 'tags', ...)` to `'labels'`, and update the local variable names and the
`console.error` strings from tag to label.

- [ ] **Step 4: Update `src/lib/services/index.ts`**

The file is three `export *` lines. Change the last one so it reads:

```ts
/**
 * Service Layer Index
 * Central export point for all service modules
 */

export * from './authService';
export * from './recipeService';
export * from './labelService';
```

Because these are wholesale re-exports, anything added to `recipeService` later — such as the
`RecipeInput` type in Task 5 — is exported automatically with no further change here.

- [ ] **Step 5: Delete the dead form store**

`src/lib/stores/recipe-form.store.ts` imports `Tag` and would fail this task's type-check.
It is dead code: `RecipeForm.svelte` manages its own `$state` and writes `localStorage`
directly, and nothing imports `createRecipeFormStore`.

Confirm that, then delete it:

```bash
grep -rn "createRecipeFormStore\|RecipeFormStore\|recipe-form.store" src
```

Expected: matches only inside `src/lib/stores/recipe-form.store.ts` itself. If any other file
appears, stop and report instead of deleting.

```bash
git rm src/lib/stores/recipe-form.store.ts
```

- [ ] **Step 6: Update `src/lib/services/recipeService.ts`**

Change the import to `populateRecipeLabels, populateRecipeSummaryLabels` from
`$lib/services/labelService`, the type imports to `RecipeWithLabels` and
`RecipeSummaryWithLabels`, and inside `createRecipe` and `updateRecipe` change

```ts
const tagIds = recipeData.tags?.map((tag) => tag.id) || [];
const { tags, ...recipeWithoutTags } = recipeData;
```

to

```ts
const labelIds = recipeData.labels?.map((label) => label.id) || [];
const { labels, ...recipeWithoutLabels } = recipeData;
```

and write `labelIds` instead of `tagIds` in both the `addDoc` and the `updateDoc` payload.
Update the two `Omit<...>` signatures to `Omit<RecipeWithLabels, 'id' | 'labelIds' | ...>`.

- [ ] **Step 7: Update every remaining consumer**

Find them all:

```bash
grep -rn "Tag\b\|tags\|tagIds\|getAllTags\|availableTags" src --include="*.svelte" --include="*.ts" | grep -v "aria-label\|ariaLabel"
```

Rename mechanically in each hit: `Tag` → `Label`, `tags` → `labels`, `availableTags` →
`availableLabels`, `getAllTags` → `getAllLabels`, `RecipeWithTags` → `RecipeWithLabels`,
`RecipeSummaryWithTags` → `RecipeSummaryWithLabels`, `addtag`/`removetag` →
`addlabel`/`removelabel`, `$t('common.loading.tags')` → `$t('common.loading.labels')`.

`TagsStep.svelte` is renamed internally too even though Task 6 deletes it — that keeps this
task's `yarn check` clean without carrying a broken file forward.

In `RecipeForm.svelte`, `stepTitles` still references `$t('recipe.steps.tags')`, which Task 3
removed. Change it to `$t('recipe.steps.categoryLabels')`.

- [ ] **Step 8: Verify**

```bash
yarn check
```

Expected: no errors. If anything still mentions `Tag`, `tagIds` or `tagService`, the grep in
step 7 missed it — rerun it.

- [ ] **Step 9: Manual check that nothing regressed**

```bash
yarn dev
```

Open the overview, open a recipe, and open the wizard to step 2. Everything should look and
behave exactly as before this task: the "category" shown is still the first label. Nothing is
fixed yet; this only confirms the rename broke nothing.

- [ ] **Step 10: Commit** *(owner runs this)*

```bash
git add -A src/lib src/routes
git commit -m "refactor: rename Tag to Label across code and the Firestore collection"
```

---

### Task 5: Add categoryId to the data layer

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/services/labelService.ts`
- Modify: `src/lib/services/recipeService.ts`

This task moves view-model assembly out of `labelService` and into `recipeService`. Resolving
a recipe's category is not a label concern, and `labelService` should only know about labels.

- [ ] **Step 1: Add the category to the types**

In `src/lib/types.ts`, add the import at the top:

```ts
import type { Category } from '$lib/constants/categories';
```

Add `categoryId` to `RecipeSummary`, above `labelIds`:

```ts
	categoryId: string; // UUID of a category from $lib/constants/categories
	labelIds: string[]; // Array of label IDs (references to /labels collection)
```

Change both view models so the category is resolved and optional:

```ts
export interface RecipeSummaryWithLabels
	extends Omit<RecipeSummary, 'categoryId' | 'labelIds'> {
	category?: Category; // Resolved from constants; undefined if the id matches nothing
	labels: Label[];
}

export interface RecipeWithLabels extends Omit<Recipe, 'categoryId' | 'labelIds'> {
	category?: Category;
	labels: Label[];
}
```

Add `categoryId` to `RecipeFormData`, above `labels`:

```ts
	categoryId: string;
	labels: Label[];
```

- [ ] **Step 2: Strip view-model assembly out of `labelService.ts`**

Delete `populateRecipeLabels` and `populateRecipeSummaryLabels` entirely, along with the now
unused `Recipe`, `RecipeSummary`, `RecipeWithLabels` and `RecipeSummaryWithLabels` type
imports. The file keeps exactly four exports: `getAllLabels`, `getLabelById`,
`populateLabels`, `createLabel`.

- [ ] **Step 3: Assemble the view models in `recipeService.ts`**

Replace the import from `labelService` with:

```ts
import { populateLabels } from '$lib/services/labelService';
import { getCategoryById } from '$lib/constants/categories';
```

Add these two helpers below the imports:

```ts
/**
 * Build the summary view model: labels fetched from Firestore, category resolved from
 * constants. The category costs no read.
 */
async function toRecipeSummaryWithLabels(
	recipe: RecipeSummary
): Promise<RecipeSummaryWithLabels> {
	const labels = await populateLabels(recipe.labelIds || []);
	const { categoryId, labelIds, ...rest } = recipe;

	return { ...rest, category: getCategoryById(categoryId), labels };
}

/** Build the full view model. See toRecipeSummaryWithLabels. */
async function toRecipeWithLabels(recipe: Recipe): Promise<RecipeWithLabels> {
	const labels = await populateLabels(recipe.labelIds || []);
	const { categoryId, labelIds, ...rest } = recipe;

	return { ...rest, category: getCategoryById(categoryId), labels };
}
```

Replace the two call sites: `populateRecipeTags(recipe)` in `getRecipeById` becomes
`toRecipeWithLabels(recipe)`, and `populateRecipeSummaryLabels(recipe)` inside
`subscribeToUserRecipes` becomes `toRecipeSummaryWithLabels(recipe)`.

- [ ] **Step 4: Give the write functions an explicit input type**

The `Omit<RecipeWithLabels, ...>` signatures no longer fit, because the form supplies a
`categoryId` string rather than a resolved `Category`. Add an explicit type above
`createRecipe`:

```ts
/**
 * What the recipe form submits. Distinct from RecipeWithLabels: the form holds a categoryId,
 * not a resolved category, and labels as objects rather than ids.
 */
export interface RecipeInput {
	title: string;
	description: string;
	image: string;
	prepTime: string;
	cookTime: string;
	servings: number;
	categoryId: string;
	labels: Label[];
	ingredients: { [key: number]: Ingredient[] };
	steps: string[];
}
```

Import `Label` and `Ingredient` alongside the existing type imports. Then change both
signatures and bodies:

```ts
export async function createRecipe(recipeData: RecipeInput, userId: string): Promise<string> {
	try {
		const labelIds = recipeData.labels?.map((label) => label.id) || [];
		const { labels, ...recipeWithoutLabels } = recipeData;

		const docRef = await addDoc(collection(db, 'recipes'), {
			...recipeWithoutLabels,
			labelIds,
			userId,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});

		return docRef.id;
	} catch (error) {
		console.error('Error creating recipe:', error);
		throw error;
	}
}

export async function updateRecipe(
	recipeId: string,
	recipeData: RecipeInput,
	userId: string
): Promise<void> {
	try {
		const labelIds = recipeData.labels?.map((label) => label.id) || [];
		const { labels, ...recipeWithoutLabels } = recipeData;

		await updateDoc(doc(db, 'recipes', recipeId), {
			...recipeWithoutLabels,
			labelIds,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		console.error('Error updating recipe:', error);
		throw error;
	}
}
```

`categoryId` rides along inside `recipeWithoutLabels`, so it is written without extra code.
`updateRecipe` keeps its unused `userId` parameter: every caller passes it and removing it is
unrelated churn.

- [ ] **Step 5: Confirm `RecipeInput` is exported**

No edit should be needed. `src/lib/index.ts` does `export * from './services'`, and
`services/index.ts` does `export * from './recipeService'`, so a new export on `recipeService`
reaches `$lib` automatically. Verify with:

```bash
grep -n "export \*" src/lib/index.ts src/lib/services/index.ts
```

Expected: both wholesale re-exports are present.

- [ ] **Step 6: Verify**

```bash
yarn check
```

Expected: errors **only** in `RecipeForm.svelte`, because it still passes `tags`/`labels`
without a `categoryId` to `createRecipe`. Task 7 fixes that. If any other file errors, a step
above was missed.

- [ ] **Step 7: Commit** *(owner runs this)*

```bash
git add src/lib/types.ts src/lib/services
git commit -m "feat: store categoryId on recipes and resolve it from constants"
```

---

### Task 6: CategoryPicker component

**Files:**
- Create: `src/lib/components/recipe/CategoryPicker.svelte`

- [ ] **Step 1: Create the component**

```svelte
<script lang="ts">
	import { CATEGORIES } from '$lib/constants/categories';
	import { t } from '$lib/i18n';

	interface Props {
		categoryId: string;
		error?: string;
	}

	let { categoryId = $bindable(), error = '' }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
		{$t('recipe.labels.category')} <span class="text-accent">{$t('common.required')}</span>
	</span>

	<div class="flex flex-wrap gap-2">
		{#each CATEGORIES as category (category.id)}
			{@const isSelected = categoryId === category.id}
			<button
				type="button"
				onclick={() => (categoryId = category.id)}
				aria-pressed={isSelected}
				class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
					? 'bg-accent font-black text-ink'
					: 'bg-white font-extrabold text-ink'}"
			>
				{$t(category.nameKey)}
			</button>
		{/each}
	</div>

	{#if error}
		<p class="text-xs font-semibold text-accent">{error}</p>
	{/if}
</div>
```

Two deliberate choices here:

**The selected chip uses `text-ink`, not `text-white`.** `TagsStep.svelte` renders its
selected chip as `bg-accent font-black text-white`, which is 3,1:1 — the palette marks that
combination "niet gebruiken". This is new code, so it does not reproduce a known contrast
failure. The existing occurrences elsewhere are tracked in
`docs/issues/palette-contrast-rollout.md`.

**`aria-pressed` rather than `role="radio"`.** A radiogroup promises arrow-key navigation that
would have to be implemented to be honest. `aria-pressed` on toggle buttons is what the rest
of this codebase already does and is not misleading about its keyboard behaviour.

- [ ] **Step 2: Verify**

```bash
yarn check
```

Expected: still only the pre-existing `RecipeForm.svelte` errors from Task 5.

- [ ] **Step 3: Commit** *(owner runs this)*

```bash
git add src/lib/components/recipe/CategoryPicker.svelte
git commit -m "feat: add CategoryPicker for single-select of a recipe category"
```

---

### Task 7: LabelPicker component

**Files:**
- Create: `src/lib/components/recipe/LabelPicker.svelte`
- Delete: `src/lib/components/recipe/TagsStep.svelte`

- [ ] **Step 1: Create the component**

This is the label half of the old `TagsStep`, with the category heading and the category copy
removed:

```svelte
<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Label } from '$lib';
	import { createLabel } from '$lib/services/labelService';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	interface Props {
		labels: Label[];
		availableLabels: Label[];
		onaddlabel: (label: Label) => void;
		onremovelabel: (index: number) => void;
	}

	let {
		labels = $bindable(),
		availableLabels = $bindable(),
		onaddlabel,
		onremovelabel
	}: Props = $props();

	const SWATCHES = [
		{ name: 'accent', value: '#FF5C35' },
		{ name: 'yellow', value: '#FFC400' },
		{ name: 'teal', value: '#2ED3B7' },
		{ name: 'violet', value: '#6C5CE7' }
	];

	// Literal class names so Tailwind's static scanner can find them (a dynamic
	// `bg-${swatch.name}` string never appears verbatim in this file, so classes
	// without another literal usage elsewhere, e.g. bg-violet, would not be generated).
	const SWATCH_BG_CLASS: Record<string, string> = {
		accent: 'bg-accent',
		yellow: 'bg-yellow',
		teal: 'bg-teal',
		violet: 'bg-violet'
	};

	let newLabelName = $state<string>('');
	let newLabelColor = $state<string>(SWATCHES[0].value);
	let isCreatingLabel = $state<boolean>(false);

	function toggleLabel(label: Label) {
		const index = labels.findIndex((l) => l.id === label.id);
		if (index === -1) {
			onaddlabel(label);
		} else {
			onremovelabel(index);
		}
	}

	async function addCustomLabel() {
		if (newLabelName.trim() && $user) {
			isCreatingLabel = true;
			try {
				const newLabel = await createLabel(
					{ name: newLabelName.trim(), color: newLabelColor },
					$user.uid
				);
				availableLabels = [...availableLabels, newLabel];
				onaddlabel(newLabel);
				newLabelName = '';
			} catch (error) {
				console.error('Error creating label:', error);
				alert($t('recipe.labelPicker.createError'));
			} finally {
				isCreatingLabel = false;
			}
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.labels')}
		</span>
		<div class="flex flex-wrap gap-2">
			{#each availableLabels as label (label.id)}
				{@const isSelected = labels.some((l) => l.id === label.id)}
				<button
					type="button"
					onclick={() => toggleLabel(label)}
					aria-pressed={isSelected}
					class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
						? 'bg-accent font-black text-ink'
						: 'bg-white font-extrabold text-ink'}"
				>
					{label.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<label for="new-label-name" class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labelPicker.newLabel')}
		</label>

		<input
			type="text"
			id="new-label-name"
			bind:value={newLabelName}
			placeholder={$t('recipe.labelPicker.namePlaceholder')}
			disabled={isCreatingLabel}
			class="focus-ring w-full border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			onkeydown={(e) =>
				e.key === 'Enter' && !isCreatingLabel && (e.preventDefault(), addCustomLabel())}
		/>

		<div class="flex items-center justify-between">
			<span class="text-[11px] font-black uppercase text-muted">
				{$t('recipe.labelPicker.colorLabel')}
			</span>
			<div class="flex gap-2">
				{#each SWATCHES as swatch (swatch.name)}
					<button
						type="button"
						aria-label={$t('recipe.labelPicker.swatchColors.' + swatch.name)}
						aria-pressed={newLabelColor === swatch.value}
						onclick={() => (newLabelColor = swatch.value)}
						class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink {SWATCH_BG_CLASS[
							swatch.name
						]} {newLabelColor === swatch.value
							? 'shadow-[inset_0_0_0_3px_var(--color-ink)]'
							: ''}"
					>
						{#if newLabelColor === swatch.value}
							<Check size={16} class="text-ink" strokeWidth={3} />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<button
			type="button"
			onclick={addCustomLabel}
			disabled={isCreatingLabel || !newLabelName.trim()}
			class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink disabled:opacity-[.45]"
		>
			{isCreatingLabel ? $t('recipe.labelPicker.adding') : $t('recipe.labelPicker.addLabel')}
		</button>

		<p class="text-xs font-semibold text-muted">{$t('recipe.labelPicker.newLabelHint')}</p>
	</div>
</div>
```

The swatch set stays at four. Widening it to the palette's ten would be discarded work if
label colors turn out to be unnecessary after the label redesign.

- [ ] **Step 2: Delete the old step component**

Delete `src/lib/components/recipe/TagsStep.svelte`. `RecipeForm.svelte` still imports it, so
`yarn check` will report that until Task 8 — which is the next task.

- [ ] **Step 3: Commit** *(owner runs this)*

```bash
git add src/lib/components/recipe/LabelPicker.svelte
git rm src/lib/components/recipe/TagsStep.svelte
git commit -m "feat: add LabelPicker and drop the combined TagsStep"
```

---

### Task 8: Wire step 2 into RecipeForm

**Files:**
- Modify: `src/lib/components/recipe/RecipeForm.svelte`

- [ ] **Step 1: Swap the imports**

Replace the `TagsStep` import with:

```ts
import CategoryPicker from '$lib/components/recipe/CategoryPicker.svelte';
import LabelPicker from '$lib/components/recipe/LabelPicker.svelte';
```

Change the `Props` interface field `availableTags: Tag[]` to `availableLabels: Label[]`, the
type import to `Label`, and the destructuring accordingly.

- [ ] **Step 2: Replace the form state**

Where the component declares `let labels = $state<Label[]>([])` (renamed from `tags` in
Task 4), add the category above it:

```ts
	let categoryId = $state<string>('');
	let labels = $state<Label[]>([]);
```

Add a field-level error beside the existing `titleError`:

```ts
	let categoryError = $state<string>('');
```

- [ ] **Step 3: Include the category in initialisation, persistence and the dirty check**

In the initialise-from-`initialData` effect, add `categoryId = initialData.categoryId;`
alongside the other assignments.

In the same effect, extend `initialSnapshot` and the draft restore. The snapshot line becomes:

```ts
		initialSnapshot = JSON.stringify({
			title,
			description,
			image,
			prepTime,
			cookTime,
			categoryId,
			labels,
			steps,
			ingredients
		});
```

and the draft restore gains `categoryId = draft.categoryId || categoryId;`.

In the save-to-`localStorage` effect, add `categoryId` to the `formData` object and to the
list of tracked dependencies at the bottom of that effect.

In `isDirty()`, add `categoryId` to the `JSON.stringify` object, in the same key order as
`initialSnapshot` — the two strings are compared directly, so a different order would report
every form as dirty.

- [ ] **Step 4: Validate the category on step 2**

`validateCurrentStep` currently handles steps 1, 3 and 4 and silently passes step 2. Reset the
new error alongside the others at the top of the function:

```ts
		categoryError = '';
```

and add the branch:

```ts
		} else if (currentStep === 2) {
			if (!categoryId) {
				categoryError = $t('recipe.validation.categoryRequired');
				isValid = false;
			}
		} else if (currentStep === 3) {
```

Add the same guard to `validateForm`, which runs on submit, so a draft restored straight onto
step 4 cannot be saved without a category. Put it directly after the title check:

```ts
		if (!categoryId) {
			error = $t('recipe.validation.categoryRequired');
			return false;
		}
```

- [ ] **Step 5: Render both pickers in the step-2 branch**

Replace the `TagsStep` line:

```svelte
	{:else if currentStep === 2}
		<CategoryPicker bind:categoryId error={categoryError} />
		<LabelPicker
			bind:labels
			bind:availableLabels
			onaddlabel={addLabel}
			onremovelabel={removeLabel}
		/>
```

The form element already sets `gap-[18px]` on its flex column, so the two sections space
themselves without extra markup. Confirm the handlers are named `addLabel` and `removeLabel`
after Task 4 and rename them if not.

- [ ] **Step 6: Submit the category**

In the form's `onsubmit`, add `categoryId` to the `recipeData` object:

```ts
				const recipeData = {
					title,
					description: description || '',
					image:
						image ||
						'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
					prepTime,
					cookTime,
					servings: servings[0] || 4,
					categoryId,
					labels,
					ingredients,
					steps
				};
```

- [ ] **Step 7: Verify**

```bash
yarn check
```

Expected: **clean, no errors anywhere.** This is the task where the whole change compiles for
the first time. Any remaining error points at a step above.

- [ ] **Step 8: Manual check of the wizard**

```bash
yarn dev
```

1. Open `/recipes/new` and go to step 2. Confirm four category chips appear with Dutch names,
   and a separate label section below them.
2. Press "Volgende" without choosing a category. Confirm it is blocked and
   "Kies een categorie" appears.
3. Choose a category. Confirm exactly one chip is filled at a time — clicking a second one
   deselects the first.
4. Create a label and confirm it appears selected and stays available.
5. Finish the recipe and confirm it saves.

- [ ] **Step 9: Commit** *(owner runs this)*

```bash
git add src/lib/components/recipe/RecipeForm.svelte
git commit -m "feat: split wizard step 2 into a category picker and a label picker"
```

---

### Task 9: Display the category

**Files:**
- Modify: `src/lib/components/RecipeCard.svelte`
- Modify: `src/lib/components/RecipeHero.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/routes/recipes/[id]/+page.svelte`

- [ ] **Step 1: `RecipeCard` takes a Category**

Replace the script block:

```svelte
<script lang="ts">
	import type { Category } from '$lib/constants/categories';
	import { t } from '$lib/i18n';

	interface Props {
		id: string;
		title: string;
		image: string;
		category?: Category;
		time?: string;
		shadowIndex: number;
	}

	let { id, title, image, category, time, shadowIndex }: Props = $props();

	const SHADOW_ROTATION = ['offset-accent', 'offset-teal', 'offset-violet', 'offset-yellow'];
	const shadowClass = $derived(SHADOW_ROTATION[shadowIndex % SHADOW_ROTATION.length]);

	const categoryName = $derived(category ? $t(category.nameKey) : '');
</script>
```

and the meta line in the markup:

```svelte
				<p class="truncate text-[9px] font-black uppercase tracking-[0.08em] text-muted">
					{categoryName}{categoryName && time ? ' · ' : ''}{time || ''}
				</p>
```

`SHADOW_ROTATION` stays at four entries. Widening it to the palette's ten-color sequence is
tracked in `docs/issues/palette-contrast-rollout.md`.

- [ ] **Step 2: `RecipeHero` takes a Category and uses its fixed text color**

Change the script block's type and add the palette helper:

```svelte
<script lang="ts">
	import { ArrowLeft, Pencil } from 'lucide-svelte';
	import type { Category } from '$lib/constants/categories';
	import { paletteStyle } from '$lib/constants/palette';
	import { t } from '$lib/i18n';

	interface Props {
		recipeId: string;
		title: string;
		image: string;
		category?: Category;
	}

	let { recipeId, title, image, category }: Props = $props();
</script>
```

and replace the badge at the bottom of the file:

```svelte
	{#if category}
		<span
			class="absolute -bottom-[14px] left-4 z-10 -rotate-2 border-2 border-ink px-3 py-[5px] text-[11px] font-black uppercase"
			style={paletteStyle(category.color)}
		>
			{$t(category.nameKey)}
		</span>
	{/if}
```

Note that `text-ink` is gone from the class list. It was hardcoded next to an inline
background, which breaks as soon as a white-text color is chosen — and four of the ten
palette colors need white. `paletteStyle` now sets both.

- [ ] **Step 3: Pass the resolved category from the overview and search on its name**

In `src/routes/+page.svelte`, change the type import to:

```ts
	import type { Label, RecipeSummaryWithLabels } from '$lib';
```

Replace the `filteredRecipes` derivation so it searches the translated category name too:

```ts
	const filteredRecipes = $derived(
		recipes.filter((recipe: RecipeSummaryWithLabels) => {
			const query = searchQuery.toLowerCase();
			const categoryName = recipe.category ? $t(recipe.category.nameKey).toLowerCase() : '';

			return (
				recipe.title.toLowerCase().includes(query) ||
				recipe.description?.toLowerCase().includes(query) ||
				categoryName.includes(query) ||
				recipe.labels?.some((label: Label) => label.name.toLowerCase().includes(query))
			);
		})
	);
```

and change the card's prop from `category={recipe.labels?.[0]}` to `category={recipe.category}`.

- [ ] **Step 4: Pass the resolved category from the detail page**

In `src/routes/recipes/[id]/+page.svelte`, change

```svelte
category={recipe.labels?.[0]}
```

to

```svelte
category={recipe.category}
```

- [ ] **Step 5: Verify**

```bash
yarn check
```

Expected: clean.

- [ ] **Step 6: Manual check of the display**

```bash
yarn dev
```

1. On the overview, confirm each card shows its real category name and cook time, and that
   the name no longer changes when a recipe's labels change.
2. Open a recipe and confirm the badge over the hero edge shows the category in its fixed
   color, with readable text. Temporarily set one category's `color` to `'bes'` in
   `categories.ts` and confirm the badge text turns white. Revert it afterwards.
3. Search for a category name, e.g. "hoofd", and confirm it filters.
4. Search for a label name and confirm it still filters.

- [ ] **Step 7: Commit** *(owner runs this)*

```bash
git add src/lib/components/RecipeCard.svelte src/lib/components/RecipeHero.svelte src/routes/+page.svelte "src/routes/recipes/[id]/+page.svelte"
git commit -m "feat: show the recipe category from constants instead of the first label"
```

---

### Task 10: Update the wizard entry points

**Files:**
- Modify: `src/routes/recipes/new/+page.svelte`
- Modify: `src/routes/recipes/[id]/edit/+page.svelte`

- [ ] **Step 1: Bump the draft key on the create page**

In `src/routes/recipes/new/+page.svelte`, change the `RecipeForm` invocation:

```svelte
		<RecipeForm
			{availableLabels}
			storageKey="recipe-draft-v2"
			submitErrorMessage={$t('recipe.validation.saveFailed')}
		/>
```

Drafts already sitting in a user's `localStorage` under `recipe-draft` carry `tags` and no
`categoryId`. A new key lets them lapse cleanly instead of half-loading into the new shape.

- [ ] **Step 2: Bump the draft key and add the category on the edit page**

In `src/routes/recipes/[id]/edit/+page.svelte`, change `storageKey` to
`` {`recipe-edit-v2-${data.recipeId}`} `` and add the category to `initialData`:

```ts
	const initialData = $derived(
		recipe
			? {
					title: recipe.title,
					description: recipe.description || '',
					image: recipe.image,
					prepTime: recipe.prepTime || '',
					cookTime: recipe.cookTime || '',
					categoryId: recipe.category?.id ?? '',
					labels: recipe.labels ? [...recipe.labels] : [],
					servings: Object.keys(recipe.ingredients).map(Number),
					currentServing: recipe.servings || Object.keys(recipe.ingredients).map(Number)[0],
					ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
					steps: [...recipe.steps]
				}
			: undefined
	);
```

`recipe.category?.id ?? ''` matters: the view model resolves an unknown id to `undefined`, and
an empty string then makes step 2 demand a fresh choice rather than silently saving the recipe
without a category.

- [ ] **Step 3: Verify**

```bash
yarn check
```

Expected: clean.

- [ ] **Step 4: Manual check of editing**

```bash
yarn dev
```

Edit an existing recipe. Confirm step 2 opens with its current category already selected and
its labels already ticked, change the category, save, and confirm the detail page badge
updates.

- [ ] **Step 5: Commit** *(owner runs this)*

```bash
git add src/routes/recipes/new/+page.svelte "src/routes/recipes/[id]/edit/+page.svelte"
git commit -m "feat: carry the category through the create and edit entry points"
```

---

### Task 11: Delete the dead files

**Files:**
- Delete: `src/routes/recipes/new/+page.ts`
- Delete: `src/routes/recipes/new/+page.server.ts`

`src/lib/stores/recipe-form.store.ts` was already deleted in Task 4, because it imports `Tag`
and would have failed that task's type-check.

- [ ] **Step 1: Confirm the create page ignores its route data**

```bash
grep -n "data" src/routes/recipes/new/+page.svelte
```

Expected: no `let { data }` prop and no use of `data`. That is what makes `+page.ts` dead —
its `load` runs on every navigation and the return value is discarded, because the page
fetches labels itself in `onMount`.

If the grep contradicts this, stop and report rather than deleting.

- [ ] **Step 2: Delete the two files**

```bash
git rm src/routes/recipes/new/+page.ts src/routes/recipes/new/+page.server.ts
```

`+page.ts` returns 35 hardcoded English tags that nothing reads. `+page.server.ts` contains
only a comment stating it is unused.

- [ ] **Step 3: Verify**

```bash
yarn check
```

Expected: clean.

- [ ] **Step 4: Manual check that the create page still loads**

```bash
yarn dev
```

Open `/recipes/new`. Deleting a `+page.ts` changes route data loading, so confirm the page
still renders and the label list still populates.

- [ ] **Step 5: Commit** *(owner runs this)*

```bash
git commit -m "chore: remove the dead route loaders on the create page"
```

---

### Task 12: Final verification

**Files:** none

- [ ] **Step 1: Type-check the whole project**

```bash
yarn check
```

Expected: zero errors, zero warnings introduced by this change.

- [ ] **Step 2: Confirm no trace of the old vocabulary remains**

```bash
grep -rn "\bTag\b\|tagIds\|tagService\|availableTags\|getAllTags\|recipe\.tags\|RecipeWithTags\|RecipeSummaryWithTags" src
grep -rn "'tags'\|\"tags\"" src
```

Expected: no output from either. The second catches a missed Firestore collection name, which
would silently read from the wrong collection at runtime rather than failing to compile — so
it matters more than the first.

- [ ] **Step 3: Build**

```bash
yarn build
```

Expected: succeeds. This catches SSR-only problems that `svelte-check` does not.

- [ ] **Step 4: Walk the whole flow once**

```bash
yarn dev
```

1. Overview shows every recipe with the right category and time.
2. Search finds a recipe by category name and by label name.
3. Create a recipe: step 2 blocks without a category, accepts one category at a time, allows
   creating a label, and saves.
4. Detail page shows the badge in the category's fixed color with readable text.
5. Edit that recipe: category and labels are pre-filled; changing the category persists.
6. A second recipe can select the label created in step 3.

- [ ] **Step 5: Report the remaining open item**

The four category colors in `categories.ts` still carry a `TODO`. Confirm with the owner
whether the palette's suggested mapping stands, in particular `main` on `koraal` given that
koraal is also the action color.

---

## Deferred, with issues already filed

- `docs/issues/label-lookup-n-plus-one.md` — `populateLabels` still does one `getDoc` per
  label, per recipe, per snapshot.
- `docs/issues/palette-contrast-rollout.md` — `muted` → `muted-strong`, `accent-diep` for
  white-on-accent buttons, and the ten-color shadow rotation.
- `docs/issues/unreachable-en-locale.md` — the English locale cannot be reached, and the two
  i18n documents describe a switcher that no longer exists.
- Displaying labels, and a category filter on the overview, both await their own design.
