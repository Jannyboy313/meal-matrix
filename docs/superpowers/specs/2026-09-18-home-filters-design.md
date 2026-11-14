# Filtering the recipe overview by category and label

**Date:** 2026-09-18
**Status:** approved design, ready for an implementation plan
**Design sources:** owner mockup of the filter sheet (mobile), `design/Meal Matrix - kleurenpalet.dc.html`
**Picks up:** the "category filter on the overview, and filtering by label" item that
`docs/superpowers/specs/2026-09-04-labels-categories-separation-design.md` deliberately deferred

## Problem

The overview has one input for three questions.

`src/routes/+page.svelte` filters a single free-text box across four fields at once: title,
description, translated category name, and label names. Typing `brood` therefore behaves as a
category filter, but an invisible one — nothing on screen says a category constraint is active,
and the only way to remove it is to clear the search term you also wanted to keep.

There is no way to ask for two labels at once, no way to combine a category with a search term,
and no way to share or reload a search: the query lives in component state and dies with the
page.

Categories and labels became separate first-class concepts in the 2026-09-04 work. The overview
never caught up.

## Target

Three filter dimensions, combined with AND:

- **Free text** (`query`) — substring match on title, description, and label names
- **Category** (`categoryKeys`) — OR within the group; a recipe has exactly one category
- **Label** (`labelSlugs`) — AND within the group; every selected label must be present

The search bar stays where it is. A filter button beside it opens a bottom sheet holding the
category and label chips. Filtering is live: each tap updates the list behind the sheet and the
URL immediately. The whole filter state is readable and shareable as query parameters.

## Decisions

| Decision | Rationale |
| --- | --- |
| Free text no longer matches the category name | Categories get a visible, removable control; matching them in the text box too would keep the invisible filter this work exists to remove. It also keeps `filterRecipes` free of any i18n dependency |
| Multiple labels combine with AND, categories with OR | A recipe has exactly one category, so AND across categories would always return nothing. Across labels, AND is what a filter panel implies: each tap narrows |
| Labels are matched by slugified name, not by Firestore id | The URL is a shared surface; opaque auto-ids do not belong in it. This mirrors *Firestore is an export format* from the 2026-09-04 spec |
| Filtering is live, not applied on confirm | The owner's choice. The button keeps its result count so it reads as "close and see these 8" |
| Every URL write uses `replaceState` | Live filtering would otherwise create a history entry per tap and per typed character, making the back button useless for leaving the page. "Wis alles" is the intended undo |
| All five categories are always shown; labels are derived from the loaded recipes | Categories are a closed set of five in code, so the section can stand still. Labels are open-ended and fetching unused ones would cost two extra Firestore queries for chips that return nothing |
| The category chip keeps an ink border; only the fill carries the category colour | A `limoen` (#9BDE1E) border on white reaches ~1,6:1 and `geel` (#FFC400) ~1,5:1, against WCAG's 3:1 for non-text UI. See *Why the border stays ink* |
| `FilterSheet` never touches the URL | The page owns every write. The sheet takes values and callbacks, so it can be reasoned about without a router |
| Vitest is added, for the pure modules only | The filter and URL logic are the first code in this project with enough branching to regress silently. Component tests stay out |

### Out of scope

- **Sorting the overview**, and filtering on prep or cook time.
- **The label lookup N+1.** See `docs/issues/label-lookup-n-plus-one.md`. This work does not
  make it worse: it reads the labels already populated on each recipe and issues no new queries.
- **The palette's app-wide contrast rollout.** See `docs/issues/palette-contrast-rollout.md`.
  The chips resolve their own contrast through `paletteStyle()`.
- **The dead English locale.** See `docs/issues/unreachable-en-locale.md`. New keys are added to
  both locales anyway, so the file does not drift further out of sync.

## Filter logic

### `src/lib/filters/recipeFilter.ts`

Pure: no Svelte, no Firestore, no i18n.

```ts
export interface RecipeFilter {
	/** Free text; matched case-insensitively against title, description and label names */
	query: string;
	/** OR within the group. Empty means no constraint */
	categoryKeys: string[];
	/** AND within the group. Empty means no constraint. Slugs, not ids — see filterParams */
	labelSlugs: string[];
}

export const EMPTY_FILTER: RecipeFilter;

export function filterRecipes(
	recipes: RecipeSummaryWithLabels[],
	filter: RecipeFilter
): RecipeSummaryWithLabels[];

/** True when any dimension constrains the result. Drives the empty-state message */
export function isFilterActive(filter: RecipeFilter): boolean;

/** Number of selected chips, for the button badge. Excludes the free-text query */
export function activeFilterCount(filter: RecipeFilter): number;
```

The three groups combine with AND. Within a group, an empty array means "no constraint" rather
than "match nothing", so the empty filter returns every recipe.

Edge cases the implementation must honour:

- A recipe whose `category` is `undefined` — the key resolved to nothing, which
  `getCategoryByKey` allows — matches no category filter, but is still returned when the
  category group is empty.
- A recipe with no labels matches no label filter.
- A label slug that matches nothing returns an empty list. It is not silently dropped; see
  *Unknown slugs are not sanitised*.

### Why labels are matched by slug

`filterRecipes` slugifies each recipe's label names and compares them to `filter.labelSlugs`.
There is no name-to-id lookup, and the function needs no label set passed in.

Two consequences, both wanted:

- Two labels that slugify to the same value behave as one filter term.
- The module stays free of any dependency on the label collection.

The cost is that renaming a label breaks links that reference it. That is accepted: a
readable, shareable URL is worth more here than link permanence in a personal recipe app.

### Unknown slugs are not sanitised

A slug in the URL that matches none of the user's labels yields an empty result, together with
the empty state and its "Wis alles" escape.

The alternative — dropping unknown slugs against the known label set — is rejected on two
grounds. The label set only exists after the recipes have loaded, so sanitising would have to
race the subscription. And silently discarding a filter the user can read in their own address
bar is worse than showing them honestly that it matched nothing.

Category keys are different: they are a closed set in code, so they *are* validated on parse.
This asymmetry is deliberate and should be stated in the module's comments.

## URL contract

### `src/lib/filters/filterParams.ts`

```ts
/**
 * "Zonder gluten" -> "zonder-gluten", "Crème brûlée" -> "creme-brulee".
 * Trimmed, lowercased, NFD-normalised with combining marks removed, runs of whitespace
 * collapsed to a single hyphen, every remaining character outside [a-z0-9-] dropped.
 */
export function slugify(name: string): string;

/** Unknown category keys are dropped; unknown label slugs are kept. See above */
export function parseFilterParams(params: URLSearchParams): RecipeFilter;

/** Returns "" for the empty filter, so a clean overview has a clean URL */
export function toSearchString(filter: RecipeFilter): string;
```

Shape:

```
/?q=pasta&category=main,bread&label=vega,surinaams
```

Parameter names are English because the values already are: `main` and `bread` are the
`CategoryKey` values from `src/lib/constants/categories.ts`. `categorie=main` would be half a
translation.

Parsing is forgiving — empty segments, stray whitespace and duplicate values in
`category=main,,bread` are all tolerated — because the string is user-editable.

### URL as the source of truth

`categoryKeys` and `labelSlugs` are derived from `page.url.searchParams` and written back on
every tap. There is no second copy of that state.

The search term is the exception. It is local `$state` so typing responds immediately, and it
is written to the URL debounced at 250ms. It is seeded from `q` on first load. The list itself
filters on every keystroke, undebounced — only the URL write waits. The term is trimmed before
matching, so a trailing space does not empty the overview.

Because every write uses `replaceState`, no filter change produces a history entry, and the
search input never needs to be re-synced from an external navigation. Writes also pass
`keepFocus: true` and `noScroll: true`, so typing is not interrupted and the grid does not jump.

## Interface

### Layout

```
+page.svelte
├─ header (title, live recipe count, AccountMenu)
├─ div.flex.items-stretch.gap-3
│  ├─ SearchBar            flex-1, unchanged
│  └─ FilterButton         new
├─ grid -> RecipeCard
├─ EmptyState + "Wis alles" (only when a filter is active)
├─ FilterSheet             new
│  └─ FilterChip           new
└─ FloatingActionButton
```

`items-stretch` on the row makes the filter button match the input height without a magic
number.

### `FilterButton.svelte`

Square, `border-2 border-ink offset-violet bg-white`, `SlidersHorizontal` from lucide-svelte.

A badge appears only when `activeFilterCount > 0`: `absolute -top-2 -right-2`, `bg-accent
text-ink border-2 border-ink rounded-full`. The badge is visual only, so the button's
`aria-label` names the count in words. Also `aria-haspopup="dialog"` and `aria-expanded`.

### `FilterChip.svelte`

```ts
interface Props {
	text: string;
	selected: boolean;
	/** Category chips only. Label chips have no colour, by design */
	color?: PaletteToken;
	onclick: () => void;
}
```

The border is always `border-2 border-ink`. Three states:

| State | Background | Text |
| --- | --- | --- |
| not selected | `bg-white` | `text-ink` |
| selected, category | inline `paletteStyle(color)` | set by `paletteStyle` |
| selected, label | `bg-accent` | `text-ink` |

`paletteStyle()` emits background and the one text colour that reaches AA on it, as a single
inline `style`. Inline styles beat classes, so contrast cannot be broken by a stray utility
class. Chips carry `aria-pressed`.

### Why the border stays ink

The original request was for the chip border to carry the category colour instead of black.
Measured against white, four of the five category colours fail WCAG's 3:1 minimum for non-text
UI components — `limoen` at roughly 1,6:1 and `geel` at roughly 1,5:1 are the worst. A border
in those colours is not a subtle accessibility infraction; it is close to invisible on paper.

The colour therefore lives in the fill, which `paletteStyle()` already pairs with a compliant
text colour. The ink border also matches every other bordered surface in the app.

Two rejected alternatives are recorded so they are not re-litigated: a 4px colour bar inside
the ink border, and adding four darkened border tokens to the palette. Both work; both were
judged not worth their cost here.

### `FilterSheet.svelte`

Presentational. It receives values and callbacks and performs no navigation.

The parent renders it conditionally rather than passing an `open` flag, so the `$effect` cleanup
that restores body scrolling is tied to the component's own lifetime.

```ts
interface Props {
	categoryKeys: string[];
	labelSlugs: string[];
	/** Derived from the loaded recipes, deduplicated by slug, sorted by name */
	availableLabels: Label[];
	resultCount: number;
	ontogglecategory: (key: string) => void;
	ontogglelabel: (slug: string) => void;
	onclear: () => void;
	onclose: () => void;
}
```

```
overlay  fixed inset-0 z-50 bg-ink/40                 click closes
sheet    fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto
         border-t-2 border-ink bg-paper
         pb-[calc(22px+env(safe-area-inset-bottom))]

┌──────────────────────────────────────┐
│ Filters                    Wis alles │
│                                      │
│ CATEGORIE                            │
│ [VOORGERECHT][HOOFDGERECHT][DESSERT] │
│ [BROOD][BAKKEN]                      │
│                                      │
│ LABEL                                │
│ [VEGA][SURINAAMS][VLEES]             │
│                                      │
│ ▓▓▓ TOON 8 RECEPTEN ▓▓▓              │
└──────────────────────────────────────┘
```

- All five categories, always, in the order of `CATEGORIES`.
- The label section is hidden entirely when the user has no labels, rather than rendering an
  empty heading.
- The confirm button reads `SLUITEN` when `resultCount` is 0; "Toon 0 recepten" reads as a dead
  end.
- Plural handling reuses the pattern already in the locale files:
  `Toon {{count}} recept{{count !== 1 ? 'en' : ''}}`.
- Corners stay square. Nothing in the app uses a border radius, and the mockup's rounded top is
  the only place it appears.
- The sheet is the same at every breakpoint. No desktop variant.

### Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the title.
- On open, focus moves to the sheet container (`tabindex="-1"`) so the title is announced.
- Escape closes and returns focus to `FilterButton`, following the pattern already in
  `AccountMenu.svelte`. `FilterButton` exposes its element as a `$bindable` prop so the page can
  focus it; without that, closing the sheet drops a keyboard user at the top of the document.
- Tab cycles within the sheet. The existing discard dialog in `RecipeForm.svelte` does not trap
  focus, but it holds two buttons; this sheet holds ten or more, and tabbing out into the grid
  behind it is genuinely disorienting.
- `document.body.style.overflow` is set to `hidden` while open and restored in the `$effect`
  cleanup.
- The recipe count in the page header gets `aria-live="polite"`, so live filtering is audible.
- Clicking the backdrop closes the sheet.

### Empty state

`EmptyState` takes only a `message`, and that API is left alone. The "Wis alles" button is
rendered beside it in `+page.svelte`.

The message switches on `isFilterActive(filter)` rather than on the search term alone, which is
what the current code does. Without the clear button, a shared URL whose label slug matches
nothing leaves the user on a dead screen.

### Reuse: the two existing pickers

`CategoryPicker.svelte` and `LabelPicker.svelte` each hold their own copy of the same chip
markup, which `FilterChip` now makes a third copy of. Both are moved onto `FilterChip`.

This has one visible consequence: a selected category in the recipe wizard becomes its category
colour instead of accent, so categories look the same everywhere in the app. The step is
separable and can be dropped without affecting the rest of this work.

## Internationalisation

New keys under `recipe.filters` in both `nl` and `en`:

| Key | nl |
| --- | --- |
| `title` | Filters |
| `clearAll` | Wis alles |
| `category` | Categorie |
| `label` | Label |
| `open` | Filters openen |
| `openWithCount` | Filters openen, {{count}} actief |
| `showResults` | Toon {{count}} recept{{count !== 1 ? 'en' : ''}} |
| `close` | Sluiten |
| `dismiss` | Filters sluiten |

## Testing

Vitest is added as a devDependency, with a `test` script and a `test` block in `vite.config.ts`
using `environment: 'node'`. Only the two pure modules are covered; there are no component
tests.

`recipeFilter.test.ts`:

- the empty filter returns every recipe
- `query` matches title, description and label name, case-insensitively
- multiple category keys behave as OR
- multiple label slugs behave as AND
- the three groups combine as AND
- a recipe with an unresolved category matches no category filter, but survives an empty one
- a recipe with no labels matches no label filter
- a slug matching nothing yields an empty result

`filterParams.test.ts`:

- `toSearchString` then `parseFilterParams` round-trips
- the empty filter serialises to `""`
- `slugify` strips diacritics and converts spaces
- `category=main,,bread` with stray whitespace parses cleanly
- an unknown category key is dropped
- an unknown label slug is kept

## Files

New:

- `src/lib/filters/recipeFilter.ts` + `recipeFilter.test.ts`
- `src/lib/filters/filterParams.ts` + `filterParams.test.ts`
- `src/lib/components/FilterButton.svelte`
- `src/lib/components/FilterChip.svelte`
- `src/lib/components/FilterSheet.svelte`

Changed:

- `src/routes/+page.svelte` — filter state, URL reads and writes, layout row, empty state
- `src/lib/i18n/locales/nl/recipe.json` and `src/lib/i18n/locales/en/recipe.json`
- `src/lib/components/recipe/CategoryPicker.svelte` and `LabelPicker.svelte` — onto `FilterChip`
- `package.json`, `vite.config.ts` — vitest
