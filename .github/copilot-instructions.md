# GitHub Copilot Project Instructions

This project is a high-performance web application built with a focus on Progressive Web App (PWA) standards.

## 1. Project Context & Technology Stack
* **Core Framework:** SvelteKit / Svelte.
* **Package Manager:** **Yarn**. All installation and execution commands must use Yarn (`yarn install`, `yarn dev`, `yarn build`).
* **Styling:** **Tailwind CSS** for a utility-first approach. Avoid raw CSS or inline styles unless strictly necessary for custom components or overrides.
* **Component Library:** **Skeleton UI**. Utilize Skeleton UI components, classes, and design tokens (e.g., colors, typography variants) where applicable.

---

## 2. Svelte & Component Conventions
* **File Naming:** Components must be named using **PascalCase** (e.g., `SettingsModal.svelte`).
* **Props:** Use **`export let`** for props. Always provide a default value when a prop is optional.
* **Reactivity:**
    * Use the Svelte **`$stores`** syntax for reactive state management.
    * Utilize **reactive declarations (`$:`)** to compute values reactively or run side effects where logic demands it.
* **Structure:** Place the **`<script>`** tag as the first element in the component file, followed by the `<style>` and then the markup.
* **Design:** Components should adhere to the **Single Responsibility Principle** (SRP) – keep them small, focused, and highly reusable.

---

## 3. PWA & Performance Guidelines
* **Offline-First:** All new feature implementation and routing logic must consider an offline or low-connectivity user experience.
* **Service Workers:** When generating code for asset caching or background sync, refer to **SvelteKit's service worker integration** setup. Do not generate generic vanilla JavaScript service worker code.
* **Manifest:** Ensure any generated features that affect app meta-data align with **Web App Manifest** best practices (e.g., appropriate naming, icons, display modes).
* **Loading:** Prioritize performance: use SvelteKit's **`+page.server.js`** for data loading and avoid excessive client-side fetching where possible.

---

## 4. Styling & Tailwind Focus (Mobile First)
* **Mobile First:** Apply all Tailwind classes **without a prefix** (e.g., `pt-4`, `flex`) as the base styling for mobile. Use explicit responsive prefixes (`sm:`, `md:`, `lg:`) **only for overrides** at larger screen sizes.
* **Utility First:** Generate all styling using Tailwind utility classes. Do not define new CSS classes in the `<style>` block unless they are encapsulated or part of a component's structural necessity.
* **Skeleton UI Classes:** When suggesting UI elements (cards, buttons, forms), use the standard **Skeleton UI class prefixes** (e.g., `btn`, `card`, `variant-filled-surface`).
* **Accessibility:** Ensure all generated markup includes appropriate **ARIA attributes** and follows **A11y (Accessibility)** standards.