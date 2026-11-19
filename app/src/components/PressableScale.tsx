/**
 * PressableScale.js — Chạm phản hồi nảy nhẹ chuẩn thương mại:
 * scale down khi nhấn, spring về khi thả (không phẳng lì kiểu cũ).
 */
import React, { useState } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";
import { motion } from "../theme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function PressableScale({ children, onPress, style, disabled }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, ...motion.springSoft }).start();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => to(motion.pressScale)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
