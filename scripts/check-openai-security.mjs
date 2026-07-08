#!/usr/bin/env node
/**
 * Static security check: OpenAI must only be referenced in approved server paths.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const allowedRoots = [
  path.join(repoRoot, 'server', 'src', 'ai'),
  path.join(repoRoot, 'server', 'src', 'routes', 'ai.ts'),
  path.join(repoRoot, 'server', 'src', 'services', 'ai-jobs-db.ts'),
  path.join(repoRoot, 'server', '.env.example'),
  path.join(repoRoot, 'docs'),
];

const forbiddenClientPatterns = [
  /from\s+['"]openai['"]/,
  /OPENAI_API_KEY/,
  /NEXT_PUBLIC_OPENAI/,
];

const scanDirs = [
  path.join(repoRoot, 'src'),
  path.join(repoRoot, 'server', 'src'),
];

let failed = false;

function isAllowed(filePath) {
  return allowedRoots.some((root) => filePath.startsWith(root));
}

function scanFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
  if (filePath.includes('node_modules') || filePath.includes('dist')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (/NEXT_PUBLIC_OPENAI/.test(content)) {
    console.error(`FAIL: NEXT_PUBLIC_OPENAI found in ${filePath}`);
    failed = true;
  }
  if (/from\s+['"]openai['"]/.test(content) && !isAllowed(filePath)) {
    console.error(`FAIL: OpenAI client import outside approved server AI layer: ${filePath}`);
    failed = true;
  }
  if (/OPENAI_API_KEY/.test(content) && filePath.includes(`${path.sep}src${path.sep}`) && filePath.includes(`${path.sep}repo${path.sep}src${path.sep}`)) {
    console.error(`FAIL: OPENAI_API_KEY referenced in frontend path: ${filePath}`);
    failed = true;
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else scanFile(full);
  }
}

for (const dir of scanDirs) {
  if (fs.existsSync(dir)) walk(dir);
}

if (failed) process.exit(1);
console.log('OpenAI security static check passed.');
