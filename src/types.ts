/** 百分比裁剪区域，各字段取值 0–100，相对于图片自身宽高 */
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageItem {
  id: string;
  /** 显示名称，裁剪副本带「(裁剪)」后缀 */
  name: string;
  /** Object URL，副本与原图共享同一 URL */
  url: string;
  /** 原始像素宽度 */
  width: number;
  /** 原始像素高度 */
  height: number;
  /** 百分比裁剪信息，无则表示完整图片 */
  crop?: Crop;
}

export type CompareMode = "divider" | "flicker";

export type ToolId = "compare" | "collage";

export interface AspectRatio {
  id: string;
  label: string;
  w: number;
  h: number;
}

export interface GridLayout {
  rows: number;
  cols: number;
}
