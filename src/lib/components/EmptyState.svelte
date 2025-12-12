<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="card preset-filled-primary-500 rounded-xl p-8 text-center">
	<p class="text-base sm:text-lg opacity-75">{message}</p>
</div>
