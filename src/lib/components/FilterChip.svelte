<script lang="ts">
	import { paletteStyle, type PaletteToken } from '$lib/constants/palette';

	interface Props {
		text: string;
		selected: boolean;
		/**
		 * Category chips only. Labels carry no colour by design — see the comment on Label in
		 * src/lib/types.ts.
		 */
		color?: PaletteToken;
		onclick: () => void;
	}

	let { text, selected, color, onclick }: Props = $props();

	/**
	 * paletteStyle emits the background plus the one text colour that reaches AA on it. An
	 * inline style beats a utility class, so the pairing cannot be broken from the outside.
	 */
	const style = $derived(selected && color ? paletteStyle(color) : undefined);

	const fill = $derived.by(() => {
		if (!selected) return 'bg-white';
		// Selected with a colour: the inline style paints it. Selected without one: a label chip.
		return color ? '' : 'bg-accent';
	});
</script>

<button
	type="button"
	{onclick}
	{style}
	aria-pressed={selected}
	class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase text-ink {fill} {selected
		? 'font-black'
		: 'font-extrabold'}"
>
	{text}
</button>
