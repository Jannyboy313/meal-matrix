# Broken plural in `recipe.ingredients.forServings`

## Problem

`src/lib/i18n/locales/{nl,en}/recipe.json` define `forServings` with a JS ternary inside the placeholder:

```json
"forServings": "Ingrediënten voor {{count}} portie{{count !== 1 ? 's' : ''}}"
```

`@sveltekit-i18n/parser-default` does not evaluate expressions. The second placeholder resolves to an empty string, so the output is always singular ("Ingrediënten voor 3 portie").

The key is currently not referenced anywhere in `src/`, so nothing is visibly wrong yet.

## Fix

Use the parser's modifier syntax, or remove the key if it stays unused:

```json
"forServings": "Ingrediënten voor {{count}} {{count; 1:portie; default:porties;}}"
```

## Found

2026-11-14, while verifying the `filters.showResults` string for the home filters work.
