<script lang="ts">
	import type { Tag } from '$lib';
	import RecipeForm from '$lib/components/recipe/RecipeForm.svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import { getAllTags } from '$lib/services/tagService';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';

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
	<title>Create New Recipe - Recipe Collection</title>
</svelte:head>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<ChefHatLoader size="lg" label="Loading..." />
	</div>
{:else}
	<div class="container mx-auto p-4 pb-32 sm:p-6 md:p-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="h1">Create New Recipe</h1>
		</div>

		<RecipeForm
			{availableTags}
			storageKey="recipe-draft"
			submitErrorMessage="Failed to create recipe. Please try again."
		/>
	</div>
{/if}
