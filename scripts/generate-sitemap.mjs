#!/usr/bin/env node
// Generates src/sitemap.xml and prerender-routes.txt for the static Bansko
// Unlocked site. Runs automatically before `npm run build` via `prebuild`.
//
// Fully static: no API, no locales. The page list lives here; activity slugs
// are read from src/app/data/activities.data.ts and blog slugs from
// src/app/data/blog-posts-en.ts, so adding content only needs a data-file edit
// followed by a rerun of this script.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// TODO(deploy): confirm the production domain before launch.
const SITE = 'https://banskounlocked.com';
const TODAY = new Date().toISOString().slice(0, 10);

// IndexNow: gated on env var so local builds don't ping search engines. Disabled
// until a Bansko Unlocked key file is hosted on the live domain.
// TODO(deploy): regenerate the IndexNow key + host its .txt file, then update host/key.
const INDEXNOW_KEY = '';
const INDEXNOW_HOST = 'banskounlocked.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

const STATIC_PAGES = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'weekly',
    hreflang: true,
    image: {
      loc: `${SITE}/assets/og/og-image.jpg`,
      caption: 'Bansko Unlocked — adventure activities in Bansko, Bulgaria',
      title: 'Bansko Unlocked',
    },
  },
  { path: '/activities', priority: '0.9', changefreq: 'weekly', hreflang: true },
  { path: '/reviews', priority: '0.8', changefreq: 'weekly', hreflang: true },
  { path: '/contact', priority: '0.8', changefreq: 'monthly', hreflang: true },
  { path: '/about', priority: '0.7', changefreq: 'monthly', hreflang: true },
  { path: '/team', priority: '0.6', changefreq: 'monthly', hreflang: true },
  { path: '/gallery', priority: '0.7', changefreq: 'weekly', hreflang: true },
  { path: '/faq', priority: '0.7', changefreq: 'monthly', hreflang: true },
  { path: '/blog', priority: '0.7', changefreq: 'weekly', hreflang: true },
];

const STATIC_PRERENDER_ROUTES = [
  '/',
  '/activities',
  '/contact',
  '/about',
  '/team',
  '/gallery',
  '/reviews',
  '/faq',
  '/blog',
];

// Read `slug: '...'` values out of a plain-object-literal TS data file via regex
// (avoids pulling in a TS loader). Used for both activities and blog posts.
function readSlugs(relPath) {
  try {
    const src = readFileSync(resolve(repoRoot, relPath), 'utf8');
    const re = /\bslug:\s*['"]([\w-]+)['"]/g;
    return [...src.matchAll(re)].map((m) => m[1]);
  } catch (err) {
    console.warn(`[sitemap] Could not read ${relPath}: ${err.message}`);
    return [];
  }
}

// Blog posts with their published date, for <lastmod>.
function readBlogPosts() {
  try {
    const src = readFileSync(resolve(repoRoot, 'src/app/data/blog-posts-en.ts'), 'utf8');
    const slugs = [...src.matchAll(/\bslug:\s*['"]([\w-]+)['"]/g)];
    const dates = [...src.matchAll(/\bpublishedDate:\s*['"](\d{4}-\d{2}-\d{2})['"]/g)];
    if (slugs.length !== dates.length) {
      console.warn(`[sitemap] blog-posts-en.ts: ${slugs.length} slugs vs ${dates.length} dates — mismatch, skipping blog`);
      return [];
    }
    return slugs.map((m, i) => ({ slug: m[1], publishedDate: dates[i][1] }));
  } catch (err) {
    console.warn(`[sitemap] Could not read blog posts: ${err.message}`);
    return [];
  }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlBlock({ loc, priority, changefreq, hreflang, image, lastmod }) {
  const lines = ['  <url>'];
  lines.push(`    <loc>${escapeXml(loc)}</loc>`);
  lines.push(`    <lastmod>${lastmod || TODAY}</lastmod>`);
  lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  if (hreflang) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(loc)}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(loc)}" />`);
  }
  if (image) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(image.loc)}</image:loc>`);
    if (image.caption) lines.push(`      <image:caption>${escapeXml(image.caption)}</image:caption>`);
    if (image.title) lines.push(`      <image:title>${escapeXml(image.title)}</image:title>`);
    lines.push('    </image:image>');
  }
  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemap(activitySlugs, blogPosts) {
  const blocks = [];
  for (const p of STATIC_PAGES) {
    blocks.push(
      urlBlock({
        loc: `${SITE}${p.path}`,
        priority: p.priority,
        changefreq: p.changefreq,
        hreflang: p.hreflang,
        image: p.image,
      })
    );
  }
  for (const slug of activitySlugs) {
    blocks.push(
      urlBlock({ loc: `${SITE}/activities/${slug}`, priority: '0.8', changefreq: 'monthly', hreflang: true })
    );
  }
  for (const post of blogPosts) {
    blocks.push(
      urlBlock({ loc: `${SITE}/blog/${post.slug}`, priority: '0.7', changefreq: 'monthly', hreflang: true, lastmod: post.publishedDate })
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Bansko Unlocked — XML Sitemap
  AUTO-GENERATED by scripts/generate-sitemap.mjs. Do not hand-edit; rerun the script.
  Static site (English only): static pages + activity pages + blog posts.
  Last generated: ${TODAY}
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${blocks.join('\n\n')}

</urlset>
`;
}

function buildPrerenderRoutes(activitySlugs, blogPosts) {
  const lines = [...STATIC_PRERENDER_ROUTES];
  for (const slug of activitySlugs) lines.push(`/activities/${slug}`);
  for (const post of blogPosts) lines.push(`/blog/${post.slug}`);
  return lines.join('\n') + '\n';
}

function collectUrls(activitySlugs, blogPosts) {
  const urls = STATIC_PAGES.map((p) => `${SITE}${p.path}`);
  for (const slug of activitySlugs) urls.push(`${SITE}/activities/${slug}`);
  for (const post of blogPosts) urls.push(`${SITE}/blog/${post.slug}`);
  return urls;
}

async function submitToIndexNow(urls) {
  if (process.env.INDEXNOW_SUBMIT !== '1' || !INDEXNOW_KEY) {
    console.log('[indexnow] Skipped (set INDEXNOW_SUBMIT=1 and configure a key to enable).');
    return;
  }
  const body = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };
  try {
    const r = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (r.ok || r.status === 202) {
      console.log(`[indexnow] Submitted ${urls.length} URL(s) — HTTP ${r.status}.`);
    } else {
      console.warn(`[indexnow] Unexpected response HTTP ${r.status}: ${await r.text().catch(() => '')}`);
    }
  } catch (err) {
    console.warn(`[indexnow] Submission failed: ${err.message}`);
  }
}

(async () => {
  const activitySlugs = readSlugs('src/app/data/activities.data.ts');
  const blogPosts = readBlogPosts();

  const sitemap = buildSitemap(activitySlugs, blogPosts);
  const routes = buildPrerenderRoutes(activitySlugs, blogPosts);

  writeFileSync(resolve(repoRoot, 'src/sitemap.xml'), sitemap, 'utf8');
  writeFileSync(resolve(repoRoot, 'prerender-routes.txt'), routes, 'utf8');

  console.log(
    `[sitemap] Generated src/sitemap.xml and prerender-routes.txt — ` +
      `${STATIC_PAGES.length} static + ${activitySlugs.length} activities + ${blogPosts.length} blog posts (${TODAY})`
  );

  await submitToIndexNow(collectUrls(activitySlugs, blogPosts));
})();
