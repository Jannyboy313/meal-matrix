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

<div class="space-y-6">
	<h2 class="h2 text-primary-500">{$t('recipe.steps.basicInfo')}</h2>

	<label class="label">
		<span class="font-semibold">{$t('recipe.labels.name')} <span class="text-error-500">*</span></span>
		<input
			type="text"
			bind:value={title}
			placeholder={$t('recipe.placeholders.name')}
			class="input rounded-lg mt-2"
			class:!border-error-500={titleError}
			class:!border-2={titleError}
			required
		/>
		{#if titleError}
			<p class="text-error-500 text-sm mt-1">{titleError}</p>
		{/if}
	</label>

	<label class="label">
		<span class="font-semibold">{$t('recipe.labels.description')}</span>
		<textarea
			bind:value={description}
			placeholder={$t('recipe.placeholders.description')}
			class="textarea rounded-lg mt-2"
			rows="3"
		></textarea>
	</label>

	<label class="label">
		<span class="font-semibold">{$t('recipe.labels.imageUrl')}</span>
		<input
			type="url"
			bind:value={image}
			placeholder={$t('recipe.placeholders.imageUrl')}
			class="input rounded-lg mt-2"
		/>
		<p class="text-sm opacity-75 mt-1">{$t('recipe.labels.imageUrlHint')}</p>
	</label>

	{#if image}
		<div class="preset-tonal-primary rounded-lg overflow-hidden max-h-48">
			<img
				src={image}
				alt="Recipe preview"
				class="w-full h-48 object-cover"
				onerror={(e) => {
					const target = e.target as HTMLImageElement;
					target.style.display = 'none';
				}}
			/>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<label class="label">
			<span class="font-semibold">{$t('recipe.labels.prepTime')}</span>
			<input type="text" bind:value={prepTime} placeholder={$t('recipe.placeholders.prepTime')} class="input rounded-lg mt-2" />
		</label>

		<label class="label">
			<span class="font-semibold">{$t('recipe.labels.cookTime')}</span>
			<input type="text" bind:value={cookTime} placeholder={$t('recipe.placeholders.cookTime')} class="input rounded-lg mt-2" />
		</label>
	</div>
</div>
