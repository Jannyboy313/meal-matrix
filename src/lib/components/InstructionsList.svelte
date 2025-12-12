<script lang="ts">
	interface Props {
		steps: string[];
	}

	let { steps }: Props = $props();
</script>

<ol class="space-y-5 sm:space-y-6">
	{#each steps as step, index}
		<li class="flex gap-3 sm:gap-4">
			<span
				class="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm"
			>
				{index + 1}
			</span>
			<p class="pt-0.5 sm:pt-1 leading-relaxed text-sm sm:text-base">{step}</p>
		</li>
	{/each}
</ol>
