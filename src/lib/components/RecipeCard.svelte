<script lang="ts">
	import type { Category } from '$lib/constants/categories';
	import { paletteColor } from '$lib/constants/palette';
	import { t } from '$lib/i18n';

	interface Props {
		id: string;
		title: string;
		image: string;
		category?: Category;
		time?: string;
	}

	let { id, title, image, category, time }: Props = $props();

	const categoryName = $derived(category ? $t(category.nameKey) : '');
	const offsetColor = $derived(category ? paletteColor(category.color) : undefined);
</script>

<a href="/recipes/{id}" class="focus-ring block">
	<article class="offset-custom border-2 border-ink bg-white" style:--offset-color={offsetColor}>
		<div class="h-[98px] overflow-hidden border-b-2 border-ink bg-image">
			<img src={image} alt={title} class="h-full w-full object-cover" />
		</div>
		<div class="pb-[11px] pl-[10px] pr-[10px] pt-[9px]">
			<p class="truncate text-[9px] font-black uppercase tracking-[0.08em] text-muted-strong">
				{categoryName}{categoryName && time ? ' · ' : ''}{time || ''}
			</p>
			<h2 class="mt-1 line-clamp-2 font-display text-[17px] font-black leading-[1.05] tracking-[-0.035em] text-ink">
				{title}
			</h2>
		</div>
	</article>
</a>
