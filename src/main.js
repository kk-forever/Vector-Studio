const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { makePdfHtml, parseSvgDimensions } = require("./shared/conversion-utils");

const MIME_BY_EXTENSION = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg"
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#f4f0e8",
    title: "Vector Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

function getOpenFilters(mode) {
  if (mode === "svg") {
    return [{ name: "SVG 矢量图", extensions: ["svg"] }];
  }

  return [{ name: "PNG/JPG 位图", extensions: ["png", "jpg", "jpeg"] }];
}

ipcMain.handle("file:open", async (_event, mode) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择图片",
    properties: ["openFile"],
    filters: getOpenFilters(mode)
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const extension = path.extname(filePath).slice(1).toLowerCase();
  const name = path.basename(filePath);

  if (extension === "svg") {
    const text = await fs.readFile(filePath, "utf8");
    return {
      canceled: false,
      filePath,
      name,
      extension,
      kind: "text",
      content: text,
      dimensions: parseSvgDimensions(text)
    };
  }

  const buffer = await fs.readFile(filePath);
  const mime = MIME_BY_EXTENSION[extension] || "application/octet-stream";
  return {
    canceled: false,
    filePath,
    name,
    extension,
    kind: "dataUrl",
    content: `data:${mime};base64,${buffer.toString("base64")}`
  };
});

ipcMain.handle("file:select-output-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择输出目录",
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  return { canceled: false, directory: result.filePaths[0] };
});

ipcMain.handle("file:save", async (_event, payload) => {
  const filters = Array.isArray(payload?.filters) ? payload.filters : [];
  const content = payload?.content || "";
  const kind = payload?.kind || "text";
  const data = kind === "base64" ? Buffer.from(content, "base64") : String(content);

  if (payload?.filePath || (payload?.directory && payload?.fileName)) {
    const targetPath = payload.filePath || path.join(payload.directory, path.basename(payload.fileName));
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, data);
    return { canceled: false, filePath: targetPath };
  }

  const defaultName = payload?.defaultName || "converted";
  const defaultPath = payload?.defaultDirectory
    ? path.join(payload.defaultDirectory, path.basename(defaultName))
    : defaultName;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "保存结果",
    defaultPath,
    filters
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, data);

  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle("export:pdf", async (_event, payload) => {
  const width = Number(payload?.width) || 1024;
  const height = Number(payload?.height) || 1024;
  const markup = String(payload?.markup || "");

  if (!markup.trim()) {
    throw new Error("没有可导出的矢量内容。");
  }

  const exportWindow = new BrowserWindow({
    width: Math.min(4096, Math.max(200, Math.round(width))),
    height: Math.min(4096, Math.max(200, Math.round(height))),
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  try {
    const html = makePdfHtml(markup, width, height);
    await exportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const buffer = await exportWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: "none" }
    });

    return {
      kind: "base64",
      content: buffer.toString("base64")
    };
  } finally {
    if (!exportWindow.isDestroyed()) {
      exportWindow.destroy();
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

