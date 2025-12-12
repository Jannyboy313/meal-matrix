# Component Architecture

This document describes how the application follows the principle of **Segmenting into Reusable Components**.

## Component Design Principles

### 1. Single Responsibility Principle (SRP)
Each component has one clear responsibility and does one thing well.

### 2. Reusability
Components are designed to be reused across different parts of the application.

### 3. Composability
Smaller components can be composed together to build complex UIs.

### 4. Type Safety
All components use TypeScript with proper prop interfaces.

---

## Component Categories

### Display Components

#### RecipeCard
**Purpose:** Display recipe summary information in a card format
**Location:** `src/lib/components/RecipeCard.svelte`
**Props:**
- `id: string` - Recipe identifier
- `title: string` - Recipe title
- `description?: string` - Recipe description
- `image: string` - Recipe image URL
- `tags?: Tag[]` - Associated tags

**Usage:**
```svelte
<RecipeCard
  id={recipe.id}
  title={recipe.title}
  description={recipe.description}
  image={recipe.image}
  tags={recipe.tags}
/>
```

#### IngredientListDisplay
**Purpose:** Display a list of ingredients with amounts
**Location:** `src/lib/components/IngredientListDisplay.svelte`
**Props:**
- `ingredients: Ingredient[]` - Array of ingredients

**Usage:**
```svelte
<IngredientListDisplay ingredients={currentIngredients} />
```

#### InstructionsList
**Purpose:** Display numbered recipe steps/instructions
**Location:** `src/lib/components/InstructionsList.svelte`
**Props:**
- `steps: string[]` - Array of instruction steps

**Usage:**
```svelte
<InstructionsList steps={recipe.steps} />
```

#### RecipeMetaInfo
**Purpose:** Display recipe metadata (prep time, cook time)
**Location:** `src/lib/components/RecipeMetaInfo.svelte`
**Props:**
- `prepTime?: string` - Preparation time
- `cookTime?: string` - Cooking time

**Usage:**
```svelte
<RecipeMetaInfo prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
```

#### TagList
**Purpose:** Display a list of colored tags
**Location:** `src/lib/components/TagList.svelte`
**Props:**
- `tags: Tag[]` - Array of tags to display

**Usage:**
```svelte
<TagList tags={recipe.tags} />
```

#### RecipeHero
**Purpose:** Display the recipe header with image and action buttons
**Location:** `src/lib/components/RecipeHero.svelte`
**Props:**
- `recipeId: string` - Recipe identifier for edit link
- `title: string` - Recipe title for alt text
- `image: string` - Hero image URL

**Usage:**
```svelte
<RecipeHero recipeId={recipe.id} title={recipe.title} image={recipe.image} />
```

---

### Input Components

#### SearchBar
**Purpose:** Reusable search input with icon
**Location:** `src/lib/components/SearchBar.svelte`
**Props:**
- `value?: string` - Bindable search value
- `placeholder?: string` - Input placeholder text

**Usage:**
```svelte
<SearchBar bind:value={searchQuery} placeholder="Search recipes..." />
```

---

### Navigation Components

#### BackButton
**Purpose:** Consistent back navigation button
**Location:** `src/lib/components/BackButton.svelte`
**Props:**
- `href?: string` - Destination URL (default: '/')
- `text?: string` - Button text (default: '← Back to Recipes')

**Usage:**
```svelte
<BackButton />
<BackButton href="/custom" text="Go Back" />
```

#### FloatingActionButton
**Purpose:** Floating action button (FAB) for primary actions
**Location:** `src/lib/components/FloatingActionButton.svelte`
**Props:**
- `href: string` - Destination URL
- `ariaLabel?: string` - Accessibility label
- `iconSize?: number` - Icon size in pixels

**Usage:**
```svelte
<FloatingActionButton href="/recipes/new" ariaLabel="Add new recipe" />
```

---

### Feedback Components

#### LoadingSpinner
**Purpose:** Consistent loading state display
**Location:** `src/lib/components/LoadingSpinner.svelte`
**Props:**
- `message?: string` - Loading message (default: 'Loading...')

**Usage:**
```svelte
{#if loading}
  <LoadingSpinner message="Loading recipe..." />
{/if}
```

#### ErrorDisplay
**Purpose:** Consistent error state display
**Location:** `src/lib/components/ErrorDisplay.svelte`
**Props:**
- `message: string` - Error message to display

**Usage:**
```svelte
{#if error}
  <ErrorDisplay message={error} />
{/if}
```

#### EmptyState
**Purpose:** Display when no data is available
**Location:** `src/lib/components/EmptyState.svelte`
**Props:**
- `message: string` - Empty state message

**Usage:**
```svelte
{#if items.length === 0}
  <EmptyState message="No items found" />
{/if}
```

---

### Feature Components

#### Login
**Purpose:** Complete login/logout functionality with auth state management
**Location:** `src/lib/components/Login.svelte`

#### NavBar
**Purpose:** Application navigation with user menu
**Location:** `src/lib/components/NavBar.svelte`

#### PWAInstaller
**Purpose:** PWA installation prompt handler
**Location:** `src/lib/components/PWAInstaller.svelte`

#### RecipeForm (Complex Component)
**Purpose:** Multi-step recipe creation/editing form
**Location:** `src/lib/components/recipe/RecipeForm.svelte`
**Sub-components:**
- BasicInfoStep
- TagsStep
- IngredientsStep
- InstructionsStep
- ProgressIndicator
- StepNavigation

---

## Component Composition Examples

### Home Page
The home page demonstrates good component composition:

```svelte
<SearchBar bind:value={searchQuery} />

<div class="grid">
  {#each filteredRecipes as recipe}
    <RecipeCard {...recipe} />
  {/each}
</div>

{#if filteredRecipes.length === 0}
  <EmptyState message="No recipes found" />
{/if}

<FloatingActionButton href="/recipes/new" />
```

### Recipe Detail Page
The recipe detail page uses multiple specialized components:

```svelte
{#if loading}
  <LoadingSpinner message="Loading recipe..." />
{:else if error}
  <ErrorDisplay message={error} />
{:else if recipe}
  <RecipeHero {...recipe} />

  <TagList tags={recipe.tags} />
  <RecipeMetaInfo prepTime={recipe.prepTime} cookTime={recipe.cookTime} />

  <IngredientListDisplay ingredients={currentIngredients} />
  <InstructionsList steps={recipe.steps} />

  <BackButton />
{/if}
```

---

## Benefits of This Architecture

### 1. **Maintainability**
- Changes to a component are isolated
- Easier to locate and fix bugs
- Clear separation of concerns

### 2. **Reusability**
- Components can be used across different pages
- Reduces code duplication
- Consistent UI/UX across the application

### 3. **Testability**
- Small, focused components are easier to test
- Clear inputs (props) and outputs (events)
- Can test components in isolation

### 4. **Developer Experience**
- Clear component names indicate their purpose
- Well-defined props with TypeScript types
- Easy to understand component hierarchy

### 5. **Performance**
- Smaller components can be optimized individually
- Easier to identify performance bottlenecks
- Better code splitting opportunities

---

## Best Practices

### 1. Keep Components Small
Each component should fit on one screen without scrolling. If larger, consider breaking it down.

### 2. Use Descriptive Names
Component names should clearly indicate what they display or do:
- ✅ `RecipeCard`, `IngredientListDisplay`, `LoadingSpinner`
- ❌ `Card`, `List`, `Spinner`

### 3. Props Over Internal State
Prefer passing data via props rather than fetching within components (unless it's a feature component).

### 4. Consistent Styling
Use Tailwind utility classes and Skeleton UI components for consistency.

### 5. Mobile-First Design
All components follow mobile-first responsive design with Tailwind breakpoints.

### 6. TypeScript Interfaces
Always define proper TypeScript interfaces for props:
```typescript
interface Props {
  id: string;
  title: string;
  optional?: string;
}
```

### 7. Accessibility
Ensure all components include proper ARIA labels and semantic HTML.

---

## Anti-Patterns to Avoid

### ❌ Monolithic Components
Don't create large components that handle multiple responsibilities:
```svelte
<!-- BAD: One component doing too much -->
<RecipePageEverything />
```

### ❌ Prop Drilling
Avoid passing props through multiple levels. Use stores for shared state:
```svelte
<!-- BAD: Props passed through many levels -->
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

<!-- GOOD: Use stores -->
import { user } from '$lib/stores/auth';
```

### ❌ Duplicated Code
If you're copying and pasting component markup, extract it into a reusable component instead.

---

## Adding New Components

When adding a new component, follow this checklist:

1. **Identify the responsibility** - What is the single purpose?
2. **Define the props** - What data does it need?
3. **Choose the location**:
   - `src/lib/components/` - General reusable components
   - `src/lib/components/recipe/` - Recipe-specific components
4. **Create TypeScript interface** - Define prop types
5. **Follow naming conventions** - Use PascalCase
6. **Apply Tailwind styling** - Mobile-first, use Skeleton UI tokens
7. **Add to this documentation** - Update the appropriate section
8. **Test in isolation** - Verify the component works independently

---

## Conclusion

By following the principle of segmenting the application into reusable components, we've created a maintainable, scalable codebase that's easy to understand and extend. Each component has a clear purpose, making the application easier to develop, test, and maintain.
