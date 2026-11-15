import { describe, expect, it } from 'vitest';
import { ImportError, isPublicAddress, parseImportUrl } from './fetchRecipePage';

describe('isPublicAddress', () => {
	it.each(['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111'])('allows %s', (ip) => {
		expect(isPublicAddress(ip)).toBe(true);
	});

	it.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.20.0.1',
		'192.168.1.1',
		'169.254.169.254',
		'100.64.0.1',
		'0.0.0.0',
		'::1',
		'::',
		'fd00::1',
		'fe80::1',
		'::ffff:127.0.0.1',
		'::FFFF:10.0.0.1',
		'::ffff:7f00:1',
		'64:ff9b::a00:1',
		'not-an-ip'
	])('blocks %s', (ip) => {
		expect(isPublicAddress(ip)).toBe(false);
	});
});

describe('parseImportUrl', () => {
	it('accepts http and https', () => {
		expect(parseImportUrl(' https://www.ah.nl/allerhande/recept/R-R1 ').hostname).toBe('www.ah.nl');
		expect(parseImportUrl('http://example.com').protocol).toBe('http:');
	});

	it.each([['ftp://example.com'], ['file:///etc/passwd'], ['javascript:alert(1)'], ['geen url'], ['https://user:pw@example.com'], [42]])(
		'rejects %s',
		(input) => {
			expect(() => parseImportUrl(input)).toThrow(ImportError);
		}
	);
});
