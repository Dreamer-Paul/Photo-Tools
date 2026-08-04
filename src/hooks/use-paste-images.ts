import { useEffect } from "react";
import { useLatest } from "@/hooks/use-latest";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function collectClipboardImages(data: DataTransfer | null): File[] {
  if (!data) return [];

  const files: File[] = [];
  const seen = new Set<File>();

  for (const item of Array.from(data.items)) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file && !seen.has(file)) {
      seen.add(file);
      files.push(file);
    }
  }

  for (const file of Array.from(data.files)) {
    if (!file.type.startsWith("image/") || seen.has(file)) continue;
    seen.add(file);
    files.push(file);
  }

  return files;
}

/**
 * 全局监听粘贴事件，从剪贴板提取图片并交给 onAdd。
 * 在输入框 / 可编辑区域粘贴时不拦截。
 */
export function usePasteImages(onAdd: (files: File[]) => void, enabled = true) {
  const onAddRef = useLatest(onAdd);

  useEffect(() => {
    if (!enabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const files = collectClipboardImages(e.clipboardData);
      if (files.length === 0) return;

      e.preventDefault();
      onAddRef.current(files);
    };

    window.addEventListener("paste", handlePaste);

    return () => window.removeEventListener("paste", handlePaste);
  }, [enabled, onAddRef]);
}
