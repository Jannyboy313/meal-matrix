# Meal Matrix Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin every screen of Meal Matrix (SvelteKit + Tailwind v4, Svelte 5) to match the design handoff in `.github/design_handoff_meal_matrix_redesign/` (harsh 2px borders, offset hard shadows, Archivo type, one accent + three category colors, fully Dutch UI), replacing the current Skeleton-UI look, without changing the data model or the app's core capabilities.

**Architecture:** Drop `@skeletonlabs/skeleton`/`@skeletonlabs/tw-plugin` entirely and define the new design tokens as Tailwind v4 `@theme` CSS variables plus a handful of reusable `.offset-*`/`.focus-ring` utility classes in `src/routes/layout.css`. Every `.svelte` file that currently renders Skeleton classes (`btn`, `card`, `preset-*`, `input`, `badge`, `h1`/`h2`, `variant-*`) gets its markup restyled in place with plain Tailwind utilities — no new generic `Button`/`Card` component layer, matching this codebase's existing convention of inlining utility classes per component. One new screen (bereidingsweergave / cook mode) is added because the handoff describes step-by-step checking off that does not exist yet; one existing component (`InstructionsList.svelte`) is repurposed to implement it instead of being left dead.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`), lucide-svelte, sveltekit-i18n, Firebase/Firestore. No test runner exists in this repo (no vitest/playwright) — verification for every task is `yarn check` (svelte-check) plus a manual comparison against `.github/design_handoff_meal_matrix_redesign/final-design.html` in the browser via `yarn dev`. Introducing a test framework is out of scope for a visual redesign.

---

## Decisions made before writing this plan

These were resolved with the user (Jan) before implementation, or are judgment calls documented here so the executing engineer doesn't re-litigate them:

1. **Bereidingsweergave (cook mode) does not exist today** — the detail page only has a static, non-interactive instruction list. Decision: **build it** as a new route (`/recipes/[id]/cook`), reusing `InstructionsList.svelte` (repurposed into a checkbox list) rather than leaving it dead. This is technically a new feature, approved explicitly.
2. **Skeleton UI is removed completely** (package + config + every `btn`/`card`/`preset-*`/`input`/`badge`/`h1`/`h2`/`variant-*` class in the codebase), replaced by Tailwind v4 `@theme` tokens matching the handoff's design tokens table. This means every `.svelte` file in `src/lib/components` and `src/routes` needs its classes touched, not just the 7 handoff screens — anything still using a Skeleton class after this plan is broken (unstyled), because the classes stop existing.
3. **Language switching is removed** — `LanguageSwitcher.svelte` and `NavBar.svelte` are deleted, the app always loads the `nl` locale, `app.html` gets `lang="nl"`. The `sveltekit-i18n` machinery and the `en`/`nl` JSON files stay (so English can come back later); only the browser-detection/localStorage-switching code path goes away. Existing hardcoded English strings (several `+page.svelte` files, `InstructionsStep.svelte`, `ProgressIndicator.svelte`) get moved into the `nl` (and `en`, for parity) JSON files as part of the task that touches that file.
4. **Recipes keep multiple tags** (`tags: Tag[]`, multi-select) even though the design shows one category chip/badge per recipe. Decision: **no data-model or selection-cardinality change.** The card/detail/hero "category badge" simply renders `tags[0]`; the wizard's category step keeps its existing multi-select tag logic, just restyled into a single unified chip grid (tap an active chip again to deselect, replacing the old separate "selected tags" list + X-to-remove pattern — a minor, deliberate interaction simplification, not a capability change).
5. **Serving-size scaling keeps its current mechanism.** The handoff's "hoeveelheden schalen automatisch" language describes the *user-visible effect*, but the app has never computed scaled amounts — `Recipe.ingredients` is a dictionary of manually-authored ingredient lists keyed by serving count (`{ 2: [...], 4: [...] }`), and switching servings just looks up a different pre-written list. This plan keeps that mechanism (no scaling formula is introduced) and only fixes a latent bug on the detail page where the lookup was hardcoded to keys `2`/`4` instead of reading whatever keys actually exist (`recipes/[id]/+page.svelte:42-49` today). The detail page's "Bewerken" servings input can only switch to a serving count that already has data; entering an unknown number shows a validation message instead of silently doing nothing.
6. Card grid responsiveness beyond the 390px mobile frame (`sm:`/`lg:` breakpoints widening the grid to 3–4 columns) is kept — the handoff is mobile-first but says nothing about removing desktop support, and dropping it would be a functional regression nobody asked for.
7. `RecipeSummary` (the type used by the home-page list query) is missing `prepTime`/`cookTime` in its TypeScript shape, but the Firestore documents actually contain those fields (`subscribeToUserRecipes` spreads the whole document). Adding them to the type is a pure typing fix, not a data/query change, and is required so the home card can show "CATEGORIE · TIJD".

---

## Task 1: Design tokens & global chrome

**Files:**
- Modify: `src/routes/layout.css`
- Modify: `src/app.html`
- Modify: `tailwind.config.ts`
- Modify: `package.json`
- Modify: `static/manifest.json`
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Replace the global stylesheet**

Replace the full contents of `src/routes/layout.css` with:

```css
@import 'tailwindcss';

@theme {
	--font-display: 'Archivo', sans-serif;

	--color-ink: #17150f;
	--color-paper: #fffdf7;
	--color-surface: #ffffff;
	--color-accent: #ff5c35;
	--color-yellow: #ffc400;
	--color-teal: #2ed3b7;
	--color-violet: #6c5ce7;
	--color-muted: #8d8878;
	--color-image: #efeadc;
	--color-hero: #2a2318;
}

body {
	font-family: var(--font-display);
	background-color: var(--color-paper);
	color: var(--color-ink);
}

input::placeholder,
textarea::placeholder {
	opacity: 1;
	color: var(--color-muted);
}

.offset-ink,
.offset-accent,
.offset-yellow,
.offset-teal,
.offset-violet {
	transition:
		transform 80ms ease-out,
		box-shadow 80ms ease-out;
}

.offset-ink {
	box-shadow: 5px 5px 0 0 var(--color-ink);
}
.offset-accent {
	box-shadow: 5px 5px 0 0 var(--color-accent);
}
.offset-yellow {
	box-shadow: 5px 5px 0 0 var(--color-yellow);
}
.offset-teal {
	box-shadow: 5px 5px 0 0 var(--color-teal);
}
.offset-violet {
	box-shadow: 5px 5px 0 0 var(--color-violet);
}

.offset-ink:active {
	transform: translate(2px, 2px);
	box-shadow: 3px 3px 0 0 var(--color-ink);
}
.offset-accent:active {
	transform: translate(2px, 2px);
	box-shadow: 3px 3px 0 0 var(--color-accent);
}
.offset-yellow:active {
	transform: translate(2px, 2px);
	box-shadow: 3px 3px 0 0 var(--color-yellow);
}
.offset-teal:active {
	transform: translate(2px, 2px);
	box-shadow: 3px 3px 0 0 var(--color-teal);
}
.offset-violet:active {
	transform: translate(2px, 2px);
	box-shadow: 3px 3px 0 0 var(--color-violet);
}

.focus-ring:focus-visible {
	outline: 2px solid var(--color-accent);
	outline-offset: 2px;
}
```

This generates Tailwind utilities `bg-ink`/`text-ink`/`border-ink`, `bg-accent`/`text-accent`/`border-accent`, etc. for every `--color-*` variable (Tailwind v4 convention), plus the `.offset-*`/`.focus-ring` helper classes used by every other task in this plan to implement the "harde 2px kaders + offset-schaduw + ingedrukt-effect" pattern without repeating `box-shadow`/`:active` rules in every component.

- [ ] **Step 2: Update `app.html`**

Replace the full contents of `src/app.html` with:

```html
<!doctype html>
<html lang="nl">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
		<meta name="theme-color" content="#FF5C35" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-title" content="Meal Matrix" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="description" content="A Progressive Web App for recipe management built with SvelteKit" />
		<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
		<link rel="apple-touch-icon" href="/icon-192x192.png" />
		<link rel="manifest" href="/manifest.json" />
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link
			href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&display=swap"
			rel="stylesheet"
		/>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

- [ ] **Step 3: Remove the Skeleton plugin from Tailwind config**

Replace the full contents of `tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
	darkMode: 'selector',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [forms, typography]
} satisfies Config;
```

- [ ] **Step 4: Remove Skeleton dependencies from `package.json`**

In `package.json`, delete these two lines from `devDependencies`:

```json
		"@skeletonlabs/skeleton": "^4.7.1",
		"@skeletonlabs/tw-plugin": "^0.4.1",
```

Then run:

```bash
yarn install
```

Expected: lockfile updates, no errors, `node_modules/@skeletonlabs` is removed.

- [ ] **Step 5: Align the PWA manifest with the new theme color**

In `static/manifest.json`, change:

```json
	"background_color": "#1a1a1a",
	"theme_color": "#1a1a1a",
```

to:

```json
	"background_color": "#FFFDF7",
	"theme_color": "#FF5C35",
```

- [ ] **Step 6: Remove the shared NavBar and Skeleton theme attribute from the root layout**

Replace the full contents of `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
	import './layout.css';
	import PWAInstaller from '$lib/components/PWAInstaller.svelte';
	import { initAuthListener } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initAuthListener();
	});
</script>

<PWAInstaller />

<div class="flex min-h-screen flex-col bg-paper text-ink">
	<main class="flex-1">
		{@render children()}
	</main>
</div>
```

This drops the `data-theme="cerberus"` wrapper and the conditional `<NavBar />` — every screen in the redesign owns its own header (see Tasks 4–7), so there is no more shared top bar. `NavBar.svelte` is deleted in Task 11 once nothing references it.

- [ ] **Step 7: Verify**

Run:

```bash
yarn check
```

Expected: this will report type/reference errors in every file still using Skeleton classes or the deleted `NavBar`/`LanguageSwitcher` — that's expected at this point in the plan; confirm the errors are exactly "still uses old classes/components", not something unrelated (e.g. a typo introduced in this task's own edited files). Every one of those errors is resolved by a later task in this plan.

- [ ] **Step 8: Commit**

```bash
git add src/routes/layout.css src/app.html tailwind.config.ts package.json yarn.lock static/manifest.json src/routes/+layout.svelte
git commit -m "feat: replace Skeleton UI theme with redesign design tokens"
```

---

## Task 2: Shared status components (Login, ErrorDisplay, EmptyState, ChefHatLoader)

These four components are used across every screen (loading/error/empty states) and are explicitly called out in the handoff ("Statussen die het ontwerp nog niet toont... houd je aan de taal: 2px kaders, accent voor de fout, geen zachte schaduw"), plus the login screen which isn't part of the 7 mockups but breaks visually the moment Skeleton is removed.

**Files:**
- Modify: `src/lib/components/Login.svelte`
- Modify: `src/lib/components/ErrorDisplay.svelte`
- Modify: `src/lib/components/EmptyState.svelte`
- Modify: `src/lib/components/ChefHatLoader.svelte`

- [ ] **Step 1: Restyle `ErrorDisplay.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-paper p-6">
	<div class="w-full max-w-md space-y-4 border-2 border-ink offset-accent bg-white p-8 text-center">
		<p class="text-base font-semibold text-ink">{message}</p>
		<a
			href="/"
			class="focus-ring inline-block border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white"
		>
			{$t('common.actions.backToRecipes')}
		</a>
	</div>
</div>
```

- [ ] **Step 2: Restyle `EmptyState.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="border-2 border-dashed border-ink bg-white p-8 text-center">
	<p class="text-base font-semibold text-muted">{message}</p>
</div>
```

- [ ] **Step 3: Restyle `ChefHatLoader.svelte`**

In `src/lib/components/ChefHatLoader.svelte`, replace every `text-primary-500` and `bg-primary-500` occurrence with `text-accent` and `bg-accent` respectively (4 occurrences total: 1 in the `<ChefHat>` icon's class, 5 in the bar `<div>`s — read the file, do a literal find/replace of `primary-500` → `accent`). No other changes; the component's props/animation keyframes are unrelated to the redesign.

- [ ] **Step 4: Restyle `Login.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { user, initAuthListener } from '$lib/stores/auth';
	import { signInWithGoogle, signOut } from '$lib/services/authService';
	import { t } from '$lib/i18n';

	let loading = $state<boolean>(false);
	let error = $state<string>('');

	onMount(() => {
		initAuthListener();
	});

	async function handleGoogleSignIn(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signInWithGoogle();
		} catch (err) {
			console.error('Sign-in error:', err);
			error = err instanceof Error ? err.message : $t('common.errors.signInFailed');
		} finally {
			loading = false;
		}
	}

	async function handleSignOut(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signOut();
		} catch (err) {
			console.error('Sign-out error:', err);
			error = err instanceof Error ? err.message : $t('common.errors.signOutFailed');
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center gap-4 border-2 border-ink offset-accent bg-white p-6">
	{#if $user === undefined}
		<span class="text-sm font-semibold text-ink">{$t('common.loading.authentication')}</span>
	{:else if $user}
		<div class="flex flex-col items-center gap-4">
			{#if $user.photoURL}
				<img src={$user.photoURL} alt={$user.displayName || $t('common.nav.user')} class="h-16 w-16 border-2 border-ink object-cover" />
			{/if}
			<div class="text-center">
				<p class="text-lg font-black text-ink">{$user.displayName || $t('auth.anonymousUser')}</p>
				<p class="text-sm font-semibold text-muted">{$user.email || ''}</p>
			</div>
			<button
				onclick={handleSignOut}
				disabled={loading}
				class="focus-ring border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-[.45]"
			>
				{loading ? $t('common.loading.authentication') : $t('auth.signOut')}
			</button>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4">
			<h2 class="font-display text-xl font-black text-ink">{$t('auth.title')}</h2>
			<p class="text-sm font-semibold text-muted">{$t('auth.subtitle')}</p>
			<button
				onclick={handleGoogleSignIn}
				disabled={loading}
				class="focus-ring flex items-center gap-2 border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-[.45]"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				{loading ? $t('common.loading.authentication') : $t('auth.signInWithGoogle')}
			</button>
		</div>
	{/if}

	{#if error}
		<div class="border-2 border-ink bg-accent p-3 text-white">
			<p class="text-sm font-semibold">{error}</p>
		</div>
	{/if}
</div>
```

- [ ] **Step 5: Verify**

```bash
yarn check
```

Expected: no new errors introduced by these 4 files. Then `yarn dev`, visit `/login` while signed out, confirm the card renders with a 2px border, offset shadow, Archivo heading, and no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/Login.svelte src/lib/components/ErrorDisplay.svelte src/lib/components/EmptyState.svelte src/lib/components/ChefHatLoader.svelte
git commit -m "feat: restyle shared status components to the redesign tokens"
```

---

## Task 3: Home screen

**Files:**
- Create: `src/lib/components/AccountMenu.svelte`
- Modify: `src/lib/components/SearchBar.svelte`
- Modify: `src/lib/components/RecipeCard.svelte`
- Modify: `src/lib/components/FloatingActionButton.svelte`
- Modify: `src/routes/+page.svelte`
- Modify: `src/lib/types.ts`
- Delete: `src/lib/components/NavBar.svelte`, `src/lib/components/LanguageSwitcher.svelte`

The design's home header (title + count on the left, an avatar on the right) replaces `NavBar`. Sign-out — the one bit of `NavBar`'s functionality that must not be lost — moves into a small dropdown behind that avatar.

- [ ] **Step 1: Add `prepTime`/`cookTime` to `RecipeSummary`**

In `src/lib/types.ts`, change the `RecipeSummary` interface from:

```ts
export interface RecipeSummary {
	id: string; // UUID
	title: string;
	description: string;
	image: string;
	tagIds: string[]; // Array of tag IDs (references to /tags collection)
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
	userId?: string; // Owner of the recipe
}
```

to:

```ts
export interface RecipeSummary {
	id: string; // UUID
	title: string;
	description: string;
	image: string;
	tagIds: string[]; // Array of tag IDs (references to /tags collection)
	prepTime?: string;
	cookTime?: string;
	createdAt?: string; // ISO 8601 timestamp
	updatedAt?: string; // ISO 8601 timestamp
	userId?: string; // Owner of the recipe
}
```

This is a typing-only change: `subscribeToUserRecipes` in `recipeService.ts` already spreads the full Firestore document into these objects, so the fields exist at runtime today; they were just missing from the type.

- [ ] **Step 2: Create `AccountMenu.svelte`**

```svelte
<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { signOut } from '$lib/services/authService';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	let isOpen = $state(false);
	let loading = $state(false);

	const initials = $derived(
		($user?.displayName || $user?.email || '?')
			.trim()
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	function toggle() {
		isOpen = !isOpen;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.account-menu')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (browser && isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	async function handleSignOut(): Promise<void> {
		loading = true;
		try {
			await signOut();
			await goto('/login');
		} finally {
			loading = false;
		}
	}
</script>

<div class="account-menu relative">
	<button
		type="button"
		onclick={toggle}
		aria-label="Account"
		class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-violet bg-white font-display text-xs font-extrabold text-ink"
	>
		{initials}
	</button>

	{#if isOpen}
		<div class="absolute right-0 z-50 mt-2 w-48 border-2 border-ink offset-ink bg-white">
			<div class="border-b border-ink px-4 py-3">
				<p class="truncate text-sm font-semibold text-ink">{$user?.displayName || $user?.email}</p>
			</div>
			<button
				type="button"
				onclick={handleSignOut}
				disabled={loading}
				class="focus-ring w-full px-4 py-3 text-left text-sm font-black uppercase tracking-wide text-ink disabled:opacity-[.45]"
			>
				{loading ? $t('common.loading.authentication') : $t('common.nav.signOut')}
			</button>
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Restyle `SearchBar.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		value?: string;
		placeholder?: string;
	}

	let { value = $bindable(''), placeholder = $t('common.actions.search') }: Props = $props();
</script>

<div class="relative">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
		<Search size={18} class="text-muted" strokeWidth={2} />
	</div>
	<input
		type="search"
		bind:value
		{placeholder}
		class="focus-ring w-full border-2 border-ink offset-accent bg-white py-[15px] pl-11 pr-4 text-base font-bold text-ink"
	/>
</div>
```

(The unused `onInput` prop from the original is dropped — it was never called from the template.)

- [ ] **Step 4: Restyle `RecipeCard.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import type { Tag } from '$lib';

	interface Props {
		id: string;
		title: string;
		image: string;
		category?: Tag;
		time?: string;
		shadowIndex: number;
	}

	let { id, title, image, category, time, shadowIndex }: Props = $props();

	const SHADOW_ROTATION = ['offset-accent', 'offset-teal', 'offset-violet', 'offset-yellow'];
	const shadowClass = SHADOW_ROTATION[shadowIndex % SHADOW_ROTATION.length];
</script>

<a href="/recipes/{id}" class="focus-ring block">
	<article class="border-2 border-ink bg-white {shadowClass}">
		<div class="h-[98px] overflow-hidden border-b-2 border-ink bg-image">
			<img src={image} alt={title} class="h-full w-full object-cover" />
		</div>
		<div class="pb-[11px] pl-[10px] pr-[10px] pt-[9px]">
			<p class="truncate text-[9px] font-black uppercase tracking-[0.08em] text-muted">
				{category?.name || ''}{category && time ? ' · ' : ''}{time || ''}
			</p>
			<h2 class="mt-1 line-clamp-2 font-display text-[17px] font-black leading-[1.05] tracking-[-0.035em] text-ink">
				{title}
			</h2>
		</div>
	</article>
</a>
```

- [ ] **Step 5: Restyle `FloatingActionButton.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Plus } from 'lucide-svelte';

	interface Props {
		href: string;
		ariaLabel?: string;
	}

	let { href, ariaLabel = 'Add new item' }: Props = $props();
</script>

<a
	{href}
	aria-label={ariaLabel}
	class="focus-ring fixed bottom-[26px] right-[22px] z-50 flex h-[60px] w-[60px] items-center justify-center border-2 border-ink offset-ink bg-accent"
>
	<Plus size={28} class="text-white" strokeWidth={2.5} />
</a>
```

- [ ] **Step 6: Rewrite the home page**

Replace the full contents of `src/routes/+page.svelte` with:

```svelte
<script lang="ts">
	import type { Tag, RecipeSummaryWithTags } from '$lib';
	import { subscribeToUserRecipes } from '$lib/services/recipeService';
	import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import AccountMenu from '$lib/components/AccountMenu.svelte';
	import { t } from '$lib/i18n';

	let recipes = $state<RecipeSummaryWithTags[]>([]);
	let searchQuery = $state<string>('');
	let loading = $state<boolean>(true);
	let hasLoadedOnce = $state<boolean>(false);
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		const unsubscribeUser = user.subscribe(($user) => {
			if ($user === undefined) return;

			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}

			if ($user) {
				loading = true;
				hasLoadedOnce = false;
				unsubscribe = subscribeToUserRecipes($user.uid, (updatedRecipes) => {
					recipes = updatedRecipes;
					if (!hasLoadedOnce) {
						hasLoadedOnce = true;
						loading = false;
					}
				});
			} else {
				recipes = [];
				loading = false;
				hasLoadedOnce = true;
			}
		});

		return () => {
			unsubscribeUser();
		};
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	const filteredRecipes = $derived(
		recipes.filter((recipe: RecipeSummaryWithTags) => {
			const query = searchQuery.toLowerCase();
			return (
				recipe.title.toLowerCase().includes(query) ||
				recipe.description?.toLowerCase().includes(query) ||
				recipe.tags?.some((tag: Tag) => tag.name.toLowerCase().includes(query))
			);
		})
	);
</script>

<svelte:head>
	<title>{$t('common.app.name')}</title>
</svelte:head>

<div class="min-h-screen bg-paper pb-28">
	<header class="flex items-start justify-between px-[22px] pb-[18px] pt-3">
		<div class="flex flex-col gap-0.5">
			<span class="font-display text-[22px] font-black leading-none tracking-[-0.04em] text-ink">
				{$t('common.app.name')}
			</span>
			<span class="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
				{filteredRecipes.length} {$t('recipe.labels.recipesCount')}
			</span>
		</div>
		<AccountMenu />
	</header>

	<div class="px-[22px] pb-4">
		<SearchBar bind:value={searchQuery} placeholder={$t('recipe.placeholders.searchRecipes')} />
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16">
			<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-x-[18px] gap-y-5 px-[22px] sm:grid-cols-3 lg:grid-cols-4">
			{#each filteredRecipes as recipe, i (recipe.id)}
				<RecipeCard
					id={recipe.id}
					title={recipe.title}
					image={recipe.image}
					category={recipe.tags?.[0]}
					time={recipe.cookTime}
					shadowIndex={i}
				/>
			{/each}
		</div>

		{#if filteredRecipes.length === 0}
			<div class="px-[22px] pt-2">
				<EmptyState message={searchQuery ? $t('common.empty.noResults') : $t('common.empty.startCreating')} />
			</div>
		{/if}
	{/if}
</div>

<FloatingActionButton href="/recipes/new" ariaLabel={$t('recipe.actions.addRecipe')} />
```

- [ ] **Step 7: Add the new i18n key**

In `src/lib/i18n/locales/nl/recipe.json`, inside `"labels"`, add:

```json
		"recipesCount": "recepten",
```

In `src/lib/i18n/locales/en/recipe.json`, inside `"labels"`, add:

```json
		"recipesCount": "recipes",
```

- [ ] **Step 8: Delete the now-unused NavBar and LanguageSwitcher**

```bash
rm src/lib/components/NavBar.svelte src/lib/components/LanguageSwitcher.svelte
```

- [ ] **Step 9: Verify**

```bash
yarn check
```

Expected: no remaining references to `NavBar`/`LanguageSwitcher` (Task 1 already removed the only import site). Then `yarn dev`, sign in, confirm the home screen shows the title/count header, avatar with initials (click it → sign-out menu works), search bar, 2-column card grid with rotating shadow colors, and the floating `+` button — compare side-by-side with the `10a home` frame in `final-design.html`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/components/AccountMenu.svelte src/lib/components/SearchBar.svelte src/lib/components/RecipeCard.svelte src/lib/components/FloatingActionButton.svelte src/routes/+page.svelte src/lib/types.ts src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git add -u src/lib/components/NavBar.svelte src/lib/components/LanguageSwitcher.svelte
git commit -m "feat: redesign home screen and replace NavBar with an account menu"
```

---

## Task 4: Detail screen

**Files:**
- Modify: `src/lib/components/RecipeHero.svelte`
- Modify: `src/lib/components/RecipeMetaInfo.svelte`
- Modify: `src/lib/components/IngredientListDisplay.svelte`
- Modify: `src/routes/recipes/[id]/+page.svelte`
- Delete: `src/lib/components/TagList.svelte`, `src/lib/components/BackButton.svelte`, `src/lib/components/InstructionsList.svelte` (repurposed in Task 5 — deleted here, recreated there)

The detail screen no longer shows instructions at all (that moved to the new cook-mode screen in Task 5) — it becomes hero → title → meta blocks → servings → ingredients → a fixed bottom bar with "Lijst" and "Begin met koken".

- [ ] **Step 1: Restyle `RecipeHero.svelte`, adding the category badge**

Replace its full contents with:

```svelte
<script lang="ts">
	import { ArrowLeft, Pencil } from 'lucide-svelte';
	import type { Tag } from '$lib';

	interface Props {
		recipeId: string;
		title: string;
		image: string;
		category?: Tag;
	}

	let { recipeId, title, image, category }: Props = $props();
</script>

<header class="relative h-[212px] w-full overflow-hidden border-b-2 border-ink bg-hero">
	<img src={image} alt={title} class="h-full w-full object-cover" />

	<div class="absolute left-[22px] right-[22px] top-12 flex justify-between">
		<a
			href="/"
			aria-label="Terug naar recepten"
			class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink offset-yellow bg-white"
		>
			<ArrowLeft size={18} class="text-ink" strokeWidth={2.5} />
		</a>
		<a
			href="/recipes/{recipeId}/edit"
			aria-label="Recept bewerken"
			class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink offset-accent bg-white"
		>
			<Pencil size={18} class="text-ink" strokeWidth={2.5} />
		</a>
	</div>

	{#if category}
		<span
			class="absolute -bottom-[14px] left-4 -rotate-2 border-2 border-ink px-3 py-[5px] text-[11px] font-black uppercase text-ink"
			style="background-color: {category.color}"
		>
			{category.name}
		</span>
	{/if}
</header>
```

- [ ] **Step 2: Restyle `RecipeMetaInfo.svelte` into the three meta blocks**

Replace its full contents with:

```svelte
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		prepTime?: string;
		cookTime?: string;
		servings: number;
	}

	let { prepTime, cookTime, servings }: Props = $props();
</script>

<div class="flex gap-[9px]">
	<div class="flex-1 border-2 border-ink offset-yellow bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.prepTimeShort')}</div>
		<div class="text-[15px] font-black text-ink">{prepTime || '–'}</div>
	</div>
	<div class="flex-1 border-2 border-ink offset-teal bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.cookTimeShort')}</div>
		<div class="text-[15px] font-black text-ink">{cookTime || '–'}</div>
	</div>
	<div class="flex-1 border-2 border-ink offset-violet bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.servings')}</div>
		<div class="text-[15px] font-black text-ink">{servings}</div>
	</div>
</div>
```

- [ ] **Step 3: Restyle `IngredientListDisplay.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import type { Ingredient } from '$lib';

	interface Props {
		ingredients: Ingredient[];
	}

	let { ingredients }: Props = $props();
</script>

<div>
	{#each ingredients as ingredient, i}
		<div class="flex items-baseline justify-between border-ink py-[11px] {i === 0 ? 'border-t-2' : 'border-t'}">
			<span class="text-[15px] font-semibold text-ink">{ingredient.name}</span>
			<span class="text-sm font-black text-ink">{ingredient.amount}</span>
		</div>
	{/each}
</div>
```

- [ ] **Step 4: Add the new i18n keys**

In `src/lib/i18n/locales/nl/recipe.json`, inside `"labels"`, add:

```json
		"prepTimeShort": "Voorb.",
		"cookTimeShort": "Bereiden",
```

inside `"actions"`, add:

```json
		"viewList": "Lijst",
		"startCooking": "Begin met koken",
```

inside `"validation"`, add:

```json
		"recipeNotFound": "Recept niet gevonden",
		"recipeLoadFailed": "Recept laden mislukt",
		"servingsNotAvailable": "Deze portiegrootte is niet beschikbaar voor dit recept."
```

In `src/lib/i18n/locales/en/recipe.json`, mirror the same keys:

```json
		"prepTimeShort": "Prep",
		"cookTimeShort": "Cook",
```

```json
		"viewList": "List",
		"startCooking": "Start cooking",
```

```json
		"recipeNotFound": "Recipe not found",
		"recipeLoadFailed": "Failed to load recipe",
		"servingsNotAvailable": "This serving size isn't available for this recipe."
```

- [ ] **Step 5: Rewrite the detail page**

Replace the full contents of `src/routes/recipes/[id]/+page.svelte` with:

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags } from '$lib';
	import { getRecipeById } from '$lib/services/recipeService';
	import { onMount } from 'svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import RecipeMetaInfo from '$lib/components/RecipeMetaInfo.svelte';
	import IngredientListDisplay from '$lib/components/IngredientListDisplay.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import RecipeHero from '$lib/components/RecipeHero.svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	let selectedServings = $state<number>(4);
	let editingServings = $state<boolean>(false);
	let servingsInput = $state<string>('');
	let servingsError = $state<string>('');

	onMount(async () => {
		try {
			loading = true;
			const fetchedRecipe = await getRecipeById(data.recipeId);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				selectedServings = fetchedRecipe.servings;
			} else {
				error = $t('recipe.validation.recipeNotFound');
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = $t('recipe.validation.recipeLoadFailed');
		} finally {
			loading = false;
		}
	});

	const availableServings = $derived(
		recipe ? Object.keys(recipe.ingredients).map(Number).sort((a, b) => a - b) : []
	);

	const currentIngredients = $derived.by(() => {
		if (!recipe) return [];
		return recipe.ingredients[selectedServings] || recipe.ingredients[recipe.servings] || [];
	});

	function confirmCustomServings() {
		const value = Number(servingsInput);
		if (availableServings.includes(value)) {
			selectedServings = value;
			servingsError = '';
			editingServings = false;
			servingsInput = '';
		} else {
			servingsError = $t('recipe.validation.servingsNotAvailable');
		}
	}
</script>

<svelte:head>
	<title>{recipe?.title || $t('common.app.name')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="flex min-h-screen flex-col bg-paper pb-[92px]">
		<RecipeHero recipeId={recipe.id} title={recipe.title} image={recipe.image} category={recipe.tags?.[0]} />

		<div class="px-[22px] pt-[26px]">
			<h1 class="font-display text-[32px] font-black leading-[0.98] tracking-[-0.05em] text-ink">
				{recipe.title}
			</h1>
		</div>

		<div class="px-[22px] pt-[18px]">
			<RecipeMetaInfo prepTime={recipe.prepTime} cookTime={recipe.cookTime} servings={selectedServings} />
		</div>

		<div class="flex-1 px-[22px] pt-5">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.servings.label')}</span>
			<div class="mt-2 flex items-stretch gap-2">
				{#each availableServings as serving}
					<button
						type="button"
						onclick={() => (selectedServings = serving)}
						class="focus-ring min-w-[44px] flex-none border-2 border-ink px-2 py-[9px] text-sm font-black {selectedServings ===
						serving
							? 'bg-accent text-white'
							: 'bg-white text-ink'}"
					>
						{serving}
					</button>
				{/each}
				<button
					type="button"
					onclick={() => (editingServings = !editingServings)}
					class="focus-ring flex-1 border-2 border-ink bg-yellow px-2 py-[9px] text-xs font-black uppercase text-ink"
				>
					{$t('recipe.servings.edit')}
				</button>
			</div>

			{#if editingServings}
				<div class="mt-2 flex items-center gap-2">
					<input
						type="number"
						bind:value={servingsInput}
						min="1"
						placeholder={$t('recipe.servings.placeholder')}
						class="focus-ring h-9 w-16 border-2 border-ink bg-white text-center text-sm font-bold text-ink"
						onkeydown={(e) => e.key === 'Enter' && confirmCustomServings()}
					/>
					<button
						type="button"
						onclick={confirmCustomServings}
						class="focus-ring border-2 border-ink offset-teal bg-white px-3 py-2 text-xs font-black uppercase text-ink"
					>
						{$t('recipe.servings.confirm')}
					</button>
				</div>
				{#if servingsError}
					<p class="mt-1 text-xs font-semibold text-accent">{servingsError}</p>
				{/if}
			{/if}

			<div id="ingredients" class="mt-[14px] text-[13px] font-black uppercase tracking-[0.06em] text-ink">
				{$t('recipe.labels.ingredients')} · {currentIngredients.length}
			</div>
			<IngredientListDisplay ingredients={currentIngredients} />
		</div>

		<div class="fixed inset-x-0 bottom-0 z-40 flex gap-[10px] border-t-2 border-ink bg-white px-[22px] py-[14px] pb-6">
			<a
				href="#ingredients"
				class="focus-ring flex-none border-2 border-ink bg-white px-4 py-[14px] text-sm font-black uppercase text-ink"
			>
				{$t('recipe.actions.viewList')}
			</a>
			<a
				href="/recipes/{recipe.id}/cook"
				class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[14px] text-center text-[15px] font-black uppercase text-white"
			>
				{$t('recipe.actions.startCooking')}
			</a>
		</div>
	</div>
{/if}
```

This also fixes the pre-existing bug where `currentIngredients` only ever handled serving keys `2` and `4` (`recipe.ingredients[selectedServings] || recipe.ingredients[recipe.servings] || []` now reads whatever keys the recipe actually has).

- [ ] **Step 6: Delete the now-unused components**

`TagList.svelte` and `BackButton.svelte` are no longer imported anywhere (the category badge moved into `RecipeHero`; there's no more bottom "back to recipes" link, replaced by the hero's back arrow). `InstructionsList.svelte` is deleted here and recreated with new (checkbox-driven) behaviour in Task 5 — do not skip Task 5 after this step, the app will not build for the cook-mode route until then.

```bash
rm src/lib/components/TagList.svelte src/lib/components/BackButton.svelte src/lib/components/InstructionsList.svelte
```

- [ ] **Step 7: Verify**

```bash
yarn check
```

Expected: errors only for the not-yet-created cook route (Task 5) referencing `InstructionsList` — none for the detail page itself. Then `yarn dev`, open a recipe, confirm hero/back/edit buttons, rotated category badge, title, 3 meta blocks, servings row (only the recipe's actual serving keys + "Bewerken"), ingredient list, and the fixed bottom bar. Compare against `10b detail` in `final-design.html`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/RecipeHero.svelte src/lib/components/RecipeMetaInfo.svelte src/lib/components/IngredientListDisplay.svelte src/routes/recipes/\[id\]/+page.svelte src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git add -u src/lib/components/TagList.svelte src/lib/components/BackButton.svelte src/lib/components/InstructionsList.svelte
git commit -m "feat: redesign recipe detail screen and fix serving-lookup bug"
```

---

## Task 5: Cook-mode screen (bereidingsweergave)

**Files:**
- Create: `src/lib/components/InstructionsList.svelte` (repurposed as a checkbox list — was deleted in Task 4)
- Create: `src/routes/recipes/[id]/cook/+page.server.ts`
- Create: `src/routes/recipes/[id]/cook/+page.svelte`

- [ ] **Step 1: Recreate `InstructionsList.svelte` as an interactive checklist**

```svelte
<script lang="ts">
	interface Props {
		steps: string[];
		completedSteps: Set<number>;
		ontoggle: (index: number) => void;
	}

	let { steps, completedSteps, ontoggle }: Props = $props();
</script>

<ol>
	{#each steps as step, index}
		{@const done = completedSteps.has(index)}
		<li class="border-t border-ink">
			<button
				type="button"
				onclick={() => ontoggle(index)}
				class="focus-ring flex w-full items-start gap-[13px] py-[14px] text-left {done ? 'opacity-50' : ''}"
			>
				<span
					class="flex h-[30px] w-[30px] flex-none items-center justify-center border-2 border-ink text-[13px] font-black text-ink {done
						? 'bg-teal'
						: 'bg-white'}"
				>
					{done ? '✓' : index + 1}
				</span>
				<span class="text-base font-semibold leading-[1.4] text-ink {done ? 'line-through' : ''}">
					{step}
				</span>
			</button>
		</li>
	{/each}
</ol>
```

- [ ] **Step 2: Add the server loader for the cook route**

```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		recipeId: params.id
	};
};
```

Save as `src/routes/recipes/[id]/cook/+page.server.ts` (identical pattern to `src/routes/recipes/[id]/+page.server.ts`).

- [ ] **Step 3: Create the cook-mode page**

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags } from '$lib';
	import { getRecipeById } from '$lib/services/recipeService';
	import { onMount } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import InstructionsList from '$lib/components/InstructionsList.svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let completedSteps = $state<Set<number>>(new Set());

	onMount(async () => {
		try {
			const fetched = await getRecipeById(data.recipeId);
			if (fetched) {
				recipe = fetched;
			} else {
				error = $t('recipe.validation.recipeNotFound');
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = $t('recipe.validation.recipeLoadFailed');
		} finally {
			loading = false;
		}
	});

	function toggleStep(index: number) {
		const next = new Set(completedSteps);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		completedSteps = next;
	}

	const percentage = $derived(
		recipe && recipe.steps.length > 0 ? Math.round((completedSteps.size / recipe.steps.length) * 100) : 0
	);
</script>

<svelte:head>
	<title>{recipe?.title || $t('common.app.name')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="flex min-h-screen flex-col bg-paper">
		<header class="flex flex-none items-center gap-3 border-b-2 border-ink px-[22px] pb-4 pt-12">
			<a
				href="/recipes/{recipe.id}"
				aria-label={$t('common.actions.back')}
				class="focus-ring flex h-9 w-9 flex-none items-center justify-center border-2 border-ink offset-yellow bg-white"
			>
				<ArrowLeft size={18} class="text-ink" strokeWidth={2.5} />
			</a>
			<span class="truncate text-lg font-black tracking-[-0.035em] text-ink">{recipe.title}</span>
		</header>

		<div class="flex-none px-[22px] pt-[14px]">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
					{$t('recipe.cook.progress', { done: completedSteps.size, total: recipe.steps.length })}
				</span>
				<span class="text-xs font-black text-muted">{percentage}%</span>
			</div>
			<div class="h-[10px] border-2 border-ink bg-white">
				<div class="h-[6px] bg-accent" style="width: {percentage}%"></div>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-[22px] pb-8 pt-[14px]">
			<InstructionsList steps={recipe.steps} {completedSteps} ontoggle={toggleStep} />
		</div>
	</div>
{/if}
```

- [ ] **Step 4: Add the new i18n key**

In `src/lib/i18n/locales/nl/recipe.json`, add a top-level `"cook"` section:

```json
	"cook": {
		"progress": "{{done}} van {{total}} gedaan"
	},
```

In `src/lib/i18n/locales/en/recipe.json`:

```json
	"cook": {
		"progress": "{{done}} of {{total}} done"
	},
```

(This follows the same `{{var}}` interpolation already used by the existing `recipe.ingredients.forServings` key — `sveltekit-i18n` evaluates the placeholders against the params object passed as the second argument to `$t`.)

- [ ] **Step 5: Verify**

```bash
yarn check
```

Then `yarn dev`, open a recipe detail page, click "Begin met koken", confirm the header (back arrow + title), the progress bar/percentage, and that tapping a step toggles its checkbox, strikethrough, and updates the counter/percentage. Compare against `10c bereiding` in `final-design.html`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/InstructionsList.svelte "src/routes/recipes/[id]/cook" src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "feat: add step-by-step cook mode screen"
```

---

## Task 6: Wizard shell (header, progress bar, bottom navigation, close-confirmation)

**Files:**
- Modify: `src/lib/components/recipe/RecipeForm.svelte`
- Modify: `src/lib/components/recipe/ProgressIndicator.svelte`
- Modify: `src/lib/components/recipe/StepNavigation.svelte`
- Modify: `src/routes/recipes/new/+page.svelte`
- Modify: `src/routes/recipes/[id]/edit/+page.svelte`

The handoff's wizard header ("Nieuw recept" + a close `✕` that asks for confirmation if something was filled in) doesn't exist today — `StepNavigation` only ever showed a plain "Cancel" link on step 1 with no dirty-check. This task adds that confirmation once and reuses it both for the new header's close button and for step 1's "Annuleer" button.

- [ ] **Step 1: Restyle `ProgressIndicator.svelte` and fix its hardcoded English**

Replace its full contents with:

```svelte
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		currentStep: number;
		totalSteps: number;
		stepTitles: string[];
	}

	let { currentStep, totalSteps, stepTitles }: Props = $props();
</script>

<div class="flex flex-col gap-[10px]">
	<div class="grid grid-cols-4 gap-[6px]">
		{#each Array(totalSteps) as _, i}
			<span class="h-2 border-2 border-ink {i < currentStep ? 'bg-accent' : 'bg-transparent'}"></span>
		{/each}
	</div>
	<p class="text-[11px] font-black uppercase tracking-[0.1em] text-muted">
		{$t('recipe.wizard.stepOf', { step: currentStep, total: totalSteps, name: stepTitles[currentStep - 1] })}
	</p>
</div>
```

- [ ] **Step 2: Restyle `StepNavigation.svelte`, adding the step-1 cancel path**

Replace its full contents with:

```svelte
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		currentStep: number;
		totalSteps: number;
		isSubmitting: boolean;
		isEditing?: boolean;
		onprevious: () => void;
		onnext: () => void;
		oncancel: () => void;
	}

	let { currentStep, totalSteps, isSubmitting, isEditing = false, onprevious, onnext, oncancel }: Props = $props();
</script>

<div class="fixed inset-x-0 bottom-0 z-40 flex gap-[10px] border-t-2 border-ink bg-white px-[22px] py-[14px] pb-[26px]">
	{#if currentStep > 1}
		<button
			type="button"
			onclick={onprevious}
			class="focus-ring flex-none border-2 border-ink bg-white px-[18px] py-[15px] text-[15px] font-black uppercase text-ink"
		>
			{$t('recipe.steps.previous')}
		</button>
	{:else}
		<button
			type="button"
			onclick={oncancel}
			class="focus-ring flex-none border-2 border-ink bg-white px-[18px] py-[15px] text-[15px] font-black uppercase text-ink"
		>
			{$t('common.actions.cancel')}
		</button>
	{/if}

	{#if currentStep < totalSteps}
		<button
			type="button"
			onclick={onnext}
			class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[15px] text-[15px] font-black uppercase text-white"
		>
			{$t('recipe.steps.next')}
		</button>
	{:else}
		<button
			type="submit"
			disabled={isSubmitting}
			class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[15px] text-[15px] font-black uppercase text-white disabled:opacity-[.45]"
		>
			{#if isEditing}
				{isSubmitting ? $t('recipe.actions.updating') : $t('recipe.actions.updateRecipe')}
			{:else}
				{isSubmitting ? $t('recipe.actions.creating') : $t('recipe.actions.createRecipe')}
			{/if}
		</button>
	{/if}
</div>
```

- [ ] **Step 3: Add the header, progress placement, and close-confirmation to `RecipeForm.svelte`**

Open `src/lib/components/recipe/RecipeForm.svelte`. Add `X` to the lucide-svelte import on line 1's neighbourhood (the file currently has no icon import at the top — add one):

```ts
	import { X } from 'lucide-svelte';
```

Add one new state variable next to the other flow-state declarations (near `let isInitialized = $state<boolean>(false);`):

```ts
	let showCloseConfirm = $state<boolean>(false);
```

Add two new functions next to `clearDraft`/`validateForm` (keep every existing function — `addTag`, `removeTag`, `addServing`, `removeServing`, `changeServing`, `addIngredient`, `removeIngredient`, `addStep`, `removeStep`, `validateCurrentStep`, `nextStep`, `previousStep`, `clearDraft`, `validateForm` — all unchanged):

```ts
	function isDirty(): boolean {
		return Boolean(
			title ||
				description ||
				image ||
				prepTime ||
				cookTime ||
				tags.length ||
				steps.some((step) => step.trim()) ||
				Object.values(ingredients).some((list) => list.some((ing) => ing.name.trim() || ing.amount.trim()))
		);
	}

	function requestClose() {
		if (isDirty()) {
			showCloseConfirm = true;
		} else {
			discardAndClose();
		}
	}

	function discardAndClose() {
		clearDraft();
		showCloseConfirm = false;
		goto(isEditing && recipeId ? `/recipes/${recipeId}` : '/');
	}
```

Replace the template (everything from `<!-- Progress Indicator -->` down to the closing `</form>`, i.e. from the current line 327 to line 431) with:

```svelte
<div class="flex items-center justify-between px-[22px] pt-12">
	<span class="font-display text-xl font-black tracking-[-0.04em] text-ink">
		{isEditing ? $t('recipe.title.edit') : $t('recipe.title.createNew')}
	</span>
	<button
		type="button"
		onclick={requestClose}
		aria-label={$t('common.actions.cancel')}
		class="focus-ring flex h-[34px] w-[34px] items-center justify-center border-2 border-ink text-ink"
	>
		<X size={18} />
	</button>
</div>

<div class="px-[22px] pt-[14px]">
	<ProgressIndicator {currentStep} {totalSteps} {stepTitles} />
</div>

{#if error}
	<div class="mx-[22px] mt-[18px] border-2 border-ink offset-accent bg-accent px-4 py-3 text-white">
		<p class="text-sm font-semibold">{error}</p>
	</div>
{/if}

<form
	onsubmit={async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		const currentUser = $user;
		if (!currentUser) {
			error = $t('recipe.validation.mustBeLoggedIn');
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const recipeData = {
				title,
				description: description || '',
				image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop',
				prepTime,
				cookTime,
				servings: servings[0] || 4,
				tags,
				ingredients,
				steps
			};

			if (isEditing && recipeId) {
				await updateRecipe(recipeId, recipeData, currentUser.uid);
				clearDraft();
				await goto(`/recipes/${recipeId}`);
			} else {
				const newRecipeId = await createRecipe(recipeData, currentUser.uid);
				clearDraft();
				await goto(`/recipes/${newRecipeId}`);
			}

			onSuccess?.();
		} catch (err) {
			console.error('Error saving recipe:', err);
			error = submitErrorMessage;
		} finally {
			isSubmitting = false;
		}
	}}
	class="flex flex-col gap-[18px] px-[22px] pb-[120px] pt-[20px]"
>
	{#if currentStep === 1}
		<BasicInfoStep bind:title bind:description bind:image bind:prepTime bind:cookTime {titleError} />
	{:else if currentStep === 2}
		<TagsStep bind:tags {availableTags} onaddtag={addTag} onremovetag={removeTag} />
	{:else if currentStep === 3}
		<IngredientsStep
			bind:servings
			bind:ingredients
			bind:currentServing
			{ingredientErrors}
			onaddserving={addServing}
			onremoveserving={removeServing}
			onchangeserving={changeServing}
			onaddingredient={addIngredient}
			onremoveingredient={removeIngredient}
		/>
	{:else if currentStep === 4}
		<InstructionsStep bind:steps {stepErrors} onaddstep={addStep} onremovestep={removeStep} />
	{/if}

	<StepNavigation
		{currentStep}
		{totalSteps}
		{isSubmitting}
		{isEditing}
		onprevious={previousStep}
		onnext={nextStep}
		oncancel={requestClose}
	/>
</form>

{#if showCloseConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-[22px]">
		<div class="w-full max-w-sm border-2 border-ink offset-ink bg-white p-6">
			<p class="text-base font-semibold text-ink">{$t('recipe.wizard.discardTitle')}</p>
			<p class="mt-2 text-sm text-muted">{$t('recipe.wizard.discardBody')}</p>
			<div class="mt-5 flex gap-[10px]">
				<button
					type="button"
					onclick={() => (showCloseConfirm = false)}
					class="focus-ring flex-1 border-2 border-ink bg-white py-3 text-sm font-black uppercase text-ink"
				>
					{$t('recipe.wizard.discardCancel')}
				</button>
				<button
					type="button"
					onclick={discardAndClose}
					class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-3 text-sm font-black uppercase text-white"
				>
					{$t('recipe.wizard.discardConfirm')}
				</button>
			</div>
		</div>
	</div>
{/if}
```

Every other part of the script block (props, all `$state` declarations, the two `$effect` blocks for init/localStorage-save/URL-sync, and the scroll-to-top `$effect`) stays exactly as it is today — this step only adds the two functions/one state var above and replaces the template.

- [ ] **Step 4: Restyle the "new recipe" page wrapper**

Replace the full contents of `src/routes/recipes/new/+page.svelte` with:

```svelte
<script lang="ts">
	import type { Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let availableTags = $state<Tag[]>([]);
	let loading = $state<boolean>(true);

	onMount(async () => {
		try {
			const currentUser = $user;
			availableTags = await getAllTags(currentUser?.uid);
		} catch (error) {
			console.error('Error loading tags:', error);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{$t('recipe.title.createNew')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.tags')} />
	</div>
{:else}
	<div class="min-h-screen bg-paper">
		<RecipeForm {availableTags} storageKey="recipe-draft" submitErrorMessage={$t('recipe.validation.saveFailed')} />
	</div>
{/if}
```

- [ ] **Step 5: Restyle the "edit recipe" page wrapper**

Replace the full contents of `src/routes/recipes/[id]/edit/+page.svelte` with:

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags, Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import { getRecipeById } from '$lib/services/recipeService';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let availableTags = $state<Tag[]>([]);
	let loading = $state<boolean>(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			loading = true;
			const currentUser = $user;

			const [fetchedRecipe, fetchedTags] = await Promise.all([
				getRecipeById(data.recipeId),
				getAllTags(currentUser?.uid)
			]);

			if (fetchedRecipe) {
				recipe = fetchedRecipe;
				availableTags = fetchedTags;
			} else {
				error = $t('recipe.validation.recipeNotFound');
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = $t('recipe.validation.recipeLoadFailed');
		} finally {
			loading = false;
		}
	});

	const initialData = $derived(
		recipe
			? {
					title: recipe.title,
					description: recipe.description || '',
					image: recipe.image,
					prepTime: recipe.prepTime || '',
					cookTime: recipe.cookTime || '',
					tags: recipe.tags ? [...recipe.tags] : [],
					servings: Object.keys(recipe.ingredients).map(Number),
					currentServing: recipe.servings || Object.keys(recipe.ingredients).map(Number)[0],
					ingredients: JSON.parse(JSON.stringify(recipe.ingredients)),
					steps: [...recipe.steps]
				}
			: undefined
	);
</script>

<svelte:head>
	<title>{recipe ? `${$t('recipe.title.edit')} – ${recipe.title}` : $t('recipe.title.edit')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe && initialData}
	<div class="min-h-screen bg-paper">
		<RecipeForm
			{availableTags}
			storageKey={`recipe-edit-${data.recipeId}`}
			{initialData}
			isEditing={true}
			recipeId={data.recipeId}
			submitErrorMessage={$t('recipe.validation.saveFailed')}
		/>
	</div>
{/if}
```

- [ ] **Step 6: Add the new i18n keys**

In `src/lib/i18n/locales/nl/recipe.json`, add a top-level `"wizard"` section:

```json
	"wizard": {
		"stepOf": "Stap {{step}} van {{total}} · {{name}}",
		"discardTitle": "Wijzigingen niet opgeslagen",
		"discardBody": "Als je nu sluit, gaat wat je al hebt ingevuld verloren.",
		"discardCancel": "Doorgaan met invullen",
		"discardConfirm": "Verwijderen en sluiten"
	},
```

In `src/lib/i18n/locales/en/recipe.json`:

```json
	"wizard": {
		"stepOf": "Step {{step}} of {{total}} · {{name}}",
		"discardTitle": "Unsaved changes",
		"discardBody": "If you close now, what you've filled in will be lost.",
		"discardCancel": "Keep editing",
		"discardConfirm": "Discard and close"
	},
```

- [ ] **Step 7: Verify**

```bash
yarn check
```

Then `yarn dev`, go to "add recipe": confirm the header (title + `✕`), 4-segment progress bar with step label, and that clicking `✕` (or "Annuleer" on step 1) after typing something shows the discard-confirmation dialog; confirm "Doorgaan met invullen" dismisses it and "Verwijderen en sluiten" clears the draft and navigates home. Compare header/progress/bottom bar against `10d`–`10g` in `final-design.html`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/components/recipe/RecipeForm.svelte src/lib/components/recipe/ProgressIndicator.svelte src/lib/components/recipe/StepNavigation.svelte src/routes/recipes/new/+page.svelte "src/routes/recipes/[id]/edit/+page.svelte" src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "feat: redesign wizard shell with close-confirmation dialog"
```

---

## Task 7: Wizard step 1 — Basis

**Files:**
- Modify: `src/lib/components/recipe/BasicInfoStep.svelte`

- [ ] **Step 1: Restyle the step**

Replace its full contents with:

```svelte
<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		title: string;
		description: string;
		image: string;
		prepTime: string;
		cookTime: string;
		titleError: string;
	}

	let {
		title = $bindable(),
		description = $bindable(),
		image = $bindable(),
		prepTime = $bindable(),
		cookTime = $bindable(),
		titleError
	}: Props = $props();
</script>

<div class="flex flex-col gap-[18px]">
	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.name')} <span class="text-accent">{$t('common.required')}</span>
		</span>
		<input
			type="text"
			bind:value={title}
			placeholder={$t('recipe.placeholders.name')}
			class="focus-ring border-2 bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink {titleError
				? 'border-accent'
				: 'border-ink'}"
			required
		/>
		{#if titleError}
			<p class="text-xs font-semibold text-accent">{titleError}</p>
		{/if}
	</div>

	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.description')}</span>
		<textarea
			bind:value={description}
			placeholder={$t('recipe.placeholders.description')}
			rows="3"
			class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
		></textarea>
	</div>

	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.imageUrl')}</span>
		<input
			type="url"
			bind:value={image}
			placeholder={$t('recipe.placeholders.imageUrl')}
			class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
		/>
		<p class="text-xs font-semibold text-muted">{$t('recipe.labels.imageUrlHint')}</p>
	</div>

	{#if image}
		<div class="max-h-48 overflow-hidden border-2 border-ink">
			<img
				src={image}
				alt="Voorbeeld"
				class="h-48 w-full object-cover"
				onerror={(e) => {
					const target = e.target as HTMLImageElement;
					target.style.display = 'none';
				}}
			/>
		</div>
	{/if}

	<div class="flex gap-3">
		<div class="flex flex-1 flex-col gap-[7px]">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.prepTime')}</span>
			<input
				type="text"
				bind:value={prepTime}
				placeholder={$t('recipe.placeholders.prepTime')}
				class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			/>
		</div>
		<div class="flex flex-1 flex-col gap-[7px]">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.cookTime')}</span>
			<input
				type="text"
				bind:value={cookTime}
				placeholder={$t('recipe.placeholders.cookTime')}
				class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			/>
		</div>
	</div>
</div>
```

(The redundant `<h2>Basis Informatie</h2>` heading is dropped — the wizard shell above it already shows "STAP 1 VAN 4 · BASIS", and the mockup's step content starts directly with the "Naam" field.)

- [ ] **Step 2: Add the new i18n key**

In `src/lib/i18n/locales/nl/common.json`, add a top-level key:

```json
	"required": "Verplicht",
```

In `src/lib/i18n/locales/en/common.json`:

```json
	"required": "Required",
```

- [ ] **Step 3: Verify**

```bash
yarn check
```

Then in the wizard, confirm step 1 shows "NAAM VERPLICHT" (in accent), the description/image/prep/cook fields, and the live image preview. Compare against `10d wizard 1`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/recipe/BasicInfoStep.svelte src/lib/i18n/locales/nl/common.json src/lib/i18n/locales/en/common.json
git commit -m "feat: redesign wizard step 1 (basisinformatie)"
```

---

## Task 8: Wizard step 2 — Categorie

**Files:**
- Modify: `src/lib/components/recipe/TagsStep.svelte`

Per decision 4 above: recipes keep multiple tags; this step keeps its multi-select logic but presents it as one unified chip grid (tap a chip to select, tap again to deselect) instead of a separate "selected" list + free color picker. New categories are restricted to the four accent swatches.

- [ ] **Step 1: Restyle the step**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Tag } from '$lib';
	import { createTag } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	interface Props {
		tags: Tag[];
		availableTags: Tag[];
		onaddtag: (tag: Tag) => void;
		onremovetag: (index: number) => void;
	}

	let { tags = $bindable(), availableTags = $bindable(), onaddtag, onremovetag }: Props = $props();

	const SWATCHES = [
		{ name: 'accent', value: '#FF5C35' },
		{ name: 'yellow', value: '#FFC400' },
		{ name: 'teal', value: '#2ED3B7' },
		{ name: 'violet', value: '#6C5CE7' }
	];

	let newTagName = $state<string>('');
	let newTagColor = $state<string>(SWATCHES[0].value);
	let isCreatingTag = $state<boolean>(false);

	function toggleTag(tag: Tag) {
		const index = tags.findIndex((t) => t.name === tag.name);
		if (index === -1) {
			onaddtag(tag);
		} else {
			onremovetag(index);
		}
	}

	async function addCustomTag() {
		if (newTagName.trim() && $user) {
			isCreatingTag = true;
			try {
				const newTag = await createTag({ name: newTagName.trim(), color: newTagColor }, $user.uid);
				availableTags = [...availableTags, newTag];
				onaddtag(newTag);
				newTagName = '';
			} catch (error) {
				console.error('Error creating tag:', error);
				alert($t('recipe.tags.createError'));
			} finally {
				isCreatingTag = false;
			}
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.category')} <span class="text-accent">{$t('common.required')}</span>
		</span>
		<div class="flex flex-wrap gap-2">
			{#each availableTags as tag}
				{@const isSelected = tags.some((t) => t.name === tag.name)}
				<button
					type="button"
					onclick={() => toggleTag(tag)}
					class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
						? 'bg-accent font-black text-white'
						: 'bg-white font-extrabold text-ink'}"
				>
					{tag.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.tags.newCategory')}</span>

		<input
			type="text"
			bind:value={newTagName}
			placeholder={$t('recipe.tags.namePlaceholder')}
			disabled={isCreatingTag}
			class="focus-ring w-full border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			onkeydown={(e) => e.key === 'Enter' && !isCreatingTag && (e.preventDefault(), addCustomTag())}
		/>

		<div class="flex items-center justify-between">
			<span class="text-[11px] font-black uppercase text-muted">{$t('recipe.tags.colorLabel')}</span>
			<div class="flex gap-2">
				{#each SWATCHES as swatch}
					<button
						type="button"
						aria-label={swatch.name}
						onclick={() => (newTagColor = swatch.value)}
						class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink {newTagColor ===
						swatch.value
							? 'shadow-[inset_0_0_0_3px_var(--color-ink)]'
							: ''}"
						style="background-color: {swatch.value}"
					>
						{#if newTagColor === swatch.value}
							<Check size={16} class="text-ink" strokeWidth={3} />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<button
			type="button"
			onclick={addCustomTag}
			disabled={isCreatingTag || !newTagName.trim()}
			class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink disabled:opacity-[.45]"
		>
			{isCreatingTag ? $t('recipe.tags.adding') : $t('recipe.tags.addCategory')}
		</button>

		<p class="text-xs font-semibold text-muted">{$t('recipe.tags.newCategoryHint')}</p>
	</div>
</div>
```

- [ ] **Step 2: Add the new i18n keys**

In `src/lib/i18n/locales/nl/recipe.json`, inside `"labels"`, add:

```json
		"category": "Categorie",
```

inside `"tags"`, add:

```json
		"newCategory": "Nieuwe categorie",
		"colorLabel": "Kleur",
		"addCategory": "Categorie toevoegen",
		"newCategoryHint": "Nieuwe categorieën komen ook in het filter op het overzicht."
```

In `src/lib/i18n/locales/en/recipe.json`, inside `"labels"`:

```json
		"category": "Category",
```

inside `"tags"`:

```json
		"newCategory": "New category",
		"colorLabel": "Color",
		"addCategory": "Add category",
		"newCategoryHint": "New categories also become available as a filter on the overview."
```

- [ ] **Step 3: Verify**

```bash
yarn check
```

Then in the wizard step 2, confirm existing tags render as one chip row (tap to select/deselect, accent = selected), the "nieuwe categorie" form shows a name field + 4 fixed swatches (with a checkmark + inset ring on the active one) instead of a native color picker, and "Categorie toevoegen" adds + selects the new tag. Compare against `10e wizard 2`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/recipe/TagsStep.svelte src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "feat: redesign wizard step 2 (categorie) with a 4-swatch palette"
```

---

## Task 9: Wizard step 3 — Ingrediënten

**Files:**
- Modify: `src/lib/components/recipe/IngredientsStep.svelte`
- Modify: `src/lib/components/recipe/ServingSelector.svelte`
- Modify: `src/lib/components/recipe/IngredientList.svelte`
- Modify: `src/lib/components/recipe/IngredientInput.svelte`

All four keep their existing props/events/handlers unchanged — only markup and classes change — so the add/remove/edit-serving and add/remove-ingredient logic already tested by hand today keeps working exactly as it does now.

- [ ] **Step 1: Simplify `IngredientsStep.svelte`'s wrapper (drop the redundant heading)**

Replace its full contents with:

```svelte
<script lang="ts">
	import type { Ingredient } from '$lib';
	import ServingSelector from './ServingSelector.svelte';
	import IngredientList from './IngredientList.svelte';

	interface Props {
		servings: number[];
		ingredients: { [serving: number]: Ingredient[] };
		currentServing: number;
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddserving: () => void;
		onremoveserving: (serving: number) => void;
		onchangeserving: (serving: number) => void;
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let {
		servings = $bindable(),
		ingredients = $bindable(),
		currentServing = $bindable(),
		ingredientErrors,
		onaddserving,
		onremoveserving,
		onchangeserving,
		onaddingredient,
		onremoveingredient
	}: Props = $props();

	function handleAddServing(newServing: number) {
		onaddserving();
		servings = [...servings, newServing].sort((a, b) => a - b);

		if (ingredients[currentServing]) {
			ingredients[newServing] = ingredients[currentServing].map((ing) => ({
				name: ing.name,
				amount: ''
			}));
		} else {
			ingredients[newServing] = [];
		}

		onchangeserving(newServing);
	}

	$effect(() => {
		const currentIngredients = ingredients[currentServing] || [];

		currentIngredients.forEach((ing, index) => {
			servings.forEach((serving) => {
				if (serving !== currentServing && ingredients[serving] && ingredients[serving][index]) {
					ingredients[serving][index].name = ing.name;
				}
			});
		});
	});
</script>

<div class="flex flex-col gap-5">
	<ServingSelector
		bind:servings
		{currentServing}
		{onchangeserving}
		onaddserving={handleAddServing}
		{onremoveserving}
	/>

	<IngredientList
		bind:ingredients
		{servings}
		{currentServing}
		{ingredientErrors}
		{onaddingredient}
		{onremoveingredient}
	/>
</div>
```

- [ ] **Step 2: Restyle `ServingSelector.svelte`'s template only**

Open `src/lib/components/recipe/ServingSelector.svelte`. Keep the entire `<script>` block exactly as-is (every function: `toggleEditMode`, `handleServingClick`, `handleAddClick`, `confirmAction`, `addServing`, `updateServing`, `cancelAction`, `deleteServing`, `handleKeydown`, and every `$state`). Replace only the template (from `<div class="space-y-3">` to the final closing `</div>`) with:

```svelte
<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.servings.label')}</span>
		<button
			type="button"
			onclick={toggleEditMode}
			class="focus-ring border-2 border-ink offset-yellow bg-white px-3 py-1 text-[11px] font-black uppercase text-ink"
		>
			{editMode ? $t('recipe.servings.done') : $t('recipe.servings.edit')}
		</button>
	</div>

	<div class="flex flex-wrap items-stretch gap-2">
		{#each servings as serving}
			{@const active = editMode ? editingServing === serving : currentServing === serving}
			<button
				type="button"
				onclick={() => handleServingClick(serving)}
				class="focus-ring min-w-[44px] flex-none border-2 border-ink px-2 py-[9px] text-sm font-black {active
					? 'bg-accent text-white'
					: 'bg-white text-ink'}"
			>
				{serving}
			</button>
		{/each}

		<button
			type="button"
			onclick={handleAddClick}
			aria-label={$t('recipe.servings.addServing')}
			class="focus-ring flex h-[44px] w-[44px] flex-none items-center justify-center border-2 border-dashed border-ink text-ink {isAddingNew
				? 'border-solid bg-accent text-white'
				: 'bg-white'}"
		>
			<Plus size={20} />
		</button>
	</div>

	{#if editingServing !== null || isAddingNew}
		<div class="flex items-center gap-2">
			<input
				type="number"
				bind:value={editValue}
				placeholder={$t('recipe.servings.placeholder')}
				min="1"
				class="focus-ring h-9 w-16 border-2 border-ink bg-white text-center text-sm font-bold text-ink"
				onkeydown={handleKeydown}
			/>
			<button
				type="button"
				onclick={confirmAction}
				aria-label={$t('recipe.servings.confirm')}
				class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-teal bg-white text-ink"
			>
				<X size={14} class="rotate-45" />
			</button>
			<button
				type="button"
				onclick={cancelAction}
				aria-label={$t('common.actions.cancel')}
				class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink bg-white text-ink"
			>
				<X size={14} />
			</button>
			{#if editMode && !isAddingNew && servings.length > 1}
				<button
					type="button"
					onclick={deleteServing}
					aria-label={$t('recipe.servings.deleteServing')}
					class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-accent bg-white text-ink"
				>
					<Trash2 size={14} />
				</button>
			{/if}
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Restyle `IngredientList.svelte`, adding column headers**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import type { Ingredient } from '$lib';
	import IngredientInput from './IngredientInput.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		servings: number[];
		ingredients: { [serving: number]: Ingredient[] };
		currentServing: number;
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let {
		ingredients = $bindable(),
		servings,
		currentServing,
		ingredientErrors,
		onaddingredient,
		onremoveingredient
	}: Props = $props();

	function getAmountPlaceholder(ingredientIndex: number): string {
		const sortedServings = [...servings].sort((a, b) => a - b);
		const currentIndex = sortedServings.indexOf(currentServing);

		for (let i = currentIndex + 1; i < sortedServings.length; i++) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		for (let i = currentIndex - 1; i >= 0; i--) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		return $t('recipe.placeholders.ingredientAmount');
	}

	const currentIngredients = $derived(ingredients[currentServing] || []);
	const canDelete = $derived(currentIngredients.length > 1);
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-[9px] text-[10px] font-black uppercase tracking-[0.08em] text-muted">
		<span class="w-[92px] flex-none">{$t('recipe.ingredients.quantity')}</span>
		<span>{$t('recipe.ingredients.name')}</span>
	</div>

	{#each currentIngredients as ingredient, i}
		<IngredientInput
			bind:ingredient={ingredients[currentServing][i]}
			index={i}
			placeholder={getAmountPlaceholder(i)}
			errors={ingredientErrors[i]}
			{canDelete}
			onremove={() => onremoveingredient(i)}
		/>
	{/each}

	<button
		type="button"
		onclick={onaddingredient}
		class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
	>
		+ {$t('recipe.ingredients.addLine')}
	</button>
</div>
```

- [ ] **Step 4: Restyle `IngredientInput.svelte`**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Ingredient } from '$lib';
	import { t } from '$lib/i18n';

	interface Props {
		ingredient: Ingredient;
		index: number;
		placeholder: string;
		errors?: { name?: string; amount?: string };
		canDelete: boolean;
		onremove: () => void;
	}

	let { ingredient = $bindable(), index, placeholder, errors, canDelete, onremove }: Props = $props();
</script>

<div class="flex flex-col gap-1">
	<div class="flex gap-[9px]">
		<input
			type="text"
			bind:value={ingredient.amount}
			{placeholder}
			class="focus-ring w-[92px] flex-none border-2 bg-white px-2 py-[11px] text-sm font-black text-ink {errors?.amount
				? 'border-accent'
				: 'border-ink'}"
		/>
		<input
			type="text"
			bind:value={ingredient.name}
			placeholder={$t('recipe.ingredients.name')}
			class="focus-ring flex-1 truncate border-2 bg-white px-3 py-[11px] text-sm font-semibold text-ink {errors?.name
				? 'border-accent'
				: 'border-ink'}"
			required
		/>
		{#if canDelete}
			<button
				type="button"
				onclick={onremove}
				aria-label={$t('recipe.ingredients.remove')}
				class="focus-ring flex h-[26px] w-[26px] flex-none items-center justify-center border-2 border-ink bg-white text-accent"
			>
				<Trash2 size={14} />
			</button>
		{/if}
	</div>
	{#if errors?.amount || errors?.name}
		<div class="ml-1 text-xs font-semibold text-accent">
			{#if errors?.amount}<span>{errors?.amount}</span>{/if}
			{#if errors?.name}<span>{errors?.name}</span>{/if}
		</div>
	{/if}
</div>
```

(The delete button is now hidden instead of disabled when `canDelete` is false, matching the handoff: "de laatste regel staat leeg als placeholder; daar staat geen verwijderknop".)

- [ ] **Step 5: Add the new i18n key and update the servings label wording**

In `src/lib/i18n/locales/nl/recipe.json`, inside `"ingredients"`, add:

```json
		"addLine": "Regel toevoegen",
```

change the existing `"servings"."label"` value from `"Portiegroottes"` to `"Voor hoeveel porties"`.

In `src/lib/i18n/locales/en/recipe.json`, inside `"ingredients"`, add:

```json
		"addLine": "Add line",
```

change `"servings"."label"` from `"Serving Sizes"` (or whatever its current English value is) to `"How many servings"`.

- [ ] **Step 6: Verify**

```bash
yarn check
```

Then in the wizard step 3, confirm the servings pill row + "BEWERKEN"/"KLAAR" toggle still lets you add/edit/delete serving sizes exactly as before, the two-column "HOEVEELHEID"/"INGREDIËNT" header appears, and "+ Regel toevoegen" adds a new ingredient row. Compare against `10f wizard 3`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/recipe/IngredientsStep.svelte src/lib/components/recipe/ServingSelector.svelte src/lib/components/recipe/IngredientList.svelte src/lib/components/recipe/IngredientInput.svelte src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "feat: redesign wizard step 3 (ingredienten)"
```

---

## Task 10: Wizard step 4 — Bereiding, and final i18n sweep

**Files:**
- Modify: `src/lib/components/recipe/InstructionsStep.svelte`
- Modify: `src/lib/i18n/index.ts`
- Modify: `src/routes/+layout.ts`

This task also finishes the "NL-only" decision: locale is fixed to `nl`, browser-detection/localStorage-switching code is removed.

- [ ] **Step 1: Restyle `InstructionsStep.svelte` and fix its hardcoded English**

Replace its full contents with:

```svelte
<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		steps: string[];
		stepErrors: { [key: number]: string };
		onaddstep: () => void;
		onremovestep: (index: number) => void;
	}

	let { steps = $bindable(), stepErrors, onaddstep, onremovestep }: Props = $props();
</script>

<div class="flex flex-col gap-[14px]">
	{#each steps as step, i}
		<div class="flex flex-col gap-1">
			<div class="flex gap-3">
				<span
					class="flex h-[38px] w-[38px] flex-none items-center justify-center border-2 border-ink text-sm font-black text-ink {step.trim()
						? 'bg-yellow'
						: 'bg-white'}"
				>
					{i + 1}
				</span>
				<textarea
					bind:value={steps[i]}
					placeholder={$t('recipe.instructions.description')}
					rows="2"
					class="focus-ring min-h-[74px] flex-1 border-2 bg-white px-[13px] py-[11px] text-[15px] font-semibold leading-[1.4] text-ink {stepErrors[
						i
					]
						? 'border-accent'
						: 'border-ink'}"
					required
				></textarea>
				<button
					type="button"
					onclick={() => onremovestep(i)}
					disabled={steps.length === 1}
					aria-label={$t('recipe.instructions.removeStep')}
					class="focus-ring flex h-9 w-9 flex-none items-center justify-center self-start border-2 border-ink bg-white text-accent disabled:opacity-[.45]"
				>
					<X size={18} />
				</button>
			</div>
			{#if stepErrors[i]}
				<p class="ml-[50px] text-xs font-semibold text-accent">{stepErrors[i]}</p>
			{/if}
		</div>
	{/each}

	<button
		type="button"
		onclick={onaddstep}
		class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
	>
		+ {$t('recipe.instructions.add')}
	</button>

	<p class="text-xs font-semibold text-muted">{$t('recipe.instructions.oneActionHint')}</p>
</div>
```

This replaces the two hardcoded English strings ("Describe this step...", "Add Step") with the existing `recipe.instructions.description`/`recipe.instructions.add` keys.

- [ ] **Step 2: Add the new i18n key**

In `src/lib/i18n/locales/nl/recipe.json`, inside `"instructions"`, add:

```json
		"oneActionHint": "Eén handeling per stap leest het best tijdens het koken."
```

In `src/lib/i18n/locales/en/recipe.json`, inside `"instructions"`:

```json
		"oneActionHint": "One action per step reads best while cooking."
```

- [ ] **Step 3: Fix the locale defaults in `src/lib/i18n/index.ts`**

Change:

```ts
export const defaultLocale = 'en';

// List of supported locales
export const supportedLocales = ['en', 'nl'];

/**
 * Detects the user's preferred language from the browser
 * @returns The detected locale or the default locale
 */
export function detectBrowserLocale(): string {
	if (!browser) {
		return defaultLocale;
	}

	// Get browser languages in order of preference
	const browserLanguages = navigator.languages || [navigator.language];

	// Try to find a supported locale that matches the browser's preference
	for (const lang of browserLanguages) {
		// Check exact match (e.g., 'nl')
		if (supportedLocales.includes(lang)) {
			return lang;
		}

		// Check language code without region (e.g., 'nl-NL' -> 'nl')
		const langCode = lang.split('-')[0];
		if (supportedLocales.includes(langCode)) {
			return langCode;
		}
	}

	// Fall back to default locale
	return defaultLocale;
}
```

to:

```ts
export const defaultLocale = 'nl';
```

and remove the now-unused `import { browser } from '$app/environment';` line at the top of the file. Leave `config` (the `translations`/`loaders` object) untouched — both `en` and `nl` JSON files stay wired up so English can be reinstated later.

- [ ] **Step 4: Fix `src/routes/+layout.ts` to always load `nl`**

Replace its full contents with:

```ts
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { loadTranslations, locale, defaultLocale } from '$lib/i18n';

export const load: LayoutLoad = async ({ url }) => {
	locale.set(defaultLocale);
	await loadTranslations(defaultLocale, url.pathname);

	const publicRoutes = ['/login'];
	const isPublicRoute = publicRoutes.includes(url.pathname);
	const currentUser = get(user);

	if (!isPublicRoute && currentUser === null) {
		const returnTo = encodeURIComponent(url.pathname);
		throw redirect(303, `/login?returnTo=${returnTo}`);
	}

	return {};
};
```

- [ ] **Step 5: Verify**

```bash
yarn check
```

Then `yarn dev` with the browser set to a non-Dutch language (or just check normally, since it's now unconditional): confirm the app always renders in Dutch regardless of browser language, and `localStorage` no longer gets a `locale` key written. In the wizard step 4, confirm the numbered boxes (yellow once filled in, white while empty), "+ Stap toevoegen", and hint text. Compare against `10g wizard 4`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/recipe/InstructionsStep.svelte src/lib/i18n/index.ts src/routes/+layout.ts src/lib/i18n/locales/nl/recipe.json src/lib/i18n/locales/en/recipe.json
git commit -m "feat: redesign wizard step 4 and lock the app to the nl locale"
```

---

## Task 11: Manual visual QA pass

**Files:** none (verification-only task)

- [ ] **Step 1: Run the app and open the reference file side by side**

```bash
yarn dev
```

Open `.github/design_handoff_meal_matrix_redesign/final-design.html` in a second browser tab/window at the same time.

- [ ] **Step 2: Walk every screen and note deltas**

For each of the 8 screens (`10a home`, `10b detail`, `10c bereiding`, `10d`–`10g` wizard steps 1–4, plus anything reachable only via interaction like the discard-confirmation dialog and the account menu), compare against the corresponding frame in `final-design.html`: colors, border widths, offset-shadow colors/direction, corner radius, spacing, and Archivo weights/tracking. Resize the browser down to ~390px width to match the mobile-first frame size the mockups were built at.

- [ ] **Step 3: Confirm the interaction states from the handoff's "Interactiestaten" section**

- Pressed: primary buttons/cards visibly shift `translate(2px, 2px)` and their shadow shrinks to `3px 3px` on `:active` (the `.offset-*:active` rules from Task 1).
- Focus: tabbing to any interactive element shows a 2px accent `outline` with 2px offset (the `.focus-ring` class).
- Disabled: disabled buttons (submit while `isSubmitting`, delete-serving when only one serving exists, etc.) show `opacity-[.45]` and no offset shadow.

- [ ] **Step 4: Fix any deltas found**

If a mismatch is found, fix it in the file/task it belongs to (don't create a new catch-all file) and re-run `yarn check`.

- [ ] **Step 5: Final full-app check**

```bash
yarn check
```

Expected: zero errors, zero remaining references to `preset-`, `btn`, `card`, `variant-`, `.h1`/`.h2`/`.h3`, `primary-500`/`secondary-500`/`tertiary-500`/`surface-*-token` anywhere in `src/` (a quick sanity grep: `grep -rn "preset-\|primary-500\|secondary-500\|tertiary-500\|surface-.*-token" src/` should return nothing).

- [ ] **Step 6: Commit** (only if Step 4 produced fixes)

```bash
git add -A
git commit -m "fix: visual QA fixes against the design handoff"
```
