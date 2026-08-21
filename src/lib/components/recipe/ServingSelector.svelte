<script lang="ts">
	import { Plus, X, Trash2 } from 'lucide-svelte';
	import { t } from '$lib/i18n';

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

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between">
		<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">{$t('recipe.servings.label')}</span>
		<button
			type="button"
			onclick={toggleEditMode}
			class="focus-ring border-2 border-ink offset-yellow bg-white px-3 py-1 text-[11px] font-black uppercase text-ink"
		>
			{editMode ? $t('recipe.servings.done') : $t('recipe.servings.edit')}
		</button>
	</div>

	<div class="flex flex-wrap items-stretch gap-2">
		{#each servings as serving (serving)}
			{@const active = editMode ? editingServing === serving : currentServing === serving}
			<button
				type="button"
				onclick={() => handleServingClick(serving)}
				aria-pressed={active}
				class="focus-ring min-w-[44px] flex-none border-2 border-ink px-2 py-[9px] text-sm font-black {active
					? 'bg-accent text-white'
					: 'bg-white text-ink'}"
			>
				{serving}
			</button>
		{/each}

		<button
			type="button"
			onclick={handleAddClick}
			aria-label={$t('recipe.servings.addServing')}
			aria-expanded={editingServing !== null || isAddingNew}
			aria-controls="serving-editor"
			class="focus-ring flex h-[44px] w-[44px] flex-none items-center justify-center border-2 border-dashed border-ink text-ink {isAddingNew
				? 'border-solid bg-accent text-white'
				: 'bg-white'}"
		>
			<Plus size={20} />
		</button>
	</div>

	{#if editingServing !== null || isAddingNew}
		<div id="serving-editor" class="flex items-center gap-2">
			<input
				type="number"
				bind:value={editValue}
				placeholder={$t('recipe.servings.placeholder')}
				min="1"
				aria-label={$t('recipe.servings.placeholder')}
				class="focus-ring h-9 w-16 border-2 border-ink bg-white text-center text-sm font-bold text-ink"
				onkeydown={handleKeydown}
			/>
			<button
				type="button"
				onclick={confirmAction}
				aria-label={$t('recipe.servings.confirm')}
				class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-teal bg-white text-ink"
			>
				<X size={14} class="rotate-45" />
			</button>
			<button
				type="button"
				onclick={cancelAction}
				aria-label={$t('common.actions.cancel')}
				class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink bg-white text-ink"
			>
				<X size={14} />
			</button>
			{#if editMode && !isAddingNew && servings.length > 1}
				<button
					type="button"
					onclick={deleteServing}
					aria-label={$t('recipe.servings.deleteServing')}
					class="focus-ring flex h-9 w-9 items-center justify-center border-2 border-ink offset-accent bg-white text-ink"
				>
					<Trash2 size={14} />
				</button>
			{/if}
		</div>
	{/if}
</div>
