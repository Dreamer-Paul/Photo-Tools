/* eslint-disable react-hooks/refs */
import { useRef } from "react";

/**
 * 始终指向最新 value 的 ref，避免 effect / 事件监听因闭包拿到过期值。
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  
  return ref;
}
