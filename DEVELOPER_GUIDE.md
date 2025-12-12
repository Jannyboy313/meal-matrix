# Developer Guide - Working with the Refactored Codebase

## Quick Start

### Importing Services

**✅ Correct Way:**
```typescript
// Import from services
import { signInWithGoogle, signOut } from '$lib/services/authService';
import { getRecipeById, createRecipe } from '$lib/services/recipeService';
import { getAllTags, createTag } from '$lib/services/tagService';

// Or use the service index
import {
  signInWithGoogle,
  getRecipeById,
  getAllTags
} from '$lib/services';
```

**❌ Avoid:**
```typescript
// Don't import Firebase directly in components
import { auth } from '$lib/firebase';
import { signOut } from 'firebase/auth';
```

## Common Patterns

### 1. Authentication

```typescript
<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle, signOut } from '$lib/services';

  async function handleLogin() {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      // Handle error
    }
  }
</script>

{#if $user}
  <p>Welcome, {$user.displayName}</p>
  <button onclick={handleLogout}>Sign Out</button>
{:else}
  <button onclick={handleLogin}>Sign In</button>
{/if}
```

### 2. Loading Recipes (Real-time)

```typescript
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { subscribeToUserRecipes } from '$lib/services';
  import type { RecipeSummaryWithTags } from '$lib/types';

  let recipes = $state<RecipeSummaryWithTags[]>([]);
  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    const unsubUser = user.subscribe(($user) => {
      // Clean up previous subscription
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      // Subscribe if user is logged in
      if ($user) {
        unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
          recipes = updatedRecipes;
        });
      } else {
        recipes = [];
      }
    });

    return () => unsubUser();
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

{#each recipes as recipe}
  <div>{recipe.title}</div>
{/each}
```

### 3. Loading a Single Recipe

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { getRecipeById } from '$lib/services';
  import type { RecipeWithTags } from '$lib/types';

  let { recipeId }: { recipeId: string } = $props();

  let recipe = $state<RecipeWithTags | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      recipe = await getRecipeById(recipeId);
      if (!recipe) {
        error = 'Recipe not found';
      }
    } catch (err) {
      console.error('Failed to load recipe:', err);
      error = 'Failed to load recipe';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p class="error">{error}</p>
{:else if recipe}
  <h1>{recipe.title}</h1>
  <p>{recipe.description}</p>
{/if}
```

### 4. Creating a Recipe

```typescript
<script lang="ts">
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import { createRecipe } from '$lib/services';
  import type { Tag } from '$lib/types';

  let title = $state('');
  let description = $state('');
  let tags = $state<Tag[]>([]);
  let ingredients = $state({ 4: [{ name: '', amount: '' }] });
  let steps = $state(['']);

  async function handleSubmit() {
    const currentUser = $user;
    if (!currentUser) {
      alert('You must be logged in');
      return;
    }

    try {
      const recipeId = await createRecipe({
        title,
        description,
        image: 'https://example.com/image.jpg',
        prepTime: '15 min',
        cookTime: '30 min',
        servings: 4,
        tags,
        ingredients,
        steps
      }, currentUser.uid);

      // Navigate to the new recipe
      await goto(`/recipes/${recipeId}`);
    } catch (error) {
      console.error('Failed to create recipe:', error);
      alert('Failed to create recipe');
    }
  }
</script>
```

### 5. Working with Tags

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { getAllTags, createTag } from '$lib/services';
  import type { Tag } from '$lib/types';

  let tags = $state<Tag[]>([]);
  let selectedTags = $state<Tag[]>([]);

  onMount(async () => {
    const currentUser = $user;
    tags = await getAllTags(currentUser?.uid);
  });

  async function handleCreateTag(name: string, color: string) {
    const currentUser = $user;
    if (!currentUser) return;

    try {
      const newTag = await createTag({ name, color }, currentUser.uid);
      tags = [...tags, newTag];
      selectedTags = [...selectedTags, newTag];
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  }
</script>
```

## Svelte 5 Best Practices

### Use Runes

```typescript
// State
let count = $state(0);
let user = $state<User | null>(null);

// Derived
let doubled = $derived(count * 2);
let fullName = $derived.by(() => {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`;
});

// Props
let { title, description = '' }: Props = $props();

// Effects
$effect(() => {
  console.log('Count changed:', count);
});
```

### Event Handlers

```typescript
// ✅ Svelte 5 syntax
<button onclick={handleClick}>Click</button>

// ❌ Old syntax (deprecated)
<button on:click={handleClick}>Click</button>
```

### Bindable Props

```typescript
// Parent component
<ChildComponent bind:value={myValue} />

// Child component
interface Props {
  value: string;
}

let { value = $bindable() }: Props = $props();
```

## Form State Management

### Option 1: Local State (Simple Forms)

```typescript
<script lang="ts">
  let title = $state('');
  let description = $state('');
</script>

<input bind:value={title} />
<textarea bind:value={description} />
```

### Option 2: Recipe Form Store (Complex Forms)

```typescript
<script lang="ts">
  import { createRecipeFormStore } from '$lib/stores/recipe-form.store';

  const formStore = createRecipeFormStore('my-form-key', {
    title: 'Initial Title',
    // ... other initial data
  });

  // Access state
  $: formData = $formStore;

  // Use helper methods
  function addTag(tag: Tag) {
    formStore.addTag(tag);
  }

  function reset() {
    formStore.reset();
  }
</script>
```

## Validation

```typescript
import {
  validateBasicInfo,
  validateIngredients,
  hasErrors
} from '$lib/utils/recipe-form-validation';

// Validate step
const errors = validateBasicInfo(title);
if (hasErrors(errors)) {
  console.error('Validation failed:', errors);
  return;
}

// Validate ingredients
const ingredientErrors = validateIngredients(ingredients[currentServing], currentServing);
```

## TypeScript Types

Always import types from `$lib/types`:

```typescript
import type {
  Recipe,
  RecipeWithTags,
  RecipeSummary,
  RecipeSummaryWithTags,
  Tag,
  Ingredient,
  RecipeFormData
} from '$lib/types';
```

### Type Differences

- `Recipe` - Database format with `tagIds: string[]`
- `RecipeWithTags` - View model with `tags: Tag[]`
- `RecipeSummary` - Minimal recipe data for lists (with `tagIds`)
- `RecipeSummaryWithTags` - Minimal data for lists (with `tags`)

## Error Handling

### Service Level
Services log errors and throw them for caller handling:

```typescript
try {
  const recipe = await getRecipeById(id);
} catch (error) {
  console.error('Service error:', error);
  // Handle appropriately (show message, redirect, etc.)
}
```

### Component Level
Components should handle errors gracefully:

```typescript
let error = $state<string | null>(null);

try {
  // ... service call
} catch (err) {
  console.error('Component error:', err);
  error = err instanceof Error ? err.message : 'An error occurred';
}

{#if error}
  <div class="error">{error}</div>
{/if}
```

## File Organization

When creating new features:

```
New Feature: Shopping List
├── src/lib/services/shopping-list.service.ts  # Business logic
├── src/lib/stores/shopping-list.store.ts      # State management (if needed)
├── src/lib/components/shopping-list/          # UI components
│   ├── ShoppingList.svelte
│   ├── ShoppingListItem.svelte
│   └── AddItemForm.svelte
└── src/routes/shopping-list/                  # Pages
    ├── +page.svelte
    └── +page.server.ts (if needed)
```

## Common Pitfalls

### ❌ Don't mix Firebase and Services
```typescript
// Bad
import { auth } from '$lib/firebase';
import { getRecipeById } from '$lib/services';
```

### ❌ Don't forget cleanup
```typescript
// Bad - memory leak
onMount(() => {
  const unsubscribe = subscribeToUserRecipes(userId, callback);
  // Missing: return () => unsubscribe();
});

// Good
onMount(() => {
  const unsubscribe = subscribeToUserRecipes(userId, callback);
  return () => unsubscribe();
});
```

### ❌ Don't use old event syntax
```typescript
// Bad - Svelte 4 syntax
<button on:click={handler}>

// Good - Svelte 5 syntax
<button onclick={handler}>
```

## Testing (Future)

### Mocking Services

```typescript
import { vi } from 'vitest';
import { render } from '@testing-library/svelte';

vi.mock('$lib/services/recipeService', () => ({
  getRecipeById: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Test Recipe',
    // ... other fields
  })
}));

// Now test your component
```

## Getting Help

1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for overall structure
2. Check [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) for changes made
3. Check [src/lib/services/README.md](./src/lib/services/README.md) for service details
4. Check individual service files for JSDoc documentation

## Contributing

When adding new features:

1. ✅ Create a service in `src/lib/services/`
2. ✅ Add proper TypeScript types
3. ✅ Add JSDoc comments
4. ✅ Export from service index
5. ✅ Use the service in components (not Firebase directly)
6. ✅ Follow Svelte 5 patterns
7. ✅ Add validation in utils if needed
8. ✅ Update documentation
