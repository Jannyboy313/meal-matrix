import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import type { Tag, Ingredient, Recipe } from '$lib';

// Common tags that can be reused across recipes
const availableTags: Tag[] = [
	{ id: 'tag-italian', name: 'Italian', color: '#008C45' },
	{ id: 'tag-pasta', name: 'Pasta', color: '#F4A460' },
	{ id: 'tag-quick', name: 'Quick', color: '#FF6B6B' },
	{ id: 'tag-healthy', name: 'Healthy', color: '#4CAF50' },
	{ id: 'tag-salad', name: 'Salad', color: '#8BC34A' },
	{ id: 'tag-protein', name: 'Protein', color: '#E91E63' },
	{ id: 'tag-dessert', name: 'Dessert', color: '#FF69B4' },
	{ id: 'tag-chocolate', name: 'Chocolate', color: '#6F4E37' },
	{ id: 'tag-indulgent', name: 'Indulgent', color: '#9C27B0' },
	{ id: 'tag-vegetarian', name: 'Vegetarian', color: '#4CAF50' },
	{ id: 'tag-vegan', name: 'Vegan', color: '#8BC34A' },
	{ id: 'tag-gluten-free', name: 'Gluten-Free', color: '#FFC107' },
	{ id: 'tag-dairy-free', name: 'Dairy-Free', color: '#03A9F4' },
	{ id: 'tag-low-carb', name: 'Low-Carb', color: '#9E9E9E' },
	{ id: 'tag-breakfast', name: 'Breakfast', color: '#FF9800' },
	{ id: 'tag-lunch', name: 'Lunch', color: '#2196F3' },
	{ id: 'tag-dinner', name: 'Dinner', color: '#673AB7' },
	{ id: 'tag-snack', name: 'Snack', color: '#CDDC39' },
	{ id: 'tag-appetizer', name: 'Appetizer', color: '#00BCD4' },
	{ id: 'tag-main-course', name: 'Main Course', color: '#E91E63' },
	{ id: 'tag-side-dish', name: 'Side Dish', color: '#9C27B0' },
	{ id: 'tag-soup', name: 'Soup', color: '#FF5722' },
	{ id: 'tag-seafood', name: 'Seafood', color: '#00ACC1' },
	{ id: 'tag-chicken', name: 'Chicken', color: '#F57C00' },
	{ id: 'tag-beef', name: 'Beef', color: '#D32F2F' },
	{ id: 'tag-pork', name: 'Pork', color: '#C2185B' },
	{ id: 'tag-asian', name: 'Asian', color: '#E64A19' },
	{ id: 'tag-mexican', name: 'Mexican', color: '#D32F2F' },
	{ id: 'tag-french', name: 'French', color: '#1976D2' },
	{ id: 'tag-american', name: 'American', color: '#1565C0' },
	{ id: 'tag-mediterranean', name: 'Mediterranean', color: '#0097A7' },
	{ id: 'tag-spicy', name: 'Spicy', color: '#FF3D00' },
	{ id: 'tag-comfort-food', name: 'Comfort Food', color: '#F57F17' },
	{ id: 'tag-easy', name: 'Easy', color: '#7CB342' },
	{ id: 'tag-gourmet', name: 'Gourmet', color: '#6A1B9A' }
];

export const load: PageServerLoad = async ({ params }) => {
	// In a real app, this would fetch from a database
	const recipes: Recipe[] = [
		{
			id: 'recipe-1',
			title: 'Spaghetti Carbonara',
			description: 'Classic Italian pasta with eggs, cheese, and pancetta',
			image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=400&fit=crop',
			tags: [
				{ id: 'tag-italian', name: 'Italian', color: '#008C45' },
				{ id: 'tag-pasta', name: 'Pasta', color: '#F4A460' },
				{ id: 'tag-quick', name: 'Quick', color: '#FF6B6B' }
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

	const recipe = recipes.find((r) => r.id === params.id);

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
