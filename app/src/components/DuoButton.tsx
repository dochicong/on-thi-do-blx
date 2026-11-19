/**
 * ProButton (tên file giữ DuoButton cho tương thích) — nút bấm nổi 3D
 * chuyên nghiệp: cạnh đáy tạo chiều sâu, lún spring khi nhấn.
 *
 * Cấu trúc: một "gờ đáy" màu tối hơn nằm dưới + mặt nút nổi phía trên. Khi nhấn,
 * mặt nút lún xuống đúng bằng độ dày gờ (Animated.spring) rồi nảy về — tạo cảm
 * giác bấm thật. Có haptic và hỗ trợ Light/Dark.
 */
import React, { useCallback, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { haptics } from '../utils/haptics';

export type DuoVariant = 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'ghost';
export type DuoSize = 'sm' | 'md' | 'lg';

type VariantColors = { face: string; edge: string; text: string; border?: string };

const LIGHT: Record<DuoVariant, VariantColors> = {
  primary: { face: '#1D4ED8', edge: '#163CA8', text: '#FFFFFF' },
  success: { face: '#0F766E', edge: '#0A5A54', text: '#FFFFFF' },
  danger: { face: '#DC2626', edge: '#A31D1D', text: '#FFFFFF' },
  warning: { face: '#F59E0B', edge: '#B36F08', text: '#FFFFFF' },
  neutral: { face: '#FFFFFF', edge: '#CBD5E1', text: '#0B1220', border: '#E2E8F0' },
  ghost: { face: 'transparent', edge: 'transparent', text: '#0B1220', border: '#CBD5E1' },
};

const DARK: Record<DuoVariant, VariantColors> = {
  primary: { face: '#3B82F6', edge: '#1D4ED8', text: '#FFFFFF' },
  success: { face: '#2DD4BF', edge: '#14B8A6', text: '#04211D' },
  danger: { face: '#F87171', edge: '#DC2626', text: '#2A0505' },
  warning: { face: '#F59E0B', edge: '#B45309', text: '#FFFFFF' },
  neutral: { face: '#1B2438', edge: '#0C1322', text: '#F2F6FF', border: '#243049' },
  ghost: { face: 'transparent', edge: 'transparent', text: '#F2F6FF', border: '#243049' },
};

const SIZES: Record<DuoSize, { height: number; edge: number; radius: number; font: number; padH: number }> = {
  sm: { height: 40, edge: 4, radius: 12, font: 13.5, padH: 14 },
  md: { height: 50, edge: 5, radius: 15, font: 15, padH: 18 },
  lg: { height: 58, edge: 6, radius: 18, font: 17, padH: 22 },
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: DuoVariant;
  size?: DuoSize;
  /** icon vector phía trước (khuyến nghị dùng thay emoji) */
  leadingIcon?: React.ComponentProps<typeof Ionicons>['name'];
  /** icon vector phía sau */
  trailingIcon?: React.ComponentProps<typeof Ionicons>['name'];
  /** @deprecated dùng leadingIcon */
  icon?: string;
  /** @deprecated dùng trailingIcon */
  rightIcon?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /** mức haptic khi nhấn: none để tắt */
  haptic?: 'selection' | 'light' | 'medium' | 'none';
  accessibilityLabel?: string;
};

export function DuoButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  icon,
  rightIcon,
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  haptic = 'selection',
  accessibilityLabel,
}: Props) {
  const { isDark } = useTheme();
  // Giữ Animated.Value trong state (giá trị ổn định) thay vì ref:
  // React Compiler không cho đọc ref trong lúc render, còn interpolate phải chạy khi render.
  const [anim] = useState(() => new Animated.Value(0));
  const palette = (isDark ? DARK : LIGHT)[variant];
  const dims = SIZES[size];
  const inactive = disabled || loading;

  const spring = useCallback(
    (toValue: number, bounciness: number) => {
      Animated.spring(anim, {
        toValue,
        useNativeDriver: true,
        speed: 30,
        bounciness,
      }).start();
    },
    [anim],
  );

  const handlePressIn = useCallback(() => {
    if (inactive) return;
    spring(1, 0);
    if (haptic === 'selection') haptics.selection();
    else if (haptic === 'light') haptics.impactLight();
    else if (haptic === 'medium') haptics.impactMedium();
  }, [inactive, spring, haptic]);

  const handlePressOut = useCallback(() => {
    if (inactive) return;
    spring(0, 7);
  }, [inactive, spring]);

  const handlePress = useCallback(() => {
    if (inactive) return;
    onPress?.();
  }, [inactive, onPress]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dims.edge],
  });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}
    >
      <View style={{ height: dims.height + dims.edge }}>
        {/* gờ đáy 3D */}
        <View
          style={{
            position: 'absolute',
            top: dims.edge,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: dims.radius,
            backgroundColor: palette.edge,
            borderWidth: palette.border && variant !== 'ghost' ? 1 : 0,
            borderColor: palette.border,
          }}
        />
        {/* mặt nút */}
        <Animated.View
          style={[
            styles.face,
            {
              height: dims.height,
              borderRadius: dims.radius,
              backgroundColor: palette.face,
              paddingHorizontal: dims.padH,
              borderWidth: palette.border ? 1.5 : 0,
              borderColor: palette.border,
              opacity: inactive ? 0.55 : 1,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {leadingIcon ? (
            <Ionicons name={leadingIcon} size={dims.font + 6} color={palette.text} />
          ) : icon ? (
            <Text style={[styles.icon, { fontSize: dims.font + 3 }]}>{icon}</Text>
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.label, { color: palette.text, fontSize: dims.font }, textStyle]}
          >
            {loading ? 'Đang xử lý…' : label}
          </Text>
          {trailingIcon ? (
            <Ionicons name={trailingIcon} size={dims.font + 4} color={palette.text} />
          ) : rightIcon ? (
            <Text style={[styles.icon, { color: palette.text, fontSize: dims.font + 3 }]}>
              {rightIcon}
            </Text>
          ) : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontWeight: '800', letterSpacing: 0.2 },
  icon: { fontWeight: '800' },
});

export default DuoButton;
