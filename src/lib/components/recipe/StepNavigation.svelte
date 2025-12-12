<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		isSubmitting: boolean;
		isEditing?: boolean;
		onprevious: () => void;
		onnext: () => void;
	}

	let { currentStep, totalSteps, isSubmitting, isEditing = false, onprevious, onnext }: Props = $props();
</script>

<div class="flex gap-3 mt-6 p-4 rounded-lg">
	{#if currentStep > 1}
		<button
			type="button"
			onclick={onprevious}
			class="btn preset-tonal-secondary flex items-center justify-center gap-2 flex-1"
		>
			<ChevronLeft size={20} />
			Previous
		</button>
	{:else}
		<a href="/" class="btn preset-outlined-secondary-500 flex items-center justify-center flex-1">
			Cancel
		</a>
	{/if}

	{#if currentStep < totalSteps}
		<button
			type="button"
			onclick={onnext}
			class="btn preset-filled-primary-500 flex items-center justify-center gap-2 flex-1"
		>
			Next
			<ChevronRight size={20} />
		</button>
	{:else}
		<button
			type="submit"
			class="btn preset-filled-tertiary-500 flex items-center justify-center flex-1"
			disabled={isSubmitting}
		>
			{#if isEditing}
				{isSubmitting ? 'Updating...' : 'Update Recipe'}
			{:else}
				{isSubmitting ? 'Creating...' : 'Create Recipe'}
			{/if}
		</button>
	{/if}
</div>
