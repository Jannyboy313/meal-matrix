# Services Layer

This directory contains the service layer for the application, following the **Single Responsibility Principle** and **Dependency Inversion Principle** from SOLID.

## Architecture

The service layer acts as an abstraction between the UI components and Firebase/Firestore. This provides several benefits:

- **Separation of Concerns**: Business logic is separated from UI and data access
- **Testability**: Services can be mocked for testing
- **Maintainability**: Changes to Firebase implementation don't affect components
- **Reusability**: Services can be used across multiple components

## Services

### `authService.ts`
Handles authentication operations:
- `signInWithGoogle()` - Sign in with Google OAuth
- `signOut()` - Sign out current user
- `updateSessionCookie()` - Manage session cookies for SSR

### `recipeService.ts`
Manages recipe CRUD operations, and owns view-model assembly — it combines the labels fetched
from Firestore with the category resolved from constants:
- `getRecipeById(recipeId)` - Fetch a single recipe, with labels and category resolved
- `subscribeToUserRecipes(userId, callback)` - Real-time recipe subscription
- `createRecipe(recipeData, userId)` - Create a new recipe from a `RecipeInput`
- `updateRecipe(recipeId, recipeData, userId)` - Update existing recipe from a `RecipeInput`

### `labelService.ts`
Manages label operations. Labels are user-created keywords stored in the `labels` collection;
they are distinct from categories, which are code constants and never hit Firestore:
- `getAllLabels(userId?)` - Fetch all available labels (global + user-specific)
- `getLabelById(labelId)` - Fetch a single label
- `createLabel(labelData, userId)` - Create a new label
- `populateLabels(labelIds)` - Convert label IDs to full label objects

## Categories are not a service

The four recipe categories live in `$lib/constants/categories.ts`, not in Firestore. A recipe
stores only a category UUID, and `getCategoryById` resolves it synchronously — so displaying a
category costs no read. See `docs/superpowers/specs/2026-09-04-labels-categories-separation-design.md`.

## Usage

Import services from `$lib/services`:

\`\`\`typescript
import { signInWithGoogle, signOut } from '$lib/services/authService';
import { getRecipeById, createRecipe } from '$lib/services/recipeService';
import { getAllLabels, createLabel } from '$lib/services/labelService';
\`\`\`

Or use the service index:

\`\`\`typescript
import { signInWithGoogle, getRecipeById, getAllLabels } from '$lib/services';
\`\`\`

## Best Practices

1. **Never import Firebase directly in components** - Always use services
2. **Handle errors at the service level** - Services log errors and throw for caller handling
3. **Keep services focused** - Each service handles one domain (auth, recipes, labels)
4. **Use TypeScript types** - All services are fully typed
5. **Document complex logic** - Add JSDoc comments for public methods
