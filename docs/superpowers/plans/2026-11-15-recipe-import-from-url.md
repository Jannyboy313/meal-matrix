# Importing a recipe from a URL

**Date:** 2026-11-15
**Status:** approved, in progress

## Goal

On `/recipes/new` the user pastes the URL of a recipe on another website. The app reads that
page and fills title, description, image, times, servings, ingredients and instructions. The
user then walks through the existing four wizard steps to check and correct the result, picks a
category and labels, and saves as usual.

## Approach

Almost every recipe site (Allerhande, Jumbo, 24Kitchen, BBC Good Food, NYT Cooking, WordPress
recipe plugins) embeds a schema.org `Recipe` as JSON-LD for Google's rich results. Reading that
block gives structured data without per-site scrapers.

The page cannot be fetched from the browser (CORS), so a SvelteKit endpoint fetches it on the
server (Vercel function), extracts the `Recipe` node, maps it to the form's shape and returns
that. The form applies it to its state; validation, drafts and saving stay unchanged.

```
RecipeImport.svelte ──POST {url} + Bearer ID token──▶ /api/recipes/import
                                                        ├─ verify Firebase ID token
                                                        ├─ guarded fetch (SSRF limits)
                                                        ├─ extractRecipeNode(html)
                                                        └─ mapRecipe(node) ──▶ ImportedRecipe JSON
RecipeForm applies ImportedRecipe to its $state ◀───────┘
```

## Decisions

| Decision | Rationale |
| --- | --- |
| JSON-LD only, no HTML-heuristic or microdata fallback | Covers the large majority of sites with ~50 lines of parsing. Sites without it get a clear "no recipe found" message; the user types it in as today |
| No parsing dependency; JSON-LD blocks extracted with a regex on `<script type="application/ld+json">` | We need one tag type, not a DOM. Keeps the function bundle small |
| Mapping runs on the server; the client receives `ImportedRecipe` | One place for the messy logic, testable as pure functions, and the client never handles foreign HTML |
| The endpoint verifies a Firebase ID token sent as `Authorization: Bearer` | The `session` cookie is only checked for presence (see `docs/issues/session-cookie-not-verified.md`). Without verification this endpoint is an open fetch proxy for anyone who sets a dummy cookie. The client gets a fresh token via `auth.currentUser.getIdToken()`; the server verifies it against Google's public keys with `jose` (no service account needed) |
| Fetch is guarded: `http(s)` only, DNS-resolved IP must be public, manual redirects (max 3, each re-checked), 10s timeout, 3 MB body cap | Standard SSRF hygiene for a server that fetches user-supplied URLs |
| Ingredient strings are split into `amount` + `name` heuristically; on doubt `amount` stays empty | JSON-LD has only `"200 g bloem"`. An empty amount trips the existing step-3 validation, so the user is forced to look at exactly the lines the parser could not handle |
| Import fills a single serving size (`recipeYield`, default 4) | The form supports several, but the source only describes one. Scaling is a separate feature |
| Category and labels are not filled | `recipeCategory`/`keywords` are free text and rarely match our five categories; a wrong guess is worse than an empty required field the user fills in step 2 |
| Import is only offered in create mode, at the top of step 1 | Overwriting an existing recipe from a URL is a different feature with merge questions |
| Import into a dirty form asks for confirmation first | The draft in localStorage would otherwise be silently replaced |
| Sites that refuse server fetches (bot protection) get a "site blocked" error, no fallback | The owner's choice for now. A paste-the-text fallback can follow if it turns out to matter |
| The source URL is not stored | The owner's choice. The import only pre-fills the form; the saved recipe has the same shape as a hand-entered one, so no data-model change |
| Image is kept as the remote URL | Same as manually entered images today. Hotlinking can break later; copying to storage is out of scope |

## Mapping

| schema.org | Form field | Notes |
| --- | --- | --- |
| `name` | `title` | Decode HTML entities, trim |
| `description` | `description` | Strip tags |
| `image` | `image` | `string`, `string[]` or `ImageObject`/`ImageObject[]` → first URL |
| `prepTime`, `cookTime` | `prepTime`, `cookTime` | ISO 8601 duration (`PT1H30M`) → `"1 u 30 min"`; unparsable → empty |
| `recipeYield` | `servings`, `currentServing` | First integer in `string`/`number`/array (`"4 personen"` → 4); fallback 4 |
| `recipeIngredient` | `ingredients[servings]` | Split per line, see below |
| `recipeInstructions` | `steps` | `string` (split on newlines), `string[]`, `HowToStep[]`, `HowToSection[]` (flattened, section names dropped); strip tags, drop empty |

Finding the node: parse every JSON-LD block (skip ones that fail `JSON.parse`), walk top-level
objects, arrays and `@graph`, and pick the first node whose `@type` is `"Recipe"` or an array
containing it.

Ingredient split: leading quantity (`200`, `1,5`, `1/2`, `½`, `1-2`, `2 à 3`) optionally followed
by a unit from a fixed list (`g`, `kg`, `ml`, `cl`, `dl`, `l`, `el`, `tl`, `eetlepel(s)`,
`theelepel(s)`, `snuf(je)`, `teen/teentjes`, `stuk(s)`, `blik`, `zakje`, `bos(je)`, `cup(s)`,
`tbsp`, `tsp`, `oz`, `lb`) goes to `amount`; the rest is `name`. No leading quantity → `amount`
empty, whole string in `name`.

## Tasks

Each task ends with `yarn check` and `yarn test` green and one commit on `main`.

1. **Pure parsing modules + tests.** `src/lib/import/extractRecipeNode.ts`,
   `src/lib/import/mapRecipe.ts` (`parseDuration`, `parseYield`, `splitIngredient`,
   `flattenInstructions`, `mapRecipe`), `ImportedRecipe` type in `src/lib/types.ts`. Vitest
   fixtures are small hand-written HTML/JSON-LD snippets covering `@graph`, type arrays,
   `HowToSection`, string instructions, broken JSON blocks. No scraped pages in the repo.
2. **Server: token verification and guarded fetch.** Add `jose`.
   `src/lib/server/verifyIdToken.ts` (issuer/audience = Firebase project id from
   `PUBLIC_FIREBASE_PROJECT_ID` or wherever `src/lib/firebase.ts` reads it),
   `src/lib/server/fetchRecipePage.ts` with the limits from *Decisions*. Unit-test the IP check
   (private, loopback, link-local, IPv6 ULA, IPv4-mapped IPv6).
3. **Endpoint.** `src/routes/api/recipes/import/+server.ts`: `POST { url }` → `200 ImportedRecipe`,
   `400` invalid URL, `401` bad token, `422` no recipe found, `502` site unreachable/blocked.
   Error bodies carry a code, not a message; the client translates.
4. **UI.** `src/lib/components/recipe/RecipeImport.svelte` (URL input, button, `ChefHatLoader`
   while busy, translated error per code). `RecipeForm.svelte` gets `applyImport(data)` and
   renders the component above `BasicInfoStep` when `!isEditing`; dirty check reuses
   `isDirty()` and the existing confirm-dialog styling. After import a notice says
   "Geïmporteerd van {host} — controleer elke stap". i18n keys in `nl` and `en` `recipe.json`.
5. **Manual check** against a handful of real sites (Allerhande, Jumbo, 24Kitchen, BBC Good
   Food, one WordPress blog) on the Vercel preview; note the ones that block server fetches.

## Out of scope

- An LLM fallback for pages without JSON-LD.
- PWA Web Share Target ("share to Meal Matrix" from the browser on Android). A natural follow-up:
  it only needs a manifest entry and reading a `?url=` parameter into this import.
- Scaling ingredients to other serving sizes.
- Copying the remote image into our own storage.
- Rate limiting the endpoint; acceptable while it requires a verified token.
