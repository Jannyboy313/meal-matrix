<script lang="ts">
	import { Plus, X, Trash2, Pencil } from 'lucide-svelte';

	interface Ingredient {
		amount: string;
		name: string;
	}

	interface Props {
		servings: number[];
		ingredients: { [serving: number]: Ingredient[] };
		currentServing: number;
		ingredientErrors: { [key: number]: { name?: string; amount?: string } };
		onaddserving: () => void;
		onremoveserving: (serving: number) => void;
		onchangeserving: (serving: number) => void;
		onaddingredient: () => void;
		onremoveingredient: (index: number) => void;
	}

	let {
		servings = $bindable(),
		ingredients = $bindable(),
		currentServing = $bindable(),
		ingredientErrors,
		onaddserving,
		onremoveserving,
		onchangeserving,
		onaddingredient,
		onremoveingredient
	}: Props = $props();

	let editMode = $state<boolean>(false);
	let editingServing = $state<number | null>(null);
	let editValue = $state<number | ''>('');
	let isAddingNew = $state<boolean>(false);

	function addServing() {
		if (editValue && !servings.includes(Number(editValue))) {
			onaddserving();
			const servingNum = Number(editValue);
			servings = [...servings, servingNum].sort((a, b) => a - b);

			// Copy ingredient names from current serving
			if (ingredients[currentServing]) {
				ingredients[servingNum] = ingredients[currentServing].map((ing) => ({
					name: ing.name,
					amount: ''
				}));
			} else {
				ingredients[servingNum] = [];
			}

			// Switch to the newly added serving
			onchangeserving(servingNum);
			editValue = '';
			editingServing = null;
			isAddingNew = false;
		}
	}

	// Sync ingredient names across all servings when changed
	$effect(() => {
		const currentIngredients = ingredients[currentServing] || [];

		currentIngredients.forEach((ing, index) => {
			servings.forEach((serving) => {
				if (serving !== currentServing && ingredients[serving] && ingredients[serving][index]) {
					// Sync name but preserve amount
					ingredients[serving][index].name = ing.name;
				}
			});
		});
	});

	function getAmountPlaceholder(ingredientIndex: number): string {
		const currentIngredients = ingredients[currentServing] || [];
		const sortedServings = [...servings].sort((a, b) => a - b);
		const currentIndex = sortedServings.indexOf(currentServing);

		// Try to find amount from serving above
		for (let i = currentIndex + 1; i < sortedServings.length; i++) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		// Try to find amount from serving below
		for (let i = currentIndex - 1; i >= 0; i--) {
			const serving = sortedServings[i];
			const amount = ingredients[serving]?.[ingredientIndex]?.amount;
			if (amount) return amount;
		}

		return 'Amount (e.g., 200g)';
	}
</script>

<div class="space-y-6">
	<h2 class="h2 text-primary-500">Ingredients <span class="text-error-500">*</span></h2>

	<!-- Servings Management -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<p class="text-sm font-semibold opacity-75">Serving sizes:</p>
			<button
				type="button"
				onclick={() => {
					editMode = !editMode;
					if (!editMode) {
						// Hide input when done is clicked
						editingServing = null;
						editValue = '';
						isAddingNew = false;
					} else {
						// Show input for current serving when edit is clicked
						editingServing = currentServing;
						editValue = currentServing;
					}
				}}
				class="btn btn-sm preset-tonal-primary rounded-full"
			>
				{editMode ? 'Done' : 'Edit'}
			</button>
		</div>
		<div class="flex flex-wrap gap-2 items-start">
			{#each servings as serving, index}
				<button
					type="button"
					onclick={() => {
						if (editMode) {
							editingServing = serving;
							editValue = serving;
							isAddingNew = false;
						} else {
							onchangeserving(serving);
						}
					}}
					class="rounded-full w-12 h-12 font-semibold text-sm transition-all"
					class:bg-primary-500={editMode ? editingServing === serving : currentServing === serving}
					class:text-white={editMode ? editingServing === serving : currentServing === serving}
					class:variant-soft-surface={editMode ? editingServing !== serving : currentServing !== serving}
					class:hover:variant-filled-surface={!editMode && currentServing !== serving}
				>
					{serving}
				</button>
			{/each}

			<!-- Add New Serving Button -->
			<button
				type="button"
				onclick={() => {
					isAddingNew = true;
					editingServing = null;
					editValue = '';
				}}
				class="rounded-full w-12 h-12 transition-all flex items-center justify-center"
				class:bg-primary-500={isAddingNew}
				class:text-white={isAddingNew}
				class:preset-tonal-surface={!isAddingNew}
				class:hover:preset-filled-surface={!isAddingNew}
				aria-label="Add serving size"
			>
				<Plus size={24} />
			</button>
		</div>

		<!-- Fixed position input field -->
		{#if editingServing !== null || isAddingNew}
			<div class="flex gap-1 items-center justify-center pt-2">
				<input
					type="number"
					bind:value={editValue}
					placeholder="6"
					min="1"
					class="input rounded-lg w-16 h-8 text-center text-sm"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							if (editValue && Number(editValue) > 0) {
								if (isAddingNew) {
									addServing();
								} else if (editingServing !== null) {
									const idx = servings.indexOf(editingServing);
									if (idx !== -1) {
										servings[idx] = Number(editValue);
										servings = [...servings].sort((a, b) => a - b);
										editingServing = null;
										editValue = '';
									}
								}
							}
						} else if (e.key === 'Escape') {
							editValue = '';
							editingServing = null;
							isAddingNew = false;
						}
					}}
				/>
				<button
					type="button"
					onclick={() => {
						if (editValue && Number(editValue) > 0) {
							if (isAddingNew) {
								addServing();
							} else if (editingServing !== null) {
								const idx = servings.indexOf(editingServing);
								if (idx !== -1) {
									servings[idx] = Number(editValue);
									servings = [...servings].sort((a, b) => a - b);
									editingServing = null;
									editValue = '';
								}
							}
						}
					}}
					class="btn btn-icon btn-sm preset-filled-primary-500 rounded-full w-8! h-8!"
					aria-label="Confirm"
				>
					<X size={14} class="rotate-45" />
				</button>
				<button
					type="button"
					onclick={() => {
						editValue = '';
						editingServing = null;
						isAddingNew = false;
					}}
					class="btn btn-icon btn-sm preset-outlined-primary-500 rounded-full w-8! h-8!"
					aria-label="Cancel"
				>
					<X size={14} />
				</button>
				{#if editMode && !isAddingNew && servings.length > 1}
					<button
						type="button"
						onclick={() => {
							// If deleting the current serving, switch to another serving first
							if (editingServing === currentServing) {
								const remainingServings = servings.filter(s => s !== editingServing);
								if (remainingServings.length > 0) {
									onchangeserving(remainingServings[0]);
								}
							}
							if (editingServing !== null) {
								onremoveserving(editingServing);
								editingServing = null;
								editValue = '';
							}
						}}
						class="btn btn-icon btn-sm preset-filled-error-500 rounded-full w-8! h-8!"
						aria-label="Delete serving"
					>
						<Trash2 size={14} />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Ingredients for Current Serving -->
	<div class="space-y-3">
		<p class="text-sm opacity-75">
			Ingredients for <span class="font-semibold text-primary-500">{currentServing} serving{currentServing !== 1 ? 's' : ''}</span>
		</p>

		{#each (ingredients[currentServing] || []) as ingredient, i}
			<div class="space-y-1">
				<div class="flex gap-2">
					<div class="flex-none w-32 sm:w-40">
						<input
							type="text"
							bind:value={ingredient.amount}
							placeholder={getAmountPlaceholder(i)}
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
						class="btn btn-icon preset-tonal-error aspect-square p-2"
						disabled={(ingredients[currentServing] || []).length === 1}
						aria-label="Remove ingredient"
					>
						<Trash2 class="text-error-500" size={16} />
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

	<button type="button" onclick={onaddingredient} class="btn preset-tonal-primary w-full">
		<Plus size={20} class="mr-2" />
		Add Ingredient
	</button>
</div>
