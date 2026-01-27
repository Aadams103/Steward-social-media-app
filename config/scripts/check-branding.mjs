import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)), "..");
const LEGACY_TERMS = [/hostess/i];
// After rebrand to Steward: only allow files that document the legacy term or one-time migration
const ALLOWLIST = [
	"config/scripts/check-branding.mjs",
	".cursor/commands/rebrand-steward.md",
	".cursor/commands/brand-steward.md", // documents OLD_BRAND_TERMS for the rebrand procedure
	"src/store/app-store.ts", // one-time migration: hostess_active_brand_id → steward_active_brand_id
];

async function walk(dir, acc) {
	const entries = await readdir(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			if (["node_modules", "dist"].includes(entry.name)) continue;
			await walk(full, acc);
		} else if (/\.(ts|tsx|js|jsx|md|html|json|css)$/i.test(entry.name)) {
			acc.push(full);
		}
	}
}

async function main() {
	const files = [];
	await walk(ROOT, files);

	const offenders = [];

	for (const fullPath of files) {
		const file = fullPath.slice(ROOT.length + 1).replace(/\\/g, "/");
		if (ALLOWLIST.some((allowed) => file.endsWith(allowed))) continue;
		const contents = await readFile(resolve(ROOT, file), "utf8");
		for (const re of LEGACY_TERMS) {
			if (re.test(contents)) {
				offenders.push({ file, term: re.source });
				break;
			}
		}
	}

	if (offenders.length) {
		console.error("Legacy brand terms found:");
		for (const { file, term } of offenders) {
			console.error(`- ${file} (matches /${term}/)`);
		}
		process.exit(1);
	}

	console.log("✅ Branding check passed: no legacy terms found (outside allowlist).");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

