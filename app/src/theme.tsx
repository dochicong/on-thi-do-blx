/**
 * Theme toàn app — Sáng / Tối / Theo hệ thống, lưu lựa chọn trong AsyncStorage.
 * API: const { c, mode, scheme, isDark, setMode, toggle, ready } = useTheme();
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const SETTINGS_KEY = '@jplicense/v1/settings';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export type Palette = {
  bg: string; card: string; text: string; textDim: string; accent: string; accentSoft: string;
  success: string; danger: string; warn: string; border: string; chip: string; chipActive: string;
  chipTextActive: string; timerWarn: string; timerDanger: string; overlay: string; pass: string; fail: string;
};

const light: Palette = {
  bg: "#F4F6FA",
  card: "#FFFFFF",
  text: "#0F172A",
  textDim: "#64748B",
  accent: "#2563EB",
  accentSoft: "#EFF4FF",
  success: "#16A34A",
  danger: "#DC2626",
  warn: "#D97706",
  border: "#E4E8F1",
  chip: "#F1F4F9",
  chipActive: "#2563EB",
  chipTextActive: "#FFFFFF",
  timerWarn: "#D97706",
  timerDanger: "#DC2626",
  overlay: "rgba(15,23,42,0.5)",
  pass: "#16A34A",
  fail: "#DC2626",
};

const dark: Palette = {
  bg: "#0B0F17",
  card: "#131A26",
  text: "#F1F5F9",
  textDim: "#94A3B8",
  accent: "#60A5FA",
  accentSoft: "#16233A",
  success: "#4ADE80",
  danger: "#F87171",
  warn: "#FBBF24",
  border: "#232D3F",
  chip: "#1B2434",
  chipActive: "#60A5FA",
  chipTextActive: "#0B0F17",
  timerWarn: "#FBBF24",
  timerDanger: "#F87171",
  overlay: "rgba(2,6,16,0.65)",
  pass: "#4ADE80",
  fail: "#F87171",
};

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { s: 8, m: 12, l: 16, xl: 24, round: 999 };

/** Hằng số chuyển động dùng chung — hiệu ứng mượt, nhất quán toàn app. */
export const motion = {
  pressScale: 0.975,
  spring: { friction: 22, tension: 320, useNativeDriver: true },
  springSoft: { friction: 14, tension: 180, useNativeDriver: true },
  fast: { duration: 120, useNativeDriver: true },
  normal: { duration: 220, useNativeDriver: true },
  slow: { duration: 360, useNativeDriver: true },
};

/** Cỡ chữ chuẩn — hierarchy rõ ràng, số liệu dùng tabular-nums. */
export const font = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, big: 30 };

/** Bóng đổ tinh tế (elevation chuẩn mobile thương mại). */
export const shadow = (c: string, level: 1 | 2 | 3 = 1) =>
  level === 1
    ? { shadowColor: c, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
    : level === 2
    ? { shadowColor: c, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 5 }
    : { shadowColor: c, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 };

export type ThemeValue = {
  c: Palette;
  mode: ThemeMode;
  scheme: Scheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => void;
  ready: boolean;
};

const ThemeCtx = createContext<ThemeValue | null>(null);

function isMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sys = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const saved = raw ? (JSON.parse(raw) as { themeMode?: unknown }).themeMode : null;
        if (alive && isMode(saved)) setModeState(saved);
      } catch {
        // cài đặt hỏng -> dùng theo hệ thống
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, themeMode: next }));
    } catch {
      // vẫn giữ theme trong phiên hiện tại
    }
  }, []);

  const scheme: Scheme = mode === 'system' ? (sys === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeValue>(() => {
    const c = scheme === 'dark' ? dark : light;
    return {
      c,
      mode,
      scheme,
      isDark: scheme === 'dark',
      setMode,
      toggle: () => setMode(scheme === 'dark' ? 'light' : 'dark'),
      ready,
    };
  }, [mode, scheme, setMode, ready]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme phải dùng bên trong <ThemeProvider>');
  return v;
}
