import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
	{ size: 192, name: 'icon-192x192.png' },
	{ size: 512, name: 'icon-512x512.png' }
];

const svgBuffer = Buffer.from(`
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="85" fill="#10b981"/>
  <path d="M256 106.667C209.207 106.667 170.667 145.207 170.667 192V234.667H149.333C134.603 234.667 122.667 246.603 122.667 261.333V378.667C122.667 393.397 134.603 405.333 149.333 405.333H362.667C377.397 405.333 389.333 393.397 389.333 378.667V261.333C389.333 246.603 377.397 234.667 362.667 234.667H341.333V192C341.333 145.207 302.793 106.667 256 106.667ZM298.667 234.667H213.333V192C213.333 168.77 232.103 149.333 256 149.333C279.897 149.333 298.667 168.77 298.667 192V234.667Z" fill="white"/>
  <circle cx="256" cy="320" r="21.333" fill="#1a1a1a"/>
  <text x="256" y="341.333" font-family="Arial, sans-serif" font-size="37.333" fill="#1a1a1a" text-anchor="middle" font-weight="bold">MM</text>
</svg>
`);

async function generateIcons() {
	for (const { size, name } of sizes) {
		// Regular icon
		await sharp(svgBuffer)
			.resize(size, size)
			.png()
			.toFile(join(__dirname, '..', 'static', name));

		// Maskable icon (with padding)
		const maskableSvg = Buffer.from(`
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#10b981"/>
  <g transform="translate(${size * 0.1}, ${size * 0.1}) scale(0.8)">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#10b981"/>
    <path d="M${size * 0.5} ${size * 0.2083}C${size * 0.4086} ${size * 0.2083} ${size * 0.3333} ${size * 0.2837} ${size * 0.3333} ${size * 0.375}V${size * 0.4583}H${size * 0.2917}C${size * 0.2631} ${size * 0.4583} ${size * 0.2396} ${size * 0.4818} ${size * 0.2396} ${size * 0.5104}V${size * 0.7396}C${size * 0.2396} ${size * 0.7682} ${size * 0.2631} ${size * 0.7917} ${size * 0.2917} ${size * 0.7917}H${size * 0.7083}C${size * 0.7369} ${size * 0.7917} ${size * 0.7604} ${size * 0.7682} ${size * 0.7604} ${size * 0.7396}V${size * 0.5104}C${size * 0.7604} ${size * 0.4818} ${size * 0.7369} ${size * 0.4583} ${size * 0.7083} ${size * 0.4583}H${size * 0.6667}V${size * 0.375}C${size * 0.6667} ${size * 0.2837} ${size * 0.5914} ${size * 0.2083} ${size * 0.5} ${size * 0.2083}ZM${size * 0.5833} ${size * 0.4583}H${size * 0.4167}V${size * 0.375}C${size * 0.4167} ${size * 0.3294} ${size * 0.4544} ${size * 0.2917} ${size * 0.5} ${size * 0.2917}C${size * 0.5456} ${size * 0.2917} ${size * 0.5833} ${size * 0.3294} ${size * 0.5833} ${size * 0.375}V${size * 0.4583}Z" fill="white"/>
  </g>
</svg>
		`);

		await sharp(maskableSvg)
			.resize(size, size)
			.png()
			.toFile(join(__dirname, '..', 'static', name.replace('.png', '-maskable.png')));

		console.log(`Generated ${name} and ${name.replace('.png', '-maskable.png')}`);
	}
}

generateIcons().catch(console.error);
