import type { Crop, ImageItem } from "../types";

export const FULL_CROP: Crop = { x: 0, y: 0, width: 100, height: 100 };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** HTTP 非安全上下文没有 `crypto.randomUUID`，依次退到 getRandomValues / Math.random */
export function randomId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function loadImageItem(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: randomId(),
        name: file.name,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法加载图片：${file.name}`));
    };
    img.src = url;
  });
}

/** 裁剪后的像素尺寸（无裁剪时即原始尺寸） */
export function croppedSize(item: ImageItem): { width: number; height: number } {
  const c = item.crop ?? FULL_CROP;
  return {
    width: (item.width * c.width) / 100,
    height: (item.height * c.height) / 100,
  };
}

/**
 * 把「相对于已裁剪视图的百分比选区」换算成「相对于原图的百分比选区」，
 * 使再次裁剪可以在副本上叠加。
 */
export function composeCrop(base: Crop | undefined, rel: Crop): Crop {
  if (!base) return rel;
  return {
    x: base.x + (rel.x * base.width) / 100,
    y: base.y + (rel.y * base.height) / 100,
    width: (rel.width * base.width) / 100,
    height: (rel.height * base.height) / 100,
  };
}
