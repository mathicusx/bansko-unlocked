#!/usr/bin/env node
// Audit untranslated UI strings across Angular templates and components.
//
// Reports:
//   1. Text nodes in *.component.html that contain English-looking content
//      and aren't bound through `{{ copy.* }}` / `{{ t(...) }}` interpolation.
//   2. User-facing HTML attributes (alt, title, placeholder, aria-label,
//      aria-describedby) with hardcoded string values.
//   3. *.component.ts files calling `seoService.updateMetaTags({ ... })` with
//      string literals for title / description / keywords instead of pulling
//      the slice from `t(locale).meta.*`.
//
// Run:
//   node scripts/audit-i18n.mjs
//   npm run i18n:audit
//
// Adding a new locale (fr, pl, ...) doesn't change this script — the audit
// reports any English literal still wired in a template or component. Once a
// string is moved to en.ts plus the new locale dictionary, it disappears from
// the next audit run.
//
// Heuristics, not perfect: it walks tags with a regex tokenizer, skips
// <mat-icon>/<script>/<style>/<code>/<pre> contents (icon ligature names and
// code aren't user-facing copy), strips {{ ... }} interpolations and Angular
// control-flow blocks (@if / @for / @defer / ...), and flags only strings
// with at least one 3-letter Latin word. Expect a handful of false positives
// in admin-only badges, brand names, and section labels written as constants.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const APP_DIR = resolve(repoRoot, 'src/app');

const TEMPLATE_ATTRS = ['alt', 'title', 'placeholder', 'aria-label', 'aria-describedby'];
const SKIP_TAGS = new Set(['script', 'style', 'mat-icon', 'code', 'pre']);

// Whole files we never localize: admin pages and the wildcard 404.
const SKIP_FILE_PATTERNS = [
  /\/admin-[\w-]+\//,
  /\/not-found\//,
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function shouldSkipFile(path) {
  const norm = path.replace(/\\/g, '/');
  return SKIP_FILE_PATTERNS.some(re => re.test(norm));
}

function lineOf(src, idx) {
  let line = 1;
  for (let k = 0; k < idx && k < src.length; k++) if (src[k] === '\n') line++;
  return line;
}

function looksLikeEnglish(s) {
  if (!s) return false;
  return /[A-Za-z]{3,}/.test(s);
}

function hasInterpolation(s) {
  return /\{\{[\s\S]*?\}\}/.test(s);
}

function auditTemplate(path) {
  const raw = readFileSync(path, 'utf8');
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
  const findings = [];
  const len = stripped.length;
  let i = 0;
  let skipDepth = 0;

  while (i < len) {
    if (stripped[i] === '<') {
      // Allow quoted attribute values to contain '>' (e.g. *ngIf="x > 0").
      const tagMatch = /^<\/?([\w-]+)((?:"[^"]*"|'[^']*'|[^>])*)>/.exec(stripped.slice(i));
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        const fullTag = tagMatch[0];
        const isClose = stripped[i + 1] === '/';
        const isSelfClose = fullTag.endsWith('/>');

        if (SKIP_TAGS.has(tagName)) {
          if (isClose) skipDepth = Math.max(0, skipDepth - 1);
          else if (!isSelfClose) skipDepth++;
        }

        if (!isClose && !skipDepth) {
          const attrText = tagMatch[2];
          for (const attr of TEMPLATE_ATTRS) {
            const re = new RegExp(`\\s${attr}=(?:"([^"]*)"|'([^']*)')`, 'i');
            const m = re.exec(attrText);
            if (m) {
              const val = m[1] ?? m[2] ?? '';
              if (looksLikeEnglish(val) && !hasInterpolation(val)) {
                findings.push({ line: lineOf(stripped, i), kind: `attr:${attr}`, text: val.trim() });
              }
            }
          }
        }

        i += fullTag.length;
        continue;
      }
    }

    // Text content up to the next tag
    let j = i;
    while (j < len && stripped[j] !== '<') j++;
    if (!skipDepth) {
      const text = stripped.slice(i, j);
      const cleaned = text
        .replace(/\{\{[\s\S]*?\}\}/g, '')
        .replace(/@(if|else|for|defer|switch|case|default|placeholder|loading|error|empty)\b[^{]*\{?/g, '')
        .replace(/[{}]/g, '')
        .trim();
      if (looksLikeEnglish(cleaned)) {
        findings.push({ line: lineOf(stripped, i), kind: 'text', text: cleaned.replace(/\s+/g, ' ') });
      }
    }
    i = j;
  }

  return findings;
}

function auditComponent(path) {
  const src = readFileSync(path, 'utf8');
  const issues = [];
  const re = /updateMetaTags\s*\(\s*\{([\s\S]*?)\}\s*\)/g;
  let m;
  while ((m = re.exec(src))) {
    const block = m[1];
    for (const field of ['title', 'description', 'keywords']) {
      const literal = new RegExp(`\\b${field}\\s*:\\s*['"\`]([^'"\`]{8,})['"\`]`).exec(block);
      if (literal) {
        issues.push({ field, value: literal[1].trim() });
      }
    }
  }
  return issues;
}

const allFiles = walk(APP_DIR);
const templates = allFiles
  .filter(f => f.endsWith('.component.html') && !shouldSkipFile(f))
  .sort();
const components = allFiles
  .filter(f => f.endsWith('.component.ts') && !shouldSkipFile(f))
  .sort();

const templateReport = [];
let templateTotal = 0;
for (const path of templates) {
  const findings = auditTemplate(path);
  if (findings.length) {
    templateReport.push({ file: relative(repoRoot, path).replace(/\\/g, '/'), findings });
    templateTotal += findings.length;
  }
}

const metaReport = [];
for (const path of components) {
  const issues = auditComponent(path);
  if (issues.length) {
    metaReport.push({ file: relative(repoRoot, path).replace(/\\/g, '/'), issues });
  }
}

const fileWord = n => `${n} file${n === 1 ? '' : 's'}`;
console.log('# i18n audit');
console.log(`Scanned ${templates.length} templates and ${components.length} components.`);
console.log(`Templates: ${templateTotal} hardcoded strings across ${fileWord(templateReport.length)}.`);
console.log(`Components: literal meta tags in ${fileWord(metaReport.length)}.`);
console.log('');

if (templateReport.length) {
  console.log('## Hardcoded template strings');
  for (const { file, findings } of templateReport) {
    console.log(`\n${file}  (${findings.length})`);
    for (const f of findings) {
      const preview = f.text.length > 120 ? `${f.text.slice(0, 117)}...` : f.text;
      console.log(`  L${f.line.toString().padStart(3, ' ')}  ${f.kind.padEnd(18)}  ${preview}`);
    }
  }
}

if (metaReport.length) {
  console.log('\n## Components with literal meta tags');
  console.log('(replace with `t(locale).meta.<page>.title` etc. — see home.component.ts for the pattern)');
  for (const { file, issues } of metaReport) {
    console.log(`\n${file}`);
    for (const it of issues) {
      const preview = it.value.length > 120 ? `${it.value.slice(0, 117)}...` : it.value;
      console.log(`  ${it.field.padEnd(12)}  ${preview}`);
    }
  }
}

if (!templateReport.length && !metaReport.length) {
  console.log('All templates and meta tags resolve through the i18n dictionary.');
}
