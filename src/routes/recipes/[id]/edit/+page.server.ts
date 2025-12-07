import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// Recipe data and tags are fetched client-side from Firestore
	return {
		recipeId: params.id
	};
};

// Old mock data - kept for reference during migration
/*
const recipes: RecipeWithTags[] = [
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
*/
