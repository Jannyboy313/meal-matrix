<script lang="ts">
	import type { Tag } from '$lib';

	interface Props {
		id: string;
		title: string;
		description?: string;
		image: string;
		tags?: Tag[];
	}

	let { id, title, description, image, tags = [] }: Props = $props();
</script>

<a href="/recipes/{id}" class="block">
	<article class="card variant-filled-surface rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer shadow-lg">
		<header class="relative h-48 overflow-hidden">
			<img
				src={image}
				alt={title}
				class="w-full h-full object-cover"
			/>
		</header>
		<div class="p-4 space-y-2">
			{#if tags.length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each tags as tag}
						<span
							class="text-xs px-2.5 py-1 rounded-full text-white font-medium"
							style="background-color: {tag.color}"
						>
							{tag.name}
						</span>
					{/each}
				</div>
			{/if}
			<h2 class="h3">{title}</h2>
			{#if description}
				<p class="text-sm opacity-75">{description}</p>
			{/if}
		</div>
	</article>
</a>
