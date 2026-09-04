<script lang="ts">
	import type { Label } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import { getAllLabels } from '$lib/services/labelService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let availableLabels = $state<Label[]>([]);
	let loading = $state<boolean>(true);

	onMount(async () => {
		try {
			const currentUser = $user;
			availableLabels = await getAllLabels(currentUser?.uid);
		} catch (error) {
			console.error('Error loading labels:', error);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{$t('recipe.title.createNew')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-dvh items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.labels')} />
	</div>
{:else}
	<div class="min-h-dvh bg-paper">
		<RecipeForm
			{availableLabels}
			storageKey="recipe-draft-v3"
			submitErrorMessage={$t('recipe.validation.saveFailed')}
		/>
	</div>
{/if}
