<script lang="ts">
	import { ArrowLeft, Pencil } from 'lucide-svelte';

	interface Props {
		recipeId: string;
		title: string;
		image: string;
	}

	let { recipeId, title, image }: Props = $props();
</script>

<header class="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 overflow-hidden">
	<img
		src={image}
		alt={title}
		class="w-full h-full object-cover"
	/>
	<div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>

	<!-- Back Button -->
	<a
		href="/"
		class="btn btn-icon absolute top-4 left-4 z-10 shadow-lg bg-white/90 hover:bg-white text-black rounded-full"
		aria-label="Back to recipes"
	>
		<ArrowLeft size={20} />
	</a>

	<!-- Edit Button -->
	<a
		href="/recipes/{recipeId}/edit"
		class="btn btn-icon absolute top-4 right-4 z-10 shadow-lg bg-white/90 hover:bg-white text-black rounded-full"
		aria-label="Edit recipe"
	>
		<Pencil size={20} />
	</a>
</header>
