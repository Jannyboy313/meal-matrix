<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="card variant-filled-surface rounded-xl p-8 text-center">
	<p class="text-base sm:text-lg opacity-75">{message}</p>
</div>
