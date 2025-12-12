<script lang="ts">
	import type { Tag } from '$lib';

	interface Props {
		tags: Tag[];
	}

	let { tags }: Props = $props();
</script>

{#if tags.length > 0}
	<div class="flex flex-wrap gap-2">
		{#each tags as tag}
			<span
				class="text-xs px-3 py-1 rounded-full text-white font-medium"
				style="background-color: {tag.color}"
			>
				{tag.name}
			</span>
		{/each}
	</div>
{/if}
