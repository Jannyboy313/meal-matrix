<script lang="ts">
	import type { PageData } from './$types';
	import type { RecipeWithTags } from '$lib';
	import { getRecipeById } from '$lib/services/recipeService';
	import { onMount } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import ChefHatLoader from '$lib/components/ChefHatLoader.svelte';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';
	import InstructionsList from '$lib/components/InstructionsList.svelte';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
	let recipe = $state<RecipeWithTags | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let completedSteps = $state<Set<number>>(new Set());

	onMount(async () => {
		try {
			const fetched = await getRecipeById(data.recipeId);
			if (fetched) {
				recipe = fetched;
			} else {
				error = $t('recipe.validation.recipeNotFound');
			}
		} catch (err) {
			console.error('Error loading recipe:', err);
			error = $t('recipe.validation.recipeLoadFailed');
		} finally {
			loading = false;
		}
	});

	function toggleStep(index: number) {
		const next = new Set(completedSteps);
		if (next.has(index)) {
			next.delete(index);
		} else {
			next.add(index);
		}
		completedSteps = next;
	}

	const percentage = $derived(
		recipe && recipe.steps.length > 0 ? Math.round((completedSteps.size / recipe.steps.length) * 100) : 0
	);
</script>

<svelte:head>
	<title>{recipe?.title || $t('common.app.name')}</title>
</svelte:head>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-paper">
		<ChefHatLoader size="lg" label={$t('common.loading.recipes')} />
	</div>
{:else if error}
	<ErrorDisplay message={error} />
{:else if recipe}
	<div class="flex min-h-screen flex-col bg-paper">
		<header class="flex flex-none items-center gap-3 border-b-2 border-ink px-[22px] pb-4 pt-12">
			<a
				href="/recipes/{recipe.id}"
				aria-label={$t('common.actions.back')}
				class="focus-ring flex h-9 w-9 flex-none items-center justify-center border-2 border-ink offset-yellow bg-white"
			>
				<ArrowLeft size={18} class="text-ink" strokeWidth={2.5} />
			</a>
			<span class="truncate text-lg font-black tracking-[-0.035em] text-ink">{recipe.title}</span>
		</header>

		<div class="flex-none px-[22px] pt-[14px]">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-black uppercase tracking-[0.08em] text-ink">
					{$t(
						'recipe.cook.progress',
						{ done: completedSteps.size, total: recipe.steps.length } as Record<string, unknown>
					)}
				</span>
				<span class="text-xs font-black text-muted">{percentage}%</span>
			</div>
			<div class="h-[10px] border-2 border-ink bg-white">
				<div class="h-[6px] bg-accent" style="width: {percentage}%"></div>
			</div>
		</div>

		<div class="flex-1 overflow-y-auto px-[22px] pb-8 pt-[14px]">
			<InstructionsList steps={recipe.steps} {completedSteps} ontoggle={toggleStep} />
		</div>
	</div>
{/if}
