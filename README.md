# Vector Studio

Vector Studio 是一个本地图像格式转换工具，主要用来处理 SVG、PNG、JPG 和 PDF 之间的转换。做这个项目的想法比较直接：平时有些图片需要转成 PDF，有些 SVG 又需要导出成普通图片，所以我做了一个可以在本地运行的小工具。

这个项目不是为了替代专业设计软件，而是把一些常见的转换操作集中到一个简单的桌面程序里。它可以把 SVG 导出成 PNG、JPG、PDF，也可以把 PNG/JPG 导出成 SVG 或 PDF。

## 主要功能

- `SVG -> PNG`：可以设置导出的宽度和高度。
- `SVG -> JPG`：可以设置尺寸、背景色和 JPG 质量。
- `SVG -> PDF`：把 SVG 渲染后导出成单页 PDF。
- `PNG/JPG -> SVG/PDF`：默认尽量保留原图颜色和文字效果。
- `PNG/JPG -> SVG/PDF`：也可以使用矢量描摹，适合 Logo、签名、图标、线稿这类图片。
- 可以设置默认输出目录和文件名模板。
- 可以直接导出，也可以用 `另存为...` 临时选择保存位置。
- 可以打包成 Windows 免安装版，解压后就能运行。

## 用到的技术

- `Electron`：用来做桌面应用窗口，以及处理文件读取、保存和 PDF 导出。
- `HTML / CSS / JavaScript`：负责界面和交互逻辑。
- `Canvas`：用于把 SVG 渲染成 PNG/JPG。
- `ImageTracerJS`：用于把 PNG/JPG 描摹成 SVG 路径。
- `Electron Builder`：用于打包 Windows 免安装版。
- `Node.js Test Runner`：用于做基础测试。

## 快速开始

### 环境要求

- Windows
- Node.js 20 或更高版本
- npm

### 安装依赖

```powershell
git clone https://github.com/<你的用户名>/vector-raster-converter.git
cd vector-raster-converter
npm.cmd install
```

### 启动项目

```powershell
npm.cmd start
```

如果启动时报 Electron 安装不完整，可以重新执行：

```powershell
npm.cmd install
```

## 使用方法

### SVG 转 PNG/JPG/PDF

1. 打开程序，进入 `SVG 转 PNG/JPG/PDF` 页面。
2. 点击 `选择 SVG`，导入 SVG 文件。
3. 根据需要调整宽度、高度、JPG 背景色或 JPG 质量。
4. 点击 `导出 PNG`、`导出 JPG` 或 `导出 PDF`。
5. 如果想临时换一个保存位置，可以点击对应的 `另存为...`。

### PNG/JPG 转 SVG/PDF

1. 进入 `PNG/JPG 转 SVG/PDF` 页面。
2. 点击 `选择 PNG/JPG`，导入图片。
3. 如果想尽量保持原图效果，使用默认的 `保真嵌入`。
4. 如果图片是 Logo、签名、图标或线稿，可以切换到 `矢量描摹`。
5. 在矢量描摹模式下，可以调整颜色数量和去噪强度。
6. 点击 `导出 SVG` 或 `导出 PDF` 保存结果。

## 输出设置

左侧的 `输出设置` 可以控制默认保存位置和文件名。

- `输出目录`：设置后，普通导出会直接保存到这个文件夹。
- `文件名模板`：默认值是 `{name}-{mode}.{ext}`。
- `{name}`：原文件名，不包含扩展名。
- `{mode}`：导出模式，例如 `export`、`vector`、`faithful`。
- `{ext}`：输出扩展名，例如 `png`、`jpg`、`svg`、`pdf`。
- `另存为...`：临时弹出保存窗口，不会修改默认输出目录。
- `重置默认`：清空输出目录，并恢复默认文件名模板。

模板示例：

```text
{name}_converted.{ext}
{name}-{mode}-{ext}.{ext}
```

## 关于转换效果

PNG/JPG 转 SVG/PDF 有两种方式：

| 模式 | 适合场景 | 优点 | 局限 |
|---|---|---|---|
| 保真嵌入 | 照片、截图、小字、渐变图 | 更接近原图 | SVG/PDF 内部仍然包含位图 |
| 矢量描摹 | Logo、图标、签名、线稿 | 可以生成 SVG 路径 | 复杂图片可能会有色块或变形 |

这里需要说明一下，普通照片很难直接变成效果很好的纯矢量图。如果图片里有很多渐变、阴影、小字，使用 `保真嵌入` 通常会更稳定；如果图片本身颜色少、边界清楚，`矢量描摹` 的效果会更好。

## 开发命令

运行检查和测试：

```powershell
npm.cmd run check
```

只运行语法检查：

```powershell
npm.cmd run lint
```

只运行测试：

```powershell
npm.cmd test
```

## 打包 Windows 免安装版

项目可以打包成 Windows 免安装目录：

```powershell
npm.cmd run dist:win
```

打包完成后会生成：

```text
dist\win-unpacked\Vector Studio.exe
```

如果要发给别人使用，需要压缩整个文件夹：

```text
dist\win-unpacked
```

对方解压后，双击 `Vector Studio.exe` 就可以运行，不需要安装 Node.js 或 npm。

注意不要只发送 `Vector Studio.exe` 单个文件，因为它还需要同目录下的 DLL、资源文件和运行时文件。

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

## 简单实现说明

项目主要分成三部分：

- `src/main.js`：Electron 主进程，负责窗口、文件选择、文件保存和 PDF 导出。
- `src/preload.js`：连接主进程和页面，避免页面直接访问 Node.js 能力。
- `src/renderer/app.js`：页面里的主要逻辑，包括预览、参数变化和导出操作。
- `src/shared/conversion-utils.js`：放了一些可以测试的工具函数。
- `tests/conversion-utils.test.js`：基础单元测试。

SVG 转 PNG/JPG 时，程序会先把 SVG 放到 Canvas 里渲染，再从 Canvas 导出图片。SVG 转 PDF 时，会用一个隐藏窗口渲染内容，再通过 Electron 的 `printToPDF` 生成 PDF。

PNG/JPG 转 SVG/PDF 时，默认模式会把原图嵌入到 SVG 里，这样颜色和文字不容易失真。矢量描摹模式会使用 ImageTracerJS 生成路径，适合比较简单、边界清楚的图形。

## 详细文档

更完整的项目结构和实现细节可以查看：

```text
PROJECT_FULL_DOCUMENTATION.md
```

## License

当前项目还没有添加 License 文件。如果后续需要开源分发，可以再补充 MIT License 或其他合适的开源协议。
