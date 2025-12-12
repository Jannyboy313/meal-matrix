<script lang="ts">
	interface Props {
		prepTime?: string;
		cookTime?: string;
	}

	let { prepTime, cookTime }: Props = $props();
</script>

{#if prepTime || cookTime}
	<div class="flex flex-wrap gap-6 pt-4 border-t border-surface-300-600-token">
		{#if prepTime}
			<div class="flex flex-col">
				<span class="text-xs uppercase opacity-75">Prep Time</span>
				<span class="font-semibold">{prepTime}</span>
			</div>
		{/if}
		{#if cookTime}
			<div class="flex flex-col">
				<span class="text-xs uppercase opacity-75">Cook Time</span>
				<span class="font-semibold">{cookTime}</span>
			</div>
		{/if}
	</div>
{/if}
