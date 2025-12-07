<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Ingredient } from '$lib';

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

<div class="space-y-1">
	<div class="flex gap-2">
		<div class="flex-none w-32 sm:w-40">
			<input
				type="text"
				bind:value={ingredient.amount}
				{placeholder}
				class="input rounded-lg w-full"
				class:!border-error-500={errors?.amount}
				class:!border-2={errors?.amount}
			/>
		</div>
		<div class="flex-1">
			<input
				type="text"
				bind:value={ingredient.name}
				placeholder="Ingredient name"
				class="input rounded-lg w-full"
				class:!border-error-500={errors?.name}
				class:!border-2={errors?.name}
				required
			/>
		</div>
		<button
			type="button"
			onclick={onremove}
			class="btn btn-icon preset-tonal-error aspect-square p-2"
			disabled={!canDelete}
			aria-label="Remove ingredient"
		>
			<Trash2 class="text-error-500" size={16} />
		</button>
	</div>
	{#if errors?.amount || errors?.name}
		<div class="text-error-500 text-sm ml-1">
			{#if errors?.amount}
				<span>{errors?.amount}</span>
			{/if}
			{#if errors?.name}
				<span>{errors?.name}</span>
			{/if}
		</div>
	{/if}
</div>
