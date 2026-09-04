<script lang="ts">
	import { X } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		steps: string[];
		stepErrors: { [key: number]: string };
		onaddstep: () => void;
		onremovestep: (index: number) => void;
	}

	let { steps = $bindable(), stepErrors, onaddstep, onremovestep }: Props = $props();
</script>

<div class="flex flex-col gap-[14px]">
	{#each steps as step, i (i)}
		<div class="flex flex-col gap-1">
			<div class="flex gap-3">
				<span
					class="flex h-[38px] w-[38px] flex-none items-center justify-center border-2 border-ink text-sm font-black text-ink {step.trim()
						? 'bg-yellow'
						: 'bg-white'}"
				>
					{i + 1}
				</span>
				<textarea
					bind:value={steps[i]}
					placeholder={$t('recipe.instructions.description')}
					rows="2"
					class="focus-ring min-h-[74px] flex-1 border-2 bg-white px-[13px] py-[11px] text-[15px] font-semibold leading-[1.4] text-ink {stepErrors[
						i
					]
						? 'border-accent'
						: 'border-ink'}"
					required
				></textarea>
				<button
					type="button"
					onclick={() => onremovestep(i)}
					disabled={steps.length === 1}
					aria-hidden={steps.length === 1}
					tabindex={steps.length === 1 ? -1 : 0}
					aria-label={$t('recipe.instructions.removeStep')}
					class="focus-ring flex h-9 w-9 flex-none items-center justify-center self-start border-2 border-ink bg-white text-accent disabled:opacity-[.45]"
				>
					<X size={18} />
				</button>
			</div>
			{#if stepErrors[i]}
				<p class="ml-[50px] text-xs font-semibold text-accent">{stepErrors[i]}</p>
			{/if}
		</div>
	{/each}

	<button
		type="button"
		onclick={onaddstep}
		class="focus-ring self-start border-2 border-ink offset-teal bg-white px-[15px] py-[11px] text-[13px] font-black uppercase text-ink"
	>
		+ {$t('recipe.instructions.add')}
	</button>

	<p class="text-xs font-semibold text-muted-strong">{$t('recipe.instructions.oneActionHint')}</p>
</div>
