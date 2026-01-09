<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import type { Tag } from '$lib';
	import { createTag } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	interface Props {
		tags: Tag[];
		availableTags: Tag[];
		onaddtag: (tag: Tag) => void;
		onremovetag: (index: number) => void;
	}

	let { tags = $bindable(), availableTags = $bindable(), onaddtag, onremovetag }: Props = $props();

	let newTagName = $state<string>('');
	let newTagColor = $state<string>('#4CAF50');
	let showCustomTag = $state<boolean>(false);
	let isCreatingTag = $state<boolean>(false);

	function addExistingTag(tag: Tag) {
		if (!tags.some((t) => t.name === tag.name)) {
			onaddtag(tag);
		}
	}

	async function addCustomTag() {
		if (newTagName.trim() && $user) {
			isCreatingTag = true;
			try {
				// Create tag in Firestore
				const newTag = await createTag(
					{
						name: newTagName.trim(),
						color: newTagColor
					},
					$user.uid
				);

				// Add to available tags list
				availableTags = [...availableTags, newTag];

				// Add to selected tags
				onaddtag(newTag);

				newTagName = '';
				showCustomTag = false;
			} catch (error) {
				console.error('Error creating tag:', error);
				alert($t('recipe.tags.createError'));
			} finally {
				isCreatingTag = false;
			}
		}
	}
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">{$t('recipe.labels.tags')}</h2>

	<!-- Selected Tags -->
	{#if tags.length > 0}
		<div class="p-4">
			<p class="text-sm font-semibold mb-2 opacity-75">{$t('recipe.tags.selected')}:</p>
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
						aria-label={$t('recipe.tags.remove')}
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
		<p class="text-sm font-semibold mb-2 opacity-75">{$t('recipe.tags.chooseExisting')}:</p>
		<div class="flex flex-wrap gap-2 max-h-75 overflow-y-auto p-4">
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
				{$t('recipe.tags.createCustom')}
			</button>
		{:else}
			<div class="space-y-2">
				<p class="text-sm font-semibold opacity-75">{$t('recipe.tags.createCustomLabel')}:</p>
				<div class="flex gap-2 flex-wrap sm:flex-nowrap">
					<input
						type="text"
						bind:value={newTagName}
						placeholder={$t('recipe.tags.namePlaceholder')}
						class="input rounded-lg flex-1"
						disabled={isCreatingTag}
						onkeydown={(e) => e.key === 'Enter' && !isCreatingTag && (e.preventDefault(), addCustomTag())}
					/>
					<input
						type="color"
						bind:value={newTagColor}
						class="input w-16 h-10 rounded-lg cursor-pointer"
						disabled={isCreatingTag}
					/>
					<button
						type="button"
						onclick={addCustomTag}
						class="btn preset-filled-primary-500 whitespace-nowrap"
						disabled={isCreatingTag || !newTagName.trim()}
					>
						{isCreatingTag ? $t('recipe.tags.adding') : $t('common.actions.add')}
					</button>
					<button
						type="button"
						onclick={() => {
							showCustomTag = false;
							newTagName = '';
						}}
						class="btn preset-tonal-surface"
						disabled={isCreatingTag}
					>
						{$t('common.actions.cancel')}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
