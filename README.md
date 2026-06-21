# Vector Studio

一个本地 Electron 桌面工具，用于在 SVG、PNG、JPG 和 PDF 之间转换。

## 安装和打开

第一次使用先在 PowerShell 里运行：

```powershell
cd D:\jzk\Academy\change
npm.cmd install
npm.cmd start
```

以后已经安装过依赖时，只需要：

```powershell
cd D:\jzk\Academy\change
npm.cmd start
```

## 使用方法

1. 打开程序后，左侧选择转换模式。
2. `SVG 转 PNG/JPG/PDF`：点击 `选择 SVG`，调宽度、高度和 JPG 参数，然后点对应导出按钮。
3. `PNG/JPG 转 SVG/PDF`：点击 `选择 PNG/JPG`，默认使用 `保真嵌入`，导出的 SVG/PDF 会保持原图颜色和文字外观。
4. 需要可编辑路径时，切换到 `矢量描摹`，再调颜色数量和去噪强度；这个模式会近似重画图片，效果取决于原图复杂度。

## 输出设置

左侧 `输出设置` 可以控制默认保存位置和文件名。

- `输出目录`：点击 `选择` 后，普通 `导出` 按钮会直接保存到这个文件夹。
- `文件名模板`：默认是 `{name}-{mode}.{ext}`。
- `{name}`：原文件名，不含扩展名。
- `{mode}`：导出模式，例如 `export`、`vector`、`faithful`。
- `{ext}`：输出扩展名，例如 `png`、`jpg`、`svg`、`pdf`。
- `另存为...`：临时弹出系统保存窗口，不会改变左侧默认输出目录。
- `重置默认`：清空输出目录，并把模板恢复为 `{name}-{mode}.{ext}`。

模板示例：

```text
{name}_converted.{ext}
{name}-{mode}-{ext}.{ext}
```

## 适合的图片

`保真嵌入` 适合照片、截图、带小字的图片、渐变图，视觉效果最接近原图，但 SVG/PDF 内部仍包含位图。

`矢量描摹` 适合 Logo、签名、图标、线稿、扁平插画等高对比图片；照片和复杂文字会变成近似色块和轮廓。

## 检查

```powershell
npm.cmd run check
```

## 打包给别人直接用

本项目配置的是 Windows 免安装版。运行：

```powershell
cd D:\jzk\Academy\change
npm.cmd run dist:win
```

打包完成后会生成：

```text
dist\win-unpacked\Vector Studio.exe
```

把整个 `dist\win-unpacked` 文件夹压缩成 zip 发给别人。别人解压后，双击 `Vector Studio.exe` 就能用，不需要安装 Node.js 或 npm。

## 上传到 GitHub

源码仓库不要上传 `node_modules/`、`dist/` 和 zip 包；这些已经写进 `.gitignore`。

第一次初始化仓库：

```powershell
cd D:\jzk\Academy\change
git init
git add .
git commit -m "Initial Vector Studio app"
```

然后在 GitHub 新建一个空仓库，不要勾选自动生成 README。假设你的远程仓库地址是 `https://github.com/<你的用户名>/<仓库名>.git`：

```powershell
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

发布给别人下载时，建议使用 GitHub Release：

1. 先运行 `npm.cmd run dist:win`。
2. 把 `dist\win-unpacked` 压缩成 zip。
3. 在 GitHub 仓库页面进入 `Releases`。
4. 点击 `Draft a new release`。
5. 创建版本号，例如 `v1.0.0`。
6. 上传压缩包并发布。

之后别人可以从 Release 页面下载 zip，解压后直接运行。
