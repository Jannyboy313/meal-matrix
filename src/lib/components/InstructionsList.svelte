<script lang="ts">
	interface Props {
		steps: string[];
		completedSteps: Set<number>;
		ontoggle: (index: number) => void;
	}

	let { steps, completedSteps, ontoggle }: Props = $props();
</script>

<ol>
	{#each steps as step, index}
		{@const done = completedSteps.has(index)}
		<li class="border-t border-ink">
			<button
				type="button"
				onclick={() => ontoggle(index)}
				class="focus-ring flex w-full items-start gap-[13px] py-[14px] text-left {done ? 'opacity-50' : ''}"
			>
				<span
					class="flex h-[30px] w-[30px] flex-none items-center justify-center border-2 border-ink text-[13px] font-black text-ink {done
						? 'bg-teal'
						: 'bg-white'}"
				>
					{done ? '✓' : index + 1}
				</span>
				<span class="text-base font-semibold leading-[1.4] text-ink {done ? 'line-through' : ''}">
					{step}
				</span>
			</button>
		</li>
	{/each}
</ol>
