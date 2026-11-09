import type { AspectRatio, GridLayout, ImageItem } from "@/types";
import { FULL_CROP } from "@/lib/images";

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: "16:9", label: "16:9", w: 16, h: 9 },
  { id: "4:3", label: "4:3", w: 4, h: 3 },
  { id: "3:2", label: "3:2", w: 3, h: 2 },
  { id: "1:1", label: "1:1", w: 1, h: 1 },
  { id: "2:3", label: "2:3", w: 2, h: 3 },
  { id: "4:5", label: "4:5", w: 4, h: 5 },
  { id: "3:4", label: "3:4", w: 3, h: 4 },
  { id: "9:16", label: "9:16", w: 9, h: 16 },
];

export const DEFAULT_RATIO = ASPECT_RATIOS.find((r) => r.id === "1:1")!;

export const MIN_SIDE = 256;
export const MAX_SIDE = 8192;
export const DEFAULT_WIDTH = 1080;
export const WIDTH_PRESETS = [1080, 1920] as const;

function addFactorLayouts(target: number, into: Map<string, GridLayout>) {
  if (target < 1) return;
  for (let rows = 1; rows <= target; rows++) {
    if (target % rows !== 0) continue;
    const cols = target / rows;
    into.set(`${rows}x${cols}`, { rows, cols });
  }
}

/** 上半整幅、下半左右各一格。rows/cols 只用于和均匀布局一起排序 */
export const BANNER_SPLIT_LAYOUT: GridLayout = { rows: 2, cols: 2, kind: "banner-split" };

export function layoutKey(layout: GridLayout): string {
  return layout.kind === "banner-split" ? "banner-split" : `${layout.rows}x${layout.cols}`;
}

export function layoutCellCount(layout: GridLayout): number {
  if (layout.kind === "banner-split") return 3;
  return layout.rows * layout.cols;
}

function layoutScore(a: GridLayout, n: number) {
  const cells = layoutCellCount(a);
  return {
    slack: Math.abs(cells - n),
    square: Math.abs(a.rows - a.cols),
    landscape: a.cols >= a.rows ? 0 : 1,
  };
}

function compareLayouts(a: GridLayout, b: GridLayout, n: number) {
  const sa = layoutScore(a, n);
  const sb = layoutScore(b, n);
  if (sa.square !== sb.square) return sa.square - sb.square;
  if (sa.landscape !== sb.landscape) return sa.landscape - sb.landscape;
  if (sa.slack !== sb.slack) return sa.slack - sb.slack;
  if (a.rows !== b.rows) return a.rows - b.rows;
  return a.cols - b.cols;
}

/**
 * 可选布局：格子数可以等于张数，也可以多 1～2 格（出现空位）或少 1 格（少放一张）。
 * 例如 5 张可选 3×2（空 1 格）或 2×2（少 1 张）。
 */
export function layoutsForCount(n: number): GridLayout[] {
  if (n < 1) return [];
  const map = new Map<string, GridLayout>();
  for (const target of [n - 1, n, n + 1, n + 2]) addFactorLayouts(target, map);
  const layouts = [...map.values()];
  if (n === 3) layouts.push(BANNER_SPLIT_LAYOUT);
  return layouts.sort((a, b) => compareLayouts(a, b, n));
}

export function layoutOptionLabel(layout: GridLayout, n: number): string {
  if (layout.kind === "banner-split") return "上宽下双";
  const cells = layout.rows * layout.cols;
  const base = `${layout.rows}×${layout.cols}`;
  if (cells === n) return base;
  if (cells > n) return `${base}（空 ${cells - n} 格）`;
  return `${base}（少 ${n - cells} 张）`;
}

/** 优先能放下全部图片、且尽量接近方形；并列时优先列数 ≥ 行数 */
export function defaultLayout(n: number): GridLayout | null {
  const layouts = layoutsForCount(n);
  if (layouts.length === 0) return null;
  const fitting = layouts.filter((l) => layoutCellCount(l) >= n);
  const pool = fitting.length > 0 ? fitting : layouts;
  return [...pool].sort((a, b) => compareLayouts(a, b, n))[0];
}

/** 多出来的空格落在最靠近画布中心的格子上，其余按勾选顺序填图 */
export function cellImageIndices(layout: GridLayout, imageCount: number): (number | null)[] {
  if (layout.kind === "banner-split") {
    return [0, 1, 2].map((i) => (i < imageCount ? i : null));
  }
  const { rows, cols } = layout;
  const total = rows * cols;
  const slots: (number | null)[] = Array.from({ length: total }, () => null);
  if (imageCount >= total) {
    for (let i = 0; i < total; i++) slots[i] = i;
    return slots;
  }

  const emptyCount = total - imageCount;
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;
  const ranked = Array.from({ length: total }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return { i, r, c, dist: Math.hypot(r - centerR, c - centerC) };
  });
  ranked.sort(
    (a, b) => a.dist - b.dist || b.r - a.r || Math.abs(a.c - centerC) - Math.abs(b.c - centerC) || a.c - b.c,
  );
  const emptySet = new Set(ranked.slice(0, emptyCount).map((cell) => cell.i));

  let img = 0;
  for (let i = 0; i < total; i++) {
    if (emptySet.has(i)) continue;
    slots[i] = img++;
  }
  return slots;
}

export function sameLayout(a: GridLayout | null, b: GridLayout | null): boolean {
  if (!a || !b) return a === b;
  return layoutKey(a) === layoutKey(b);
}

export function clampResolution(width: number, height: number): { width: number; height: number } {
  let w = Math.max(1, Math.round(width));
  let h = Math.max(1, Math.round(height));
  const maxSide = Math.max(w, h);
  const minSide = Math.min(w, h);
  let scale = 1;
  if (maxSide > MAX_SIDE) scale = MAX_SIDE / maxSide;
  if (minSide * scale < MIN_SIDE) scale = MIN_SIDE / minSide;
  if (maxSide * scale > MAX_SIDE) scale = MAX_SIDE / maxSide;
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  return { width: w, height: h };
}

export function sizeFromWidth(width: number, ratio: AspectRatio): { width: number; height: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round((w * ratio.h) / ratio.w));
  return clampResolution(w, h);
}

export function sizeFromHeight(height: number, ratio: AspectRatio): { width: number; height: number } {
  const h = Math.max(1, Math.round(height));
  const w = Math.max(1, Math.round((h * ratio.w) / ratio.h));
  return clampResolution(w, h);
}

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 按布局切出每格矩形。均匀分格时最后一行/列吃掉余数，避免露缝 */
export function layoutCellRects(canvasW: number, canvasH: number, layout: GridLayout): CellRect[] {
  if (layout.kind === "banner-split") {
    const topH = Math.floor(canvasH / 2);
    const bottomH = canvasH - topH;
    const leftW = Math.floor(canvasW / 2);
    const rightW = canvasW - leftW;
    return [
      { x: 0, y: 0, w: canvasW, h: topH },
      { x: 0, y: topH, w: leftW, h: bottomH },
      { x: leftW, y: topH, w: rightW, h: bottomH },
    ];
  }
  return cellRects(canvasW, canvasH, layout.rows, layout.cols);
}

/** 均匀分格；最后一行/列吃掉余数，避免露缝 */
export function cellRects(canvasW: number, canvasH: number, rows: number, cols: number): CellRect[] {
  const rects: CellRect[] = [];
  let y = 0;
  for (let r = 0; r < rows; r++) {
    const remainingRows = rows - r;
    const cellH = r === rows - 1 ? canvasH - y : Math.floor((canvasH - y) / remainingRows);
    let x = 0;
    for (let c = 0; c < cols; c++) {
      const remainingCols = cols - c;
      const cellW = c === cols - 1 ? canvasW - x : Math.floor((canvasW - x) / remainingCols);
      rects.push({ x, y, w: cellW, h: cellH });
      x += cellW;
    }
    y += cellH;
  }
  return rects;
}

interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

function cropPixels(item: ImageItem): SourceRect {
  const c = item.crop ?? FULL_CROP;
  return {
    sx: (item.width * c.x) / 100,
    sy: (item.height * c.y) / 100,
    sw: (item.width * c.width) / 100,
    sh: (item.height * c.height) / 100,
  };
}

/** 从源矩形中取出能 cover 填满格子的居中区域 */
export function coverSourceRect(sw: number, sh: number, cellW: number, cellH: number): SourceRect {
  if (sw <= 0 || sh <= 0 || cellW <= 0 || cellH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, sw), sh: Math.max(1, sh) };
  }
  const srcAspect = sw / sh;
  const cellAspect = cellW / cellH;
  if (srcAspect > cellAspect) {
    const cw = sh * cellAspect;
    return { sx: (sw - cw) / 2, sy: 0, sw: cw, sh };
  }
  const ch = sw / cellAspect;
  return { sx: 0, sy: (sh - ch) / 2, sw, sh: ch };
}

export async function loadElement(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export interface DrawCollageOptions {
  gridLines?: boolean;
}

export function drawCollage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  items: ImageItem[],
  images: Map<string, HTMLImageElement>,
  layout: GridLayout,
  options: DrawCollageOptions = {},
) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  const cells = layoutCellRects(width, height, layout);
  const slots = cellImageIndices(layout, items.length);

  for (let i = 0; i < cells.length; i++) {
    const imageIndex = slots[i];
    if (imageIndex == null) continue;
    const item = items[imageIndex];
    const cell = cells[i];
    if (!item) continue;
    const el = images.get(item.url);
    if (!el || cell.w <= 0 || cell.h <= 0) continue;

    const crop = cropPixels(item);
    const cover = coverSourceRect(crop.sw, crop.sh, cell.w, cell.h);
    ctx.drawImage(
      el,
      crop.sx + cover.sx,
      crop.sy + cover.sy,
      cover.sw,
      cover.sh,
      cell.x,
      cell.y,
      cell.w,
      cell.h,
    );
  }

  if (options.gridLines && cells.length > 1) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(1, width / 800);
    for (const cell of cells) {
      ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.w - 1, cell.h - 1);
    }
    ctx.restore();
  }
}

export async function exportCollagePng(
  items: ImageItem[],
  layout: GridLayout,
  width: number,
  height: number,
): Promise<Blob> {
  const urls = [...new Set(items.map((i) => i.url))];
  const loaded = await Promise.all(urls.map(async (url) => [url, await loadElement(url)] as const));
  const images = new Map(loaded);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 Canvas 上下文");

  drawCollage(ctx, width, height, items, images, layout);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("导出 PNG 失败"));
    }, "image/png");
  });
}
