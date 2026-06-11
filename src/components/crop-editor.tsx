import { useRef, useState } from "react";
import type { Crop, ImageItem } from "@/types";
import { clamp, croppedSize } from "@/lib/images";
import { useFitBox } from "@/hooks/use-fit-box";
import { CroppedImage } from "@/components/cropped-image";

interface CropEditorProps {
  a: ImageItem;
  b: ImageItem;
  /** crop 为相对于当前显示区域的百分比选区，将同时应用到两张图 */
  onConfirm: (crop: Crop) => void;
  onCancel: () => void;
}

interface Edges {
  n?: boolean;
  s?: boolean;
  e?: boolean;
  w?: boolean;
}

type DragState =
  | { kind: "create"; anchorX: number; anchorY: number }
  | { kind: "move"; startX: number; startY: number; orig: Crop }
  | { kind: "resize"; edges: Edges; orig: Crop };

/** 选区最小边长（百分比） */
const MIN_SIZE = 1;

const HANDLES: { edges: Edges; left: number; top: number; cursor: string }[] = [
  { edges: { n: true, w: true }, left: 0, top: 0, cursor: "nwse-resize" },
  { edges: { n: true }, left: 50, top: 0, cursor: "ns-resize" },
  { edges: { n: true, e: true }, left: 100, top: 0, cursor: "nesw-resize" },
  { edges: { e: true }, left: 100, top: 50, cursor: "ew-resize" },
  { edges: { s: true, e: true }, left: 100, top: 100, cursor: "nwse-resize" },
  { edges: { s: true }, left: 50, top: 100, cursor: "ns-resize" },
  { edges: { s: true, w: true }, left: 0, top: 100, cursor: "nesw-resize" },
  { edges: { w: true }, left: 0, top: 50, cursor: "ew-resize" },
];

export function CropEditor({ a, b, onConfirm, onCancel }: CropEditorProps) {
  const [sel, setSel] = useState<Crop | null>(null);
  const [bg, setBg] = useState<"a" | "b">("a");
  const drag = useRef<DragState | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const item = bg === "a" ? a : b;
  const { width, height } = croppedSize(a);
  const { ref, box } = useFitBox(width / height);

  const pctPoint = (clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const startDrag = (e: React.PointerEvent, state: DragState) => {
    drag.current = state;
    stageRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = pctPoint(e.clientX, e.clientY);
    if (d.kind === "create") {
      setSel({
        x: Math.min(d.anchorX, p.x),
        y: Math.min(d.anchorY, p.y),
        width: Math.abs(p.x - d.anchorX),
        height: Math.abs(p.y - d.anchorY),
      });
    } else if (d.kind === "move") {
      setSel({
        ...d.orig,
        x: clamp(d.orig.x + (p.x - d.startX), 0, 100 - d.orig.width),
        y: clamp(d.orig.y + (p.y - d.startY), 0, 100 - d.orig.height),
      });
    } else {
      let { x, y, width: w, height: h } = d.orig;
      if (d.edges.e) w = clamp(p.x - x, MIN_SIZE, 100 - x);
      if (d.edges.s) h = clamp(p.y - y, MIN_SIZE, 100 - y);
      if (d.edges.w) {
        const right = x + w;
        x = clamp(p.x, 0, right - MIN_SIZE);
        w = right - x;
      }
      if (d.edges.n) {
        const bottom = y + h;
        y = clamp(p.y, 0, bottom - MIN_SIZE);
        h = bottom - y;
      }
      setSel({ x, y, width: w, height: h });
    }
  };

  const handlePointerUp = () => {
    drag.current = null;
    setSel((s) => (s && (s.width < MIN_SIZE || s.height < MIN_SIZE) ? null : s));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
          裁剪区域
          <span className="ml-2 text-xs text-zinc-500">
            框选关注区域，确认后将同时裁剪 A、B 两张图并生成新的一组副本
          </span>
        </span>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          底图
          <div className="flex rounded-md p-0.5 ring-1 ring-zinc-700">
            {(["a", "b"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBg(key)}
                title={key === "a" ? a.name : b.name}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  bg === key ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {sel && (
          <span className="text-xs text-zinc-500 tabular-nums">
            x {sel.x.toFixed(1)}% · y {sel.y.toFixed(1)}% · w {sel.width.toFixed(1)}% · h {sel.height.toFixed(1)}%
          </span>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
        >
          取消
        </button>
        <button
          type="button"
          disabled={!sel}
          onClick={() => sel && onConfirm(sel)}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          确认裁剪
        </button>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <div ref={ref} className="flex h-full w-full items-center justify-center">
          {box && (
            <div
              ref={stageRef}
              className="checkerboard relative cursor-crosshair touch-none overflow-hidden rounded-lg select-none"
              style={{ width: box.width, height: box.height }}
              onPointerDown={(e) => {
                const p = pctPoint(e.clientX, e.clientY);
                setSel({ x: p.x, y: p.y, width: 0, height: 0 });
                startDrag(e, { kind: "create", anchorX: p.x, anchorY: p.y });
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <CroppedImage item={item} />
              {sel && (
                <div
                  className="absolute cursor-move border border-sky-400"
                  style={{
                    left: `${sel.x}%`,
                    top: `${sel.y}%`,
                    width: `${sel.width}%`,
                    height: `${sel.height}%`,
                    boxShadow: "0 0 0 100000px rgba(0, 0, 0, 0.55)",
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const p = pctPoint(e.clientX, e.clientY);
                    startDrag(e, { kind: "move", startX: p.x, startY: p.y, orig: sel });
                  }}
                >
                  {HANDLES.map((h, i) => (
                    <div
                      key={i}
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-sky-400 bg-white"
                      style={{ left: `${h.left}%`, top: `${h.top}%`, cursor: h.cursor }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        startDrag(e, { kind: "resize", edges: h.edges, orig: sel });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
