/**
 * UI kit dùng chung — mọi màu lấy từ useTheme().c để Dark/Light tự đổi.
 */
import React from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '../theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll = false, padded = true }: ScreenProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!scroll) {
    return (
      <View
        style={[
          { flex: 1, backgroundColor: c.bg, paddingTop: insets.top + spacing.s },
          padded && { paddingHorizontal: spacing.l },
        ]}
      >
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingHorizontal: padded ? spacing.l : 0,
        paddingTop: insets.top + spacing.s,
        paddingBottom: spacing.xxl,
        gap: spacing.l,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function Card({ children, style, onPress }: CardProps) {
  const { c } = useTheme();
  const base: ViewStyle = {
    backgroundColor: c.card,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.l,
    padding: spacing.l,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        base,
        style,
        pressed ? { opacity: 0.85, transform: [{ scale: 0.995 }] } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
      }}
    >
      <Text style={{ color: c.text, fontSize: 17, fontWeight: '700' }}>{children}</Text>
      {right ?? null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'accent',
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger' | 'success';
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const bg = tone === 'danger' ? c.danger : tone === 'success' ? c.success : c.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.m,
          paddingVertical: spacing.m,
          paddingHorizontal: spacing.l,
          alignItems: 'center',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: radius.m,
          paddingVertical: spacing.m,
          paddingHorizontal: spacing.l,
          alignItems: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'success' | 'danger';
}) {
  const { c } = useTheme();
  const color = tone === 'success' ? c.success : tone === 'danger' ? c.danger : c.text;
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color, fontSize: 24, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: c.textDim, fontSize: 12.5, marginTop: 2 }}>{label}</Text>
      {sub ? <Text style={{ color: c.textDim, fontSize: 11, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? c.chipActive : c.chip,
        borderRadius: radius.round,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
      }}
    >
      <Text style={{ color: active ? c.chipTextActive : c.textDim, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ percent, tone }: { percent: number; tone?: 'success' | 'danger' }) {
  const { c } = useTheme();
  const w = Math.max(0, Math.min(100, percent));
  const bg = tone === 'danger' ? c.danger : tone === 'success' ? c.success : c.accent;
  return (
    <View style={{ height: 8, backgroundColor: c.chip, borderRadius: 999, overflow: 'hidden' }}>
      <View style={{ width: `${w}%`, height: '100%', backgroundColor: bg }} />
    </View>
  );
}
