/**
 * Fetches a user-supplied URL from the server with the usual SSRF limits: http(s) only,
 * public addresses only, a bounded number of re-checked redirects, a timeout and a size cap.
 */

import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

export type ImportErrorCode = 'invalid_url' | 'unauthorized' | 'unreachable' | 'no_recipe';

export class ImportError extends Error {
	constructor(public readonly code: ImportErrorCode) {
		super(code);
	}
}

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 3 * 1024 * 1024;

const blocked = new BlockList();
for (const [network, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 4],
	['240.0.0.0', 4]
] as const) {
	blocked.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
	['::', 128],
	['::1', 128],
	['64:ff9b::', 96],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8]
] as const) {
	blocked.addSubnet(network, prefix, 'ipv6');
}

/** BlockList also matches IPv4-mapped IPv6 (`::ffff:7f00:1`) against the IPv4 subnets. */
export function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 0) return false;
	return !blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

export function parseImportUrl(input: unknown): URL {
	if (typeof input !== 'string') throw new ImportError('invalid_url');
	let url: URL;
	try {
		url = new URL(input.trim());
	} catch {
		throw new ImportError('invalid_url');
	}
	if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
		throw new ImportError('invalid_url');
	}
	return url;
}

async function assertPublicHost(url: URL): Promise<void> {
	const host = url.hostname.replace(/^\[|\]$/g, '');
	const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
	if (addresses.length === 0) throw new ImportError('unreachable');
	if (!addresses.every(isPublicAddress)) throw new ImportError('invalid_url');
}

async function readCapped(response: Response): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) return '';
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > MAX_BYTES) {
			await reader.cancel();
			throw new ImportError('unreachable');
		}
		chunks.push(value);
	}
	return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function fetchRecipePage(start: URL): Promise<string> {
	const signal = AbortSignal.timeout(TIMEOUT_MS);
	let url = start;

	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		// shortcut: the host is resolved again by fetch, so DNS rebinding between this check and
		// the connect is not covered. Acceptable while the endpoint requires a verified user;
		// revisit if it is ever opened up (pin the address with an undici dispatcher).
		await assertPublicHost(url);

		let response: Response;
		try {
			response = await fetch(url, {
				redirect: 'manual',
				signal,
				headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'MealMatrixRecipeImport/1.0' }
			});
		} catch {
			throw new ImportError('unreachable');
		}

		const location = response.headers.get('location');
		if (response.status >= 300 && response.status < 400 && location) {
			url = parseImportUrl(new URL(location, url).href);
			continue;
		}
		if (!response.ok) throw new ImportError('unreachable');
		try {
			return await readCapped(response);
		} catch (error) {
			throw error instanceof ImportError ? error : new ImportError('unreachable');
		}
	}
	throw new ImportError('unreachable');
}
