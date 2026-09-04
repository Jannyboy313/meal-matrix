<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		currentStep: number;
		totalSteps: number;
		stepTitles: string[];
	}

	let { currentStep, totalSteps, stepTitles }: Props = $props();
</script>

<div class="flex flex-col gap-[10px]">
	<div
		class="grid grid-cols-4 gap-[6px]"
		role="progressbar"
		aria-valuenow={currentStep}
		aria-valuemin={1}
		aria-valuemax={totalSteps}
		aria-labelledby="wizard-progress-label"
	>
		{#each Array(totalSteps) as _, i}
			<span class="h-2 border-2 border-ink {i < currentStep ? 'bg-accent' : 'bg-transparent'}"></span>
		{/each}
	</div>
	<p id="wizard-progress-label" class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-strong">
		{$t('recipe.wizard.stepOf', {
			step: currentStep,
			total: totalSteps,
			name: stepTitles[currentStep - 1]
		} as Record<string, unknown>)}
	</p>
</div>
