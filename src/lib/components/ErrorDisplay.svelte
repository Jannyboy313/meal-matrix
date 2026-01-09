<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card preset-filled-primary-500 rounded-xl p-8 text-center space-y-4 max-w-md">
		<p class="text-lg text-error-500">{message}</p>
		<a href="/" class="btn preset-filled-primary-500 rounded-lg">
			{$t('common.actions.backToRecipes')}
		</a>
	</div>
</div>
