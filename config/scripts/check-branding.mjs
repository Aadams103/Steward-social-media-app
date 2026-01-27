import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)), "..");
const LEGACY_TERMS = [/hostess/i];
const ALLOWLIST = [
	"CHANGELOG.md",
	".cursor/commands/rebrand-steward.md",
	"config/scripts/check-branding.mjs",
	"src/config/brand.ts",
	"src/store/app-store.ts",
	"src/sdk/core/request.ts",
	"server/package-lock.json",
	"server/package.json",
	"server/README.md",
	"RAILWAY_READINESS.md",
	"deploy/README_DEPLOY.md",
	"deploy/README_RAILWAY.md",
	"deploy/verify.sh",
	"deploy/setup_vps.sh",
	"deploy/nginx-hostess.conf",
	"deploy/hostess-api.service",
	"GATE1_VERIFICATION.md",
	"config/scripts/startup.sh",
	"config/hooks/git_diff.sh",
	"APP_STATUS_REPORT.md",
	"COMPREHENSIVE_PLAN.md",
	"CURRENT_STATUS_AND_REMAINING_WORK.md",
	"DEVELOPMENT_PLAN.md",
	"DIAGNOSTIC_REPORT.md",
	"FULL_APP_REVIEW.md",
	"HOOTSUITE_COMPARISON.md",
	"IMPLEMENTATION_SUMMARY.md",
	"OAUTH_SETUP_GUIDE.md",
	"PROJECT_REVIEW_SUMMARY.md",
	"README_DEVELOPMENT.md",
	"SETUP_CHECKLIST.md",
	"TODAYS_PLAN.md",
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

