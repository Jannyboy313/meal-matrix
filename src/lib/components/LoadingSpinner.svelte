<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center space-y-4">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
		<p class="text-lg opacity-75">{message}</p>
	</div>
</div>
