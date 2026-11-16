# Renaming a serving size orphans its ingredients

## Problem

`updateServing` in `src/lib/components/recipe/ServingSelector.svelte` replaces the number in
the `servings` array only. The `ingredients` map in `RecipeForm.svelte` stays keyed by the old
number and `currentServing` is not updated.

Changing a serving from 4 to 6 in edit mode therefore leaves `ingredients[4]` behind, gives
serving 6 an empty list, and keeps `currentServing` pointing at 4, which is no longer in
`servings`. It also accepts a number that already exists, producing a duplicate `{#each}` key.

Found by reading the code while adding amount scaling; not reproduced in a browser.

## Fix

Report the rename to the parent (`onrenameserving(from, to)`), move `ingredients[from]` to
`ingredients[to]`, update `currentServing` when it was `from`, and reject a number that is
already in `servings`. Consider offering to scale the amounts with `scaleAmount`, as adding a
serving now does.
