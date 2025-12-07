import type { PageServerLoad } from './$types';
import type { RecipeSummary } from '$lib';

export const load: PageServerLoad = async () => {
	// Sample recipe data - in a real app, this would come from a database
	const recipes: RecipeSummary[] = [
		{
			id: 1,
			title: 'Spaghetti Carbonara',
			description: 'Classic Italian pasta with eggs, cheese, and pancetta',
			image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
			tags: [
				{ id: 'tag-italian', name: 'Italian', color: '#008C45' },
				{ id: 'tag-pasta', name: 'Pasta', color: '#F4A460' },
				{ id: 'tag-quick', name: 'Quick', color: '#FF6B6B' }
			]
		},
		{
			id: 2,
			title: 'Grilled Chicken Salad',
			description: 'Fresh greens with grilled chicken and balsamic vinaigrette',
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
			tags: [
				{ id: 'tag-healthy', name: 'Healthy', color: '#4CAF50' },
				{ id: 'tag-salad', name: 'Salad', color: '#8BC34A' },
				{ id: 'tag-protein', name: 'Protein', color: '#E91E63' }
			]
		},
		{
			id: 3,
			title: 'Chocolate Lava Cake',
			description: 'Rich chocolate cake with a molten center',
			image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
			tags: [
				{ id: 'tag-dessert', name: 'Dessert', color: '#FF69B4' },
				{ id: 'tag-chocolate', name: 'Chocolate', color: '#6F4E37' },
				{ id: 'tag-indulgent', name: 'Indulgent', color: '#9C27B0' }
			]
		}
	];

	return {
		recipes
	};
};
