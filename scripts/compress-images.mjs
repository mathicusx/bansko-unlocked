#!/usr/bin/env node
// Compress static image assets in-place using sharp.
//
// Runs on demand via `npm run compress:images`. Not wired into the build —
// we don't want a ~10s compression pass running on every CI build for files
// that haven't changed. Drop new originals into one of the TARGETS folders,
// run the script once, commit the smaller files.
//
// Behaviour:
//   - Reads each image in the target folder(s).
//   - Auto-rotates by EXIF, resizes to fit within (maxWidth × maxHeight),
//     re-encodes at the target quality, preserves original extension.
//   - Overwrites the file in place.
//   - Skips files already under SKIP_IF_SMALLER_THAN_KB — idempotent so you
//     can run it repeatedly without re-compressing already-compressed images.

import sharp from 'sharp';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Folders compressed in-place. Add new entries here as the asset library grows.
// `blog/` holds hero images for /blog posts. `team/` holds portraits of the
// tour guides shown on /team. `enduro-gallery/` was processed once by the
// legacy compress-images.js and is intentionally NOT included here — leave it
// alone unless you're refreshing the gallery photos.
const TARGETS = [
  {
    folder: 'src/assets/blog',
    maxWidth: 1600,
    maxHeight: 1066,
    quality: 80,
    label: 'blog',
  },
  {
    folder: 'src/assets/team',
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 82,
    label: 'team',
  },
  // home-videos/ contains the original (uncompressed) hero rotation images
  // and accommodation photos. Only one file (hotel-1.jpg) is referenced by
  // running code (accommodation.component.scss); the rest is dead weight
  // that still gets bundled into the Netlify deploy via angular.json's
  // src/assets glob. Compressing in place lets the SCSS reference keep
  // working at the same path while dropping ~60 MB of CDN bloat. The .mp4
  // in this folder is ignored — sharp only handles JPG/PNG/WebP.
  {
    folder: 'src/assets/home-videos',
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 75,
    label: 'home-videos (hero originals)',
  },
  {
    folder: 'src/assets/home-videos/accommodation',
    maxWidth: 1600,
    maxHeight: 1066,
    quality: 78,
    label: 'home-videos/accommodation',
  },
];

// Loose individual files outside the above folders. Each entry is compressed
// in place using the per-entry settings.
const INDIVIDUAL_FILES = [
  { file: 'src/assets/guide-1.jpeg', maxWidth: 1200, maxHeight: 1200, quality: 82 },
  { file: 'src/assets/guide-2.jpeg', maxWidth: 1200, maxHeight: 1200, quality: 82 },
  { file: 'src/assets/guide-3.jpeg', maxWidth: 1200, maxHeight: 1200, quality: 82 },
  { file: 'src/assets/meet-the-team.jpeg', maxWidth: 1600, maxHeight: 1066, quality: 80 },
  // Hero promo posters are the LCP element on mobile/desktop. Aggressive
  // quality (55/60) is fine because the .media-overlay (rgba(0,0,0,0.55))
  // darkens them on the page, hiding artefacts. After the initial compression
  // pass they're well under 500 KB so the default skip threshold protects
  // them from being re-encoded on every script run. Set skipThresholdKB: 0
  // here temporarily when swapping in a new (uncompressed) promo image.
  { file: 'src/assets/promo/july-sale-mobile.webp', maxWidth: 800, maxHeight: 1600, quality: 55 },
  { file: 'src/assets/promo/july-sale.webp', maxWidth: 1600, maxHeight: 900, quality: 60 },
];

// Anything already this small is treated as previously compressed and left alone.
// Raised from 350 to 500: after the first compression pass, web-sized photos
// land in the 350-500 KB range. With the lower threshold the script would
// re-encode them on every subsequent run, slowly degrading quality each time.
// 500 KB is the boundary above which a file is almost certainly an unprocessed
// original worth touching.
const SKIP_IF_SMALLER_THAN_KB = 500;

function encoderFor(ext, quality) {
  switch (ext.toLowerCase()) {
    case '.png':
      return (img) => img.png({ quality, compressionLevel: 9, progressive: true });
    case '.webp':
      return (img) => img.webp({ quality });
    case '.jpg':
    case '.jpeg':
    default:
      return (img) => img.jpeg({ quality, progressive: true, mozjpeg: true });
  }
}

async function compressFolder({ folder, maxWidth, maxHeight, quality, label }) {
  const abs = resolve(repoRoot, folder);
  if (!existsSync(abs)) {
    console.warn(`[compress] ${label}: ${folder} does not exist — skipping`);
    return { processed: 0, skipped: 0, savedKB: 0 };
  }

  const entries = await readdir(abs);
  const images = entries.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (!images.length) {
    console.log(`[compress] ${label}: no images found in ${folder}`);
    return { processed: 0, skipped: 0, savedKB: 0 };
  }

  console.log(`[compress] ${label}: ${images.length} image(s) in ${folder}`);
  let processed = 0;
  let skipped = 0;
  let savedKB = 0;

  for (const file of images) {
    const inputPath = join(abs, file);
    const info = await stat(inputPath);
    const sizeKB = info.size / 1024;

    if (sizeKB < SKIP_IF_SMALLER_THAN_KB) {
      console.log(`  · ${file} — ${sizeKB.toFixed(0)}KB, already small, skip`);
      skipped++;
      continue;
    }

    try {
      const ext = extname(file);
      const encode = encoderFor(ext, quality);
      // Read into buffer first — on Windows, passing a path directly to
      // sharp can hit "UNKNOWN: unknown error, open" when another process
      // (IDE, antivirus, OneDrive) holds a handle. Buffer input bypasses
      // libvips' own file open and uses the buffer Node already has.
      const inputBuffer = await readFile(inputPath);
      const buffer = await encode(
        sharp(inputBuffer)
          .rotate()
          .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true }),
      ).toBuffer();

      await writeFile(inputPath, buffer);
      const newKB = buffer.length / 1024;
      const delta = sizeKB - newKB;
      savedKB += delta;
      processed++;
      console.log(
        `  ✓ ${file} — ${sizeKB.toFixed(0)}KB → ${newKB.toFixed(0)}KB (${((1 - newKB / sizeKB) * 100).toFixed(0)}% smaller)`,
      );
    } catch (err) {
      console.warn(`  ✗ ${file} — failed: ${err.message}`);
    }
  }

  return { processed, skipped, savedKB };
}

async function compressFile({ file, maxWidth, maxHeight, quality, skipThresholdKB }) {
  const abs = resolve(repoRoot, file);
  if (!existsSync(abs)) {
    console.warn(`[compress] file ${file} does not exist — skipping`);
    return { processed: 0, skipped: 0, savedKB: 0 };
  }
  const info = await stat(abs);
  const sizeKB = info.size / 1024;
  const threshold = skipThresholdKB ?? SKIP_IF_SMALLER_THAN_KB;
  if (sizeKB < threshold) {
    console.log(`  · ${file} — ${sizeKB.toFixed(0)}KB, already small, skip`);
    return { processed: 0, skipped: 1, savedKB: 0 };
  }
  try {
    const ext = extname(abs);
    const encode = encoderFor(ext, quality);
    const inputBuffer = await readFile(abs);
    const buffer = await encode(
      sharp(inputBuffer)
        .rotate()
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true }),
    ).toBuffer();
    await writeFile(abs, buffer);
    const newKB = buffer.length / 1024;
    const delta = sizeKB - newKB;
    console.log(
      `  ✓ ${file} — ${sizeKB.toFixed(0)}KB → ${newKB.toFixed(0)}KB (${((1 - newKB / sizeKB) * 100).toFixed(0)}% smaller)`,
    );
    return { processed: 1, skipped: 0, savedKB: delta };
  } catch (err) {
    console.warn(`  ✗ ${file} — failed: ${err.message}`);
    return { processed: 0, skipped: 0, savedKB: 0 };
  }
}

(async () => {
  let total = { processed: 0, skipped: 0, savedKB: 0 };
  for (const target of TARGETS) {
    const result = await compressFolder(target);
    total.processed += result.processed;
    total.skipped += result.skipped;
    total.savedKB += result.savedKB;
  }
  if (INDIVIDUAL_FILES.length) {
    console.log(`[compress] individual: ${INDIVIDUAL_FILES.length} file(s)`);
    for (const entry of INDIVIDUAL_FILES) {
      const result = await compressFile(entry);
      total.processed += result.processed;
      total.skipped += result.skipped;
      total.savedKB += result.savedKB;
    }
  }
  console.log(
    `\n[compress] done — ${total.processed} compressed, ${total.skipped} skipped, ${(total.savedKB / 1024).toFixed(1)} MB saved`,
  );
})().catch((err) => {
  console.error('[compress] failed:', err);
  process.exit(1);
});
