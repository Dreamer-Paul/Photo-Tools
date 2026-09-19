import { useMemo, useState } from "react";
import type { CompareMode, Crop, ImageItem, ToolId } from "@/types";
import { composeCrop, loadImageItem, randomId } from "@/lib/images";
import { usePasteImages } from "@/hooks/use-paste-images";
import { AddImages } from "@/components/add-images";
import { ImageList } from "@/components/image-list";
import { PreviewArea } from "@/components/preview-area";
import { CropEditor } from "@/components/crop-editor";
import { CollageArea } from "@/components/collage-area";

function App() {
  const [tool, setTool] = useState<ToolId>("compare");
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<CompareMode>("divider");
  const [cropping, setCropping] = useState(false);

  const a = items.find((i) => i.id === selectedIds[0]) ?? null;
  const b = items.find((i) => i.id === selectedIds[1]) ?? null;
  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((i) => i.id === id))
        .filter((i): i is ImageItem => i != null),
    [selectedIds, items],
  );

  const handleAdd = async (files: File[]) => {
    const results = await Promise.allSettled(files.map(loadImageItem));
    const loaded = results
      .filter((r): r is PromiseFulfilledResult<ImageItem> => r.status === "fulfilled")
      .map((r) => r.value);
    if (loaded.length > 0) {
      setItems((prev) => [...prev, ...loaded]);
      if (tool === "collage") {
        setSelectedIds((prev) => [...prev, ...loaded.map((i) => i.id)]);
      }
    }
    const failed = results.length - loaded.length;
    if (failed > 0) alert(`有 ${failed} 个文件无法作为图片加载`);
  };

  usePasteImages(handleAdd);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (tool === "compare" && prev.length >= 2) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      const next = prev.filter((i) => i.id !== id);
      if (removed && !next.some((i) => i.url === removed.url)) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    if (selectedIds.includes(id)) setCropping(false);
  };

  const handleToolChange = (next: ToolId) => {
    if (next === tool) return;
    setCropping(false);
    setTool(next);
    setSelectedIds(next === "collage" ? items.map((i) => i.id) : []);
  };

  const handleCropConfirm = (rel: Crop) => {
    if (!a || !b) return;
    const makeCopy = (src: ImageItem): ImageItem => ({
      ...src,
      id: randomId(),
      name: `${src.name} (裁剪)`,
      crop: composeCrop(src.crop, rel),
    });
    const copyA = makeCopy(a);
    const copyB = makeCopy(b);
    setItems((prev) => [...prev, copyA, copyB]);
    setSelectedIds([copyA.id, copyB.id]);
    setCropping(false);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-200">
      <header className="flex items-center gap-4 border-b border-zinc-800 px-5 py-3">
        <h1 className="text-base font-semibold text-zinc-50">保罗的图片工具</h1>
        <div className="flex rounded-md p-0.5 ring-1 ring-zinc-700">
          <button
            type="button"
            onClick={() => handleToolChange("compare")}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              tool === "compare" ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            修图对比
          </button>
          <button
            type="button"
            onClick={() => handleToolChange("collage")}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              tool === "collage" ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            拼图
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-800">
          <section className="border-b border-zinc-800 p-4">
            <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-500">添加图片</h2>
            <AddImages onAdd={handleAdd} />
          </section>
          <section className="flex min-h-0 flex-1 flex-col p-4">
            <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-500">
              {tool === "compare" ? "选择图片（勾选两张进行对比）" : "选择图片（勾选要拼入的图片）"}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ImageList
                items={items}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                onRemove={handleRemove}
                badgeMode={tool === "collage" ? "collage" : "compare"}
              />
            </div>
          </section>
        </aside>

        <main className="min-w-0 flex-1">
          {tool === "collage" ? (
            <CollageArea items={selectedItems} />
          ) : cropping && a && b ? (
            <CropEditor a={a} b={b} onConfirm={handleCropConfirm} onCancel={() => setCropping(false)} />
          ) : (
            <PreviewArea a={a} b={b} mode={mode} onModeChange={setMode} onCrop={() => setCropping(true)} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
