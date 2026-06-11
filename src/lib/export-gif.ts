import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { ImageItem } from "@/types";
import { croppedSize, FULL_CROP } from "@/lib/images";

/** 每帧 500ms（2 fps），与闪烁预览一致 */
const FRAME_DELAY_MS = 500;
/** 编入文件的完整循环数，GIF 本身设置为无限循环播放 */
const CYCLES = 2;
const MAX_DIMENSION = 960;

async function loadElement(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export async function exportFlickerGif(a: ImageItem, b: ImageItem): Promise<Blob> {
  const sizeA = croppedSize(a);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sizeA.width, sizeA.height));
  const width = Math.max(1, Math.round(sizeA.width * scale));
  const height = Math.max(1, Math.round(sizeA.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("无法创建 Canvas 上下文");

  const [elA, elB] = await Promise.all([loadElement(a.url), loadElement(b.url)]);

  const renderFrame = (item: ImageItem, el: HTMLImageElement) => {
    const c = item.crop ?? FULL_CROP;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(
      el,
      (item.width * c.x) / 100,
      (item.height * c.y) / 100,
      (item.width * c.width) / 100,
      (item.height * c.height) / 100,
      0,
      0,
      width,
      height,
    );
    return ctx.getImageData(0, 0, width, height).data;
  };

  const frames = [renderFrame(a, elA), renderFrame(b, elB)].map((rgba) => {
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    return { palette, index };
  });

  const gif = GIFEncoder();
  for (let cycle = 0; cycle < CYCLES; cycle++) {
    for (const { palette, index } of frames) {
      gif.writeFrame(index, width, height, {
        palette,
        delay: FRAME_DELAY_MS,
        repeat: 0,
      });
    }
  }
  gif.finish();

  return new Blob([gif.bytes()], { type: "image/gif" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
