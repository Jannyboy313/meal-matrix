<script lang="ts">
	import type { ImportedRecipe } from '$lib/types';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	interface Props {
		isDirty: () => boolean;
		onimport: (recipe: ImportedRecipe) => void;
	}

	let { isDirty, onimport }: Props = $props();

	const ERROR_CODES = ['invalid_url', 'unauthorized', 'no_recipe', 'unreachable'] as const;

	let url = $state('');
	let busy = $state(false);
	let confirmingOverwrite = $state(false);
	let errorCode = $state<(typeof ERROR_CODES)[number] | ''>('');
	let importedHost = $state('');

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !url.trim()) return;
		if (isDirty()) {
			confirmingOverwrite = true;
			return;
		}
		runImport();
	}

	async function runImport() {
		confirmingOverwrite = false;
		busy = true;
		errorCode = '';
		importedHost = '';
		try {
			const token = await $user?.getIdToken();
			const response = await fetch('/api/recipes/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
				body: JSON.stringify({ url })
			});
			const body = await response.json();
			if (!response.ok) {
				errorCode = ERROR_CODES.includes(body?.code) ? body.code : 'unreachable';
				return;
			}
			onimport(body as ImportedRecipe);
			importedHost = new URL(url.trim()).hostname.replace(/^www\./, '');
		} catch {
			errorCode = 'unreachable';
		} finally {
			busy = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="mx-[22px] mt-[20px] flex flex-col gap-[7px] border-2 border-dashed border-ink p-[14px]">
	<label for="recipe-import-url" class="text-xs font-black uppercase tracking-[0.08em] text-ink">
		{$t('recipe.import.label')}
	</label>
	<div class="flex gap-[9px]">
		<input
			id="recipe-import-url"
			type="url"
			bind:value={url}
			oninput={() => {
				confirmingOverwrite = false;
				errorCode = '';
				importedHost = '';
			}}
			placeholder={$t('recipe.import.placeholder')}
			disabled={busy}
			class="focus-ring min-w-0 flex-1 border-2 bg-white px-[14px] py-[13px] text-[15px] font-semibold text-ink {errorCode
				? 'border-accent'
				: 'border-ink'}"
		/>
		<button
			type="submit"
			disabled={busy || !url.trim()}
			aria-busy={busy}
			class="focus-ring flex-none border-2 border-ink bg-ink px-4 text-sm font-black uppercase text-white disabled:opacity-50"
		>
			{busy ? $t('recipe.import.busy') : $t('recipe.import.submit')}
		</button>
	</div>

	<div aria-live="polite">
		{#if confirmingOverwrite}
			<div class="mt-1 flex flex-wrap items-center gap-[10px]">
				<p class="text-sm font-semibold text-ink">{$t('recipe.import.overwriteBody')}</p>
				<button
					type="button"
					onclick={() => (confirmingOverwrite = false)}
					class="focus-ring border-2 border-ink bg-white px-3 py-2 text-xs font-black uppercase text-ink"
				>
					{$t('recipe.import.overwriteCancel')}
				</button>
				<button
					type="button"
					onclick={runImport}
					class="focus-ring border-2 border-ink bg-accent px-3 py-2 text-xs font-black uppercase text-white"
				>
					{$t('recipe.import.overwriteConfirm')}
				</button>
			</div>
		{:else if errorCode}
			<p class="text-xs font-semibold text-accent">{$t(`recipe.import.errors.${errorCode}`)}</p>
		{:else if importedHost}
			<p class="text-xs font-semibold text-ink">{$t('recipe.import.success', { host: importedHost } as Record<string, unknown>)}</p>
		{:else}
			<p class="text-xs font-semibold text-muted-strong">{$t('recipe.import.hint')}</p>
		{/if}
	</div>
</form>
