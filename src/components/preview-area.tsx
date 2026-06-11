import type { CompareMode, ImageItem } from "@/types";
import { DividerCompare } from "./divider-compare";
import { FlickerCompare } from "./flicker-compare";

interface PreviewAreaProps {
  a: ImageItem | null;
  b: ImageItem | null;
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
  onCrop: () => void;
}

const MODES: { id: CompareMode; label: string }[] = [
  { id: "divider", label: "分界线" },
  { id: "flicker", label: "闪烁" },
];

export function PreviewArea({ a, b, mode, onModeChange, onCrop }: PreviewAreaProps) {
  if (!a || !b) {
    const count = (a ? 1 : 0) + (b ? 1 : 0);
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
        <p className="text-lg">已选 {count} / 2 张图片</p>
        <p className="text-sm">在左侧列表中勾选两张图片后开始对比</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <div className="flex rounded-md p-0.5 ring-1 ring-zinc-700">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                mode === m.id ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCrop}
          title="框选一个区域，同时裁剪两张图，生成新的一组副本"
          className="rounded-md px-3 py-1 text-sm text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
        >
          裁剪区域
        </button>
        <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">
          A · {a.name} <span className="mx-1 text-zinc-700">vs</span> B · {b.name}
        </span>
      </div>
      <div className="min-h-0 flex-1 p-4">
        {mode === "divider" ? <DividerCompare a={a} b={b} /> : <FlickerCompare a={a} b={b} />}
      </div>
    </div>
  );
}
