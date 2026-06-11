import type { ImageItem } from "../types";
import { croppedSize } from "../lib/images";
import { CroppedImage } from "./cropped-image";

interface ImageListProps {
  items: ImageItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const THUMB = 56;

function Thumbnail({ item }: { item: ImageItem }) {
  const { width, height } = croppedSize(item);
  const aspect = width / height;
  const w = aspect >= 1 ? THUMB : THUMB * aspect;
  const h = aspect >= 1 ? THUMB / aspect : THUMB;
  return (
    <div className="flex shrink-0 items-center justify-center" style={{ width: THUMB, height: THUMB }}>
      <div className="checkerboard relative overflow-hidden rounded" style={{ width: w, height: h }}>
        <CroppedImage item={item} />
      </div>
    </div>
  );
}

export function ImageList({ items, selectedIds, onToggle, onRemove }: ImageListProps) {
  if (items.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-zinc-600">还没有图片，先在上方添加</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const selectedIndex = selectedIds.indexOf(item.id);
        const selected = selectedIndex >= 0;
        const { width, height } = croppedSize(item);
        return (
          <li key={item.id}>
            <div
              role="checkbox"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => onToggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(item.id);
                }
              }}
              className={`group flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors ${
                selected ? "border-sky-500 bg-sky-500/10" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
              }`}
            >
              <Thumbnail item={item} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-200" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {Math.round(width)}×{Math.round(height)}
                  {item.crop && <span className="ml-1 text-amber-400/80">已裁剪</span>}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-zinc-400 ring-1 ring-zinc-700 hover:bg-red-500/20 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
              {selected && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  {selectedIndex === 0 ? "A" : "B"}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
