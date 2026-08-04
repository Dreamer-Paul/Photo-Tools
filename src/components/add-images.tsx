import { useRef, useState } from "react";

export function AddImages({ onAdd }: { onAdd: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;

    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));

    if (files.length > 0) onAdd(files);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors ${
        dragOver
          ? "border-sky-400 bg-sky-400/10 text-sky-300"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="font-medium">点击、拖拽或粘贴图片</span>
      <span className="text-xs text-zinc-500">支持 PNG / JPEG / WebP，Ctrl+V 可粘贴剪贴板图片</span>
    </button>
  );
}
