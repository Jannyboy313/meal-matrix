<script lang="ts">
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

	let newLabelName = $state<string>('');
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
				const newLabel = await createLabel({ name: newLabelName.trim() }, $user.uid);
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

		<button
			type="button"
			onclick={addCustomLabel}
			disabled={isCreatingLabel || !newLabelName.trim()}
			class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink disabled:opacity-[.45]"
		>
			{isCreatingLabel ? $t('recipe.labelPicker.adding') : $t('recipe.labelPicker.addLabel')}
		</button>

		<p class="text-xs font-semibold text-muted-strong">{$t('recipe.labelPicker.newLabelHint')}</p>
	</div>
</div>
