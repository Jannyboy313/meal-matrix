<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		isSubmitting: boolean;
		onprevious: () => void;
		onnext: () => void;
	}

	let { currentStep, totalSteps, isSubmitting, onprevious, onnext }: Props = $props();
</script>

<div class="flex gap-3 mt-6 p-4 variant-soft-surface rounded-lg">
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
			class="btn preset-filled-primary-500 flex items-center justify-center flex-1"
			disabled={isSubmitting}
		>
			{isSubmitting ? 'Creating...' : 'Create Recipe'}
		</button>
	{/if}
</div>
