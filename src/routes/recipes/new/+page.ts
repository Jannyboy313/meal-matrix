import type { PageLoad } from './$types';

interface Tag {
	name: string;
	color: string;
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

export const load: PageLoad = async () => {
	// In a real app, you would fetch available tags from the database
	return {
		availableTags
	};
};
