<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		prepTime?: string;
		cookTime?: string;
	}

	let { prepTime, cookTime }: Props = $props();
</script>

{#if prepTime || cookTime}
	<div class="flex flex-wrap gap-6 pt-4 rounded-lg">
		{#if prepTime}
			<div class="flex flex-col">
				<span class="text-xs uppercase opacity-75">{$t('recipe.labels.prepTime')}</span>
				<span class="font-semibold">{prepTime}</span>
			</div>
		{/if}
		{#if cookTime}
			<div class="flex flex-col">
				<span class="text-xs uppercase opacity-75">{$t('recipe.labels.cookTime')}</span>
				<span class="font-semibold">{cookTime}</span>
			</div>
		{/if}
	</div>
{/if}
