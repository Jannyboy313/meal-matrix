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
