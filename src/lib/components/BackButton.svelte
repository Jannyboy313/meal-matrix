<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';

	interface Props {
		href?: string;
		text?: string;
	}

	let { href = '/', text = '← Back to Recipes' }: Props = $props();
</script>

<div class="text-center pt-6 sm:pt-8">
	<a
		{href}
		class="btn variant-filled-primary rounded-lg"
	>
		{text}
	</a>
</div>
