import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

interface Tag {
	name: string;
	color: string;
}

interface Ingredient {
	amount: string;
	name: string;
}

interface Recipe {
	id: number;
	title: string;
	description: string;
	image: string;
	tags: Tag[];
	prepTime: string;
	cookTime: string;
	servings: number;
	ingredients: {
		[key: number]: Ingredient[];
	};
	steps: string[];
}

// Common tags that can be reused across recipes
const availableTags: Tag[] = [
	{ name: 'Italian', color: '#008C45' },
	{ name: 'Pasta', color: '#F4A460' },
	{ name: 'Quick', color: '#FF6B6B' },
	{ name: 'Healthy', color: '#4CAF50' },
	{ name: 'Salad', color: '#8BC34A' },
	{ name: 'Protein', color: '#E91E63' },
	{ name: 'Dessert', color: '#FF69B4' },
	{ name: 'Chocolate', color: '#6F4E37' },
	{ name: 'Indulgent', color: '#9C27B0' },
	{ name: 'Vegetarian', color: '#4CAF50' },
	{ name: 'Vegan', color: '#8BC34A' },
	{ name: 'Gluten-Free', color: '#FFC107' },
	{ name: 'Dairy-Free', color: '#03A9F4' },
	{ name: 'Low-Carb', color: '#9E9E9E' },
	{ name: 'Breakfast', color: '#FF9800' },
	{ name: 'Lunch', color: '#2196F3' },
	{ name: 'Dinner', color: '#673AB7' },
	{ name: 'Snack', color: '#CDDC39' },
	{ name: 'Appetizer', color: '#00BCD4' },
	{ name: 'Main Course', color: '#E91E63' },
	{ name: 'Side Dish', color: '#9C27B0' },
	{ name: 'Soup', color: '#FF5722' },
	{ name: 'Seafood', color: '#00ACC1' },
	{ name: 'Chicken', color: '#F57C00' },
	{ name: 'Beef', color: '#D32F2F' },
	{ name: 'Pork', color: '#C2185B' },
	{ name: 'Asian', color: '#E64A19' },
	{ name: 'Mexican', color: '#D32F2F' },
	{ name: 'French', color: '#1976D2' },
	{ name: 'American', color: '#1565C0' },
	{ name: 'Mediterranean', color: '#0097A7' },
	{ name: 'Spicy', color: '#FF3D00' },
	{ name: 'Comfort Food', color: '#F57F17' },
	{ name: 'Easy', color: '#7CB342' },
	{ name: 'Gourmet', color: '#6A1B9A' }
];

export const load: PageServerLoad = async ({ params }) => {
	// In a real app, this would fetch from a database
	const recipes: Recipe[] = [
		{
			id: 1,
			title: 'Spaghetti Carbonara',
			description: 'Classic Italian pasta with eggs, cheese, and pancetta',
			image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=400&fit=crop',
			tags: [
				{ name: 'Italian', color: '#008C45' },
				{ name: 'Pasta', color: '#F4A460' },
				{ name: 'Quick', color: '#FF6B6B' }
			],
			prepTime: '10 minutes',
			cookTime: '15 minutes',
			servings: 4,
			ingredients: {
				2: [
					{ amount: '200g', name: 'Spaghetti' },
					{ amount: '100g', name: 'Pancetta or guanciale, diced' },
					{ amount: '2', name: 'Large eggs' },
					{ amount: '50g', name: 'Pecorino Romano cheese, grated' },
					{ amount: '25g', name: 'Parmesan cheese, grated' },
					{ amount: '1/2 tsp', name: 'Black pepper, freshly ground' },
					{ amount: 'Pinch', name: 'Salt' }
				],
				4: [
					{ amount: '400g', name: 'Spaghetti' },
					{ amount: '200g', name: 'Pancetta or guanciale, diced' },
					{ amount: '4', name: 'Large eggs' },
					{ amount: '100g', name: 'Pecorino Romano cheese, grated' },
					{ amount: '50g', name: 'Parmesan cheese, grated' },
					{ amount: '1 tsp', name: 'Black pepper, freshly ground' },
					{ amount: 'Pinch', name: 'Salt' }
				]
			},
			steps: [
				'Bring a large pot of salted water to a boil. Cook spaghetti according to package instructions until al dente.',
				'While pasta cooks, heat a large pan over medium heat. Add pancetta and cook until crispy, about 5 minutes.',
				'In a bowl, whisk together eggs, Pecorino Romano, and Parmesan cheese. Season with black pepper.',
				'Reserve 1 cup of pasta water, then drain the pasta.',
				'Remove pan from heat. Add hot pasta to the pan with pancetta and toss to combine.',
				'Pour egg mixture over pasta, tossing quickly to create a creamy sauce. Add pasta water as needed to reach desired consistency.',
				'Serve immediately with extra cheese and black pepper on top.'
			]
		}
	];

	const recipe = recipes.find((r) => r.id === parseInt(params.id));

	if (!recipe) {
		throw redirect(302, '/');
	}

	return {
		recipe,
		availableTags
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const data = formData.get('data');

		if (!data) {
			return fail(400, { error: 'Missing recipe data' });
		}

		try {
			const recipeData = JSON.parse(data as string);

			// Validate required fields
			if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
				return fail(400, { error: 'Missing required fields' });
			}

			// In a real app, this would update the recipe in the database
			console.log('Updating recipe:', params.id, recipeData);

			// Redirect to the updated recipe page
			throw redirect(303, `/recipes/${params.id}`);
		} catch (error) {
			console.error('Failed to update recipe:', error);
			return fail(500, { error: 'Failed to update recipe' });
		}
	}
};
