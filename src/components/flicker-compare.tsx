import { useEffect, useState } from "react";
import type { ImageItem } from "../types";
import { croppedSize } from "../lib/images";
import { useFitBox } from "../hooks/use-fit-box";
import { exportFlickerGif, downloadBlob } from "../lib/export-gif";
import { CroppedImage } from "./cropped-image";

const FLICKER_INTERVAL_MS = 500;

export function FlickerCompare({ a, b }: { a: ImageItem; b: ImageItem }) {
  const [showB, setShowB] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setShowB((s) => !s), FLICKER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const { width, height } = croppedSize(a);
  const { ref, box } = useFitBox(width / height);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportFlickerGif(a, b);
      downloadBlob(blob, "修图对比.gif");
    } catch (err) {
      alert(err instanceof Error ? err.message : "导出 GIF 失败");
    } finally {
      setExporting(false);
    }
  };

  const current = showB ? b : a;

  return (
    <div className="flex h-full flex-col gap-3">
      <div ref={ref} className="flex min-h-0 flex-1 items-center justify-center">
        {box && (
          <div
            className="checkerboard relative overflow-hidden rounded-lg select-none"
            style={{ width: box.width, height: box.height }}
          >
            <CroppedImage item={a} />
            <div className="absolute inset-0" style={{ visibility: showB ? "visible" : "hidden" }}>
              <CroppedImage item={b} />
            </div>
            <span className="pointer-events-none absolute top-2 left-2 max-w-[60%] truncate rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              {showB ? "B" : "A"} · {current.name}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
        >
          {playing ? "暂停" : "继续"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "导出中…" : "导出 GIF"}
        </button>
      </div>
    </div>
  );
}
