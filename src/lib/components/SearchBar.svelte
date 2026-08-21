<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	interface Props {
		value?: string;
		placeholder?: string;
	}

	let { value = $bindable(''), placeholder = $t('common.actions.search') }: Props = $props();
</script>

<div class="relative">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
		<Search size={18} class="text-muted" strokeWidth={2} />
	</div>
	<input
		type="search"
		bind:value
		{placeholder}
		class="focus-ring w-full border-2 border-ink offset-accent bg-white py-[15px] pl-11 pr-4 text-base font-bold text-ink"
	/>
</div>
