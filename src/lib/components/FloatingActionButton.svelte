<script lang="ts">
	import { Plus } from 'lucide-svelte';

	interface Props {
		href: string;
		ariaLabel?: string;
		iconSize?: number;
	}

	let { href, ariaLabel = 'Add new item', iconSize = 28 }: Props = $props();
</script>

<a
	{href}
	class="btn variant-filled-primary fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 flex items-center justify-center bg-primary-500 p-3!"
	aria-label={ariaLabel}
>
	<Plus size={iconSize} />
</a>
