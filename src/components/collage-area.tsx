import { useEffect, useMemo, useRef, useState } from "react";
import type { AspectRatio, GridLayout, ImageItem } from "@/types";
import { downloadBlob } from "@/lib/export-gif";
import {
  ASPECT_RATIOS,
  DEFAULT_RATIO,
  DEFAULT_WIDTH,
  WIDTH_PRESETS,
  defaultLayout,
  drawCollage,
  exportCollagePng,
  layoutKey,
  layoutOptionLabel,
  layoutsForCount,
  loadElement,
  sizeFromHeight,
  sizeFromWidth,
} from "@/lib/collage";
import { useFitBox } from "@/hooks/use-fit-box";

interface CollageAreaProps {
  items: ImageItem[];
}

export function CollageArea({ items }: CollageAreaProps) {
  const [ratio, setRatio] = useState<AspectRatio>(DEFAULT_RATIO);
  const [size, setSize] = useState(() => sizeFromWidth(DEFAULT_WIDTH, DEFAULT_RATIO));
  const [layout, setLayout] = useState<GridLayout | null>(() => defaultLayout(items.length));
  const [exporting, setExporting] = useState(false);
  const [widthDraft, setWidthDraft] = useState(String(size.width));
  const [heightDraft, setHeightDraft] = useState(String(size.height));

  const n = items.length;
  const layouts = useMemo(() => layoutsForCount(n), [n]);

  useEffect(() => {
    setLayout(defaultLayout(n));
  }, [n]);

  const applySize = (next: { width: number; height: number }) => {
    setSize(next);
    setWidthDraft(String(next.width));
    setHeightDraft(String(next.height));
  };

  const handleRatio = (next: AspectRatio) => {
    setRatio(next);
    applySize(sizeFromWidth(size.width, next));
  };

  const commitWidth = () => {
    const parsed = Number(widthDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWidthDraft(String(size.width));
      return;
    }
    applySize(sizeFromWidth(parsed, ratio));
  };

  const commitHeight = () => {
    const parsed = Number(heightDraft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setHeightDraft(String(size.height));
      return;
    }
    applySize(sizeFromHeight(parsed, ratio));
  };

  const handleExport = async () => {
    if (!layout || items.length === 0) return;
    setExporting(true);
    try {
      const blob = await exportCollagePng(items, layout, size.width, size.height);
      downloadBlob(blob, `collage-${size.width}x${size.height}.png`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  const aspect = size.width / size.height;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-zinc-500">比例</span>
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRatio(r)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                ratio.id === r.id ? "bg-sky-600 text-white" : "text-zinc-400 ring-1 ring-zinc-700 hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <span className="text-zinc-500">分辨率</span>
          <input
            type="number"
            min={1}
            value={widthDraft}
            onChange={(e) => setWidthDraft(e.target.value)}
            onBlur={commitWidth}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-20 rounded bg-zinc-900 px-1.5 py-1 text-zinc-200 ring-1 ring-zinc-700"
          />
          <span>×</span>
          <input
            type="number"
            min={1}
            value={heightDraft}
            onChange={(e) => setHeightDraft(e.target.value)}
            onBlur={commitHeight}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-20 rounded bg-zinc-900 px-1.5 py-1 text-zinc-200 ring-1 ring-zinc-700"
          />
          {WIDTH_PRESETS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => applySize(sizeFromWidth(w, ratio))}
              className="rounded px-2 py-1 text-zinc-400 ring-1 ring-zinc-700 hover:text-zinc-200"
            >
              {w} 宽
            </button>
          ))}
        </div>
        {layouts.length > 0 && layout && (
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <span className="text-zinc-500">布局</span>
            <select
              value={layoutKey(layout)}
              onChange={(e) => {
                const next = layouts.find((l) => layoutKey(l) === e.target.value);
                if (next) setLayout(next);
              }}
              className="max-w-52 rounded bg-zinc-900 px-1.5 py-1 text-zinc-200 ring-1 ring-zinc-700"
            >
              {layouts.map((l) => (
                <option key={layoutKey(l)} value={layoutKey(l)}>
                  {layoutOptionLabel(l, n)}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={!layout || items.length === 0 || exporting}
          onClick={handleExport}
          className="ml-auto rounded-md px-3 py-1 text-sm text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exporting ? "导出中…" : "导出 PNG"}
        </button>
      </div>
      <div className="min-h-0 flex-1 p-4">
        {items.length === 0 || !layout ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
            <p className="text-lg">请选择图片</p>
            <p className="text-sm">在左侧列表勾选要拼入的图片，顺序即格子顺序</p>
          </div>
        ) : (
          <CollageCanvas items={items} layout={layout} aspect={aspect} />
        )}
      </div>
    </div>
  );
}

function CollageCanvas({
  items,
  layout,
  aspect,
}: {
  items: ImageItem[];
  layout: GridLayout;
  aspect: number;
}) {
  const { ref, box } = useFitBox(aspect);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const urls = [...new Set(items.map((i) => i.url))];
    Promise.all(urls.map(async (url) => [url, await loadElement(url)] as const)).then((entries) => {
      if (!cancelled) setImages(new Map(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !box) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(box.width * dpr));
    const height = Math.max(1, Math.round(box.height * dpr));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${box.width}px`;
    canvas.style.height = `${box.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCollage(ctx, width, height, items, images, layout, { gridLines: true });
  }, [box, items, images, layout]);

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center bg-zinc-950">
      {box && <canvas ref={canvasRef} className="block bg-black" />}
    </div>
  );
}
