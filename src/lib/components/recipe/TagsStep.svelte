<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import type { Tag } from '$lib';

	interface Props {
		tags: Tag[];
		availableTags: Tag[];
		onaddtag: (tag: Tag) => void;
		onremovetag: (index: number) => void;
	}

	let { tags = $bindable(), availableTags, onaddtag, onremovetag }: Props = $props();

	let newTagName = $state<string>('');
	let newTagColor = $state<string>('#4CAF50');
	let showCustomTag = $state<boolean>(false);

	function addExistingTag(tag: Tag) {
		if (!tags.some((t) => t.name === tag.name)) {
			onaddtag(tag);
		}
	}

	function addCustomTag() {
		if (newTagName.trim()) {
			onaddtag({ name: newTagName.trim(), color: newTagColor });
			newTagName = '';
			showCustomTag = false;
		}
	}
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">Tags</h2>

	<!-- Selected Tags -->
	{#if tags.length > 0}
		<div class="variant-soft-surface rounded-lg p-4">
			<p class="text-sm font-semibold mb-2 opacity-75">Selected:</p>
			<div class="flex flex-wrap gap-2">
				{#each tags as tag, i}
					<span
						class="badge rounded-full px-3 py-1 text-sm font-medium text-white flex items-center gap-2"
						style="background-color: {tag.color};"
					>
						{tag.name}
						<button
							type="button"
							onclick={() => onremovetag(i)}
							class="hover:opacity-75"
							aria-label="Remove tag"
						>
							<X size={14} />
						</button>
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Available Tags -->
	<div>
		<p class="text-sm font-semibold mb-2 opacity-75">Choose from existing tags:</p>
		<div class="flex flex-wrap gap-2 max-h-75 overflow-y-auto p-4 variant-soft-surface rounded-lg">
			{#each availableTags as tag}
				{@const isSelected = tags.some((t) => t.name === tag.name)}
				<button
					type="button"
					onclick={() => addExistingTag(tag)}
					class="badge rounded-full px-3 py-1 text-sm font-medium text-white transition-opacity"
					class:opacity-40={isSelected}
					class:cursor-not-allowed={isSelected}
					class:hover:opacity-90={!isSelected}
					style="background-color: {tag.color};"
					disabled={isSelected}
				>
					{tag.name}
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom Tag -->
	<div>
		{#if !showCustomTag}
			<button
				type="button"
				onclick={() => (showCustomTag = true)}
				class="btn preset-tonal-primary w-full"
			>
				<Plus size={16} class="mr-2" />
				Create Custom Tag
			</button>
		{:else}
			<div class="space-y-2">
				<p class="text-sm font-semibold opacity-75">Create custom tag:</p>
				<div class="flex gap-2 flex-wrap sm:flex-nowrap">
					<input
						type="text"
						bind:value={newTagName}
						placeholder="Tag name"
						class="input rounded-lg flex-1"
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
					/>
					<input
						type="color"
						bind:value={newTagColor}
						class="input w-16 h-10 rounded-lg cursor-pointer"
					/>
					<button type="button" onclick={addCustomTag} class="btn preset-filled-primary-500 whitespace-nowrap">
						Add
					</button>
					<button
						type="button"
						onclick={() => {
							showCustomTag = false;
							newTagName = '';
						}}
						class="btn preset-tonal-surface"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
