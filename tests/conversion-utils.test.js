const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildOutputFileName,
  fitDimensions,
  makeOutputName,
  makePdfHtml,
  normalizeRasterizeOptions,
  normalizeVectorizeOptions,
  parseSvgDimensions,
  scaleToHeight,
  scaleToWidth,
  withExtension
} = require("../src/shared/conversion-utils");

test("builds output names predictably", () => {
  assert.equal(makeOutputName("logo.source.svg", "vector", "pdf"), "logo.source-vector.pdf");
  assert.equal(withExtension("scan.jpeg", "svg"), "scan.svg");
});

test("builds output file names from templates", () => {
  assert.equal(
    buildOutputFileName({
      sourceName: "logo.svg",
      mode: "export",
      extension: "png",
      template: "{name}-{mode}.{ext}"
    }),
    "logo-export.png"
  );
  assert.equal(
    buildOutputFileName({
      sourceName: "中文 文件.png",
      mode: "faithful",
      extension: "pdf",
      template: "{name}_converted.{ext}"
    }),
    "中文 文件_converted.pdf"
  );
  assert.equal(
    buildOutputFileName({
      sourceName: "bad:name?.jpg",
      mode: "vector",
      extension: "svg",
      template: "{name}-{mode}"
    }),
    "bad_name_-vector.svg"
  );
});

test("normalizes raster export options", () => {
  assert.deepEqual(
    normalizeRasterizeOptions(
      { format: "jpeg", width: "500", height: "250", jpegQuality: "2" },
      { width: 1000, height: 500 }
    ),
    {
      format: "jpg",
      width: 500,
      height: 250,
      backgroundColor: "#ffffff",
      jpegQuality: 1
    }
  );
});

test("normalizes vectorize options", () => {
  assert.deepEqual(normalizeVectorizeOptions({ colorCount: 99, pathOmit: 200 }), {
    colorCount: 64,
    pathOmit: 128
  });
});

test("parses svg dimensions from width and height", () => {
  const dimensions = parseSvgDimensions('<svg width="320px" height="180" viewBox="0 0 1 1"></svg>');
  assert.deepEqual(dimensions, { width: 320, height: 180 });
});

test("falls back to viewBox dimensions", () => {
  const dimensions = parseSvgDimensions('<svg viewBox="0 0 640 360"></svg>');
  assert.deepEqual(dimensions, { width: 640, height: 360 });
});

test("scales while preserving aspect ratio", () => {
  assert.deepEqual(scaleToWidth(800, 400, 200), { width: 200, height: 100 });
  assert.deepEqual(scaleToHeight(800, 400, 100), { width: 200, height: 100 });
});

test("rejects excessive canvas sizes", () => {
  assert.throws(() => fitDimensions(20_000, 20_000, 20_000, 20_000), /尺寸过大/);
});

test("generates pdf html with page sizing", () => {
  const html = makePdfHtml("<svg></svg>", 320, 180);
  assert.match(html, /@page \{ size: 320px 180px; margin: 0; \}/);
  assert.match(html, /<body><svg><\/svg><\/body>/);
});
