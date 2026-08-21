<script lang="ts">
	import { ChefHat } from 'lucide-svelte';

	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let label: string = 'Loading...';

	const sizeMap = {
		sm: 32,
		md: 48,
		lg: 64
	};

	const iconSize = sizeMap[size];
</script>

<div class="flex flex-col items-center justify-center gap-0" role="status" aria-live="polite">
	<div class="animate-hat-bounce">
		<ChefHat size={iconSize} class="text-accent" strokeWidth={1.5} />
	</div>

	<!-- Moving bars below the hat -->
	<div class="flex items-end justify-center gap-1">
		<div class="w-1 h-4 bg-accent rounded-full animate-bar-1"></div>
		<div class="w-1 h-4 bg-accent rounded-full animate-bar-2"></div>
		<div class="w-1 h-4 bg-accent rounded-full animate-bar-3"></div>
		<div class="w-1 h-4 bg-accent rounded-full animate-bar-4"></div>
		<div class="w-1 h-4 bg-accent rounded-full animate-bar-5"></div>
	</div>

	<span class="sr-only">{label}</span>
</div>

<style>
	@keyframes hat-bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}

	@keyframes bar-bounce {
		0%, 100% {
			transform: scaleY(0.5);
		}
		50% {
			transform: scaleY(1);
		}
	}

	:global(.animate-hat-bounce) {
		animation: hat-bounce 1.25s ease-in-out infinite;
	}

	:global(.animate-bar-1) {
		animation: bar-bounce 1.25s ease-in-out infinite;
		transform-origin: center;
	}

	:global(.animate-bar-2) {
		animation: bar-bounce 1.25s ease-in-out 0.125s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-3) {
		animation: bar-bounce 1.25s ease-in-out 0.25s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-4) {
		animation: bar-bounce 1.25s ease-in-out 0.375s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-5) {
		animation: bar-bounce 1.25s ease-in-out 0.5s infinite;
		transform-origin: center;
	}
</style>
