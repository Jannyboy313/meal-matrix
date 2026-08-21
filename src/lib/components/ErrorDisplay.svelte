<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-paper p-6">
	<div class="w-full max-w-md space-y-4 border-2 border-ink offset-accent bg-white p-8 text-center">
		<p class="text-base font-semibold text-ink">{message}</p>
		<a
			href="/"
			class="focus-ring inline-block border-2 border-ink offset-ink bg-accent px-5 py-3 text-sm font-black uppercase tracking-wide text-white"
		>
			{$t('common.actions.backToRecipes')}
		</a>
	</div>
</div>
