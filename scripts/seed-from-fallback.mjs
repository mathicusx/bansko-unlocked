// Seed the local Postgres `tours` table from src/app/data/fallback-tours.ts
// — for local testing only (e.g. so the checkout flow has real tour pages to
// click into). Idempotent: clears all rows first, then inserts the fallback
// set. Reads the .ts file as text and evaluates the array literal directly,
// which works because fallback-tours.ts contains no TS-only syntax in its
// data (no `as const`, no enum values, etc.).
//
// Run with:  node scripts/seed-from-fallback.mjs
// Defaults to the local docker-compose Postgres (host port 55432). Override
// with DATABASE_URL=... node scripts/seed-from-fallback.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
// pg lives in server/node_modules — borrow it via require resolution.
const require = createRequire(join(root, 'server', 'package.json'));
const { Client } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:55432/enduro';

function extractArray(source, name) {
  const re = new RegExp(
    `export\\s+const\\s+${name}\\s*:[^=]*=\\s*(\\[[\\s\\S]*?\\n\\]);`,
  );
  const m = source.match(re);
  if (!m) throw new Error(`Could not locate ${name} in fallback-tours.ts`);
  // The data is plain JS object literal syntax — safe to eval here because
  // the file is checked into our own repo. The (`(${...})`) wrap turns the
  // bare literal into an expression.
  return new Function(`return (${m[1]});`)();
}

const txt = readFileSync(
  join(root, 'src', 'app', 'data', 'fallback-tours.ts'),
  'utf8',
);
const enduroTours = extractArray(txt, 'FALLBACK_ENDURO_TOURS').map((t) => ({
  ...t,
  type: 'enduro',
}));
const buggyTours = extractArray(txt, 'FALLBACK_BUGGY_TOURS').map((t) => ({
  ...t,
  type: 'buggy',
}));
const tours = [...enduroTours, ...buggyTours];

console.log(
  `Seeding ${tours.length} tours (${enduroTours.length} enduro + ${buggyTours.length} buggy) → ${DATABASE_URL.replace(/:[^@/]+@/, ':***@')}`,
);

const client = new Client({ connectionString: DATABASE_URL });

await client.connect();
try {
  await client.query('TRUNCATE TABLE tours RESTART IDENTITY CASCADE');

  for (const t of tours) {
    // Let Postgres generate the UUID; we keep the slug from the fallback so
    // URLs match production. `published` forced to true so the public
    // endpoint returns them.
    await client.query(
      `INSERT INTO tours
        (slug, title, description, type, "priceEur", "priceGbp",
         "promoPriceEur", "promoPriceGbp", "promoEndDate",
         "promoBookingPeriod", promo, image, duration, "durationDetails",
         "averageDistance", difficulty, "tourDetails", published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        t.slug,
        t.title,
        t.description ?? '',
        t.type,
        t.priceEur,
        t.priceGbp,
        t.promoPriceEur ?? null,
        t.promoPriceGbp ?? null,
        t.promoEndDate ?? null,
        t.promoBookingPeriod ?? null,
        t.promo ?? null,
        t.image,
        t.duration,
        t.durationDetails,
        t.averageDistance,
        // tours.difficulty is simple-array (comma-joined text). pg will accept
        // the JS array as-is for that — TypeORM's simple-array stores
        // comma-joined, but the column is plain text, so join here.
        (t.difficulty ?? []).join(','),
        // tourDetails is jsonb on the entity.
        JSON.stringify(t.tourDetails ?? []),
        true,
      ],
    );
  }

  const { rows } = await client.query(
    'SELECT type, count(*) FROM tours GROUP BY type ORDER BY type',
  );
  console.log('Inserted:');
  for (const r of rows) console.log(`  ${r.type}: ${r.count}`);
} finally {
  await client.end();
}
