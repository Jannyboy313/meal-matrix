<script lang="ts">
	import { Plus, X } from 'lucide-svelte';

	interface Ingredient {
		amount: string;
		name: string;
	}

	interface Props {
		ingredients: Ingredient[];
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let { ingredients = $bindable(), ingredientErrors, onaddingredient, onremoveingredient }: Props = $props();
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">Ingredients <span class="text-error-500">*</span></h2>
	<p class="text-sm opacity-75">Add all ingredients with their amounts</p>

	<div class="space-y-3">
		{#each ingredients as ingredient, i}
			<div class="space-y-1">
				<div class="flex gap-2">
					<div class="flex-none w-32 sm:w-40">
						<input
							type="text"
							bind:value={ingredient.amount}
							placeholder="Amount (e.g., 200g)"
							class="input rounded-lg w-full"
							class:!border-error-500={ingredientErrors[i]?.amount}
							class:!border-2={ingredientErrors[i]?.amount}
						/>
					</div>
					<div class="flex-1">
						<input
							type="text"
							bind:value={ingredient.name}
							placeholder="Ingredient name"
							class="input rounded-lg w-full"
							class:!border-error-500={ingredientErrors[i]?.name}
							class:!border-2={ingredientErrors[i]?.name}
							required
						/>
					</div>
					<button
						type="button"
						onclick={() => onremoveingredient(i)}
						class="btn btn-icon preset-filled-error-500"
						disabled={ingredients.length === 1}
						aria-label="Remove ingredient"
					>
						<X size={20} />
					</button>
				</div>
				{#if ingredientErrors[i]?.amount || ingredientErrors[i]?.name}
					<div class="text-error-500 text-sm ml-1">
						{#if ingredientErrors[i]?.amount}
							<span>{ingredientErrors[i]?.amount}</span>
						{/if}
						{#if ingredientErrors[i]?.name}
							<span>{ingredientErrors[i]?.name}</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<button type="button" onclick={onaddingredient} class="btn preset-filled-primary-500 w-full">
		<Plus size={20} class="mr-2" />
		Add Ingredient
	</button>
</div>
