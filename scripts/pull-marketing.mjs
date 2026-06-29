#!/usr/bin/env node
// Pulls Meta Ads insights + GA4 reporting for one calendar month into
// marketing-data/*.{csv,json} so the numbers can be reviewed offline (and by
// Claude). READ-ONLY reporting — it never touches the ad account or analytics
// config, only fetches.
//
// Run on demand (NOT wired into prebuild — Netlify build env must not hold the
// ads_read / analytics tokens):
//   npm run pull:marketing                 # last full calendar month
//   npm run pull:marketing -- --month=2026-05
//
// Like generate-sitemap.mjs, this exits 0 on any failure so it never blocks a
// shell pipeline. Missing tokens => that source is skipped with a [marketing]
// warning, the other source still runs.
//
// Required env (set in your local shell or CI, never committed):
//   META_ADS_ACCESS_TOKEN   system-user token with ads_read (Meta Business
//                           Settings → System Users → Generate token)
//   META_AD_ACCOUNT_ID      the numeric ad-account id, with or without 'act_'
//   GA4_PROPERTY_ID         numeric GA4 property id (Admin → Property Settings)
//   GA4_SA_CLIENT_EMAIL     service-account email (…@….iam.gserviceaccount.com)
//   GA4_SA_PRIVATE_KEY      the SA private key (PEM). \n escapes are accepted.
//                           Alternatively set GA4_SA_KEY_FILE to the JSON path.
// See marketing-data/README.md for how to mint each credential.

import { createSign } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const OUT_DIR = resolve(repoRoot, 'marketing-data');

const GRAPH_BASE = 'https://graph.facebook.com/v19.0'; // matches meta-capi.service.ts
const GA4_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ----- month / date helpers -------------------------------------------------

function parseMonthArg() {
  const arg = process.argv.find((a) => a.startsWith('--month='));
  if (arg) {
    const v = arg.slice('--month='.length);
    if (!/^\d{4}-\d{2}$/.test(v)) {
      console.warn(`[marketing] Ignoring malformed --month=${v} (want YYYY-MM); using last full month.`);
    } else {
      return v;
    }
  }
  // Default: last full calendar month (first day of this month, minus one day).
  const now = new Date();
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonth = new Date(firstOfThisMonth.getTime() - 24 * 3600 * 1000);
  return `${lastMonth.getUTCFullYear()}-${String(lastMonth.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const since = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month
  const until = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { since, until };
}

// ----- output helpers -------------------------------------------------------

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')).join('\n');
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

function writeOut(name, rows, columns) {
  mkdirSync(OUT_DIR, { recursive: true });
  const csvPath = resolve(OUT_DIR, `${name}.csv`);
  const jsonPath = resolve(OUT_DIR, `${name}.json`);
  writeFileSync(csvPath, toCsv(rows, columns), 'utf8');
  writeFileSync(jsonPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  console.log(`[marketing] Wrote ${rows.length} row(s) → marketing-data/${name}.csv + .json`);
}

// ----- Meta Ads -------------------------------------------------------------

// Meta returns conversions inside an `actions` array (one {action_type, value}
// per event type). Flatten the ones we care about onto the row so the CSV is
// scannable; keep the raw array in JSON via `actions_raw`.
const META_ACTION_TYPES = {
  lead: 'leads',
  onsite_conversion_messaging_conversation_started_7d: 'wa_conversations',
  link_click: 'link_clicks',
  landing_page_view: 'landing_page_views',
};

function flattenMetaRow(row) {
  const out = {
    campaign_name: row.campaign_name || '',
    adset_name: row.adset_name || '',
    ad_name: row.ad_name || '',
    country: row.country || '',
    publisher_platform: row.publisher_platform || '',
    spend: row.spend || '0',
    impressions: row.impressions || '0',
    clicks: row.clicks || '0',
    ctr: row.ctr || '0',
  };
  for (const key of Object.values(META_ACTION_TYPES)) out[key] = '0';
  for (const a of row.actions || []) {
    const col = META_ACTION_TYPES[a.action_type];
    if (col) out[col] = a.value;
  }
  out.actions_raw = JSON.stringify(row.actions || []);
  return out;
}

async function pullMeta({ since, until }) {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountRaw = process.env.META_AD_ACCOUNT_ID;
  if (!token || !accountRaw) {
    console.warn('[marketing] Skipping Meta Ads (set META_ADS_ACCESS_TOKEN + META_AD_ACCOUNT_ID).');
    return null;
  }
  const account = accountRaw.startsWith('act_') ? accountRaw : `act_${accountRaw}`;
  const params = new URLSearchParams({
    level: 'ad',
    fields: 'campaign_name,adset_name,ad_name,spend,impressions,clicks,ctr,actions,cost_per_action_type',
    breakdowns: 'country,publisher_platform',
    time_range: JSON.stringify({ since, until }),
    limit: '500',
    access_token: token,
  });
  let url = `${GRAPH_BASE}/${account}/insights?${params.toString()}`;
  const rows = [];
  try {
    while (url) {
      const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      const json = await r.json();
      if (!r.ok) {
        throw new Error(json?.error?.message || `HTTP ${r.status}`);
      }
      for (const row of json.data || []) rows.push(flattenMetaRow(row));
      url = json.paging?.next || null;
    }
  } catch (err) {
    console.warn(`[marketing] Meta Ads fetch failed: ${err.message}`);
    return null;
  }
  return rows;
}

// ----- GA4 ------------------------------------------------------------------

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function loadServiceAccount() {
  const keyFile = process.env.GA4_SA_KEY_FILE;
  if (keyFile) {
    try {
      const sa = JSON.parse(readFileSync(resolve(repoRoot, keyFile), 'utf8'));
      return { email: sa.client_email, privateKey: sa.private_key };
    } catch (err) {
      console.warn(`[marketing] Could not read GA4_SA_KEY_FILE: ${err.message}`);
      return null;
    }
  }
  const email = process.env.GA4_SA_CLIENT_EMAIL;
  const privateKey = (process.env.GA4_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !privateKey) return null;
  return { email, privateKey };
}

// Mint a Google OAuth access token from the service-account key using built-in
// crypto (RS256 JWT assertion → token endpoint). Avoids pulling in
// google-auth-library for a single read scope.
async function getGoogleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = base64url(signer.sign(sa.privateKey));
  const assertion = `${signingInput}.${signature}`;

  const r = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json?.error_description || json?.error || `HTTP ${r.status}`);
  return json.access_token;
}

async function pullGa4({ since, until }) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const sa = loadServiceAccount();
  if (!propertyId || !sa) {
    console.warn(
      '[marketing] Skipping GA4 (set GA4_PROPERTY_ID + GA4_SA_CLIENT_EMAIL/GA4_SA_PRIVATE_KEY or GA4_SA_KEY_FILE).'
    );
    return null;
  }
  let rows;
  try {
    const accessToken = await getGoogleAccessToken(sa);
    const r = await fetch(`${GA4_BASE}/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: since, endDate: until }],
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
          { name: 'sessionSourceMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'conversions' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10000,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json?.error?.message || `HTTP ${r.status}`);
    const dimHeaders = (json.dimensionHeaders || []).map((h) => h.name);
    const metHeaders = (json.metricHeaders || []).map((h) => h.name);
    rows = (json.rows || []).map((row) => {
      const obj = {};
      dimHeaders.forEach((name, i) => (obj[name] = row.dimensionValues[i].value));
      metHeaders.forEach((name, i) => (obj[name] = row.metricValues[i].value));
      return obj;
    });
  } catch (err) {
    console.warn(`[marketing] GA4 fetch failed: ${err.message}`);
    return null;
  }
  return rows;
}

// ----- main -----------------------------------------------------------------

(async () => {
  const month = parseMonthArg();
  const range = monthRange(month);
  console.log(`[marketing] Pulling ${month} (${range.since} → ${range.until})`);

  const [meta, ga4] = await Promise.all([pullMeta(range), pullGa4(range)]);

  if (meta) {
    writeOut(`meta-${month}`, meta, [
      'campaign_name',
      'adset_name',
      'ad_name',
      'country',
      'publisher_platform',
      'spend',
      'impressions',
      'clicks',
      'ctr',
      'leads',
      'wa_conversations',
      'link_clicks',
      'landing_page_views',
      'actions_raw',
    ]);
  }

  if (ga4) {
    writeOut(`ga4-${month}`, ga4, [
      'country',
      'deviceCategory',
      'sessionSourceMedium',
      'sessions',
      'engagementRate',
      'averageSessionDuration',
      'bounceRate',
      'conversions',
    ]);
  }

  if (!meta && !ga4) {
    console.warn('[marketing] Nothing pulled — both sources skipped or failed. See warnings above.');
  }
  // Always exit 0: reporting must never break a shell pipeline.
  process.exit(0);
})();
