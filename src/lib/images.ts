import type { Crop, ImageItem } from "../types";

export const FULL_CROP: Crop = { x: 0, y: 0, width: 100, height: 100 };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function loadImageItem(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: crypto.randomUUID(),
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
