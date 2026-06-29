#!/usr/bin/env node
// Regenerates the INSTAGRAM_FEED block in src/app/data/instagram-feed.ts from
// the Instagram Graph API, and downloads + compresses each thumbnail into the
// gitignored src/assets/instagram/ folder. Runs before `npm run build` via the
// `prebuild` script.
//
// GATED on IG_ACCESS_TOKEN: if the token is absent (local dev, or before the
// account is wired up) the script logs a notice and EXITS 0, leaving the
// committed fallback feed untouched — exactly like generate-sitemap.mjs leaves
// the sitemap alone when the API is down. Deploys never fail because of this.
//
// Why download instead of hotlinking: the media_url / thumbnail_url the Graph
// API returns are signed scontent.*.fbcdn.net URLs that 403 after a few weeks
// (CLAUDE.md "Never hotlink Facebook CDN URLs"). We persist our own copies so
// the rendered <img> stays valid until the next deploy refreshes them.
//
// Env:
//   IG_ACCESS_TOKEN  (required)  long-lived / system-user token
//   IG_USER_ID       (optional)  IG business account id; default "me"
//   IG_GRAPH_BASE    (optional)  default "https://graph.instagram.com"
//                                use "https://graph.facebook.com/v19.0" if your
//                                token is a Facebook (Page/system-user) token
//   IG_FEED_LIMIT    (optional)  number of posts to show; default 6

import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER_ID = process.env.IG_USER_ID || 'me';
const GRAPH_BASE = (process.env.IG_GRAPH_BASE || 'https://graph.instagram.com').replace(/\/$/, '');
const LIMIT = Math.max(1, Math.min(12, parseInt(process.env.IG_FEED_LIMIT || '6', 10) || 6));

const DATA_FILE = resolve(repoRoot, 'src/app/data/instagram-feed.ts');
const ASSET_DIR = resolve(repoRoot, 'src/assets/instagram');
const ASSET_PUBLIC = 'assets/instagram'; // path as referenced from the app

const BEGIN = '// <<INSTAGRAM_FEED:BEGIN>>';
const END = '// <<INSTAGRAM_FEED:END>>';

// Thumbnail target: square-ish, retina-friendly, small. Grid renders ~300px.
const THUMB = { size: 640, quality: 80 };

if (!TOKEN) {
  console.log(
    '[instagram] IG_ACCESS_TOKEN not set — keeping committed fallback feed. ' +
      '(Set IG_ACCESS_TOKEN + IG_USER_ID in Netlify env to go live.)',
  );
  process.exit(0);
}

/** Strip hashtags, @mentions, urls, line breaks and trailing emoji clutter,
 *  collapse whitespace, take the first sentence-ish chunk, truncate. */
function cleanCaption(raw, maxLen) {
  if (!raw) return '';
  let s = String(raw)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#@][\w.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // first line / sentence
  const firstSentence = s.split(/[.!?\n]/)[0].trim();
  if (firstSentence.length >= 12) s = firstSentence;
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…';
  return s;
}

/** Build an alt string; always end with a location anchor for SEO + a11y. */
function altFor(caption) {
  const base = cleanCaption(caption, 110);
  if (base) return base.replace(/[“”"]/g, '');
  return 'Enduro Brothers ride in the Pirin Mountains, Bulgaria';
}

async function fetchJson(url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

async function fetchMedia() {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `${GRAPH_BASE}/${USER_ID}/media?fields=${encodeURIComponent(fields)}&limit=${LIMIT * 2}&access_token=${TOKEN}`;
  const json = await fetchJson(url);
  const items = Array.isArray(json.data) ? json.data : [];
  // Keep only renderable items (image, carousel cover, or video thumbnail),
  // newest first (API already returns newest first), trim to LIMIT.
  return items
    .map((m) => {
      const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
      return src
        ? {
            src,
            permalink: m.permalink,
            caption: m.caption || '',
            type: m.media_type === 'VIDEO' ? 'video' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image',
          }
        : null;
    })
    .filter(Boolean)
    .slice(0, LIMIT);
}

async function downloadThumb(src, outPath) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`thumb HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const out = await sharp(buf)
    .rotate()
    .resize(THUMB.size, THUMB.size, { fit: 'cover', position: 'attention' })
    .webp({ quality: THUMB.quality })
    .toBuffer();
  await writeFile(outPath, out);
  return out.length;
}

/** Remove old generated ig-*.webp so a shrinking feed doesn't leave orphans. */
async function clearAssetDir() {
  if (!existsSync(ASSET_DIR)) return;
  const files = await readdir(ASSET_DIR);
  await Promise.all(
    files.filter((f) => /^ig-\d+\.webp$/.test(f)).map((f) => unlink(join(ASSET_DIR, f))),
  );
}

function renderFeedBlock(posts) {
  const entries = posts
    .map((p) => {
      const alt = altFor(p.caption).replace(/'/g, "\\'");
      const caption = cleanCaption(p.caption, 60).replace(/'/g, "\\'");
      const permalink = (p.permalink || '').replace(/'/g, "\\'");
      return [
        '  {',
        `    image: '${p.image}',`,
        `    alt: '${alt}',`,
        `    permalink: '${permalink}',`,
        caption ? `    caption: '${caption}',` : null,
        `    type: '${p.type}',`,
        '  },',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    BEGIN,
    'export const INSTAGRAM_FEED: InstagramPost[] = [',
    entries,
    '];',
    '',
    '/** `true` when the feed above is the hand-authored fallback (no live build yet).',
    ' *  The generator flips this to `false` so the component can hide per-post',
    ' *  permalink clicks that all point at the profile. */',
    'export const INSTAGRAM_FEED_IS_FALLBACK = false;',
    END,
  ].join('\n');
}

(async () => {
  try {
    const media = await fetchMedia();
    if (!media.length) {
      console.warn('[instagram] API returned no renderable media — keeping fallback feed.');
      process.exit(0);
    }

    await mkdir(ASSET_DIR, { recursive: true });
    await clearAssetDir();

    const posts = [];
    let totalKB = 0;
    let i = 0;
    for (const m of media) {
      i += 1;
      const file = `ig-${i}.webp`;
      try {
        const bytes = await downloadThumb(m.src, join(ASSET_DIR, file));
        totalKB += bytes / 1024;
        posts.push({ ...m, image: `${ASSET_PUBLIC}/${file}` });
      } catch (err) {
        console.warn(`[instagram]  ✗ thumbnail ${i} failed (${err.message}) — skipping`);
      }
    }

    if (!posts.length) {
      console.warn('[instagram] all thumbnail downloads failed — keeping fallback feed.');
      process.exit(0);
    }

    const original = await readFile(DATA_FILE, 'utf8');
    const startIdx = original.indexOf(BEGIN);
    const endIdx = original.indexOf(END);
    if (startIdx === -1 || endIdx === -1) {
      console.warn('[instagram] markers not found in instagram-feed.ts — aborting rewrite, keeping fallback.');
      process.exit(0);
    }
    const next =
      original.slice(0, startIdx) + renderFeedBlock(posts) + original.slice(endIdx + END.length);
    await writeFile(DATA_FILE, next, 'utf8');

    console.log(
      `[instagram] Wrote ${posts.length} post(s) → ${ASSET_PUBLIC}/ (${totalKB.toFixed(0)} KB) and updated instagram-feed.ts`,
    );
  } catch (err) {
    // Never fail the build on an upstream hiccup — same contract as the sitemap
    // generator. A stale-but-valid fallback feed beats a broken deploy.
    console.warn(`[instagram] generation skipped: ${err.message} — keeping fallback feed.`);
    process.exit(0);
  }
})();
