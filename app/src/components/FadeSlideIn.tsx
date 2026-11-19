/**
 * FadeSlideIn.js — Hiệu ứng xuất hiện: fade + trượt nhẹ lên, dùng cho card,
 * câu hỏi khi chuyển trang, màn kết quả. Không làm chậm thao tác người dùng.
 */
import React, { useEffect, useState } from "react";
import { Animated } from "react-native";
import { motion } from "../theme";

type Props = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: object | object[];
};

export default function FadeSlideIn({ children, delay = 0, distance = 14, style }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [ty] = useState(() => new Animated.Value(distance));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, ...motion.normal, delay }),
      Animated.timing(ty, { toValue: 0, ...motion.slow, delay }),
    ]).start();
  }, [opacity, ty, delay]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY: ty }] }]}
    >
      {children}
    </Animated.View>
  );
}
