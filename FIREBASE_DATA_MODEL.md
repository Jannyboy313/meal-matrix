# Firebase Data Model - Meal Matrix

**Last verified against the code:** 2026-09-04

## Overview

Firestore holds two collections. The model follows three principles:

- **Firestore is an export format, not an implementation detail.** The raw JSON is meant to be
  taken out of Firestore and used elsewhere, so a document has to be readable on its own,
  without the codebase next to it. This is why a recipe stores a category *name* and not an
  opaque id — see [Design decisions](#design-decisions).
- **Denormalise for readability, keep a stable key for code.** Where the two goals conflict, a
  field carries both: a key the app reads and a human-readable value it does not.
- **User ownership on every document.** Both collections carry `userId`.

---

## Collections structure

```
/labels/{labelId}
/recipes/{recipeId}
```

Categories are **not** a collection. They are code constants in
`src/lib/constants/categories.ts`; see [Categories](#categories-not-a-collection).

---

## Data models

### 1. Label collection (`/labels/{labelId}`)

**Purpose:** reusable free-form keywords that recipes reference by id. Supports both global
(system) labels and user-created ones.

```typescript
interface Label {
  id: string;           // Firestore auto-ID, from addDoc
  name: string;         // Sentence case, e.g. "Meal prep"; uppercased by CSS at display time
  userId?: string;      // Owner (absent for global labels)
  isGlobal?: boolean;   // True for system labels available to all users
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**A label has no colour.** It is never rendered as a filled area — only as one typographic line
under the recipe title — so a colour field would carry no meaning. The `color` field that the
old `tags` collection had was removed deliberately; do not add it back. See
`.github/design_handoff_meal_matrix_labels/README.md`.

**Example:**

```json
{
  "name": "Meal prep",
  "userId": "user-abc-456",
  "isGlobal": false,
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>"
}
```

**Reachability constraint.** `getAllLabels` runs exactly two equality queries and unions the
results: `isGlobal == true` and `userId == <current user>`. A document matching neither is
invisible in the picker, even though recipes referencing it still render it correctly on the
detail page. Every label needs a `userId` or `isGlobal: true`.

---

### 2. Recipe collection (`/recipes/{recipeId}`)

**Purpose:** full recipe details, with the category embedded and labels referenced by id.

```typescript
interface Recipe {
  id: string;               // Firestore auto-ID, from addDoc
  title: string;
  description: string;
  image: string;            // URL

  category: StoredCategory; // Embedded, see below
  labelIds: string[];       // References into /labels

  prepTime: string;
  cookTime: string;
  servings: number;         // Default serving size

  // Object keyed by serving size. Firestore stores numeric keys as strings.
  ingredients: {
    [servingSize: number]: Ingredient[]
  };

  steps: string[];

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId?: string;
}

/** The category as stored on a recipe. */
interface StoredCategory {
  key: string;   // One of the five category keys
  name: string;  // Denormalised Dutch name; the app never reads this
}

/** View model, assembled in recipeService. */
interface RecipeWithLabels extends Omit<Recipe, 'category' | 'labelIds'> {
  category?: Category;  // Resolved from constants by key; undefined if the key is unknown
  labels: Label[];      // Populated from /labels
}
```

**Example:**

```json
{
  "title": "Belgische stoofpot",
  "description": "Klassieke stoofpot met donker bier",
  "image": "https://example.com/image.jpg",
  "category": { "key": "main", "name": "Hoofdgerecht" },
  "labelIds": ["x7Kp2QmVn8Rt", "aB3dEf9HijKl"],
  "prepTime": "30 min",
  "cookTime": "3 uur",
  "servings": 4,
  "ingredients": {
    "2": [{ "amount": "350 g", "name": "Runder sukadelappen" }],
    "4": [{ "amount": "700 g", "name": "Runder sukadelappen" }]
  },
  "steps": ["Snijd het vlees in blokken", "..."],
  "userId": "user-123"
}
```

---

## Categories, not a collection

The five categories are `readonly` constants in `src/lib/constants/categories.ts`:

| `key` | `name` | Colour token |
| --- | --- | --- |
| `starter` | Voorgerecht | `geel` |
| `main` | Hoofdgerecht | `limoen` |
| `dessert` | Dessert | `bes` |
| `bread` | Brood | `violet` |
| `baking` | Bakken | `kaneel` |

Three things stay in code because putting them in the database gains nothing: the closed set
itself (validation), the colour mapping, and the options the picker offers.

- `getCategoryByKey(key)` resolves a stored key synchronously. **No Firestore read is involved**
  — displaying a category costs nothing.
- An unknown key returns `undefined`. Every consumer renders without a category rather than
  throwing, so a recipe carrying a removed or mistyped key still opens.
- `toStoredCategory(key)` builds the document field, so the denormalised name is produced in
  exactly one place.

Display goes through `$t(category.nameKey)`; Firestore receives `category.name`. Those hold the
same words and must be kept in sync when a category is renamed.

---

## Query patterns, as actually implemented

These are the only queries the app runs. All are single-field equality, so Firestore's
automatic single-field indexes cover them — **no composite index is required**.

### Recipes for the signed-in user, live

`subscribeToUserRecipes` in `src/lib/services/recipeService.ts`:

```typescript
const q = query(collection(db, 'recipes'), where('userId', '==', userId));
onSnapshot(q, async (snapshot) => { /* ... */ });
```

There is no `orderBy`. Ordering and filtering happen in the client — `src/routes/+page.svelte`
filters on title, description, category name and label names in a `$derived`.

### One recipe by id

```typescript
const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));
```

### All labels available to a user

`getAllLabels` in `src/lib/services/labelService.ts` — two queries in parallel, unioned:

```typescript
const globalQuery = query(collection(db, 'labels'), where('isGlobal', '==', true));
const userQuery = query(collection(db, 'labels'), where('userId', '==', userId));
```

### One label by id

```typescript
const labelDoc = await getDoc(doc(db, 'labels', labelId));
```

`populateLabels` calls this once per id, per recipe, on every snapshot. That is an N+1 and it is
known — see `docs/issues/label-lookup-n-plus-one.md`. It was left in place deliberately;
performance is not a current goal.

---

## Design decisions

### Category embedded as `{ key, name }`

**Decision:** store both a stable key and the human-readable name on the recipe.

**Rationale:** the key is what the app reads, so renaming a category touches no data. The name
makes the raw export readable without the constants file. An opaque id would have satisfied the
first goal and defeated the second.

**Trade-off, accepted knowingly:** the same Dutch string lives in two places, so after a rename
the stored `name` on existing recipes is stale until a backfill runs. That is cosmetic, not
functional — the UI resolves display from the constants and corrects itself immediately.

There are no UUIDs here. The key *is* the stable identifier, and it is readable.

### Labels referenced by id (normalised)

**Decision:** store `labelIds: string[]` and fetch label documents separately.

**Rationale:** a label rename is an ordinary user action rather than a code change, so
denormalising the name would go stale often and across many documents at once.

**Trade-off:** the recipe export is *not* self-contained for labels — `labelIds` means nothing
on its own. That conflicts with the readability principle above and is unresolved; see
`docs/issues/label-names-not-in-recipe-export.md` for the three options.

### Ingredients as an object keyed by serving size

**Current:** `{ [servingSize: number]: Ingredient[] }`, e.g. `{ "2": [...], "4": [...] }`.

**Pro:** direct lookup by serving size. **Con:** Firestore stores numeric keys as strings, and
"all serving options" is awkward to query.

An array form was considered and is still an open idea — there is a `TODO` to that effect in
`src/lib/types.ts`:

```typescript
interface ServingIngredients {
  servings: number;
  ingredients: Ingredient[];
}
servingOptions: ServingIngredients[];
```

Not scheduled. The current format works and every consumer expects it.

### Document IDs are Firestore auto-IDs

Both `createRecipe` and `createLabel` use `addDoc`, so Firestore assigns the id — a 20-character
alphanumeric string, not a UUID and not a readable slug.

An earlier version of this document claimed client-side UUIDs via `crypto.randomUUID()` and
readable prefixes like `recipe-1`. That was never implemented.

---

## Security rules

**There is no `firestore.rules` in this repository.** The deployed rules live only in the
Firebase console, so what follows is the intended shape rather than verified truth. Check the
console against it.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /labels/{labelId} {
      allow read: if request.auth != null;

      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.isGlobal != true;

      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid
                            && resource.data.isGlobal != true;
    }

    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;
    }
  }
}
```

Two points worth checking in the console:

- **The collection was renamed.** A rule still matching `/tags/{tagId}` grants nothing for
  `/labels`, so every label read and write is denied. This is the most likely way for the
  migration to look successful and then fail at runtime.
- **`allow read: if true` versus requiring auth.** The earlier version of this document
  proposed public reads on both collections. Every route in the app is behind a login
  (`src/routes/+layout.ts` redirects unauthenticated users), and recipes are queried per
  `userId`, so public reads would expose other users' recipes to anyone with the project id.
  The rules above require auth instead.

---

## Known discrepancies

Recorded rather than fixed, because they need a decision:

**Timestamps are not ISO 8601 strings.** `Label`, `RecipeSummary` and `Recipe` declare
`createdAt?: string; // ISO 8601 timestamp`, but both services write `serverTimestamp()`, which
resolves to a Firestore `Timestamp`. Reading a document back gives an object, not a string. The
types are therefore wrong, and the export contains:

```json
"createdAt": { "seconds": 1757000000, "nanoseconds": 0 }
```

Nothing in the app reads either field, so there is no runtime bug. But given that the whole
point of the data model is a readable export, `{seconds, nanoseconds}` is the opposite of
readable. Two ways out: correct the types to `Timestamp` and convert at export time, or write
ISO strings and give up server-authoritative time.

**`labelIds` is typed as required but treated as optional.** The read path does
`populateLabels(recipe.labelIds || [])`, so a document without the field works fine. Writing
`[]` explicitly keeps the export uniform.

---

## Migration

The move from the old `tags` model to this one is written up in
`docs/migrations/2026-09-04-tags-to-labels-and-categories.md` — collection rename, the `color`
drop, deriving `category` from the old tags, and what to check in the console afterwards.

## What this document no longer contains

Trimmed in the 2026-09-04 rewrite because it described things that were never built or are no
longer true:

- The `/tags` collection, the `Tag` interface with `color`, `tagIds` on recipes, and
  `RecipeWithTags`.
- An "Indexes Needed" list naming indexes on `name`, `createdAt`, `tagIds` and `title`. None of
  those queries exist; the app never sorts or does `array-contains`.
- Query examples for filtering by tag and searching by title prefix. Neither is implemented.
- A four-phase migration plan whose phases were either completed or superseded.
- Sketches of unbuilt features: a `User` model, a `Review` system and recipe `Collection`s.
  A data model document should describe what exists; wishlists belong in issues.
