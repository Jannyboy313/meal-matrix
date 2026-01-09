<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let label: string = 'Loading...';

	const sizeClasses = {
		sm: 'h-4 w-1',
		md: 'h-8 w-1.5',
		lg: 'h-12 w-2'
	};

	const barClass = sizeClasses[size];
</script>

<div class="flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
	<div class="flex items-end justify-center gap-1">
		<div class="{barClass} bg-blue-500 rounded animate-bar-1"></div>
		<div class="{barClass} bg-blue-500 rounded animate-bar-2"></div>
		<div class="{barClass} bg-blue-500 rounded animate-bar-3"></div>
		<div class="{barClass} bg-blue-500 rounded animate-bar-4"></div>
		<div class="{barClass} bg-blue-500 rounded animate-bar-5"></div>
	</div>
	<span class="sr-only">{label}</span>
</div>

<style>
	@keyframes bar-bounce {
		0%, 100% {
			transform: scaleY(0.5);
		}
		50% {
			transform: scaleY(1);
		}
	}

	:global(.animate-bar-1) {
		animation: bar-bounce 1s ease-in-out infinite;
		transform-origin: center;
	}

	:global(.animate-bar-2) {
		animation: bar-bounce 1s ease-in-out 0.1s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-3) {
		animation: bar-bounce 1s ease-in-out 0.2s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-4) {
		animation: bar-bounce 1s ease-in-out 0.3s infinite;
		transform-origin: center;
	}

	:global(.animate-bar-5) {
		animation: bar-bounce 1s ease-in-out 0.4s infinite;
		transform-origin: center;
	}
</style>
