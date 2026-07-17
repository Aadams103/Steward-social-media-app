import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.endsWith("package-lock.json"));

const rules = [
  ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{16,}\b/],
  ["Stripe live secret", /\bsk_live_[A-Za-z0-9]{16,}\b/],
  ["Meta app secret literal", /\bMETA_APP_SECRET\s*=\s*["'][A-Za-z0-9_-]{16,}["']/],
];

const allowlisted = new Set([".env.example", "server/.env.example"]);
const findings = [];

for (const file of files) {
  if (allowlisted.has(file)) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [label, pattern] of rules) {
    if (pattern.test(content)) findings.push(`${file}: ${label}`);
  }
}

if (findings.length > 0) {
  console.error(`Potential committed secrets found:\n${findings.map((finding) => `- ${finding}`).join("\n")}`);
  process.exit(1);
}

console.log(`Scanned ${files.length} tracked files for high-confidence credential patterns.`);
