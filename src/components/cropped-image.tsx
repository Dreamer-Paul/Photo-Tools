import type { ImageItem } from "@/types";

/**
 * 在父容器（需为 relative 定位）内铺满显示图片。
 * 携带百分比裁剪信息时，通过缩放 + 偏移只露出裁剪区域，
 * 不同分辨率的图片按同一百分比对齐到相同视口。
 */
export function CroppedImage({ item }: { item: ImageItem }) {
  const c = item.crop;

  if (!c) {
    return (
      <img
        src={item.url}
        alt={item.name}
        draggable={false}
        className="absolute inset-0 h-full w-full object-fill select-none"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={item.url}
        alt={item.name}
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: `${10000 / c.width}%`,
          height: `${10000 / c.height}%`,
          left: `${(-c.x * 100) / c.width}%`,
          top: `${(-c.y * 100) / c.height}%`,
        }}
      />
    </div>
  );
}
