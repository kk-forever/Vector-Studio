const { readFileSync, readdirSync } = require("node:fs");
const { join, extname, relative } = require("node:path");
const vm = require("node:vm");
const Module = require("node:module");

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

function checkSyntax(file) {
  const source = readFileSync(file, "utf8");
  const wrappedSource = Module.wrap(source);
  new vm.Script(wrappedSource, { filename: file });
}

const files = TARGETS.flatMap((target) => listJavaScriptFiles(join(ROOT, target)));
let failed = false;

for (const file of files) {
  try {
    checkSyntax(file);
  } catch (error) {
    failed = true;
    process.stderr.write(`${relative(ROOT, file)}\n${error.message}\n`);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`lint ok (${files.length} JavaScript files checked)`);
