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
