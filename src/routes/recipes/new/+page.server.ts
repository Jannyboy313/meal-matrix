import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

interface Tag {
	name: string;
	color: string;
}

interface Ingredient {
	amount: string;
	name: string;
}

interface NewRecipe {
	title: string;
	description: string;
	image: string;
	prepTime: string;
	cookTime: string;
	servings: number;
	tags: Tag[];
	ingredients: {
		[key: number]: Ingredient[];
	};
	steps: string[];
}

// In a real app, this would be stored in a database
let recipes: any[] = [];
let nextId = 100;

export const actions: Actions = {
	default: async ({ request }) => {
		try {
			const formData = await request.formData();
			const dataString = formData.get('data') as string;
			const data: NewRecipe = JSON.parse(dataString);

			// Create the new recipe
			const newRecipe = {
				id: nextId++,
				...data
			};

			recipes.push(newRecipe);

			// In a real app, you would:
			// 1. Validate the data more thoroughly
			// 2. Save to database
			// 3. Handle image uploads
			// 4. Add user authentication

			throw redirect(303, `/recipes/${newRecipe.id}`);
		} catch (error) {
			if (error instanceof Response) throw error;
			return { success: false, error: 'Failed to create recipe' };
		}
	}
};
