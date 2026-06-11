# 修图对比

用于对比修图前后效果的 Web 工具。将两张图片叠加显示，通过可拖拽分界线或闪烁轮播的方式实时预览差异。

## 功能概览

- **添加 / 选择 / 预览**：导入图片、从待选列表勾选两张图、进入对比预览
- **分界线模式**：拖拽画面中线，左右实时对比两个版本
- **裁剪区域**：按百分比框选局部区域，适配不同分辨率的原图与修图
- **闪烁模式**：每 0.5 秒交替显示两张图，类似 GIF 轮播
- **导出 GIF**：将闪烁对比效果导出为 GIF 文件

完整功能规格见 [docs/FEATURES.md](./docs/FEATURES.md)。

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
