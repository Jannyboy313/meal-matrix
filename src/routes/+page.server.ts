import type { PageServerLoad } from './$types';

// No server-side data loading needed - recipes are fetched client-side
// via Firestore real-time subscriptions filtered by user ID
export const load: PageServerLoad = async () => {
	return {};
};
