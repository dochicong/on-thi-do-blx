/**
 * CountUpNumber.js — Điểm số đếm tăng dần (0 → target) khi vào màn kết quả.
 * Dùng requestAnimationFrame nội bộ (đơn giản, chắc chắn, không phụ thuộc
 * Animated.Text listener qua lại).
 */
import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

type Props = {
  target: number;
  duration?: number;
  style?: object | object[];
  suffix?: string;
  delay?: number;
};

export default function CountUpNumber({
  target,
  duration = 900,
  style,
  suffix = "",
  delay = 200,
}: Props) {
  const targetNum = Math.max(0, Math.round(Number(target) || 0));
  const [shown, setShown] = useState(0);
  const raf = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    let start: number | null = null;
    let alive = true;
    const step = (ts: number) => {
      if (!alive) return;
      if (start == null) start = ts;
      const elapsed = ts - (start as number) - delay;
      const t = Math.min(1, Math.max(0, elapsed / duration));
      // easeOutCubic — nhanh đầu, chậm cuối, cảm giác "về đích"
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * targetNum));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      alive = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [targetNum, duration, delay]);

  return (
    <Text style={[style, { fontVariant: ["tabular-nums"] }]}>
      {shown}
      {suffix}
    </Text>
  );
}
