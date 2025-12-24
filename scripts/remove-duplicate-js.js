#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/server/dist/**",
  "**/.git/**",
];

function log(...s) {
  console.log(...s);
}

const jsFiles = glob.sync("**/*.js", {
  cwd: root,
  nodir: true,
  ignore: ignorePatterns,
});
const duplicates = [];

for (const rel of jsFiles) {
  const abs = path.join(root, rel);
  // skip files that are intended server bundles / compiled outputs by heuristic
  if (/\.min\.js$/.test(rel)) continue;
  const tsxPath = rel.replace(/\.js$/, ".tsx");
  const tsPath = rel.replace(/\.js$/, ".ts");
  const absTsx = path.join(root, tsxPath);
  const absTs = path.join(root, tsPath);
  if (fs.existsSync(absTsx) || fs.existsSync(absTs)) {
    duplicates.push(rel);
  }
}

const report = {
  scanned: jsFiles.length,
  duplicatesCount: duplicates.length,
  duplicates,
  applied: apply,
  timestamp: new Date().toISOString(),
};

const reportPath = path.join(
  root,
  "scripts",
  "remove-duplicate-js.report.json",
);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (duplicates.length === 0) {
  log("No duplicate .js files found. Report written to", reportPath);
  process.exit(0);
}

log(
  `Found ${duplicates.length} duplicate .js files (matching .ts/.tsx). Report: ${reportPath}`,
);
if (!apply) {
  log("Dry run (no files deleted). To delete, re-run with --apply");
  duplicates.slice(0, 50).forEach((f) => log("  ", f));
  if (duplicates.length > 50) log("  ...", duplicates.length - 50, "more");
  process.exit(0);
}

// Apply deletions
for (const rel of duplicates) {
  try {
    fs.unlinkSync(path.join(root, rel));
    log("Deleted", rel);
  } catch (err) {
    log("Failed to delete", rel, err.message);
  }
}

report.appliedAt = new Date().toISOString();
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
log("Deletion complete. Report updated at", reportPath);
