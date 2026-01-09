# Internationalization (i18n) Guide

This application uses **sveltekit-i18n** for internationalization, making it easy to support multiple languages.

## Current Languages

- **English (en)** - Default language
- **Nederlands (nl)** - Dutch

## Architecture

### Structure

```
src/lib/i18n/
├── index.ts                    # i18n configuration and exports
└── locales/
    ├── en/                     # English translations
    │   ├── common.json         # Common UI strings
    │   ├── auth.json           # Authentication related
    │   └── recipe.json         # Recipe-specific strings
    └── nl/                     # Dutch translations
        ├── common.json
        ├── auth.json
        └── recipe.json
```

### Translation Files

Translations are organized by namespace:

- **common**: App-wide strings (navigation, actions, errors, loading states)
- **auth**: Authentication-related strings (login, sign out, etc.)
- **recipe**: Recipe-specific content (forms, labels, actions)

## Usage in Components

### 1. Import the translation function

```typescript
import { t } from '$lib/i18n';
```

### 2. Use translations in your template

```svelte
<h1>{$t('common.app.name')}</h1>
<button>{$t('common.actions.save')}</button>
<p>{$t('auth.title')}</p>
```

### 3. Access nested translations

Translation keys use dot notation to access nested objects:

```svelte
{$t('recipe.labels.name')}        <!-- "Recipe Name" -->
{$t('recipe.steps.ingredients')}   <!-- "Ingredients" -->
```

## Adding a New Language

### Step 1: Create Translation Files

Create a new directory under `src/lib/i18n/locales/` for your language code (e.g., `fr` for French):

```bash
mkdir -p src/lib/i18n/locales/fr
```

Copy the English JSON files as templates:

```bash
cp src/lib/i18n/locales/en/*.json src/lib/i18n/locales/fr/
```

### Step 2: Translate the Content

Edit each JSON file in the new language directory and translate all values (keep keys unchanged):

```json
// locales/fr/common.json
{
  "app": {
    "name": "Meal Matrix",
    "loading": "Chargement...",
    "error": "Une erreur s'est produite"
  },
  ...
}
```

### Step 3: Update Configuration

Add your language to `src/lib/i18n/index.ts`:

```typescript
export const config: Config = {
	translations: {
		en: { lang: 'en' },
		nl: { lang: 'nl' },
		fr: { lang: 'fr' }  // Add new language
	},
	loaders: [
		// Add loaders for each namespace
		{
			locale: 'fr',
			key: 'common',
			loader: async () => (await import('./locales/fr/common.json')).default
		},
		{
			locale: 'fr',
			key: 'auth',
			loader: async () => (await import('./locales/fr/auth.json')).default
		},
		{
			locale: 'fr',
			key: 'recipe',
			loader: async () => (await import('./locales/fr/recipe.json')).default
		}
	]
};
```

### Step 4: Add to Language Switcher

Update `src/lib/components/LanguageSwitcher.svelte`:

```typescript
const availableLanguages = [
	{ code: 'en', name: 'English', flag: '🇬🇧' },
	{ code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
	{ code: 'fr', name: 'Français', flag: '🇫🇷' }  // Add new language
];
```

## Adding New Translation Keys

### Step 1: Choose the Right Namespace

Decide which namespace your new keys belong to:
- **common.json**: UI elements, navigation, general actions
- **auth.json**: Authentication flow
- **recipe.json**: Recipe-specific functionality

### Step 2: Add to All Language Files

Add your new keys to the JSON file in **every language directory**:

```json
// In all locales/*/common.json
{
  "myNewSection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

### Step 3: Use in Components

```svelte
<h2>{$t('common.myNewSection.title')}</h2>
<p>{$t('common.myNewSection.description')}</p>
```

## Best Practices

### 1. Keep Keys Descriptive

Use clear, hierarchical keys that describe the content:

✅ Good: `recipe.labels.cookTime`
❌ Bad: `recipe.label1`

### 2. Group Related Content

Organize translations logically within namespaces:

```json
{
  "recipe": {
    "labels": { ... },
    "actions": { ... },
    "validation": { ... }
  }
}
```

### 3. Consistent Naming

Follow the existing naming patterns:
- `labels.*` - Form labels
- `actions.*` - Button text and actions
- `placeholders.*` - Input placeholders
- `validation.*` - Error messages
- `title.*` - Page/section titles

### 4. Avoid Hardcoded Strings

Never use hardcoded text in components:

```svelte
<!-- ❌ Bad -->
<button>Save Recipe</button>

<!-- ✅ Good -->
<button>{$t('recipe.actions.addRecipe')}</button>
```

### 5. Handle Dynamic Content

For dynamic content, construct translations properly:

```svelte
<!-- For counts/numbers -->
{$t('recipe.labels.servings')}: {servings}

<!-- For conditional text -->
{loading ? $t('common.loading.authentication') : $t('auth.signOut')}
```

## Language Persistence

The selected language is automatically saved to `localStorage` and persists across sessions. The application:

1. Checks `localStorage` for saved locale on load
2. Falls back to English if no preference is saved
3. Saves the new selection whenever the user changes language

## Programmatic Language Switching

To change language programmatically:

```typescript
import { locale } from '$lib/i18n';
import { browser } from '$app/environment';

function switchToFrench() {
  locale.set('fr');
  if (browser) {
    localStorage.setItem('locale', 'fr');
  }
}
```

## Checking Current Language

Access the current locale in components:

```svelte
<script lang="ts">
  import { locale } from '$lib/i18n';
</script>

<p>Current language: {$locale}</p>
```

## TypeScript Support

The translation keys are type-safe when using the `$t` function. TypeScript will autocomplete available namespaces and keys based on your JSON structure.

## Testing Translations

1. Switch between languages using the language switcher in the navbar
2. Verify all UI text updates correctly
3. Check that no hardcoded strings remain
4. Test with incomplete translations (keys should fall back to English)

## Common Issues

### Missing Translation

If a translation key is missing, the key itself will be displayed:

```
common.missing.key
```

**Solution**: Add the key to all language JSON files.

### Translation Not Updating

If translations don't update after changes:

1. Clear browser cache
2. Restart the dev server
3. Check that JSON is valid (no trailing commas, proper quotes)

### Wrong Language Shown

If the wrong language displays:

1. Check browser localStorage for saved locale
2. Clear localStorage: `localStorage.removeItem('locale')`
3. Refresh the page

## Future Enhancements

Potential improvements for the i18n system:

- Date/time formatting per locale
- Pluralization support
- RTL (right-to-left) language support
- Server-side language detection from browser headers
- Translation management UI for non-developers
