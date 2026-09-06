<script lang="ts">
	import { tick } from 'svelte';
	import { ChevronDown, ChevronUp, X } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		steps: string[];
		stepErrors: { [key: number]: string };
		onaddstep: () => void;
		onremovestep: (index: number) => void;
		onmovestep: (fromIndex: number, toIndex: number) => void;
	}

	let {
		steps = $bindable(),
		stepErrors,
		onaddstep,
		onremovestep,
		onmovestep
	}: Props = $props();

	let moveUpButtons = $state<HTMLButtonElement[]>([]);
	let moveDownButtons = $state<HTMLButtonElement[]>([]);
	let moveAnnouncement = $state<string>('');

	const canReorder = $derived(steps.length > 1);

	// The each block is keyed by index, so the DOM nodes stay put while the values move past them.
	// Focus therefore has to be sent to the step's new position, otherwise a second click would
	// move whichever step just took the old spot.
	async function moveStep(fromIndex: number, toIndex: number) {
		if (toIndex < 0 || toIndex >= steps.length) {
			return;
		}

		const movingUp = toIndex < fromIndex;
		onmovestep(fromIndex, toIndex);

		moveAnnouncement = $t('recipe.instructions.stepMoved', {
			position: toIndex + 1,
			total: steps.length
		} as Record<string, unknown>);

		await tick();

		// At the first or last position the matching button is disabled, so fall back to its sibling
		// to keep focus inside the step that just moved.
		const preferred = movingUp ? moveUpButtons[toIndex] : moveDownButtons[toIndex];
		const fallback = movingUp ? moveDownButtons[toIndex] : moveUpButtons[toIndex];
		(preferred?.disabled ? fallback : preferred)?.focus();
	}
</script>

<div class="flex flex-col gap-[14px]">
	{#each steps as step, i (i)}
		<div class="flex flex-col gap-1">
			<div class="flex gap-3">
				<div class="flex flex-none flex-col items-center gap-1">
					<span
						class="flex h-[38px] w-[38px] items-center justify-center border-2 border-ink text-sm font-black text-ink {step.trim()
							? 'bg-yellow'
							: 'bg-white'}"
					>
						{i + 1}
					</span>
					{#if canReorder}
						<button
							type="button"
							bind:this={moveUpButtons[i]}
							onclick={() => moveStep(i, i - 1)}
							disabled={i === 0}
							aria-label={$t('recipe.instructions.moveStepUp', { step: i + 1 } as Record<
								string,
								unknown
							>)}
							class="focus-ring flex h-[26px] w-[38px] items-center justify-center border-2 border-ink bg-white text-ink disabled:opacity-[.45]"
						>
							<ChevronUp size={16} />
						</button>
						<button
							type="button"
							bind:this={moveDownButtons[i]}
							onclick={() => moveStep(i, i + 1)}
							disabled={i === steps.length - 1}
							aria-label={$t('recipe.instructions.moveStepDown', { step: i + 1 } as Record<
								string,
								unknown
							>)}
							class="focus-ring flex h-[26px] w-[38px] items-center justify-center border-2 border-ink bg-white text-ink disabled:opacity-[.45]"
						>
							<ChevronDown size={16} />
						</button>
					{/if}
				</div>
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

	<p aria-live="polite" class="sr-only">{moveAnnouncement}</p>
</div>
