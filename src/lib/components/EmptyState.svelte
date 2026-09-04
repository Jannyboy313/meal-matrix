<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<div class="border-2 border-dashed border-ink bg-white p-8 text-center">
	<p class="text-base font-semibold text-muted-strong">{message}</p>
</div>
