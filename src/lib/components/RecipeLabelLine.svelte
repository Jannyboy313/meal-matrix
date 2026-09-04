<script lang="ts">
	import type { Label } from '$lib';

	interface Props {
		labels: Label[];
	}

	let { labels }: Props = $props();
</script>

<!--
	Labels as one typographic line, not chips. Chips would compete with the category badge on
	the hero and with the three meta blocks below it; labels are secondary information and a
	single meta line adds them without changing the screen's hierarchy.

	Order is the order they were stored in, so the line stays stable across visits. The line is
	deliberately static: it is far too small for a 44px touch target, and tappable text without
	affordance is confusing. Filtering, if it ever lands, belongs on the overview.

	See .github/design_handoff_meal_matrix_labels/README.md (variant 14e)
-->
{#if labels.length > 0}
	<p
		class="mt-3 text-[11px] font-black uppercase leading-[1.5] tracking-[0.1em] text-muted-strong"
	>
		{#each labels as label, index (label.id)}{#if index > 0}<span class="text-ink"> · </span
			>{/if}{label.name}{/each}
	</p>
{/if}
