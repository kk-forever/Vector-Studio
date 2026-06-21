# Vector Studio

Vector Studio 是一个本地运行的 Electron 桌面工具，用于在 SVG、PNG、JPG 和 PDF 之间转换。它支持 SVG 转位图/PDF，也支持 PNG/JPG 以保真嵌入或矢量描摹的方式导出为 SVG/PDF。

## 功能特性

- `SVG -> PNG`：自定义宽高后导出 PNG。
- `SVG -> JPG`：自定义宽高、JPG 质量和背景色后导出 JPG。
- `SVG -> PDF`：通过 Electron 隐藏窗口导出 PDF。
- `PNG/JPG -> SVG/PDF`：默认使用保真嵌入，尽量保持原图颜色和文字外观。
- `PNG/JPG -> SVG/PDF`：可切换为矢量描摹，适合 Logo、图标、签名、线稿等高对比图片。
- 支持设置默认输出目录。
- 支持文件名模板，例如 `{name}-{mode}.{ext}`。
- 支持普通导出和 `另存为...` 两种保存方式。
- 支持 Windows 免安装版打包。

## 技术栈

- Electron
- 原生 HTML / CSS / JavaScript
- ImageTracerJS
- Electron Builder
- Node.js 内置测试框架

## 快速开始

### 环境要求

- Windows
- Node.js 20 或更高版本
- npm

### 安装依赖

```powershell
cd D:\jzk\Academy\change
npm.cmd install
```

### 启动开发版

```powershell
npm.cmd start
```

> `start` 脚本会自动清理 `ELECTRON_RUN_AS_NODE`，避免某些环境变量导致 Electron 被当作 Node.js 运行。

## 使用说明

### SVG 转 PNG/JPG/PDF

1. 打开程序后，选择左侧 `SVG 转 PNG/JPG/PDF`。
2. 点击 `选择 SVG`。
3. 调整宽度、高度、JPG 质量或 JPG 背景色。
4. 点击 `导出 PNG`、`导出 JPG` 或 `导出 PDF`。
5. 如需临时修改文件名或保存位置，点击对应的 `另存为...` 按钮。

### PNG/JPG 转 SVG/PDF

1. 选择左侧 `PNG/JPG 转 SVG/PDF`。
2. 点击 `选择 PNG/JPG`。
3. 默认使用 `保真嵌入`，适合照片、截图、带小字图片和渐变图。
4. 如果需要可编辑路径，可切换到 `矢量描摹`。
5. 在 `矢量描摹` 模式下，可以调整 `颜色数量` 和 `去噪强度`。
6. 点击 `导出 SVG` 或 `导出 PDF`。

## 输出设置

左侧 `输出设置` 可以控制默认保存位置和文件名。

- `输出目录`：点击 `选择` 后，普通 `导出` 按钮会直接保存到这个文件夹。
- `文件名模板`：默认是 `{name}-{mode}.{ext}`。
- `{name}`：原文件名，不含扩展名。
- `{mode}`：导出模式，例如 `export`、`vector`、`faithful`。
- `{ext}`：输出扩展名，例如 `png`、`jpg`、`svg`、`pdf`。
- `另存为...`：临时弹出系统保存窗口，不会改变默认输出目录。
- `重置默认`：清空输出目录，并把模板恢复为 `{name}-{mode}.{ext}`。

模板示例：

```text
{name}_converted.{ext}
{name}-{mode}-{ext}.{ext}
```

## 保真嵌入与矢量描摹的区别

| 模式 | 适合场景 | 优点 | 限制 |
|---|---|---|---|
| 保真嵌入 | 照片、截图、小字、渐变图 | 外观最接近原图 | SVG/PDF 内部仍包含位图 |
| 矢量描摹 | Logo、图标、签名、线稿、扁平插画 | 可生成 SVG 路径 | 复杂图像会出现色块化、变形或颜色偏差 |

## 开发命令

### 语法检查和测试

```powershell
npm.cmd run check
```

### 只运行语法检查

```powershell
npm.cmd run lint
```

### 只运行测试

```powershell
npm.cmd test
```

## 打包 Windows 免安装版

本项目配置的是 Windows 免安装版，不生成安装程序。

```powershell
cd D:\jzk\Academy\change
npm.cmd run dist:win
```

打包完成后会生成：

```text
dist\win-unpacked\Vector Studio.exe
```

发布给别人时，请压缩整个文件夹：

```text
dist\win-unpacked
```

对方解压后，双击 `Vector Studio.exe` 即可使用，不需要安装 Node.js 或 npm。

> 注意：不要只发送 `Vector Studio.exe` 单个文件。Electron 程序运行需要同目录下的 DLL、资源文件和运行时文件。

## 项目结构

```text
.
├── package.json
├── package-lock.json
├── README.md
├── PROJECT_FULL_DOCUMENTATION.md
├── samples
│   └── sample-logo.svg
├── scripts
│   └── lint.js
├── src
│   ├── main.js
│   ├── preload.js
│   ├── shared
│   │   └── conversion-utils.js
│   └── renderer
│       ├── index.html
│       ├── styles.css
│       └── app.js
└── tests
    └── conversion-utils.test.js
```

## 核心实现说明

- `src/main.js`：Electron 主进程，负责窗口创建、文件读取/保存、目录选择和 PDF 导出。
- `src/preload.js`：安全桥接层，暴露 `fileBridge`、`exportBridge` 和 `vectorBridge`。
- `src/renderer/app.js`：渲染层交互逻辑，负责预览、转换流程、导出设置和保存调用。
- `src/renderer/index.html`：应用界面结构。
- `src/renderer/styles.css`：应用界面样式。
- `src/shared/conversion-utils.js`：可测试的通用转换工具函数。
- `tests/conversion-utils.test.js`：单元测试。

## GitHub 上传建议

源码仓库不要提交以下内容：

- `node_modules/`
- `dist/`
- 打包生成的 zip 文件
- Electron 手动下载包

这些内容已经写入 `.gitignore`。

### 首次提交

```powershell
git add .
git commit -m "Initial Vector Studio app"
```

### 推送到 GitHub

在 GitHub 新建空仓库后，执行：

```powershell
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

如果已经添加过远程仓库，可以先查看：

```powershell
git remote -v
```

## 发布 Release

建议把可直接运行的版本放到 GitHub Release。

1. 运行 `npm.cmd run dist:win`。
2. 压缩 `dist\win-unpacked` 文件夹。
3. 打开 GitHub 仓库页面。
4. 进入 `Releases`。
5. 点击 `Draft a new release`。
6. 设置版本号，例如 `v1.0.0`。
7. 上传压缩包。
8. 发布 Release。

用户从 Release 下载 zip 后，解压即可运行。

## 详细文档

更完整的项目说明见：

```text
PROJECT_FULL_DOCUMENTATION.md
```

## License

当前项目尚未添加 License 文件。上传到 GitHub 前，如果希望别人可以明确知道如何使用、修改或分发代码，建议补充一个 License，例如 MIT License。
