<script lang="ts">
	import { Plus } from 'lucide-svelte';

	interface Props {
		href: string;
		ariaLabel?: string;
	}

	let { href, ariaLabel = 'Add new item' }: Props = $props();
</script>

<a
	{href}
	aria-label={ariaLabel}
	class="focus-ring fixed bottom-[26px] right-[22px] z-50 flex h-[60px] w-[60px] items-center justify-center border-2 border-ink offset-ink bg-accent"
>
	<Plus size={28} class="text-white" strokeWidth={2.5} />
</a>
