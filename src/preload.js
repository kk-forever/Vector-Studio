const { contextBridge, ipcRenderer } = require("electron");
const ImageTracer = require("imagetracerjs");

contextBridge.exposeInMainWorld("fileBridge", {
  openFile: (mode) => ipcRenderer.invoke("file:open", mode),
  selectOutputDirectory: () => ipcRenderer.invoke("file:select-output-directory"),
  saveFile: (payload) => ipcRenderer.invoke("file:save", payload)
});

contextBridge.exposeInMainWorld("exportBridge", {
  exportPdf: (payload) => ipcRenderer.invoke("export:pdf", payload)
});

contextBridge.exposeInMainWorld("vectorBridge", {
  imageDataToSvg: (imageData, options) => ImageTracer.imagedataToSVG(imageData, options)
});
