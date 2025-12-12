<script lang="ts">
	import { Search } from 'lucide-svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		onInput?: (value: string) => void;
	}

	let { value = $bindable(''), placeholder = 'Search...' }: Props = $props();
</script>

<div class="max-w-2xl mx-auto">
	<div class="relative">
		<div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
			<Search size={20} class="opacity-50" />
		</div>
		<input
			type="search"
			bind:value
			{placeholder}
			class="input rounded-lg pl-12 pr-4 py-3 shadow-md"
		/>
	</div>
</div>
