import type { PageLoad } from './$types';
import type { Tag } from '$lib';

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

export const load: PageLoad = async () => {
	// In a real app, you would fetch available tags from the database
	return {
		availableTags
	};
};
