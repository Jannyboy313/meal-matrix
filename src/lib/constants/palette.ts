/**
 * Category color palette
 *
 * Hex values live in the `@theme` block in src/routes/layout.css, which is the single source
 * of truth. This file holds the CSS variable name plus the one text color that reaches WCAG AA
 * on it. That pairing is fixed per color and follows from the contrast ratio, not from
 * context, so it belongs next to the color rather than at the call site.
 *
 * Six colors carry ink, four carry white. See design/Meal Matrix - kleurenpalet.dc.html
 */

export type OnColor = 'ink' | 'white';

export interface PaletteColor {
	/** CSS custom property declared in layout.css */
	cssVar: string;
	/** The only text color that reaches AA on this background */
	on: OnColor;
}

export const PALETTE = {
	koraal: { cssVar: '--color-accent', on: 'ink' },
	geel: { cssVar: '--color-yellow', on: 'ink' },
	teal: { cssVar: '--color-teal', on: 'ink' },
	violet: { cssVar: '--color-violet', on: 'white' },
	roze: { cssVar: '--color-roze', on: 'ink' },
	limoen: { cssVar: '--color-limoen', on: 'ink' },
	hemel: { cssVar: '--color-hemel', on: 'ink' },
	bes: { cssVar: '--color-bes', on: 'white' },
	bosgroen: { cssVar: '--color-bosgroen', on: 'white' },
	kaneel: { cssVar: '--color-kaneel', on: 'white' }
} as const satisfies Record<string, PaletteColor>;

export type PaletteToken = keyof typeof PALETTE;

const ON_COLOR_VAR: Record<OnColor, string> = {
	ink: '--color-ink',
	white: '--color-surface'
};

/**
 * Inline style for a filled surface in a palette color, carrying its fixed text color.
 * Used for the category badge, where the color comes from data rather than from a class.
 */
export function paletteStyle(token: PaletteToken): string {
	const { cssVar, on } = PALETTE[token];
	return `background-color: var(${cssVar}); color: var(${ON_COLOR_VAR[on]});`;
}
