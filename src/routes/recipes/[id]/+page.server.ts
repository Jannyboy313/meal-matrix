import type { PageServerLoad } from './$types';

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
					{ amount: '1 clove', name: 'Garlic, minced' },
					{ amount: 'To taste', name: 'Black pepper, freshly ground' },
					{ amount: 'To taste', name: 'Salt' }
				],
				4: [
					{ amount: '400g', name: 'Spaghetti' },
					{ amount: '200g', name: 'Pancetta or guanciale, diced' },
					{ amount: '4', name: 'Large eggs' },
					{ amount: '100g', name: 'Pecorino Romano cheese, grated' },
					{ amount: '50g', name: 'Parmesan cheese, grated' },
					{ amount: '2 cloves', name: 'Garlic, minced' },
					{ amount: 'To taste', name: 'Black pepper, freshly ground' },
					{ amount: 'To taste', name: 'Salt' }
				]
			},
			steps: [
				'Bring a large pot of salted water to a boil. Add spaghetti and cook according to package directions until al dente.',
				'While pasta cooks, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 5-7 minutes.',
				'In a bowl, whisk together eggs, Pecorino Romano, Parmesan, and a generous amount of black pepper.',
				'When pasta is done, reserve 1 cup of pasta water, then drain the pasta.',
				'Add the hot pasta to the skillet with pancetta (off heat). Toss to combine.',
				'Quickly add the egg mixture, tossing continuously. Add pasta water gradually to create a creamy sauce.',
				'Serve immediately with extra cheese and black pepper on top.'
			]
		},
		{
			id: 2,
			title: 'Grilled Chicken Salad',
			description: 'Fresh greens with grilled chicken and balsamic vinaigrette',
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=400&fit=crop',
			tags: [
				{ name: 'Healthy', color: '#4CAF50' },
				{ name: 'Salad', color: '#8BC34A' },
				{ name: 'Protein', color: '#E91E63' }
			],
			prepTime: '15 minutes',
			cookTime: '12 minutes',
			servings: 2,
			ingredients: {
				2: [
					{ amount: '2', name: 'Chicken breasts' },
					{ amount: '200g', name: 'Mixed salad greens' },
					{ amount: '1', name: 'Cucumber, sliced' },
					{ amount: '200g', name: 'Cherry tomatoes, halved' },
					{ amount: '1/2', name: 'Red onion, thinly sliced' },
					{ amount: '50g', name: 'Feta cheese, crumbled' },
					{ amount: '3 tbsp', name: 'Balsamic vinegar' },
					{ amount: '5 tbsp', name: 'Olive oil' },
					{ amount: '1 tsp', name: 'Dijon mustard' },
					{ amount: 'To taste', name: 'Salt and pepper' }
				],
				4: [
					{ amount: '4', name: 'Chicken breasts' },
					{ amount: '400g', name: 'Mixed salad greens' },
					{ amount: '2', name: 'Cucumbers, sliced' },
					{ amount: '400g', name: 'Cherry tomatoes, halved' },
					{ amount: '1', name: 'Red onion, thinly sliced' },
					{ amount: '100g', name: 'Feta cheese, crumbled' },
					{ amount: '6 tbsp', name: 'Balsamic vinegar' },
					{ amount: '10 tbsp', name: 'Olive oil' },
					{ amount: '2 tsp', name: 'Dijon mustard' },
					{ amount: 'To taste', name: 'Salt and pepper' }
				]
			},
			steps: [
				'Season chicken breasts with salt, pepper, and olive oil. Let rest for 10 minutes.',
				'Heat grill or grill pan to medium-high heat. Cook chicken for 6 minutes per side until internal temperature reaches 165°F (74°C).',
				'Let chicken rest for 5 minutes, then slice into strips.',
				'In a large bowl, combine salad greens, cucumber, tomatoes, and red onion.',
				'In a small bowl, whisk together balsamic vinegar, olive oil, mustard, salt, and pepper.',
				'Add sliced chicken to the salad, drizzle with dressing, and top with feta cheese.',
				'Toss gently and serve immediately.'
			]
		},
		{
			id: 3,
			title: 'Chocolate Lava Cake',
			description: 'Rich chocolate cake with a molten center',
			image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&h=400&fit=crop',
			tags: [
				{ name: 'Dessert', color: '#FF69B4' },
				{ name: 'Chocolate', color: '#6F4E37' },
				{ name: 'Indulgent', color: '#9C27B0' }
			],
			prepTime: '10 minutes',
			cookTime: '12 minutes',
			servings: 4,
			ingredients: {
				2: [
					{ amount: '50g', name: 'Dark chocolate, chopped' },
					{ amount: '50g', name: 'Butter' },
					{ amount: '1', name: 'Large egg' },
					{ amount: '1', name: 'Egg yolk' },
					{ amount: '30g', name: 'Sugar' },
					{ amount: '20g', name: 'All-purpose flour' },
					{ amount: '1/2 tsp', name: 'Vanilla extract' },
					{ amount: 'For dusting', name: 'Cocoa powder' },
					{ amount: 'For serving', name: 'Vanilla ice cream' }
				],
				4: [
					{ amount: '100g', name: 'Dark chocolate, chopped' },
					{ amount: '100g', name: 'Butter' },
					{ amount: '2', name: 'Large eggs' },
					{ amount: '2', name: 'Egg yolks' },
					{ amount: '60g', name: 'Sugar' },
					{ amount: '40g', name: 'All-purpose flour' },
					{ amount: '1 tsp', name: 'Vanilla extract' },
					{ amount: 'For dusting', name: 'Cocoa powder' },
					{ amount: 'For serving', name: 'Vanilla ice cream' }
				]
			},
			steps: [
				'Preheat oven to 425°F (220°C). Butter and lightly flour four 6-ounce ramekins.',
				'Melt chocolate and butter together in a microwave-safe bowl in 30-second intervals, stirring until smooth.',
				'In a separate bowl, whisk together eggs, egg yolks, and sugar until thick and pale.',
				'Fold the chocolate mixture into the egg mixture.',
				'Sift in flour and fold gently until just combined. Add vanilla extract.',
				'Divide batter evenly among prepared ramekins.',
				'Bake for 12-14 minutes until edges are firm but center is still soft.',
				'Let cool for 1 minute, then invert onto plates. Dust with cocoa powder and serve immediately with ice cream.'
			]
		}
	];

	const recipe: Recipe | undefined = recipes.find(r => r.id === parseInt(params.id));

	if (!recipe) {
		throw new Error('Recipe not found');
	}

	return {
		recipe
	};
};
