import { describe, expect, it } from 'vitest';
import { scaleAmount } from './scaleAmount';

describe('scaleAmount', () => {
	it.each([
		['200 g', 2, '400 g'],
		['200 g', 0.5, '100 g'],
		['1,5 l', 2, '3 l'],
		['1.5 l', 3, '4.5 l'],
		['1 el', 1.5, '1,5 el'],
		['100 g', 1 / 3, '33,33 g'],
		['½ tl', 2, '1 tl'],
		['1½ el', 2, '3 el'],
		['1 1/2 el', 2, '3 el'],
		['1/2 tl', 3, '1,5 tl'],
		['2-3 teentjes', 2, '4-6 teentjes'],
		['1 blik (400 g)', 2, '2 blik (800 g)'],
		['snufje', 2, 'snufje'],
		['', 2, ''],
		['1/0 el', 2, '1/0 el']
	])('scales %j by %d to %j', (amount, factor, expected) => {
		expect(scaleAmount(amount, factor)).toBe(expected);
	});

	it('returns the amount unchanged for an invalid factor', () => {
		expect(scaleAmount('200 g', 0)).toBe('200 g');
		expect(scaleAmount('200 g', NaN)).toBe('200 g');
		expect(scaleAmount('200 g', Infinity)).toBe('200 g');
	});
});
