/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// Sample recipe data - in a real app, this would come from a database
	const recipes = [
		{
			id: 1,
			title: 'Spaghetti Carbonara',
			description: 'Classic Italian pasta with eggs, cheese, and pancetta',
			image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop'
		},
		{
			id: 2,
			title: 'Grilled Chicken Salad',
			description: 'Fresh greens with grilled chicken and balsamic vinaigrette',
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
		},
		{
			id: 3,
			title: 'Chocolate Lava Cake',
			description: 'Rich chocolate cake with a molten center',
			image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop'
		},
		{
			id: 4,
			title: 'Margherita Pizza',
			description: 'Traditional pizza with fresh mozzarella, tomatoes, and basil',
			image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop'
		},
		{
			id: 5,
			title: 'Thai Green Curry',
			description: 'Spicy and aromatic curry with coconut milk and vegetables',
			image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop'
		},
		{
			id: 6,
			title: 'Classic Burger',
			description: 'Juicy beef patty with lettuce, tomato, and special sauce',
			image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'
		},
		{
			id: 7,
			title: 'Sushi Platter',
			description: 'Assorted fresh sushi rolls and nigiri',
			image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop'
		},
		{
			id: 8,
			title: 'Greek Salad',
			description: 'Fresh vegetables with feta cheese and olives',
			image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop'
		}
	];

	return {
		recipes
	};
}
