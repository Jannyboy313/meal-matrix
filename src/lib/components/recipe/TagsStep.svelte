<script lang="ts">
	import { Check } from 'lucide-svelte';
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

	const SWATCHES = [
		{ name: 'accent', value: '#FF5C35' },
		{ name: 'yellow', value: '#FFC400' },
		{ name: 'teal', value: '#2ED3B7' },
		{ name: 'violet', value: '#6C5CE7' }
	];

	// Literal class names so Tailwind's static scanner can find them (a dynamic
	// `bg-${swatch.name}` string never appears verbatim in this file, so classes
	// without another literal usage elsewhere, e.g. bg-violet, would not be generated).
	const SWATCH_BG_CLASS: Record<string, string> = {
		accent: 'bg-accent',
		yellow: 'bg-yellow',
		teal: 'bg-teal',
		violet: 'bg-violet'
	};

	let newTagName = $state<string>('');
	let newTagColor = $state<string>(SWATCHES[0].value);
	let isCreatingTag = $state<boolean>(false);

	function toggleTag(tag: Tag) {
		const index = tags.findIndex((t) => t.id === tag.id);
		if (index === -1) {
			onaddtag(tag);
		} else {
			onremovetag(index);
		}
	}

	async function addCustomTag() {
		if (newTagName.trim() && $user) {
			isCreatingTag = true;
			try {
				const newTag = await createTag({ name: newTagName.trim(), color: newTagColor }, $user.uid);
				availableTags = [...availableTags, newTag];
				onaddtag(newTag);
				newTagName = '';
			} catch (error) {
				console.error('Error creating tag:', error);
				alert($t('recipe.tags.createError'));
			} finally {
				isCreatingTag = false;
			}
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.category')} <span class="text-accent">{$t('common.required')}</span>
		</span>
		<div class="flex flex-wrap gap-2">
			{#each availableTags as tag (tag.id)}
				{@const isSelected = tags.some((t) => t.id === tag.id)}
				<button
					type="button"
					onclick={() => toggleTag(tag)}
					aria-pressed={isSelected}
					class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
						? 'bg-accent font-black text-white'
						: 'bg-white font-extrabold text-ink'}"
				>
					{tag.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<label for="new-category-name" class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.tags.newCategory')}</label>

		<input
			type="text"
			id="new-category-name"
			bind:value={newTagName}
			placeholder={$t('recipe.tags.namePlaceholder')}
			disabled={isCreatingTag}
			class="focus-ring w-full border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			onkeydown={(e) => e.key === 'Enter' && !isCreatingTag && (e.preventDefault(), addCustomTag())}
		/>

		<div class="flex items-center justify-between">
			<span class="text-[11px] font-black uppercase text-muted">{$t('recipe.tags.colorLabel')}</span>
			<div class="flex gap-2">
				{#each SWATCHES as swatch (swatch.name)}
					<button
						type="button"
						aria-label={$t('recipe.tags.swatchColors.' + swatch.name)}
						aria-pressed={newTagColor === swatch.value}
						onclick={() => (newTagColor = swatch.value)}
						class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink {SWATCH_BG_CLASS[
							swatch.name
						]} {newTagColor === swatch.value ? 'shadow-[inset_0_0_0_3px_var(--color-ink)]' : ''}"
					>
						{#if newTagColor === swatch.value}
							<Check size={16} class="text-ink" strokeWidth={3} />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<button
			type="button"
			onclick={addCustomTag}
			disabled={isCreatingTag || !newTagName.trim()}
			class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink disabled:opacity-[.45]"
		>
			{isCreatingTag ? $t('recipe.tags.adding') : $t('recipe.tags.addCategory')}
		</button>

		<p class="text-xs font-semibold text-muted">{$t('recipe.tags.newCategoryHint')}</p>
	</div>
</div>
