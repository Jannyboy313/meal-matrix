# Architecture Overview

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  (Svelte Components - Pages & Components)                   │
│                                                              │
│  • +page.svelte files (routes)                              │
│  • Components (Login, NavBar, RecipeForm, etc.)             │
│  • Responsible for: Display, User Interaction               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORE LAYER                               │
│  (Svelte Stores - State Management)                         │
│                                                              │
│  • auth.ts - Authentication state                           │
│  • recipe-form.store.ts - Form state & persistence          │
│  • Responsible for: Reactive State, localStorage            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  (Business Logic & Firebase Abstraction)                    │
│                                                              │
│  • authService.ts - Authentication operations              │
│  • recipeService.ts - Recipe CRUD operations               │
│  • tagService.ts - Tag management                          │
│  • Responsible for: Business Logic, Data Transformation     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ uses
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                          │
│  (Firebase Configuration)                                    │
│                                                              │
│  • firebase.ts - Firebase initialization                    │
│  • Exports: auth, db instances                              │
│  • Responsible for: Firebase connection                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ connects to
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                          │
│  (Cloud Firestore, Authentication)                          │
│                                                              │
│  • Authentication (Google OAuth)                            │
│  • Firestore Collections: recipes, tags                     │
│  • Real-time subscriptions                                  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Read Flow (Example: Loading Recipes)
```
1. User opens homepage (+page.svelte)
   ↓
2. Component subscribes to user store (auth.ts)
   ↓
3. When user authenticated, calls subscribeToUserRecipes()
   from recipeService.ts
   ↓
4. Service queries Firestore via db instance
   ↓
5. Real-time updates received from Firestore
   ↓
6. Service populates tags using tagService.ts
   ↓
7. Transformed data returned via callback
   ↓
8. Component updates reactive state
   ↓
9. UI re-renders with new data
```

### Write Flow (Example: Creating Recipe)
```
1. User fills RecipeForm component
   ↓
2. Form state managed by local $state
   (could use recipe-form.store.ts)
   ↓
3. User submits form
   ↓
4. Component calls createRecipe() from recipeService.ts
   ↓
5. Service validates and transforms data
   ↓
6. Service writes to Firestore via db instance
   ↓
7. Firestore returns document ID
   ↓
8. Service returns ID to component
   ↓
9. Component navigates to new recipe page
   ↓
10. Real-time subscription picks up new recipe
```

## Directory Structure

```
src/lib/
├── firebase.ts              # Firebase config (DATA ACCESS)
├── index.ts                 # Main exports
├── types.ts                 # TypeScript types
│
├── services/                # SERVICE LAYER
│   ├── authService.ts      # Auth operations
│   ├── recipeService.ts    # Recipe CRUD
│   ├── tagService.ts       # Tag management
│   ├── index.ts             # Service exports
│   └── README.md            # Service documentation
│
├── stores/                  # STORE LAYER
│   ├── auth.ts              # Auth state
│   └── recipe-form.store.ts # Form state
│
├── utils/                   # UTILITIES
│   └── recipe-form-validation.ts  # Validation logic
│
└── components/              # UI LAYER
    ├── Login.svelte
    ├── NavBar.svelte
    └── recipe/
        ├── RecipeForm.svelte
        ├── BasicInfoStep.svelte
        ├── TagsStep.svelte
        ├── IngredientsStep.svelte
        └── InstructionsStep.svelte
```

## Component Hierarchy

```
App Layout (+layout.svelte)
│
├── NavBar
│   └── Uses: auth store, auth service
│
└── Routes
    │
    ├── Home (+page.svelte)
    │   └── Uses: auth store, recipe service
    │
    ├── Recipe Detail ([id]/+page.svelte)
    │   └── Uses: recipe service
    │
    ├── Recipe New (new/+page.svelte)
    │   ├── Uses: tag service
    │   └── RecipeForm
    │       ├── Uses: auth store, recipe service
    │       ├── ProgressIndicator
    │       ├── BasicInfoStep
    │       ├── TagsStep (uses tag service)
    │       ├── IngredientsStep
    │       │   ├── ServingSelector
    │       │   └── IngredientList
    │       │       └── IngredientInput
    │       ├── InstructionsStep
    │       └── StepNavigation
    │
    └── Recipe Edit ([id]/edit/+page.svelte)
        ├── Uses: recipe service, tag service
        └── RecipeForm (same as above)
```

## Service Dependencies

```
UI Components
    ↓
┌───────────────────────────────────────┐
│         Service Layer                 │
│                                       │
│  authService ←→ auth store          │
│       ↓                               │
│  Firebase Auth                        │
│                                       │
│  recipeService                       │
│       ↓                               │
│  tagService ← (uses for population) │
│       ↓                               │
│  Firestore DB                         │
└───────────────────────────────────────┘
```

## Key Design Patterns

### 1. Service Pattern
- Encapsulates business logic
- Provides clean API to components
- Handles Firebase operations

### 2. Store Pattern (Svelte)
- Reactive state management
- Readonly exports for encapsulation
- Subscription-based updates

### 3. Repository Pattern
- Services act as repositories
- Abstract data access
- Single source of truth for data operations

### 4. Factory Pattern
- `createRecipeFormStore()` factory function
- Creates configured store instances
- Encapsulates store creation logic

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- ✅ Each service handles one domain
- ✅ Validation separated into utils
- ✅ Form state in dedicated store

### Open/Closed Principle (OCP)
- ✅ Services can be extended via new methods
- ✅ No need to modify existing code

### Liskov Substitution Principle (LSP)
- ✅ Services implement consistent interfaces
- ✅ Can be swapped (e.g., for mocks)

### Interface Segregation Principle (ISP)
- ✅ Services expose only needed methods
- ✅ No fat interfaces

### Dependency Inversion Principle (DIP)
- ✅ Components depend on service abstractions
- ✅ Not on Firebase directly
- ✅ Easy to swap implementations

## Benefits

### For Development
- 🎯 Clear separation of concerns
- 🧪 Easy to test (mockable services)
- 📦 Reusable code across components
- 🔍 Easy to find functionality
- 📝 Self-documenting architecture

### For Maintenance
- 🔧 Changes isolated to specific layers
- 🛡️ Type safety throughout
- 📚 Clear documentation
- 🔄 Easy to refactor

### For Scalability
- ➕ Easy to add new services
- 🌳 Clear place for new features
- 🔌 Can replace Firebase without UI changes
- 📈 Supports growing codebase

## Migration Strategy

### Phase 1: Service Layer (✅ Complete)
- Created service modules
- Maintained backward compatibility
- Updated core components

### Phase 2: Component Updates (✅ Complete)
- Updated imports to use services
- Applied Svelte 5 best practices
- Improved component structure

### Phase 3: Deprecation (Future)
- Mark old patterns as deprecated
- Gradual migration of remaining code
- Remove deprecated code when ready

## Testing Strategy

### Unit Tests (Future)
```typescript
// Mock services for component tests
jest.mock('$lib/services/recipeService', () => ({
  getRecipeById: jest.fn(),
  createRecipe: jest.fn()
}));
```

### Integration Tests (Future)
- Test service layer with Firebase emulator
- Test real-time subscriptions
- Test error handling

### E2E Tests (Future)
- Test complete user flows
- Test authentication
- Test recipe CRUD operations
