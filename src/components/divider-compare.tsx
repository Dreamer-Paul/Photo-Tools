import { useRef, useState } from "react";
import type { ImageItem } from "@/types";
import { clamp, croppedSize } from "@/lib/images";
import { useFitBox } from "@/hooks/use-fit-box";
import { CroppedImage } from "@/components/cropped-image";

export function DividerCompare({ a, b }: { a: ImageItem; b: ImageItem }) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const { width, height } = croppedSize(a);
  const { ref, box } = useFitBox(width / height);

  const updateFromX = (clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
  };

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center">
      {box && (
        <div
          ref={stageRef}
          className="checkerboard relative touch-none overflow-hidden rounded-lg select-none"
          style={{ width: box.width, height: box.height }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateFromX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) updateFromX(e.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
        >
          <CroppedImage item={b} />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <CroppedImage item={a} />
          </div>

          <span className="pointer-events-none absolute top-2 left-2 max-w-[40%] truncate rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            A · {a.name}
          </span>
          <span className="pointer-events-none absolute top-2 right-2 max-w-[40%] truncate rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            B · {b.name}
          </span>

          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_4px_rgba(0,0,0,0.6)]"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-white text-[10px] font-bold text-zinc-700 shadow-md">
              ◀ ▶
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
