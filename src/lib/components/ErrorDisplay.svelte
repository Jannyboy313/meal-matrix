<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card preset-filled-primary-500 rounded-xl p-8 text-center space-y-4 max-w-md">
		<p class="text-lg text-error-500">{message}</p>
		<a href="/" class="btn preset-filled-primary-500 rounded-lg">
			Back to Recipes
		</a>
	</div>
</div>
