<script lang="ts">
	import { Check } from 'lucide-svelte';
	import type { Label } from '$lib';
	import { createLabel } from '$lib/services/labelService';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	interface Props {
		labels: Label[];
		availableLabels: Label[];
		onaddlabel: (label: Label) => void;
		onremovelabel: (index: number) => void;
	}

	let {
		labels = $bindable(),
		availableLabels = $bindable(),
		onaddlabel,
		onremovelabel
	}: Props = $props();

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

	let newLabelName = $state<string>('');
	let newLabelColor = $state<string>(SWATCHES[0].value);
	let isCreatingLabel = $state<boolean>(false);

	function toggleLabel(label: Label) {
		const index = labels.findIndex((l) => l.id === label.id);
		if (index === -1) {
			onaddlabel(label);
		} else {
			onremovelabel(index);
		}
	}

	async function addCustomLabel() {
		if (newLabelName.trim() && $user) {
			isCreatingLabel = true;
			try {
				const newLabel = await createLabel(
					{ name: newLabelName.trim(), color: newLabelColor },
					$user.uid
				);
				availableLabels = [...availableLabels, newLabel];
				onaddlabel(newLabel);
				newLabelName = '';
			} catch (error) {
				console.error('Error creating label:', error);
				alert($t('recipe.labelPicker.createError'));
			} finally {
				isCreatingLabel = false;
			}
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labels.labels')}
		</span>
		<div class="flex flex-wrap gap-2">
			{#each availableLabels as label (label.id)}
				{@const isSelected = labels.some((l) => l.id === label.id)}
				<button
					type="button"
					onclick={() => toggleLabel(label)}
					aria-pressed={isSelected}
					class="focus-ring border-2 border-ink px-[13px] py-[9px] text-xs uppercase {isSelected
						? 'bg-accent font-black text-ink'
						: 'bg-white font-extrabold text-ink'}"
				>
					{label.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<label for="new-label-name" class="text-xs font-black uppercase tracking-[0.08em] text-ink">
			{$t('recipe.labelPicker.newLabel')}
		</label>

		<input
			type="text"
			id="new-label-name"
			bind:value={newLabelName}
			placeholder={$t('recipe.labelPicker.namePlaceholder')}
			disabled={isCreatingLabel}
			class="focus-ring w-full border-2 border-ink bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink"
			onkeydown={(e) =>
				e.key === 'Enter' && !isCreatingLabel && (e.preventDefault(), addCustomLabel())}
		/>

		<div class="flex items-center justify-between">
			<span class="text-[11px] font-black uppercase text-muted">
				{$t('recipe.labelPicker.colorLabel')}
			</span>
			<div class="flex gap-2">
				{#each SWATCHES as swatch (swatch.name)}
					<button
						type="button"
						aria-label={$t('recipe.labelPicker.swatchColors.' + swatch.name)}
						aria-pressed={newLabelColor === swatch.value}
						onclick={() => (newLabelColor = swatch.value)}
						class="focus-ring flex h-[38px] w-[38px] items-center justify-center border-2 border-ink {SWATCH_BG_CLASS[
							swatch.name
						]} {newLabelColor === swatch.value
							? 'shadow-[inset_0_0_0_3px_var(--color-ink)]'
							: ''}"
					>
						{#if newLabelColor === swatch.value}
							<Check size={16} class="text-ink" strokeWidth={3} />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<button
			type="button"
			onclick={addCustomLabel}
			disabled={isCreatingLabel || !newLabelName.trim()}
			class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink disabled:opacity-[.45]"
		>
			{isCreatingLabel ? $t('recipe.labelPicker.adding') : $t('recipe.labelPicker.addLabel')}
		</button>

		<p class="text-xs font-semibold text-muted">{$t('recipe.labelPicker.newLabelHint')}</p>
	</div>
</div>
