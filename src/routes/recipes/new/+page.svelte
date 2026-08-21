<script lang="ts">
	import type { Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	let availableTags = $state<Tag[]>([]);
	let loading = $state<boolean>(true);

	onMount(async () => {
		try {
			const currentUser = $user;
			availableTags = await getAllTags(currentUser?.uid);
		} catch (error) {
			console.error('Error loading tags:', error);
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
		<ChefHatLoader size="lg" label={$t('common.loading.tags')} />
	</div>
{:else}
	<div class="min-h-dvh bg-paper">
		<RecipeForm {availableTags} storageKey="recipe-draft" submitErrorMessage={$t('recipe.validation.saveFailed')} />
	</div>
{/if}
