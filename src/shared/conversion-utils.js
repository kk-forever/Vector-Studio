const path = require("node:path");

const MAX_CANVAS_PIXELS = 48_000_000;
const RASTER_FORMATS = new Set(["png", "jpg", "jpeg"]);
const DEFAULT_OUTPUT_TEMPLATE = "{name}-{mode}.{ext}";

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function normalizeExtension(ext) {
  const normalized = String(ext || "").trim().toLowerCase().replace(/^\./, "");
  return normalized === "jpeg" ? "jpg" : normalized;
}

function baseNameWithoutExtension(fileName, fallback = "converted") {
  const parsed = path.parse(String(fileName || fallback));
  return parsed.name || fallback;
}

function withExtension(fileName, extension) {
  const cleanExtension = normalizeExtension(extension);
  const baseName = baseNameWithoutExtension(fileName);
  return `${baseName}.${cleanExtension}`;
}

function makeOutputName(fileName, suffix, extension) {
  const baseName = baseNameWithoutExtension(fileName);
  const cleanSuffix = suffix ? `-${suffix}` : "";
  return `${baseName}${cleanSuffix}.${normalizeExtension(extension)}`;
}

function sanitizeFileNamePart(value, fallback = "converted") {
  const cleaned = String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  return cleaned || fallback;
}

function buildOutputFileName({ sourceName, mode, extension, template } = {}) {
  const ext = normalizeExtension(extension || "svg");
  const safeName = sanitizeFileNamePart(baseNameWithoutExtension(sourceName, "converted"));
  const safeMode = sanitizeFileNamePart(mode || "export", "export");
  const activeTemplate = String(template || "").trim() || DEFAULT_OUTPUT_TEMPLATE;
  const rendered = activeTemplate
    .replaceAll("{name}", safeName)
    .replaceAll("{mode}", safeMode)
    .replaceAll("{ext}", ext);
  const sanitized = sanitizeFileNamePart(rendered, `${safeName}-${safeMode}.${ext}`);

  return sanitized.toLowerCase().endsWith(`.${ext}`) ? sanitized : `${sanitized}.${ext}`;
}

function isSupportedRasterExtension(extension) {
  return RASTER_FORMATS.has(normalizeExtension(extension));
}

function fitDimensions(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const width = clampNumber(targetWidth, 1, 16_384, sourceWidth);
  const height = clampNumber(targetHeight, 1, 16_384, sourceHeight);

  if (width * height > MAX_CANVAS_PIXELS) {
    throw new Error("图片尺寸过大，请降低导出宽度或高度后再试。");
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

function scaleToWidth(sourceWidth, sourceHeight, targetWidth) {
  const width = clampNumber(targetWidth, 1, 16_384, sourceWidth);
  const ratio = width / sourceWidth;
  return fitDimensions(width, sourceHeight * ratio, width, sourceHeight * ratio);
}

function scaleToHeight(sourceWidth, sourceHeight, targetHeight) {
  const height = clampNumber(targetHeight, 1, 16_384, sourceHeight);
  const ratio = height / sourceHeight;
  return fitDimensions(sourceWidth * ratio, height, sourceWidth * ratio, height);
}

function normalizeRasterizeOptions(input = {}, source = {}) {
  const sourceWidth = clampNumber(source.width, 1, 16_384, 1024);
  const sourceHeight = clampNumber(source.height, 1, 16_384, 1024);
  const dimensions = fitDimensions(sourceWidth, sourceHeight, input.width, input.height);
  const format = normalizeExtension(input.format || "png");

  return {
    format: format === "jpg" ? "jpg" : "png",
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: input.backgroundColor || "#ffffff",
    jpegQuality: clampNumber(input.jpegQuality, 0.1, 1, 0.92)
  };
}

function normalizeVectorizeOptions(input = {}) {
  return {
    colorCount: clampNumber(input.colorCount, 2, 64, 24),
    pathOmit: clampNumber(input.pathOmit, 0, 128, 8)
  };
}

function parseSvgDimensions(svgText) {
  const text = String(svgText || "");
  const svgTag = text.match(/<svg\b[^>]*>/i)?.[0] || "";
  const width = parseSvgLength(svgTag.match(/\bwidth=["']([^"']+)["']/i)?.[1]);
  const height = parseSvgLength(svgTag.match(/\bheight=["']([^"']+)["']/i)?.[1]);
  const viewBox = svgTag.match(/\bviewBox=["']([^"']+)["']/i)?.[1];

  if (width && height) {
    return { width, height };
  }

  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number).filter(Number.isFinite);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return {
        width: Math.round(parts[2]),
        height: Math.round(parts[3])
      };
    }
  }

  return { width: 1024, height: 1024 };
}

function parseSvgLength(value) {
  if (!value) {
    return null;
  }
  const match = String(value).trim().match(/^([0-9.]+)/);
  const parsed = match ? Number(match[1]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function makePdfHtml(markup, width, height) {
  const safeWidth = clampNumber(width, 1, 16_384, 1024);
  const safeHeight = clampNumber(height, 1, 16_384, 1024);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${safeWidth}px ${safeHeight}px; margin: 0; }
    html, body { width: ${safeWidth}px; height: ${safeHeight}px; margin: 0; background: transparent; overflow: hidden; }
    body { display: grid; place-items: center; }
    svg { width: ${safeWidth}px; height: ${safeHeight}px; display: block; }
  </style>
</head>
<body>${markup}</body>
</html>`;
}

module.exports = {
  DEFAULT_OUTPUT_TEMPLATE,
  MAX_CANVAS_PIXELS,
  baseNameWithoutExtension,
  buildOutputFileName,
  clampNumber,
  fitDimensions,
  isSupportedRasterExtension,
  makeOutputName,
  makePdfHtml,
  normalizeExtension,
  normalizeRasterizeOptions,
  normalizeVectorizeOptions,
  parseSvgDimensions,
  scaleToHeight,
  scaleToWidth,
  withExtension
};
