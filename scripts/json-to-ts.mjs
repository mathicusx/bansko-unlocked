#!/usr/bin/env node
// Convert JSON-style i18n snippets to TS object-literal syntax.
//
// Usage:
//   node scripts/json-to-ts.mjs <file>      # rewrites file in place
//   node scripts/json-to-ts.mjs < input     # reads stdin, writes stdout
//   echo '...' | node scripts/json-to-ts.mjs
//
// Transforms:
//   "key": "value"   ->   key: 'value'
// Keys that aren't valid JS identifiers (e.g. "kebab-case") are left quoted.
// Strings containing a ' switch to "..." so we don't need to escape.

import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
const input = path ? readFileSync(path, 'utf8') : readFileSync(0, 'utf8');

function escapeSingle(s) {
  let out = '';
  for (const ch of s) {
    if (ch === '\\') out += '\\\\';
    else if (ch === "'") out += "\\'";
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else out += ch;
  }
  return out;
}

function escapeDouble(s) {
  let out = '';
  for (const ch of s) {
    if (ch === '\\') out += '\\\\';
    else if (ch === '"') out += '\\"';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else out += ch;
  }
  return out;
}

function transform(text) {
  // 1) Unquote object keys that are valid JS identifiers: "key": -> key:
  text = text.replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)"(\s*:)/g,
    '$1$2',
  );

  // 2) Convert remaining JSON double-quoted strings to TS string literals.
  text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (_m, body) => {
    let decoded;
    try {
      decoded = JSON.parse('"' + body + '"');
    } catch {
      return _m; // leave untouched if it's not a valid JSON string body
    }
    if (decoded.includes("'") && !decoded.includes('"')) {
      return `"${escapeDouble(decoded)}"`;
    }
    return `'${escapeSingle(decoded)}'`;
  });

  return text;
}

const out = transform(input);
if (path) {
  writeFileSync(path, out);
  process.stderr.write(`Transformed ${path}\n`);
} else {
  process.stdout.write(out);
}
