# Migration: tags → labels + categories

**Date:** 2026-09-04
**Applies to:** the code on branch `feature/update-logo` after the labels/categories separation
**Design:** `docs/superpowers/specs/2026-09-04-labels-categories-separation-design.md`

The app no longer reads `tags` or `tagIds`. Until this migration runs, recipes will open but
show no category badge and no labels, because `labelIds` and `category` are both absent and the
read path degrades to empty rather than throwing. Nothing crashes; nothing displays.

---

## 1. Collection `tags` → `labels`

Copy every document from `/tags/{id}` to `/labels/{id}`.

**Preserve the document ID.** Recipes reference labels by id, so a new id breaks every
reference.

| Field | Action |
| --- | --- |
| `name` | Keep as is. Stored in sentence case; the UI uppercases it with CSS |
| `color` | **Drop.** Labels have no colour — see below |
| `userId` | Keep |
| `isGlobal` | Keep |
| `createdAt` / `updatedAt` | Keep |

Then delete `/tags`.

### Why `color` goes

The labels design renders a label as plain text in one typographic line, never as a filled
area, so a colour field would carry no meaning. The app no longer writes or reads it. Leaving
it behind would put a dead field in exactly the export you want to keep readable.

### Watch out: labels with neither `userId` nor `isGlobal`

`getAllLabels` runs exactly two queries and unions the results:

```
where('isGlobal', '==', true)
where('userId', '==', <current user>)
```

A label document that has no `userId` **and** does not have `isGlobal: true` matches neither,
so it becomes invisible in the picker — even though recipes referencing it still display it
fine on the detail page. If any old tag documents lack both, give them one or the other.

---

## 2. Recipe documents

For each document in `/recipes/{id}`:

| Field | Action |
| --- | --- |
| `category` | **Add** — an object `{ key, name }`, see section 3 |
| `labelIds` | **Add** — array of label ids, see section 4 |
| `tagIds` | **Delete** |

Everything else — `title`, `description`, `image`, `prepTime`, `cookTime`, `servings`,
`ingredients`, `steps`, `userId`, `createdAt`, `updatedAt` — is untouched.

### Before

```json
{
  "title": "Belgische stoofpot",
  "tagIds": ["tagHoofd01", "tagVega02", "tagOven03"],
  "servings": 4
}
```

### After

```json
{
  "title": "Belgische stoofpot",
  "category": { "key": "main", "name": "Hoofdgerecht" },
  "labelIds": ["tagVega02", "tagOven03"],
  "servings": 4
}
```

Note that `tagHoofd01` was *consumed* by the category and is **not** in `labelIds`. Leaving it
there would show "Hoofdgerecht" as both the badge on the hero and a label under the title.

---

## 3. The `category` field

Exactly these five keys are valid. They come from `src/lib/constants/categories.ts`:

| `key` | `name` |
| --- | --- |
| `starter` | `Voorgerecht` |
| `main` | `Hoofdgerecht` |
| `dessert` | `Dessert` |
| `bread` | `Brood` |
| `baking` | `Bakken` |

Two rules:

- **`key` must match one of the five exactly.** Anything else resolves to `undefined`, which
  means no badge on the detail page and no category name on the overview card. It will not
  throw, so a typo fails silently — worth asserting in the script.
- **`name` must match the table exactly.** The app never reads it; it exists so the raw
  Firestore JSON is readable on its own. A wrong value is not a functional bug but it defeats
  the point of the field.

### Deriving the key from the old tags

The old UI showed `tags[0]` as the category — the first element of `tagIds`. **Do not rely on
that.** Array order was never a deliberate choice, so the "category" a recipe appeared to have
depended on insert order and could change when a tag was removed. That is the bug this work
exists to fix; do not carry it into the new data.

Instead, for each recipe: resolve all of its `tagIds` to names, and find the first whose name
matches a category. Suggested aliases, to be confirmed against your actual data:

| Old tag name | → key |
| --- | --- |
| Voorgerecht | `starter` |
| Hoofdgerecht | `main` |
| Dessert, Nagerecht | `dessert` |
| Brood | `bread` |
| Bakken | `baking` |

Match case-insensitively and trim whitespace. Before writing the script, list the distinct tag
names actually in use so the alias table is complete — the redesign mockups also showed
"Salade", "Soep" and "Surinaams" as categories, and those have **no** category to map to. They
should become ordinary labels.

### Recipes where nothing matches

You have to choose, and it is a real choice:

**Default them to `main`.** Every recipe stays valid and editable. Cost: a recipe gets a
category that may be wrong, silently.

**Leave `category` off entirely.** Honest about not knowing. Cost: the recipe opens with no
badge, and the edit form will refuse to save it until someone picks a category — which is
arguably the right prompt, but it means the app has recipes that cannot be saved without a
change of state first.

Whichever you pick, count them first. If it is a handful, fix them by hand and skip the
decision.

### Delete the consumed category tags

After the recipes are migrated, the old tag documents whose names became category names
("Hoofdgerecht", "Voorgerecht", …) are no longer referenced by anything. Delete them from
`/labels`. If they stay, they show up as selectable labels and a user can attach
"Hoofdgerecht" as a label to a Hoofdgerecht recipe.

---

## 4. The `labelIds` field

All of the recipe's old `tagIds`, **minus** the one consumed by the category.

Set `[]` rather than omitting the field when a recipe has no labels. The read path treats a
missing value as empty, so both work, but an explicit empty array keeps the export uniform.

Order is preserved and meaningful: the detail page renders labels in stored order so the line
stays stable across visits. Do not sort them.

---

## 5. Firestore console — not in this repo

There is no `firestore.rules` or `firestore.indexes.json` in the repository, so both live only
in the Firebase console. Check them by hand.

**Rules.** Any rule matching `/tags/{document}` needs a `/labels/{document}` equivalent, or
every label read and write will be denied after the rename. This is the most likely way for the
migration to look successful and then fail at runtime.

**Indexes.** The app only runs single-field equality queries, all of which Firestore indexes
automatically:

- `recipes` where `userId ==`
- `labels` where `isGlobal ==`
- `labels` where `userId ==`

No composite index is needed. `FIREBASE_DATA_MODEL.md` mentions an index on `tagIds`
(array-contains); if one was ever created it is now dead and can be removed.

---

## 6. No action needed

- **localStorage drafts.** The form's storage keys moved to `recipe-draft-v3` and
  `recipe-edit-v3-{id}`, so any draft in the old shape lapses on its own instead of
  half-loading. Nothing to clean up.
- **Recipe ingredients, steps, servings, images, times.** Unchanged.

---

## 7. After the migration, verify

1. No document in `/recipes` still has a `tagIds` field.
2. Every document in `/recipes` has a `category.key` that is one of the five, and a
   `category.name` matching the table — or is on your deliberate exception list.
3. No `labelIds` entry points at a document that no longer exists in `/labels`. A dangling id
   is dropped silently on read, which hides the problem.
4. No document in `/labels` still has a `color` field.
5. Every document in `/labels` has either `userId` or `isGlobal: true`.
6. `/tags` is gone.

Then in the app: the overview shows a category name on every card, the detail page shows the
tilted badge in its colour and the label line under the title, and editing a recipe opens step 2
with its category preselected.

---

## 8. Stale documentation

`FIREBASE_DATA_MODEL.md` in the project root describes the old model end to end — `/tags`, the
`Tag` interface with `color`, `tagIds` on recipes, `RecipeWithTags`, and the suggested indexes.
All of it is now wrong. It is not part of this migration, but it will mislead the next person to
read it, so it should be rewritten or deleted.
