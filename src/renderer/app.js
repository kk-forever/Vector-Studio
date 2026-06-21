(function () {
  const $ = (selector) => document.querySelector(selector);
  const statusText = $("#statusText");
  const DEFAULT_OUTPUT_TEMPLATE = "{name}-{mode}.{ext}";
  const STORAGE_KEYS = {
    outputDirectory: "vectorStudio.outputDirectory",
    outputTemplate: "vectorStudio.outputTemplate"
  };

  const state = {
    svg: {
      name: "",
      text: "",
      dimensions: { width: 1024, height: 1024 }
    },
    raster: {
      name: "",
      dataUrl: "",
      image: null,
      outputSvg: "",
      dimensions: { width: 0, height: 0 }
    },
    output: {
      directory: "",
      template: DEFAULT_OUTPUT_TEMPLATE
    }
  };

  const els = {
    tabs: document.querySelectorAll(".tab-button"),
    panels: {
      svg: $("#svgPanel"),
      raster: $("#rasterPanel")
    },
    outputDirectoryInput: $("#outputDirectoryInput"),
    outputTemplateInput: $("#outputTemplateInput"),
    chooseOutputDirectoryButton: $("#chooseOutputDirectoryButton"),
    resetOutputSettingsButton: $("#resetOutputSettingsButton"),
    openSvgButton: $("#openSvgButton"),
    openRasterButton: $("#openRasterButton"),
    svgSourcePreview: $("#svgSourcePreview"),
    svgRasterCanvas: $("#svgRasterCanvas"),
    svgWidthInput: $("#svgWidthInput"),
    svgHeightInput: $("#svgHeightInput"),
    jpegQualityInput: $("#jpegQualityInput"),
    jpgBackgroundInput: $("#jpgBackgroundInput"),
    savePngButton: $("#savePngButton"),
    savePngAsButton: $("#savePngAsButton"),
    saveJpgButton: $("#saveJpgButton"),
    saveJpgAsButton: $("#saveJpgAsButton"),
    saveSvgPdfButton: $("#saveSvgPdfButton"),
    saveSvgPdfAsButton: $("#saveSvgPdfAsButton"),
    rasterSourceImage: $("#rasterSourceImage"),
    vectorPreview: $("#vectorPreview"),
    rasterModeFaithful: $("#rasterModeFaithful"),
    rasterModeTrace: $("#rasterModeTrace"),
    traceControls: $("#traceControls"),
    colorCountInput: $("#colorCountInput"),
    pathOmitInput: $("#pathOmitInput"),
    saveVectorSvgButton: $("#saveVectorSvgButton"),
    saveVectorSvgAsButton: $("#saveVectorSvgAsButton"),
    saveVectorPdfButton: $("#saveVectorPdfButton"),
    saveVectorPdfAsButton: $("#saveVectorPdfAsButton")
  };

  function setStatus(message) {
    statusText.textContent = message;
  }

  function setSvgActionsEnabled(enabled) {
    [
      els.savePngButton,
      els.savePngAsButton,
      els.saveJpgButton,
      els.saveJpgAsButton,
      els.saveSvgPdfButton,
      els.saveSvgPdfAsButton
    ].forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function setVectorActionsEnabled(enabled) {
    [
      els.saveVectorSvgButton,
      els.saveVectorSvgAsButton,
      els.saveVectorPdfButton,
      els.saveVectorPdfAsButton
    ].forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function initOutputSettings() {
    state.output.directory = localStorage.getItem(STORAGE_KEYS.outputDirectory) || "";
    state.output.template = localStorage.getItem(STORAGE_KEYS.outputTemplate) || DEFAULT_OUTPUT_TEMPLATE;
    renderOutputSettings();
  }

  function renderOutputSettings() {
    els.outputDirectoryInput.value = state.output.directory;
    els.outputTemplateInput.value = state.output.template;
  }

  function persistOutputSettings() {
    if (state.output.directory) {
      localStorage.setItem(STORAGE_KEYS.outputDirectory, state.output.directory);
    } else {
      localStorage.removeItem(STORAGE_KEYS.outputDirectory);
    }
    localStorage.setItem(STORAGE_KEYS.outputTemplate, state.output.template || DEFAULT_OUTPUT_TEMPLATE);
  }

  function sanitizeFileNamePart(value, fallback = "converted") {
    const cleaned = String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "");

    return cleaned || fallback;
  }

  function normalizeExtension(extension) {
    const normalized = String(extension || "").trim().toLowerCase().replace(/^\./, "");
    return normalized === "jpeg" ? "jpg" : normalized;
  }

  function baseNameWithoutExtension(fileName) {
    return String(fileName || "converted").replace(/\.[^.]+$/, "") || "converted";
  }

  function buildOutputFileName(sourceName, mode, extension) {
    const ext = normalizeExtension(extension);
    const safeName = sanitizeFileNamePart(baseNameWithoutExtension(sourceName));
    const safeMode = sanitizeFileNamePart(mode || "export", "export");
    const template = String(state.output.template || "").trim() || DEFAULT_OUTPUT_TEMPLATE;
    const rendered = template
      .replaceAll("{name}", safeName)
      .replaceAll("{mode}", safeMode)
      .replaceAll("{ext}", ext);
    const sanitized = sanitizeFileNamePart(rendered, `${safeName}-${safeMode}.${ext}`);

    return sanitized.toLowerCase().endsWith(`.${ext}`) ? sanitized : `${sanitized}.${ext}`;
  }

  function getNumber(input, fallback, min, max) {
    const parsed = Number(input.value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  function svgToDataUrl(svgText) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("图片解析失败，请确认文件未损坏。"));
      image.src = src;
    });
  }

  function getRasterizeOptions(format) {
    return {
      format,
      width: getNumber(els.svgWidthInput, state.svg.dimensions.width, 1, 16384),
      height: getNumber(els.svgHeightInput, state.svg.dimensions.height, 1, 16384),
      backgroundColor: els.jpgBackgroundInput.value || "#ffffff",
      jpegQuality: getNumber(els.jpegQualityInput, 0.92, 0.1, 1)
    };
  }

  async function renderSvgToCanvas(format = "png") {
    if (!state.svg.text) {
      throw new Error("请先选择 SVG 文件。");
    }

    const options = getRasterizeOptions(format);
    if (options.width * options.height > 48_000_000) {
      throw new Error("导出尺寸过大，请降低宽度或高度。");
    }

    const image = await loadImage(svgToDataUrl(state.svg.text));
    const canvas = els.svgRasterCanvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    canvas.width = options.width;
    canvas.height = options.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (format === "jpg") {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return { canvas, options };
  }

  async function refreshSvgPreview() {
    if (!state.svg.text) {
      return;
    }

    try {
      await renderSvgToCanvas("png");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openSvg() {
    const result = await window.fileBridge.openFile("svg");
    if (result.canceled) {
      return;
    }

    if (!result.content.trim().match(/<svg\b/i)) {
      throw new Error("这个文件不像有效的 SVG。");
    }

    state.svg.name = result.name;
    state.svg.text = result.content;
    state.svg.dimensions = result.dimensions || { width: 1024, height: 1024 };
    els.svgWidthInput.value = state.svg.dimensions.width;
    els.svgHeightInput.value = state.svg.dimensions.height;
    els.svgSourcePreview.innerHTML = state.svg.text;
    setSvgActionsEnabled(true);
    await refreshSvgPreview();
    setStatus(`已载入 ${result.name}`);
  }

  async function saveGeneratedFile({ sourceName, mode, extension, filters, kind, content, saveAs = false }) {
    const fileName = buildOutputFileName(sourceName, mode, extension);
    const payload = {
      defaultName: fileName,
      filters,
      kind,
      content
    };

    if (!saveAs && state.output.directory) {
      payload.directory = state.output.directory;
      payload.fileName = fileName;
    }

    if (saveAs && state.output.directory) {
      payload.defaultDirectory = state.output.directory;
    }

    const saved = await window.fileBridge.saveFile(payload);
    if (!saved.canceled) {
      setStatus(`已导出 ${saved.filePath}`);
    }
  }

  async function saveCanvas(format, saveAs = false) {
    const { canvas, options } = await renderSvgToCanvas(format);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const dataUrl = canvas.toDataURL(mime, options.jpegQuality);
    const extension = format === "jpg" ? "jpg" : "png";

    await saveGeneratedFile({
      sourceName: state.svg.name,
      mode: "export",
      extension,
      filters: [{ name: format === "jpg" ? "JPG 图片" : "PNG 图片", extensions: [extension] }],
      kind: "base64",
      content: dataUrl.split(",")[1],
      saveAs
    });
  }

  async function savePdfFromSvg(svgText, fileName, dimensions, suffix = "vector", saveAs = false) {
    const pdf = await window.exportBridge.exportPdf({
      markup: svgText,
      width: dimensions.width || 1024,
      height: dimensions.height || 1024
    });

    await saveGeneratedFile({
      sourceName: fileName,
      mode: suffix,
      extension: "pdf",
      filters: [{ name: "PDF 文件", extensions: ["pdf"] }],
      kind: "base64",
      content: pdf.content,
      saveAs
    });
  }

  async function openRaster() {
    const result = await window.fileBridge.openFile("raster");
    if (result.canceled) {
      return;
    }

    const image = await loadImage(result.content);
    if (image.naturalWidth * image.naturalHeight > 48_000_000) {
      throw new Error("图片尺寸过大，请先压缩后再导入。");
    }

    state.raster.name = result.name;
    state.raster.dataUrl = result.content;
    state.raster.image = image;
    state.raster.dimensions = {
      width: image.naturalWidth,
      height: image.naturalHeight
    };
    els.rasterSourceImage.src = result.content;
    await refreshRasterOutput();
    setStatus(`已载入 ${result.name}`);
  }

  function getRasterMode() {
    return els.rasterModeTrace.checked ? "trace" : "faithful";
  }

  function makeEmbeddedRasterSvg() {
    const { width, height } = state.raster.dimensions;
    return `<svg role="img" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${state.raster.dataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }

  async function refreshRasterOutput() {
    if (!state.raster.image) {
      return;
    }

    els.traceControls.classList.toggle("hidden", getRasterMode() !== "trace");

    if (getRasterMode() === "faithful") {
      state.raster.outputSvg = makeEmbeddedRasterSvg();
      els.vectorPreview.innerHTML = state.raster.outputSvg;
      setVectorActionsEnabled(true);
      setStatus("保真预览已更新，导出会保持原图颜色和文字外观。");
      return;
    }

    await vectorizeRaster();
  }

  function getVectorizeOptions() {
    return {
      colorCount: getNumber(els.colorCountInput, 24, 2, 64),
      pathOmit: getNumber(els.pathOmitInput, 6, 0, 128)
    };
  }

  function getColorImageData(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  async function vectorizeRaster() {
    if (!state.raster.image) {
      return;
    }

    setStatus("正在生成矢量预览...");
    const options = getVectorizeOptions();
    const imageData = getColorImageData(state.raster.image);
    const tracerOptions = {
      ltres: 1,
      qtres: 1,
      pathomit: options.pathOmit,
      numberofcolors: options.colorCount,
      colorsampling: 2,
      colorquantcycles: 3,
      scale: 1,
      strokewidth: 0,
      blurradius: 0
    };

    const svg = await window.vectorBridge.imageDataToSvg(
      {
        width: imageData.width,
        height: imageData.height,
        data: Array.from(imageData.data)
      },
      tracerOptions
    );

    state.raster.outputSvg = tidyVectorSvg(svg);
    els.vectorPreview.innerHTML = state.raster.outputSvg;
    setVectorActionsEnabled(true);
    setStatus("矢量预览已更新。");
  }

  function tidyVectorSvg(svgText) {
    return String(svgText).replace(/<svg /, '<svg role="img" ');
  }

  async function saveVectorSvg(saveAs = false) {
    if (!state.raster.outputSvg) {
      throw new Error("请先生成输出预览。");
    }

    await saveGeneratedFile({
      sourceName: state.raster.name,
      mode: getRasterMode() === "trace" ? "vector" : "faithful",
      extension: "svg",
      filters: [{ name: "SVG 矢量图", extensions: ["svg"] }],
      kind: "text",
      content: state.raster.outputSvg,
      saveAs
    });
  }

  async function chooseOutputDirectory() {
    const result = await window.fileBridge.selectOutputDirectory();
    if (result.canceled) {
      return;
    }

    state.output.directory = result.directory;
    persistOutputSettings();
    renderOutputSettings();
    setStatus(`输出目录已设置为 ${result.directory}`);
  }

  function resetOutputSettings() {
    state.output.directory = "";
    state.output.template = DEFAULT_OUTPUT_TEMPLATE;
    persistOutputSettings();
    renderOutputSettings();
    setStatus("输出设置已重置。未选择输出目录时会弹出另存为窗口。");
  }

  function bindEvents() {
    initOutputSettings();

    els.tabs.forEach((button) => {
      button.addEventListener("click", () => {
        els.tabs.forEach((tab) => tab.classList.remove("active"));
        button.classList.add("active");
        Object.values(els.panels).forEach((panel) => panel.classList.remove("active"));
        els.panels[button.dataset.tab].classList.add("active");
      });
    });

    els.chooseOutputDirectoryButton.addEventListener("click", () => guard(chooseOutputDirectory));
    els.resetOutputSettingsButton.addEventListener("click", resetOutputSettings);
    els.outputTemplateInput.addEventListener("input", () => {
      state.output.template = els.outputTemplateInput.value || DEFAULT_OUTPUT_TEMPLATE;
      persistOutputSettings();
    });

    els.openSvgButton.addEventListener("click", () => guard(openSvg));
    els.openRasterButton.addEventListener("click", () => guard(openRaster));
    els.savePngButton.addEventListener("click", () => guard(() => saveCanvas("png")));
    els.savePngAsButton.addEventListener("click", () => guard(() => saveCanvas("png", true)));
    els.saveJpgButton.addEventListener("click", () => guard(() => saveCanvas("jpg")));
    els.saveJpgAsButton.addEventListener("click", () => guard(() => saveCanvas("jpg", true)));
    els.saveSvgPdfButton.addEventListener("click", () => guard(() => savePdfFromSvg(
      state.svg.text,
      state.svg.name,
      {
        width: getNumber(els.svgWidthInput, state.svg.dimensions.width, 1, 16384),
        height: getNumber(els.svgHeightInput, state.svg.dimensions.height, 1, 16384)
      },
      "vector"
    )));
    els.saveSvgPdfAsButton.addEventListener("click", () => guard(() => savePdfFromSvg(
      state.svg.text,
      state.svg.name,
      {
        width: getNumber(els.svgWidthInput, state.svg.dimensions.width, 1, 16384),
        height: getNumber(els.svgHeightInput, state.svg.dimensions.height, 1, 16384)
      },
      "vector",
      true
    )));
    els.saveVectorSvgButton.addEventListener("click", () => guard(() => saveVectorSvg()));
    els.saveVectorSvgAsButton.addEventListener("click", () => guard(() => saveVectorSvg(true)));
    els.saveVectorPdfButton.addEventListener("click", () => guard(() => savePdfFromSvg(
      state.raster.outputSvg,
      state.raster.name,
      state.raster.dimensions,
      getRasterMode() === "trace" ? "vector" : "faithful"
    )));
    els.saveVectorPdfAsButton.addEventListener("click", () => guard(() => savePdfFromSvg(
      state.raster.outputSvg,
      state.raster.name,
      state.raster.dimensions,
      getRasterMode() === "trace" ? "vector" : "faithful",
      true
    )));

    [els.svgWidthInput, els.svgHeightInput, els.jpegQualityInput, els.jpgBackgroundInput].forEach((input) => {
      input.addEventListener("input", () => guard(refreshSvgPreview));
    });

    [els.rasterModeFaithful, els.rasterModeTrace].forEach((input) => {
      input.addEventListener("change", () => guard(refreshRasterOutput));
    });

    [els.colorCountInput, els.pathOmitInput].forEach((input) => {
      input.addEventListener("input", debounce(() => guard(refreshRasterOutput), 180));
    });
  }

  function debounce(fn, delay) {
    let timer = 0;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  async function guard(fn) {
    try {
      await fn();
    } catch (error) {
      setStatus(error.message || "操作失败。");
    }
  }

  bindEvents();
})();
