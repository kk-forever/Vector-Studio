const { readdirSync } = require("node:fs");
const { join, extname } = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = join(__dirname, "..");
const TARGETS = ["src", "tests", "scripts"];
const JS_EXTENSIONS = new Set([".js", ".cjs", ".mjs"]);

function listJavaScriptFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listJavaScriptFiles(fullPath);
    }
    return JS_EXTENSIONS.has(extname(entry.name)) ? [fullPath] : [];
  });
}

const files = TARGETS.flatMap((target) => listJavaScriptFiles(join(ROOT, target)));
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`lint ok (${files.length} JavaScript files checked)`);
