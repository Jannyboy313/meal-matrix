<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { signOut } from '$lib/services/authService';
	import { goto } from '$app/navigation';
	import { ChefHat, LogOut, User } from 'lucide-svelte';

	let loading = $state(false);

	async function handleSignOut(): Promise<void> {
		loading = true;
		try {
			await signOut();
			goto('/login');
		} catch (err) {
			console.error('Error signing out:', err);
		} finally {
			loading = false;
		}
	}
</script>

<nav class="bg-surface-100-800-token border-b border-surface-300-600-token">
	<div class="container mx-auto px-4 sm:px-6">
		<div class="flex items-center justify-between h-16">
			<!-- Logo and Brand -->
			<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
				<ChefHat size={28} class="text-primary-500" />
				<span class="text-xl font-bold hidden sm:inline">Meal Matrix</span>
			</a>

			<!-- Navigation Links -->
			<div class="flex items-center gap-2 sm:gap-4">
				{#if $user}
					<!-- User Menu -->
					<div class="flex items-center gap-2 sm:gap-3">
						{#if $user.photoURL}
							<img
								src={$user.photoURL}
								alt={$user.displayName || 'User'}
								class="w-8 h-8 rounded-full border-2 border-primary-500"
							/>
						{:else}
							<div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
								<User size={18} class="text-white" />
							</div>
						{/if}
						<span class="text-sm font-medium hidden md:inline max-w-[150px] truncate">
							{$user.displayName || 'User'}
						</span>
						<button
							onclick={handleSignOut}
							disabled={loading}
							class="btn btn-sm variant-ghost-surface rounded-lg flex items-center gap-2"
							title="Sign Out"
						>
							<LogOut size={18} />
							<span class="hidden sm:inline">{loading ? 'Signing out...' : 'Sign Out'}</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
