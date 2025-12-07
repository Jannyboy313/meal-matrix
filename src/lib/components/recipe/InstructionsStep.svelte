<script lang="ts">
	import { Plus, X } from 'lucide-svelte';

	interface Props {
		steps: string[];
		stepErrors: { [key: number]: string };
		onaddstep: () => void;
		onremovestep: (index: number) => void;
	}

	let { steps = $bindable(), stepErrors, onaddstep, onremovestep }: Props = $props();
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">Instructions <span class="text-error-500">*</span></h2>
	<p class="text-sm opacity-75">Describe each step clearly (minimum 10 characters per step)</p>

	<div class="space-y-3">
		{#each steps as step, i}
			<div class="space-y-1">
				<div class="flex gap-2">
					<span class="text-lg font-bold pt-3 w-8">{i + 1}.</span>
					<textarea
						bind:value={steps[i]}
						placeholder="Describe this step..."
						rows="2"
						class="textarea rounded-lg flex-1"
						class:!border-error-500={stepErrors[i]}
						class:!border-2={stepErrors[i]}
						required
					></textarea>
					<button
						type="button"
						onclick={() => onremovestep(i)}
						class="btn btn-icon preset-filled-error-500 self-start"
						disabled={steps.length === 1}
						aria-label="Remove step"
					>
						<X size={20} />
					</button>
				</div>
				{#if stepErrors[i]}
					<p class="text-error-500 text-sm ml-10">{stepErrors[i]}</p>
				{/if}
			</div>
		{/each}
	</div>

	<button type="button" onclick={onaddstep} class="btn preset-filled-primary-500 w-full">
		<Plus size={20} class="mr-2" />
		Add Step
	</button>
</div>
