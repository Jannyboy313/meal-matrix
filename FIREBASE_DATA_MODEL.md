# Firebase Data Model - Recipe App

## Overview
The data model is designed for Firebase/Firestore with the following principles:
- **UUIDs for all IDs** - Ensures uniqueness across distributed systems
- **Denormalization where beneficial** - Tags embedded in recipes for efficient queries
- **Timestamps for all documents** - Track creation and updates
- **User ownership tracking** - Ready for multi-user features

---

## Collections Structure

```
/tags/{tagId}
/recipes/{recipeId}
```

---

## Data Models

### 1. Tag Collection (`/tags/{tagId}`)

**Purpose:** Store reusable tags that can be referenced by recipes. Supports both global (system) tags and user-created tags.

```typescript
interface Tag {
  id: string;           // UUID (e.g., "tag-italian")
  name: string;         // Display name (e.g., "Italian")
  color: string;        // Hex color (e.g., "#008C45")
  userId?: string;      // Owner of the tag (null/undefined for global tags)
  isGlobal?: boolean;   // True for system tags available to all users
  createdAt?: string;   // ISO 8601 timestamp
  updatedAt?: string;   // ISO 8601 timestamp
}
```

**Example Documents:**

Global/System Tag:
```json
{
  "id": "tag-italian",
  "name": "Italian",
  "color": "#008C45",
  "isGlobal": true,
  "createdAt": "2025-12-07T10:30:00Z",
  "updatedAt": "2025-12-07T10:30:00Z"
}
```

User-Created Tag:
```json
{
  "id": "tag-xyz-123",
  "name": "Family Favorite",
  "color": "#FF69B4",
  "userId": "user-abc-456",
  "isGlobal": false,
  "createdAt": "2025-12-07T14:30:00Z",
  "updatedAt": "2025-12-07T14:30:00Z"
}
```

**Indexes Needed:**
- `name` (for tag search/autocomplete)
- `userId` (to query user's custom tags)
- `isGlobal` (to filter global vs. user tags)

---

### 2. Recipe Collection (`/recipes/{recipeId}`)

**Purpose:** Store full recipe details with tag references

```typescript
interface Recipe {
  id: string;          // UUID (e.g., "recipe-1")
  title: string;
  description: string;
  image: string;       // URL to image
  tagIds: string[];    // Array of tag IDs (references)
  prepTime: string;
  cookTime: string;
  servings: number;    // Default serving size

  // Current format (object with numeric keys)
  ingredients: {
    [servingSize: number]: Ingredient[]
  };

  steps: string[];     // Array of instruction steps

  createdAt?: string;  // ISO 8601 timestamp
  updatedAt?: string;  // ISO 8601 timestamp
  userId?: string;     // Owner of the recipe
}

// View model for frontend (with populated tags)
interface RecipeWithTags extends Omit<Recipe, 'tagIds'> {
  tags: Tag[];         // Populated from /tags collection
}
```

**Example Document (Database):**
```json
{
  "id": "recipe-1",
  "title": "Spaghetti Carbonara",
  "description": "Classic Italian pasta with eggs, cheese, and pancetta",
  "image": "https://example.com/image.jpg",
  "tagIds": ["tag-italian", "tag-pasta", "tag-quick"],
  "prepTime": "10 minutes",
  "cookTime": "15 minutes",
  "servings": 4,
  "ingredients": {
    "2": [
      { "amount": "200g", "name": "Spaghetti" },
      { "amount": "100g", "name": "Pancetta" }
    ],
    "4": [
      { "amount": "400g", "name": "Spaghetti" },
      { "amount": "200g", "name": "Pancetta" }
    ]
  },
  "steps": [
    "Bring water to boil",
    "Cook pasta according to package",
    "..."
  ],
  "createdAt": "2025-12-07T10:30:00Z",
  "updatedAt": "2025-12-07T10:30:00Z",
  "userId": "user-123"
}
```

**Indexes Needed:**
- `userId` (to query user's recipes)
- `createdAt` (for sorting by date)
- `tagIds` (array-contains for filtering by tag)
- `title` (for text search - may need Algolia/Typesense for full-text)

---

## Design Decisions

### ✅ **Tag References (Normalized)**
**Decision:** Store tag IDs in recipes, fetch tag data separately

**Rationale:**
- Easy to update tags across all recipes (update once in /tags collection)
- No data duplication
- Tag updates are instant for all recipes
- Better data consistency

**Implementation:**
- Store `tagIds: string[]` in recipe documents
- Fetch tags separately from `/tags/{tagId}` collection
- Frontend uses view models (`RecipeWithTags`) with populated tag data
- Can batch-fetch multiple tags efficiently

**Trade-off:**
- Requires additional read operations for tag data
- Mitigated by: caching, batch reads, and Firestore's free tier (50k reads/day)

### ✅ **Ingredients as Object vs Array**

**Current:** `{ [servingSize: number]: Ingredient[] }`
```json
{
  "2": [...],
  "4": [...]
}
```

**Pros:**
- Direct lookup by serving size: `ingredients[4]`
- Current code uses this format

**Cons:**
- Firestore numeric keys are stored as strings
- Harder to query "all serving options"

**Future Recommendation:** Migrate to array format:
```typescript
interface ServingIngredients {
  servings: number;
  ingredients: Ingredient[];
}

servingOptions: ServingIngredients[];
```

```json
{
  "servingOptions": [
    {
      "servings": 2,
      "ingredients": [...]
    },
    {
      "servings": 4,
      "ingredients": [...]
    }
  ]
}
```

### ✅ **String IDs (UUIDs)**
**Decision:** Use string UUIDs instead of Firestore auto-IDs

**Rationale:**
- Client-side UUID generation
- Works offline
- Portable across systems
- Predictable format

**Implementation:**
- Use `crypto.randomUUID()` in browser
- Use readable prefixes: `recipe-1`, `tag-italian`

---

## Query Patterns

### Get all global tags
```typescript
const tagsRef = collection(db, 'tags');
const q = query(tagsRef, where('isGlobal', '==', true));
```

### Get user's custom tags
```typescript
const q = query(
  collection(db, 'tags'),
  where('userId', '==', currentUserId)
);
```

### Get all available tags for a user (global + their custom tags)
```typescript
// Fetch global tags
const globalTagsQuery = query(
  collection(db, 'tags'),
  where('isGlobal', '==', true)
);

// Fetch user's tags
const userTagsQuery = query(
  collection(db, 'tags'),
  where('userId', '==', currentUserId)
);

const [globalSnapshot, userSnapshot] = await Promise.all([
  getDocs(globalTagsQuery),
  getDocs(userTagsQuery)
]);

const allTags = [
  ...globalSnapshot.docs.map(doc => doc.data()),
  ...userSnapshot.docs.map(doc => doc.data())
];
```

### Get all recipes
```typescript
const recipesRef = collection(db, 'recipes');
const q = query(recipesRef, orderBy('createdAt', 'desc'));
```

### Get recipes by tag
```typescript
const q = query(
  collection(db, 'recipes'),
  where('tagIds', 'array-contains', 'tag-italian')
);

// Then fetch and populate tags
const recipesSnapshot = await getDocs(q);
const recipes = await Promise.all(
  recipesSnapshot.docs.map(async (doc) => {
    const recipe = doc.data();
    const tags = await Promise.all(
      recipe.tagIds.map(id => getDoc(doc(db, 'tags', id)))
    );
    return { ...recipe, tags: tags.map(t => t.data()) };
  })
);
```

### Batch fetch tags (more efficient)
```typescript
// Fetch unique tag IDs from all recipes
const uniqueTagIds = [...new Set(recipes.flatMap(r => r.tagIds))];

// Batch fetch all tags at once
const tagsMap = new Map();
await Promise.all(
  uniqueTagIds.map(async (id) => {
    const tagDoc = await getDoc(doc(db, 'tags', id));
    tagsMap.set(id, tagDoc.data());
  })
);

// Populate recipes with tags
const recipesWithTags = recipes.map(recipe => ({
  ...recipe,
  tags: recipe.tagIds.map(id => tagsMap.get(id))
}));
```

### Get user's recipes
```typescript
const q = query(
  collection(db, 'recipes'),
  where('userId', '==', currentUserId),
  orderBy('createdAt', 'desc')
);
```

### Search recipes by title (requires index)
```typescript
const q = query(
  collection(db, 'recipes'),
  where('title', '>=', searchTerm),
  where('title', '<=', searchTerm + '\uf8ff')
);
```

---

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Tags collection
    match /tags/{tagId} {
      allow read: if true; // Everyone can read all tags

      // Create: authenticated users can create their own tags
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.isGlobal != true;

      // Update: users can only update their own tags, not global tags
      allow update: if request.auth != null
                    && resource.data.userId == request.auth.uid
                    && resource.data.isGlobal != true;

      // Delete: users can only delete their own tags, not global tags
      allow delete: if request.auth != null
                    && resource.data.userId == request.auth.uid
                    && resource.data.isGlobal != true;
    }

    // Recipes collection
    match /recipes/{recipeId} {
      allow read: if true; // Public recipes
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Migration Plan

### Phase 1: Add Firebase (Current State ✅)
- Models support UUIDs
- Timestamps fields added (optional)
- Ready for Firestore

### Phase 2: Integrate Firestore
1. Add Firebase SDK
2. Create service layer (`lib/services/firebase.ts`)
3. Implement CRUD operations
4. Update server-side load functions to use Firestore

### Phase 3: Optimize Ingredients Structure
1. Add `servingOptions` array field
2. Populate both formats temporarily
3. Update frontend to use new format
4. Remove old `ingredients` object format

### Phase 4: Add User Features
1. Add authentication
2. Add `userId` to recipes
3. Implement user-specific queries
4. Add favorites, ratings, etc.

---

## Recommended Improvements

### 1. Add User Model
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  favoriteRecipes?: string[]; // Array of recipe IDs
}
```

### 2. Add Rating/Review System
```typescript
interface Review {
  id: string;
  recipeId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}
```

### 3. Add Collections for better organization
```typescript
interface Collection {
  id: string;
  name: string;
  description: string;
  userId: string;
  recipeIds: string[];
  createdAt: string;
}
```

---

## Summary

✅ **Current model is Firebase-ready** with:
- UUIDs for all IDs
- Denormalized tags for performance
- Optional timestamp fields
- Clear collection structure

⚠️ **Minor improvements recommended:**
- Migrate ingredients to array format (ServingIngredients[])
- Make timestamps required
- Add userId field when implementing auth

🎯 **The model is well-suited for Firestore** and follows NoSQL best practices!
