# N+1 Firestore reads when populating labels

**Type:** performance
**Status:** open
**Found:** 2026-09-04, during the labels/categories separation work
**Priority:** low — deliberately deferred, performance is not a current goal

## Problem

`populateTags` (renamed to `populateLabels` by the labels/categories work) resolves
every label with its own `getDoc` call:

```ts
const tagPromises = tagIds.map((id) => getTagById(id));
const tags = await Promise.all(tagPromises);
```

`subscribeToUserRecipes` calls it once per recipe, inside the `onSnapshot` handler.
So the read count is `recipes × labels-per-recipe`, and it is paid again on **every**
snapshot — including snapshots triggered by an unrelated recipe edit.

For 20 recipes with 3 labels each that is 60 document reads per snapshot, where
the whole label set is at most a few dozen documents in total.

## Impact

- Firestore read quota and billing scale with `recipes × labels`, not with the data size.
- The overview page re-fetches labels on every realtime update, adding latency to a
  screen that is already waiting on the recipe snapshot.
- The cost grows as users add recipes, so it gets worse over time rather than better.

## Suggested fix

Fetch the label set once and resolve from a map instead of per id:

1. Load all labels for the user with a single `getAllLabels(userId)` call
   (two queries: global + user-owned, as it already does).
2. Build a `Map<string, Label>` from the result.
3. Resolve `labelIds` against that map, in memory.
4. Cache the map in a store with an explicit invalidation when a label is created,
   so the overview does not refetch it on every snapshot.

Categories need no work here: they are code constants and resolve synchronously.

## Notes

- Resolving against a map also makes the missing-label case explicit. Today a deleted
  or inaccessible label is silently dropped by the `filter((tag) => tag !== null)`,
  which hides permission errors.
- Related files: `src/lib/services/labelService.ts`, `src/lib/services/recipeService.ts`.
