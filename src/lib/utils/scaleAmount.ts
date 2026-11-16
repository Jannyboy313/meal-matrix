const VULGAR: Record<string, number> = {
	'½': 1 / 2,
	'⅓': 1 / 3,
	'⅔': 2 / 3,
	'¼': 1 / 4,
	'¾': 3 / 4,
	'⅛': 1 / 8
};

// Fractions (`1 1/2`, `1/2`) and vulgar fractions (`1½`, `½`) come before plain numbers, or
// the regex would stop after the whole part.
const NUMBER = /(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)|(?:(\d+)\s*)?([½⅓⅔¼¾⅛])|\d+(?:[.,]\d+)?/g;

/**
 * Multiplies every number in a free-text amount (`"200 g"`, `"1½ el"`, `"2-3 teentjes"`) by
 * `factor`. Text without a number (`"snufje"`) is returned unchanged. The result is a
 * suggestion for the user to correct: not every ingredient scales linearly.
 */
export function scaleAmount(amount: string, factor: number): string {
	if (!Number.isFinite(factor) || factor <= 0) return amount;

	return amount.replace(NUMBER, (token, whole, numerator, denominator, vulgarWhole, vulgar) => {
		const value = denominator
			? Number(whole ?? 0) + Number(numerator) / Number(denominator)
			: vulgar
				? Number(vulgarWhole ?? 0) + VULGAR[vulgar]
				: Number(token.replace(',', '.'));

		if (!Number.isFinite(value)) return token;

		const scaled = String(Math.round(value * factor * 100) / 100);
		return token.includes('.') ? scaled : scaled.replace('.', ',');
	});
}
