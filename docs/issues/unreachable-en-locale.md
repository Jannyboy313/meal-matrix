# The English locale is unreachable, and the i18n docs describe features that no longer exist

**Type:** cleanup / documentation
**Status:** open
**Found:** 2026-09-04, while separating labels from categories
**Priority:** low — nothing is broken for users, but the code and docs disagree with reality

## Problem

The app registers two locales but can only ever render one.

`src/routes/+layout.ts` sets the locale unconditionally on every load:

```ts
locale.set(defaultLocale);
await loadTranslations(defaultLocale, url.pathname);
```

With `defaultLocale = 'nl'` in `src/lib/i18n/index.ts`, no code path can reach `'en'`.
Commit `97c0b4a` (the redesign) removed `detectBrowserLocale`, the browser-language
detection and the `localStorage` persistence that used to select it. No language switcher
exists anywhere in `src/` — `LanguageSwitcher.svelte` and `NavBar.svelte` are both gone.

The `src/lib/i18n/locales/en/` files are still present, genuinely English, and in exact
key parity with `nl/` (common 32/32, recipe 104/104, auth 6/6). They are dead weight that
looks maintained.

Separately, two documents describe a system that is no longer there:

- `I18N_SUMMARY.md` claims a language-switcher dropdown in the navbar, `localStorage`
  persistence, and **English as the default language**.
- `I18N_GUIDE.md` lists English as the default and documents a "Step 4: Add to Language
  Switcher" for a component that does not exist.

## Impact

- A reader of the docs will look for a switcher and browser detection that were deleted.
- Contributors keep `en/` in parity — as the labels/categories work did — for a locale
  that cannot be displayed.
- The docs name the wrong default language, which is actively misleading.

## Decide first, then fix

This needs a product decision before any code moves:

**Option A — Dutch only.** Delete `src/lib/i18n/locales/en/`, drop the `en` entries from
the `translations` map and the `loaders` array in `src/lib/i18n/index.ts`, and rewrite both
i18n documents to describe a single-locale setup. The `$t` machinery stays, since it is
still the single place where UI copy lives.

**Option B — restore bilingual support.** Bring back browser detection and a persisted
choice, add a switcher somewhere reachable (the account menu is the natural spot now that
the navbar is gone), and correct the docs to say Dutch is the default.

Either way the two markdown files must be rewritten; they are wrong under both options.

## Notes

- Whoever picks this up should check `nl`/`en` key parity first. It is exact today, so
  option B is cheaper than it looks.
- `defaultLocale` is `'nl'` while the docs say English — worth fixing in the docs even if
  the rest is deferred.
