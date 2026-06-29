// One-shot: recompose the landscape july-sale poster into a portrait canvas
// that fills the 90vh mobile hero with object-fit: cover and minimal crop.
// Background is a blurred upscale of the poster itself so the padding blends
// instead of looking like flat black bars.
//
// Run: node scripts/repack-july-sale-mobile.mjs
// Restore landscape original from src/assets/promo/july-sale-mobile.landscape-backup.webp.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src/assets/promo/july-sale-mobile.landscape-backup.webp');
const out = path.join(root, 'src/assets/promo/july-sale-mobile.webp');

const TARGET_W = 1080;
const TARGET_H = 2160; // 9:18 — fits 90vh portrait viewports without side-crop

const meta = await sharp(src).metadata();
const fgScale = TARGET_W / meta.width;
const fgH = Math.round(meta.height * fgScale);

// Muted colour-wash background: stretch the poster to the canvas, blur hard,
// then darken so no shapes are recognisable — just sampled mood lighting.
const blurredBg = await sharp(src)
  .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'center' })
  .blur(120)
  .modulate({ brightness: 0.35, saturation: 0.6 })
  .toBuffer();

const foreground = await sharp(src)
  .resize(TARGET_W, fgH, { fit: 'fill' })
  .toBuffer();

// Bias the poster toward the top of the canvas — on a 90vh hero with
// object-fit: cover the bottom ~half gets cropped, so anchor where eyes land.
const top = Math.round((TARGET_H - fgH) * 0.18);

await sharp(blurredBg)
  .composite([{ input: foreground, top, left: 0 }])
  .webp({ quality: 82, effort: 6 })
  .toFile(out);

const newMeta = await sharp(out).metadata();
console.log(`Wrote ${out}`);
console.log(`  ${newMeta.width}x${newMeta.height} (${(newMeta.size / 1024).toFixed(1)} KB)`);
