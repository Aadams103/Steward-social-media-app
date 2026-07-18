import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const migrationDir = join(process.cwd(), "supabase", "migrations");
const files = (await readdir(migrationDir)).filter((file) => file.endsWith(".sql")).sort();
const errors = [];
const timestamps = new Map();

for (const file of files) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) {
    errors.push(`${file}: expected YYYYMMDDHHMMSS_snake_case.sql`);
    continue;
  }

  const timestamp = match[1];
  const prior = timestamps.get(timestamp);
  if (prior) errors.push(`${file}: duplicate migration timestamp also used by ${prior}`);
  timestamps.set(timestamp, file);

  const sql = await readFile(join(migrationDir, file), "utf8");
  if (/^(<{7}|={7}|>{7})/m.test(sql)) errors.push(`${file}: contains an unresolved merge marker`);
  if (/\b(service_role|sb_secret_)\b\s*[=:]\s*['"][^'"]+['"]/i.test(sql)) {
    errors.push(`${file}: appears to contain a credential`);
  }
}

if (files.length === 0) errors.push("No Supabase migrations found");

if (errors.length > 0) {
  console.error(`Migration validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(`Validated ${files.length} ordered Supabase migrations.`);
