<script lang="ts">
	interface Props {
		currentStep: number;
		totalSteps: number;
		stepTitles: string[];
	}

	let { currentStep, totalSteps, stepTitles }: Props = $props();
</script>

<div class="space-y-2">
	<p class="text-sm">
		<span class="text-primary-500 font-semibold">Step {currentStep} of {totalSteps}:</span>
		<span class="opacity-75">{stepTitles[currentStep - 1]}</span>
	</p>
	<div class="flex gap-2">
		{#each Array(totalSteps) as _, i}
			<div
				class="flex-1 h-2 rounded-full transition-all duration-300"
				class:bg-primary-500={i < currentStep}
				class:bg-surface-700={i >= currentStep}
			></div>
		{/each}
	</div>
</div>
