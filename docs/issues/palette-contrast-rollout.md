# Roll out the new palette's contrast rules across the app

**Type:** accessibility / design system
**Status:** open
**Found:** 2026-09-04, while separating labels from categories
**Source:** `design/Meal Matrix - kleurenpalet.dc.html`
**Priority:** medium — every one of these fails WCAG AA for small text today

## Problem

The palette document introduces two colors and one rotation rule that the codebase does
not yet know about. The labels/categories work deliberately stayed out of this, because
it is an app-wide color pass rather than a feature change. Three separate items:

### 1. `muted` is too light for small text

`--color-muted` (`#8D8878`) reaches only **3,5:1** on paper. The palette keeps it, but
restricts it to large or bold text (18px and up). Everything smaller must move to the new
`muted-strong` (`#6B6555`) — 5,7:1 on paper, 5,8:1 on white.

Affected: every label above a field, every meta line, and every placeholder under 18px.
`grep -rn "text-muted" src` finds the call sites. The `input::placeholder` rule in
`src/routes/layout.css` also points at `--color-muted`.

### 2. White text on `accent` fails

`--color-accent` (`#FF5C35`) with white text reaches **3,1:1**. The palette marks that
combination "niet gebruiken" and offers two ways out:

- ink text on `accent` (5,9:1), or
- white text on the new `accent-diep` (`#C0390E`, 5,5:1).

Also note: `violet` (`#6C5CE7`) carries white (4,8:1) but must never carry ink.

Affected: filled accent buttons and selected states with `text-white`. The new
`CategoryPicker` already uses ink on accent, so it does not need changing.

### 3. Offset shadow rotation is ten colors, not four

`SHADOW_ROTATION` in `src/lib/components/RecipeCard.svelte` cycles four colors. The
palette specifies a fixed ten-color sequence, ordered so that light and dark alternate
and no two neighbours in the grid share a value:

```
accent, violet, yellow, bosgroen, hemel, bes, teal, kaneel, limoen, roze
```

There is no contrast requirement on a shadow, so this is purely visual.

## Suggested fix

1. Add the six new colors plus `accent-diep` and `muted-strong` to the `@theme` block in
   `src/routes/layout.css`. (The labels/categories work already adds the six category
   colors, so check what is present before adding.)
2. Replace `text-muted` with `text-muted-strong` everywhere the text is under 18px, and
   repoint the `::placeholder` rule.
3. Audit every `bg-accent` paired with `text-white` and pick one of the two documented
   resolutions per case.
4. Extend `SHADOW_ROTATION` to the ten-color sequence above.

## Notes

- Rule 05 in the palette caps visible colors at three per screen, the recipe grid excepted.
  Worth checking the detail page against that once the rotation is widened.
- `#8D8878` stays in the palette, so do not delete it — it is still valid for large text.
