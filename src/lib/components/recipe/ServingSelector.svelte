<script lang="ts">
	import { Plus, X, Trash2 } from 'lucide-svelte';

	interface Props {
		servings: number[];
		currentServing: number;
		onchangeserving: (serving: number) => void;
		onaddserving: (newServing: number) => void;
		onremoveserving: (serving: number) => void;
	}

	let {
		servings = $bindable(),
		currentServing,
		onchangeserving,
		onaddserving,
		onremoveserving
	}: Props = $props();

	let editMode = $state<boolean>(false);
	let editingServing = $state<number | null>(null);
	let editValue = $state<number | ''>('');
	let isAddingNew = $state<boolean>(false);

	function toggleEditMode() {
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
	}

	function handleServingClick(serving: number) {
		if (editMode) {
			editingServing = serving;
			editValue = serving;
			isAddingNew = false;
		} else {
			onchangeserving(serving);
		}
	}

	function handleAddClick() {
		isAddingNew = true;
		editingServing = null;
		editValue = '';
	}

	function confirmAction() {
		if (editValue && Number(editValue) > 0) {
			if (isAddingNew) {
				addServing();
			} else if (editingServing !== null) {
				updateServing();
			}
		}
	}

	function addServing() {
		const servingNum = Number(editValue);
		if (!servings.includes(servingNum)) {
			onaddserving(servingNum);
			editValue = '';
			editingServing = null;
			isAddingNew = false;
		}
	}

	function updateServing() {
		if (editingServing !== null) {
			const idx = servings.indexOf(editingServing);
			if (idx !== -1) {
				servings[idx] = Number(editValue);
				servings = [...servings].sort((a, b) => a - b);
				editingServing = null;
				editValue = '';
			}
		}
	}

	function cancelAction() {
		editValue = '';
		editingServing = null;
		isAddingNew = false;
	}

	function deleteServing() {
		if (editingServing !== null) {
			// If deleting the current serving, switch to another serving first
			if (editingServing === currentServing) {
				const remainingServings = servings.filter((s) => s !== editingServing);
				if (remainingServings.length > 0) {
					onchangeserving(remainingServings[0]);
				}
			}
			onremoveserving(editingServing);
			editingServing = null;
			editValue = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			confirmAction();
		} else if (e.key === 'Escape') {
			cancelAction();
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold opacity-75">Serving sizes:</p>
		<button
			type="button"
			onclick={toggleEditMode}
			class="btn btn-sm preset-tonal-primary rounded-full"
		>
			{editMode ? 'Done' : 'Edit'}
		</button>
	</div>

	<div class="flex flex-wrap gap-2 items-start">
		{#each servings as serving}
			<button
				type="button"
				onclick={() => handleServingClick(serving)}
				class="badge rounded-full w-12 h-12 font-semibold text-sm transition-all"
				class:preset-filled-primary-500={editMode ? editingServing === serving : currentServing === serving}
				class:preset-tonal-primary={editMode
					? editingServing !== serving
					: currentServing !== serving}
				class:hover:preset-filled-primary-500={!editMode && currentServing !== serving}
			>
				{serving}
			</button>
		{/each}

		<!-- Add New Serving Button -->
		<button
			type="button"
			onclick={handleAddClick}
			class="rounded-full w-12 h-12 transition-all flex items-center justify-center"
			class:bg-primary-500={isAddingNew}
			class:text-white={isAddingNew}
			class:preset-tonal-primary={!isAddingNew}
			class:hover:preset-filled-primary-500={!isAddingNew}
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
				onkeydown={handleKeydown}
			/>
			<button
				type="button"
				onclick={confirmAction}
				class="btn btn-icon btn-sm preset-filled-primary-500 rounded-full w-8! h-8!"
				aria-label="Confirm"
			>
				<X size={14} class="rotate-45" />
			</button>
			<button
				type="button"
				onclick={cancelAction}
				class="btn btn-icon btn-sm preset-outlined-primary-500 rounded-full w-8! h-8!"
				aria-label="Cancel"
			>
				<X size={14} />
			</button>
			{#if editMode && !isAddingNew && servings.length > 1}
				<button
					type="button"
					onclick={deleteServing}
					class="btn btn-icon btn-sm preset-filled-error-500 rounded-full w-8! h-8!"
					aria-label="Delete serving"
				>
					<Trash2 size={14} />
				</button>
			{/if}
		</div>
	{/if}
</div>
