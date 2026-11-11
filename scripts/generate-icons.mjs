import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function renderIcons() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const iconSvgPath = path.join(publicDir, 'icon.svg');
  const maskableSvgPath = path.join(publicDir, 'icon-maskable.svg');

  const iconSvgContent = fs.readFileSync(iconSvgPath, 'utf8');
  const maskableSvgContent = fs.readFileSync(maskableSvgPath, 'utf8');

  // Render 192x192
  await page.setViewportSize({ width: 192, height: 192 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${iconSvgContent.replace('width="512" height="512"', 'width="192" height="192"')}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'pwa-192x192.png'), omitBackground: true });

  // Render 512x512
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${iconSvgContent}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'pwa-512x512.png'), omitBackground: true });

  // Render maskable 512x512
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#0b0d0e;">${maskableSvgContent}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'pwa-maskable-512x512.png') });

  // Render apple-touch-icon 180x180
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${iconSvgContent.replace('width="512" height="512"', 'width="180" height="180"')}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'apple-touch-icon.png') });

  // Render favicon 64x64
  await page.setViewportSize({ width: 64, height: 64 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${iconSvgContent.replace('width="512" height="512"', 'width="64" height="64"')}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'favicon.ico') });

  await browser.close();
  console.log('Successfully generated all PWA icons in /public:');
  const files = fs.readdirSync(publicDir);
  for (const f of files) {
    const stat = fs.statSync(path.join(publicDir, f));
    console.log(` - ${f} (${stat.size} bytes)`);
  }
}

renderIcons().catch((err) => {
  console.error('Error rendering icons:', err);
  process.exit(1);
});
