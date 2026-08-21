<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		prepTime?: string;
		cookTime?: string;
		servings: number;
	}

	let { prepTime, cookTime, servings }: Props = $props();
</script>

<div class="flex gap-[9px]">
	<div class="flex-1 border-2 border-ink offset-yellow bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.prepTimeShort')}</div>
		<div class="text-[15px] font-black text-ink">{prepTime || '–'}</div>
	</div>
	<div class="flex-1 border-2 border-ink offset-teal bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.cookTimeShort')}</div>
		<div class="text-[15px] font-black text-ink">{cookTime || '–'}</div>
	</div>
	<div class="flex-1 border-2 border-ink offset-violet bg-white px-[11px] py-[10px]">
		<div class="text-[9px] font-black uppercase tracking-[0.1em] text-muted">{$t('recipe.labels.servings')}</div>
		<div class="text-[15px] font-black text-ink">{servings}</div>
	</div>
</div>
