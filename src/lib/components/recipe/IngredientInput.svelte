<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Ingredient } from '$lib';
	import { t } from '$lib/i18n';

	interface Props {
		ingredient: Ingredient;
		index: number;
		placeholder: string;
		errors?: { name?: string; amount?: string };
		canDelete: boolean;
		onremove: () => void;
	}

	let { ingredient = $bindable(), index, placeholder, errors, canDelete, onremove }: Props = $props();
</script>

<div class="flex flex-col gap-1">
	<div class="flex gap-[9px]">
		<input
			type="text"
			bind:value={ingredient.amount}
			{placeholder}
			aria-label={$t('recipe.ingredients.quantity')}
			class="focus-ring w-[92px] flex-none border-2 bg-white px-2 py-[11px] text-sm font-black text-ink {errors?.amount
				? 'border-accent'
				: 'border-ink'}"
		/>
		<input
			type="text"
			bind:value={ingredient.name}
			placeholder={$t('recipe.ingredients.name')}
			aria-label={$t('recipe.ingredients.name')}
			class="focus-ring flex-1 truncate border-2 bg-white px-3 py-[11px] text-sm font-semibold text-ink {errors?.name
				? 'border-accent'
				: 'border-ink'}"
			required
		/>
		{#if canDelete}
			<button
				type="button"
				onclick={onremove}
				aria-label={$t('recipe.ingredients.remove')}
				class="focus-ring flex h-[26px] w-[26px] flex-none items-center justify-center border-2 border-ink bg-white text-accent"
			>
				<Trash2 size={14} />
			</button>
		{/if}
	</div>
	{#if errors?.amount || errors?.name}
		<div class="ml-1 text-xs font-semibold text-accent">
			{#if errors?.amount}<span>{errors?.amount}</span>{/if}
			{#if errors?.name}<span>{errors?.name}</span>{/if}
		</div>
	{/if}
</div>
