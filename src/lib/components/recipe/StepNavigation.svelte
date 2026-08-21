<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		currentStep: number;
		totalSteps: number;
		isSubmitting: boolean;
		isEditing?: boolean;
		onprevious: () => void;
		onnext: () => void;
		oncancel: () => void;
	}

	let { currentStep, totalSteps, isSubmitting, isEditing = false, onprevious, onnext, oncancel }: Props = $props();
</script>

<div class="fixed inset-x-0 bottom-0 z-40 flex gap-[10px] border-t-2 border-ink bg-white px-[22px] py-[14px] pb-[26px]">
	{#if currentStep > 1}
		<button
			type="button"
			onclick={onprevious}
			class="focus-ring flex-none border-2 border-ink bg-white px-[18px] py-[15px] text-[15px] font-black uppercase text-ink"
		>
			{$t('recipe.steps.previous')}
		</button>
	{:else}
		<button
			type="button"
			onclick={oncancel}
			class="focus-ring flex-none border-2 border-ink bg-white px-[18px] py-[15px] text-[15px] font-black uppercase text-ink"
		>
			{$t('common.actions.cancel')}
		</button>
	{/if}

	{#if currentStep < totalSteps}
		<button
			type="button"
			onclick={onnext}
			class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[15px] text-[15px] font-black uppercase text-white"
		>
			{$t('recipe.steps.next')}
		</button>
	{:else}
		<button
			type="submit"
			disabled={isSubmitting}
			class="focus-ring flex-1 border-2 border-ink offset-ink bg-accent py-[15px] text-[15px] font-black uppercase text-white disabled:opacity-[.45]"
		>
			{#if isEditing}
				{isSubmitting ? $t('recipe.actions.updating') : $t('recipe.actions.updateRecipe')}
			{:else}
				{isSubmitting ? $t('recipe.actions.creating') : $t('recipe.actions.createRecipe')}
			{/if}
		</button>
	{/if}
</div>
