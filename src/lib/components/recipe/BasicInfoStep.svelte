<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		title: string;
		description: string;
		image: string;
		prepTime: string;
		cookTime: string;
		titleError: string;
	}

	let {
		title = $bindable(),
		description = $bindable(),
		image = $bindable(),
		prepTime = $bindable(),
		cookTime = $bindable(),
		titleError
	}: Props = $props();
</script>

<div class="flex flex-col gap-[18px]">
	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.name')} <span class="text-accent">{$t('common.required')}</span>
		</span>
		<input
			type="text"
			bind:value={title}
			placeholder={$t('recipe.placeholders.name')}
			class="focus-ring border-2 bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink {titleError
				? 'border-accent'
				: 'border-ink'}"
			required
		/>
		{#if titleError}
			<p class="text-xs font-semibold text-accent">{titleError}</p>
		{/if}
	</div>

	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.description')}</span>
		<textarea
			bind:value={description}
			placeholder={$t('recipe.placeholders.description')}
			rows="3"
			class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
		></textarea>
	</div>

	<div class="flex flex-col gap-[7px]">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.imageUrl')}</span>
		<input
			type="url"
			bind:value={image}
			placeholder={$t('recipe.placeholders.imageUrl')}
			class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
		/>
		<p class="text-xs font-semibold text-muted">{$t('recipe.labels.imageUrlHint')}</p>
	</div>

	{#if image}
		<div class="max-h-48 overflow-hidden border-2 border-ink">
			<img
				src={image}
				alt="Voorbeeld"
				class="h-48 w-full object-cover"
				onerror={(e) => {
					const target = e.target as HTMLImageElement;
					target.style.display = 'none';
				}}
			/>
		</div>
	{/if}

	<div class="flex gap-3">
		<div class="flex flex-1 flex-col gap-[7px]">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.prepTime')}</span>
			<input
				type="text"
				bind:value={prepTime}
				placeholder={$t('recipe.placeholders.prepTime')}
				class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			/>
		</div>
		<div class="flex flex-1 flex-col gap-[7px]">
			<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.labels.cookTime')}</span>
			<input
				type="text"
				bind:value={cookTime}
				placeholder={$t('recipe.placeholders.cookTime')}
				class="focus-ring border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			/>
		</div>
	</div>
</div>
