# Separating categories from labels

**Date:** 2026-09-04
**Status:** approved design, ready for an implementation plan
**Design sources:** `.github/design_handoff_meal_matrix_redesign/` and `design/Meal Matrix - kleurenpalet.dc.html`

## Problem

The codebase has one concept where it needs two.

Today there is only `Tag`: a Firestore document with a name and a hex color, created by the
user, attached to a recipe through `tagIds[]`. The UI then treats the *first* tag in that
array as if it were the recipe's category. `src/routes/+page.svelte` passes
`recipe.tags?.[0]` into `RecipeCard` as `category`, and the detail page does the same into
`RecipeHero`. Step 2 of the wizard lives in `TagsStep.svelte` but is labelled "Categorie"
in the interface, and its create-form says "Nieuwe categorie" while writing a tag document.

The consequences are concrete: the category shown on a card depends on array order, a user
who reorders or removes a tag silently changes their recipe's category, and there is no way
to say "this is a main course" separately from "this is spicy".

## Target

Two distinct concepts.

**Categories** are a closed set defined in code: Voorgerecht, Hoofdgerecht, Dessert, Brood, Bakken.
Each has one fixed color that never changes. A recipe has exactly one, and it is required.

**Labels** are open and user-created, stored in Firestore exactly as tags are today. A recipe
has zero or more. They are saved and selectable now, but not yet displayed anywhere — their
presentation is waiting on its own design.

## Decisions

| Decision | Rationale |
| --- | --- |
| Categories are code constants, stored in the database as UUIDs | Names can then be changed without touching data, and the set cannot drift per user |
| Category names resolve through i18n keys, not literals | Every other UI string in the app goes through `$t`; a literal here would be the only exception |
| Labels keep their hex color, unchanged | Whether labels need colors at all is an open question until their redesign; changing storage now risks throwing away work |
| Full rename in code *and* Firestore: `Tag` → `Label`, collection `tags` → `labels` | Leaving the collection named `tags` would keep a permanent code/database mismatch, which is the confusion this work exists to remove |
| Two separate picker components, no wrapper | Each has one job, and the label side can be replaced wholesale when its design lands without touching the category side |
| Migration is handled outside this work | The owner is writing it; the implementation may assume `categoryId` is present on every recipe |

### Out of scope

- **Displaying labels.** Selected and stored, not rendered. Awaiting design.
- **A category filter on the overview.** Search continues to match category and label names.
- **The label lookup N+1.** See `docs/issues/label-lookup-n-plus-one.md`.
- **The palette's app-wide contrast changes.** See `docs/issues/palette-contrast-rollout.md`.
- **The dead English locale.** See `docs/issues/unreachable-en-locale.md`.

## Data model

### Category — code only, never in Firestore

```ts
type CategoryKey = 'starter' | 'main' | 'dessert' | 'bread' | 'baking';

interface Category {
  id: string;            // stable UUID; the only part that reaches the database
  key: CategoryKey;      // for code references
  nameKey: string;       // i18n key, e.g. 'recipe.categories.main'
  color: PaletteToken;   // reference into the palette, not a hex value
}
```

The four UUIDs below are the **contract with the migration script**. Either the migration
writes these exact values, or they are replaced here before it runs. They must not change
afterwards.

```ts
export const CATEGORIES: readonly Category[] = [
  { id: 'b7c9e1a4-3f52-4d8e-9a16-2c5d7e8f0b31', key: 'starter', nameKey: 'recipe.categories.starter', color: /* TODO */ },
  { id: 'd4e2f8a1-6b39-4c7e-8f52-1a9d3c6b4e78', key: 'main',    nameKey: 'recipe.categories.main',    color: /* TODO */ },
  { id: 'f1a3c5e7-9d24-4b6f-a83c-5e7f1b9d2a46', key: 'dessert', nameKey: 'recipe.categories.dessert', color: /* TODO */ },
  { id: 'a9d7b3f5-2e18-4c6a-b47d-8f3e1c5a9b62', key: 'bread',   nameKey: 'recipe.categories.bread',   color: /* TODO */ }
] as const;
```

`getCategoryById(id: string): Category | undefined` resolves synchronously from this array.
No Firestore read is involved. An id that matches nothing returns `undefined`, and every
consumer must render without a category rather than throw — a recipe whose category was
mistyped during migration still has to open.

**The four color choices are left to the owner.** The palette's own swatches suggest
Hoofdgerecht on koraal, Dessert on geel, Brood on violet and Voorgerecht on roze, but note
that koraal is also the action color and palette rule 01 warns against that overlap. Each
entry carries a `TODO` until filled in.

### Label — Firestore, shape unchanged

```ts
interface Label {
  id: string;
  name: string;
  color: string;      // hex, exactly as tags store it today
  userId?: string;
  isGlobal?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### Recipe

`RecipeSummary` and `Recipe` replace `tagIds: string[]` with:

```ts
categoryId: string;    // required
labelIds: string[];
```

The view models become `RecipeSummaryWithLabels` and `RecipeWithLabels`:

```ts
category?: Category;   // optional: an unresolvable id yields undefined
labels: Label[];
```

`RecipeFormData` replaces `tags: Tag[]` with `categoryId: string` and `labels: Label[]`.

## Palette

The palette document defines ten category colors, each carrying one fixed text color — six
ink, four white. That text color follows from the contrast ratio, not from context, so it
belongs next to the color rather than at the call site.

`src/routes/layout.css` already declares four of the ten in its `@theme` block. The six new
ones are added there, so CSS stays the single source of truth for hex values:

| Token | Hex | Text | Ratio |
| --- | --- | --- | --- |
| koraal | `#FF5C35` | ink | 5,9:1 |
| geel | `#FFC400` | ink | 11,4:1 |
| teal | `#2ED3B7` | ink | 9,7:1 |
| violet | `#6C5CE7` | white | 4,8:1 |
| roze | `#FF6FA5` | ink | 7,0:1 |
| limoen | `#9BDE1E` | ink | 11,2:1 |
| hemel | `#4CC3F5` | ink | 9,1:1 |
| bes | `#9B1B6E` | white | 7,6:1 |
| bosgroen | `#16714A` | white | 6,0:1 |
| kaneel | `#7A4A1E` | white | 7,4:1 |

`src/lib/constants/palette.ts` stores the CSS variable name and the text color, not the hex:

```ts
export const PALETTE = {
  koraal: { cssVar: '--color-accent', on: 'ink' },
  bes:    { cssVar: '--color-bes',    on: 'white' },
  // ... ten in total
} as const;

export type PaletteToken = keyof typeof PALETTE;
```

Consumers build an inline style from it — `background-color: var(--color-bes); color: var(--color-ink)`.
Keeping the hex out of TypeScript means a color correction happens in one file and cannot
drift between the stylesheet and the constants.

## Files

**New**

- `src/lib/constants/palette.ts` — the ten tokens and `PaletteToken`
- `src/lib/constants/categories.ts` — the four categories and `getCategoryById`
- `src/lib/components/recipe/CategoryPicker.svelte`
- `src/lib/components/recipe/LabelPicker.svelte`

**Renamed**

- `src/lib/services/tagService.ts` → `labelService.ts`, with `getAllLabels`, `getLabelById`,
  `populateLabels`, `createLabel`, `populateRecipeLabels`, `populateRecipeSummaryLabels`
- `Tag` → `Label`, `tagIds` → `labelIds`, `RecipeWithTags` → `RecipeWithLabels`,
  `RecipeSummaryWithTags` → `RecipeSummaryWithLabels` across `types.ts`, `index.ts`,
  `recipeService.ts` and every consuming component
- Firestore collection `tags` → `labels`

**Deleted**

- `src/lib/components/recipe/TagsStep.svelte` — replaced by the two pickers
- `src/routes/recipes/new/+page.ts` — dead: its `load` returns 35 hardcoded English tags
  that the page never reads, because `new/+page.svelte` fetches from Firestore in `onMount`
- `src/routes/recipes/new/+page.server.ts` — contains only a comment saying it is unused

## Step 2 of the wizard

`RecipeForm.svelte` renders both pickers directly in its `currentStep === 2` branch. There is
no wrapper component; the step is two independent sections stacked in the form.

### CategoryPicker

```
Props: categoryId (bindable string), error?: string
```

A `flex-wrap` row of four chips read from `CATEGORIES`, single-select, with the required
marker after the section label. Selection uses `accent` with **ink** text.

The current `TagsStep` renders its selected chip as `bg-accent text-white`, which is 3,1:1 —
the palette marks that combination "niet gebruiken". This is new code, so it uses ink on
accent from the start rather than reproducing a known contrast failure. Repairing the
existing occurrences elsewhere is tracked separately.

### LabelPicker

```
Props: labels (bindable Label[]), availableLabels (bindable Label[]),
       onaddlabel: (label: Label) => void, onremovelabel: (index: number) => void
```

Behaviourally identical to today's tag section: toggle existing labels on and off, or create
a new one from a name plus one of the four existing swatches, written to Firestore as a hex.
Only the copy changes, from "categorie" to "label".

The swatch set stays at four rather than widening to ten. If label colors turn out to be
unnecessary after their redesign, widening now would be discarded work.

## Validation and drafts

Step 2 currently has **no validation at all** — `validateCurrentStep` handles steps 1, 3 and
4 and falls through for 2. Category is required, so:

- `validateCurrentStep` gains a step-2 branch that blocks "Volgende" when `categoryId` is empty
- `validateForm`, which runs on submit, checks `categoryId` as well, so a draft restored
  directly onto step 4 cannot be saved without one

Draft keys move to `recipe-draft-v2` and `recipe-edit-v2-{id}`. Drafts already in a user's
`localStorage` carry `tags` and no `categoryId`; under a new key they lapse cleanly instead of
half-loading into the new shape.

## Display

- **`RecipeCard`** takes `category?: Category` instead of `category?: Tag` and renders
  `CATEGORIE · TIJD` unchanged in form, with the name resolved through `$t(category.nameKey)`.
- **`RecipeHero`** takes `category?: Category` and renders the badge overhanging the hero edge
  with both the fixed background *and* the fixed text color. It currently hardcodes
  `text-ink` alongside an inline background, which breaks the moment a white-text color is
  chosen — four of the ten need white.
- **`src/routes/+page.svelte`** passes the resolved category instead of `recipe.tags?.[0]`, and
  its search predicate matches title, description, the translated category name, and label names.

## i18n

New keys in both `nl/recipe.json` and `en/recipe.json`. The English locale is currently
unreachable (see the issue), but the two files are in exact key parity today and parity is
cheap to keep.

Note that `recipe.labels.*` is **already taken**: it is the block of form *field* labels
(`labels.name`, `labels.description`, `labels.category`, …). The label-picker strings cannot
move there without colliding, so they get their own block.

**New keys**

- `recipe.categories.starter` / `.main` / `.dessert` / `.bread` — the four display names
- `recipe.labels.labels` — field label above the label picker (this block is the right home
  for it: the block means "field labels", and the field is called Labels)
- `recipe.steps.categoryLabels` — replaces `recipe.steps.tags` ("Tags") as the step-2 title
- `recipe.validation.categoryRequired` — the new step-2 error

**Moved**

The `recipe.tags.*` block becomes `recipe.labelPicker.*`, keeping `namePlaceholder`, `adding`,
`colorLabel` and `swatchColors.*` as they are. Three of its strings change meaning rather than
just moving:

- `newCategory` → `newLabel` ("Nieuw label")
- `addCategory` → `addLabel` ("Label toevoegen")
- `createError` — reworded from "Tag maken mislukt" to label wording
- `newCategoryHint` is dropped. It promises "Nieuwe categorieën komen ook in het filter op het
  overzicht", and there is no filter and categories are no longer user-created. It is replaced
  by a hint describing what a label is for.

**Unused after this change**

- `recipe.labels.tags` ("Tags") and `recipe.steps.tags` ("Tags") — both removed.

The category section heading reuses the existing `recipe.labels.category`, which already says
"Categorie" and now finally means it.

## Verification

This project has **no test runner** — no vitest, no test files, and `package.json` exposes only
`dev`, `build`, `preview`, `check` and `setup:certs`. Adding test tooling is its own piece of
work and is not part of this change. Verification is therefore:

1. `yarn check` — `svelte-check` over the whole project. The rename touches many files, so this
   is the primary safety net and must be clean.
2. A manual walkthrough: create a recipe through all four steps, confirm step 2 blocks without
   a category, confirm the badge on the detail page shows the right color *and* readable text,
   confirm the overview card shows category and time, confirm a newly created label persists
   and is selectable on a second recipe, and confirm search finds a recipe by its category name
   and by a label name.
3. Editing an existing recipe preserves its category and labels.

## Open item

The four category colors carry a `TODO` and must be chosen before this ships. Everything else
in the design is settled.
