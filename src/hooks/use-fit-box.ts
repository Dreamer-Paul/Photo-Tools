import { useLayoutEffect, useRef, useState } from "react";

interface Box {
  width: number;
  height: number;
}

/**
 * 监听容器尺寸，返回在容器内按指定宽高比 contain 适配后的盒子尺寸，
 * 用于让对比舞台始终完整可见且保持图片比例。
 */
export function useFitBox(aspect: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width: cw, height: ch } = el.getBoundingClientRect();
      if (cw <= 0 || ch <= 0 || !Number.isFinite(aspect) || aspect <= 0) {
        setBox(null);
        return;
      }
      let width = cw;
      let height = cw / aspect;
      if (height > ch) {
        height = ch;
        width = ch * aspect;
      }
      setBox({ width, height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [aspect]);

  return { ref, box };
}
