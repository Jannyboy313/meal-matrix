# Roll out the new palette's contrast rules across the app

**Type:** accessibility / design system
**Status:** partly done — item 1 is complete, items 2 and 3 remain
**Found:** 2026-09-04, while separating labels from categories
**Source:** `design/Meal Matrix - kleurenpalet.dc.html`
**Priority:** medium — the two remaining items still fail WCAG AA for small text

## Problem

The palette document introduces two colors and one rotation rule that the codebase does
not yet know about. The labels/categories work deliberately stayed out of this, because
it is an app-wide color pass rather than a feature change. Three separate items:

### 1. `muted` is too light for small text — DONE 2026-09-04

`--color-muted` (`#8D8878`) reaches only **3,5:1** on paper. The palette keeps it, but
restricts it to large or bold text (18px and up). Everything smaller had to move to the new
`muted-strong` (`#6B6555`) — 5,7:1 on paper, 5,8:1 on white.

Resolved while building the label line on the detail page, which would otherwise have been the
first new 11px text in `muted`. `--color-muted-strong` was added to the `@theme` block, all 17
`text-muted` call sites were moved to `text-muted-strong`, and the `input::placeholder` rule in
`src/routes/layout.css` was repointed.

Every call site turned out to be under 18px — sizes ran from 9px to 16px — so nothing qualified
for the large-text exemption and `--color-muted` is now unused. It is deliberately kept in the
`@theme` block, because the palette still lists it as valid for large or bold text.

One judgement call: the search icon in `SearchBar.svelte` is a non-text UI component, so 3,5:1
already satisfied WCAG's 3:1 for those. It was moved anyway, because it sits directly beside
the placeholder text and the two should not drift apart.

### 2. White text on `accent` fails

`--color-accent` (`#FF5C35`) with white text reaches **3,1:1**. The palette marks that
combination "niet gebruiken" and offers two ways out:

- ink text on `accent` (5,9:1), or
- white text on the new `accent-diep` (`#C0390E`, 5,5:1).

Also note: `violet` (`#6C5CE7`) carries white (4,8:1) but must never carry ink.

Affected: filled accent buttons and selected states with `text-white` — **12 call sites** as of
2026-09-04, found with `grep -rn "bg-accent" src --include="*.svelte" | grep "text-white"`:

- `Login.svelte` (2 buttons, 1 error box)
- `ErrorDisplay.svelte` (1 button)
- `ServingSelector.svelte` (2 selected states)
- `RecipeForm.svelte` (1 error box, 1 discard button)
- `StepNavigation.svelte` (2 buttons)
- `recipes/[id]/+page.svelte` (1 selected serving, 1 "Begin met koken" button)

`CategoryPicker.svelte` and `LabelPicker.svelte` already use ink on accent and need no change.

Note the two error boxes are a slightly different case: white-on-accent for an error message is
both the worst contrast and the most important thing on screen to read. Those two are the ones
worth doing first if this gets split.

### 3. Offset shadow rotation is ten colors, not four

`SHADOW_ROTATION` in `src/lib/components/RecipeCard.svelte` cycles four colors. The
palette specifies a fixed ten-color sequence, ordered so that light and dark alternate
and no two neighbours in the grid share a value:

```
accent, violet, yellow, bosgroen, hemel, bes, teal, kaneel, limoen, roze
```

There is no contrast requirement on a shadow, so this is purely visual.

## Suggested fix for what remains

1. Add `accent-diep` (`#C0390E`) to the `@theme` block in `src/routes/layout.css`. The six
   category colors and `muted-strong` are already there.
2. Decide once, globally, between ink-on-accent and white-on-`accent-diep`, then apply it to
   all 12 call sites. Mixing the two resolutions across the app would look like a mistake.
3. Extend `SHADOW_ROTATION` in `RecipeCard.svelte` to the ten-color sequence above.

## Notes

- Rule 05 in the palette caps visible colors at three per screen, the recipe grid excepted.
  Worth checking the detail page against that once the rotation is widened.
- `#8D8878` stays in the palette, so do not delete it — it is still valid for large or bold
  text over ~18px, even though nothing currently uses it.
