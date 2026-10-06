import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const svgPath = path.resolve(rootDir, 'public', 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating web & PWA icons from', svgPath);

  // 1. PWA Icons
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve(rootDir, 'public', 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.resolve(rootDir, 'public', 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve(rootDir, 'public', 'pwa-maskable-512x512.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.resolve(rootDir, 'public', 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.resolve(rootDir, 'public', 'favicon.png'));
  console.log('PWA icons generated successfully.');

  // 2. Android Mipmap Icons
  const androidMipmaps = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const item of androidMipmaps) {
    const dir = path.resolve(rootDir, 'android', 'app', 'src', 'main', 'res', item.folder);
    if (fs.existsSync(dir)) {
      await sharp(svgBuffer).resize(item.size, item.size).png().toFile(path.resolve(dir, 'ic_launcher.png'));
      await sharp(svgBuffer).resize(item.size, item.size).png().toFile(path.resolve(dir, 'ic_launcher_round.png'));
      await sharp(svgBuffer).resize(item.size, item.size).png().toFile(path.resolve(dir, 'ic_launcher_foreground.png'));
      console.log(`Updated Android icons in ${item.folder} (${item.size}x${item.size})`);
    }
  }

  console.log('All beer mug icons updated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
