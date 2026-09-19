# Photo-Tools

同一应用内的图片小工具集。Header 切换工具（默认修图对比）；左侧共用添加 / 列表，右侧随工具变化。拼图尚未实现。

## 工具

- **修图对比**（默认）：两张图叠加，用分界线或闪烁轮播看修图前后差异；列表最多勾选 2 张
- **拼图**（规划中）：固定比例画布、按张数均分格子、每格居中放大裁切后导出；列表勾选不限制张数

## 功能概览（修图对比）

- **添加 / 选择 / 预览**：导入图片、从待选列表勾选两张图、进入对比预览
- **分界线模式**：拖拽画面中线，左右实时对比两个版本
- **裁剪区域**：按百分比框选局部区域，适配不同分辨率的原图与修图
- **闪烁模式**：每 0.5 秒交替显示两张图，类似 GIF 轮播
- **导出 GIF**：将闪烁对比效果导出为 GIF 文件

## 规格文档

总览与各工具规格见 [docs/README.md](./docs/README.md)。

- [docs/COMPARE.md](./docs/COMPARE.md) — 修图对比
- [docs/COLLAGE.md](./docs/COLLAGE.md) — 拼图（待实现）

## 开发

```bash
pnpm install
pnpm dev
```

```bash
pnpm build
pnpm preview
```

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
