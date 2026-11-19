import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAds, maybeShowAppOpen } from '../ads/adManager';
import { setupNotificationHandler } from '../notifications/reminders';
import { ExamModeProvider } from '../state/examMode';
import { ThemeProvider, useTheme } from '../theme';

// Hiển thị thông báo cả khi app đang mở (chỉ gọi 1 lần cho toàn app).
setupNotificationHandler();

function Inner() {
  const { isDark, c } = useTheme();

  // AdMob: khởi tạo SDK + App Open khi mở lại ứng dụng (giãn cách 4 giờ, không chen khi đang thi).
  useEffect(() => {
    let alive = true;
    void initAds().then(() => {
      if (!alive) return;
      // cold start: chờ app ổn định rồi mới cân nhắc hiện App Open
      setTimeout(() => {
        void maybeShowAppOpen();
      }, 1500);
    });
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void maybeShowAppOpen();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ExamModeProvider>
          <Inner />
        </ExamModeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
