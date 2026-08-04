import { useState } from "react";
import type { CompareMode, Crop, ImageItem } from "@/types";
import { composeCrop, loadImageItem } from "@/lib/images";
import { usePasteImages } from "@/hooks/use-paste-images";
import { AddImages } from "@/components/add-images";
import { ImageList } from "@/components/image-list";
import { PreviewArea } from "@/components/preview-area";
import { CropEditor } from "@/components/crop-editor";

function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<CompareMode>("divider");
  const [cropping, setCropping] = useState(false);

  const a = items.find((i) => i.id === selectedIds[0]) ?? null;
  const b = items.find((i) => i.id === selectedIds[1]) ?? null;

  const handleAdd = async (files: File[]) => {
    const results = await Promise.allSettled(files.map(loadImageItem));
    const loaded = results
      .filter((r): r is PromiseFulfilledResult<ImageItem> => r.status === "fulfilled")
      .map((r) => r.value);
    if (loaded.length > 0) setItems((prev) => [...prev, ...loaded]);
    const failed = results.length - loaded.length;
    if (failed > 0) alert(`有 ${failed} 个文件无法作为图片加载`);
  };

  usePasteImages(handleAdd);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // 已满两张时，替换最早选中的那张
      if (prev.length >= 2) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      const next = prev.filter((i) => i.id !== id);
      // 副本与原图共享 Object URL，仅在无人引用时释放
      if (removed && !next.some((i) => i.url === removed.url)) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    if (selectedIds.includes(id)) setCropping(false);
  };

  // 同一百分比选区同时应用到 A、B，生成新的一组裁剪副本并自动选中
  const handleCropConfirm = (rel: Crop) => {
    if (!a || !b) return;
    const makeCopy = (src: ImageItem): ImageItem => ({
      ...src,
      id: crypto.randomUUID(),
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
      <header className="flex items-baseline gap-3 border-b border-zinc-800 px-5 py-3">
        <h1 className="text-base font-semibold text-zinc-50">修图对比</h1>
        <p className="text-xs text-zinc-500">叠加对比两张图片，实时预览修图前后差异</p>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-800">
          <section className="border-b border-zinc-800 p-4">
            <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-500">添加图片</h2>
            <AddImages onAdd={handleAdd} />
          </section>
          <section className="flex min-h-0 flex-1 flex-col p-4">
            <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-500">选择图片（勾选两张进行对比）</h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ImageList items={items} selectedIds={selectedIds} onToggle={handleToggle} onRemove={handleRemove} />
            </div>
          </section>
        </aside>

        <main className="min-w-0 flex-1">
          {cropping && a && b ? (
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
