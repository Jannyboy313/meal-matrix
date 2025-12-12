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
Manages recipe CRUD operations:
- `getRecipeById(recipeId)` - Fetch a single recipe
- `subscribeToUserRecipes(userId, callback)` - Real-time recipe subscription
- `createRecipe(recipeData, userId)` - Create a new recipe
- `updateRecipe(recipeId, recipeData, userId)` - Update existing recipe

### `tagService.ts`
Manages tag operations:
- `getAllTags(userId?)` - Fetch all available tags (global + user-specific)
- `getTagById(tagId)` - Fetch a single tag
- `createTag(tagData, userId)` - Create a new tag
- `populateTags(tagIds)` - Convert tag IDs to full tag objects
- `populateRecipeTags(recipe)` - Add tag objects to recipe
- `populateRecipeSummaryTags(recipe)` - Add tag objects to recipe summary

## Usage

Import services from `$lib/services`:

\`\`\`typescript
import { signInWithGoogle, signOut } from '$lib/services/authService';
import { getRecipeById, createRecipe } from '$lib/services/recipeService';
import { getAllTags, createTag } from '$lib/services/tagService';
\`\`\`

Or use the service index:

\`\`\`typescript
import { signInWithGoogle, getRecipeById, getAllTags } from '$lib/services';
\`\`\`

## Best Practices

1. **Never import Firebase directly in components** - Always use services
2. **Handle errors at the service level** - Services log errors and throw for caller handling
3. **Keep services focused** - Each service handles one domain (auth, recipes, tags)
4. **Use TypeScript types** - All services are fully typed
5. **Document complex logic** - Add JSDoc comments for public methods
