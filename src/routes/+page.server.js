/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// Sample recipe data - in a real app, this would come from a database
	const recipes = [
		{
			id: 1,
			title: 'Spaghetti Carbonara',
			description: 'Classic Italian pasta with eggs, cheese, and pancetta',
			image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Italian', color: '#008C45' },
				{ name: 'Pasta', color: '#F4A460' },
				{ name: 'Quick', color: '#FF6B6B' }
			]
		},
		{
			id: 2,
			title: 'Grilled Chicken Salad',
			description: 'Fresh greens with grilled chicken and balsamic vinaigrette',
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Healthy', color: '#4CAF50' },
				{ name: 'Salad', color: '#8BC34A' },
				{ name: 'Protein', color: '#E91E63' }
			]
		},
		{
			id: 3,
			title: 'Chocolate Lava Cake',
			description: 'Rich chocolate cake with a molten center',
			image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Dessert', color: '#FF69B4' },
				{ name: 'Chocolate', color: '#6F4E37' },
				{ name: 'Indulgent', color: '#9C27B0' }
			]
		},
		{
			id: 4,
			title: 'Margherita Pizza',
			description: 'Traditional pizza with fresh mozzarella, tomatoes, and basil',
			image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Italian', color: '#008C45' },
				{ name: 'Pizza', color: '#DC143C' },
				{ name: 'Vegetarian', color: '#66BB6A' }
			]
		},
		{
			id: 5,
			title: 'Thai Green Curry',
			description: 'Spicy and aromatic curry with coconut milk and vegetables',
			image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Thai', color: '#FF4081' },
				{ name: 'Spicy', color: '#FF5722' },
				{ name: 'Vegan', color: '#4CAF50' }
			]
		},
		{
			id: 6,
			title: 'Classic Burger',
			description: 'Juicy beef patty with lettuce, tomato, and special sauce',
			image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
			tags: [
				{ name: 'American', color: '#3F51B5' },
				{ name: 'Comfort Food', color: '#FFA726' },
				{ name: 'Beef', color: '#8D6E63' }
			]
		},
		{
			id: 7,
			title: 'Sushi Platter',
			description: 'Assorted fresh sushi rolls and nigiri',
			image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Japanese', color: '#D32F2F' },
				{ name: 'Seafood', color: '#0288D1' },
				{ name: 'Healthy', color: '#4CAF50' }
			]
		},
		{
			id: 8,
			title: 'Greek Salad',
			description: 'Fresh vegetables with feta cheese and olives',
			image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
			tags: [
				{ name: 'Greek', color: '#2196F3' },
				{ name: 'Salad', color: '#8BC34A' },
				{ name: 'Vegetarian', color: '#66BB6A' }
			]
		}
	];

	return {
		recipes
	};
}
