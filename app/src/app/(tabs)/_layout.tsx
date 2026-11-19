import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ColorValue, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useExamMode } from '../../state/examMode';
import { useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function FourTabItem({
  name,
  label,
  focused,
  isDark,
}: {
  name: IconName;
  label: string;
  focused: boolean;
  isDark: boolean;
}) {
  const activeColor = isDark ? '#60A5FA' : '#1D63ED';
  const inactiveColor = isDark ? '#94A3B8' : '#64748B';
  const activeBg = isDark ? 'rgba(96,165,250,0.16)' : '#EFF6FF';

  return (
    <View
      style={{
        minWidth: 74,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: focused ? activeBg : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Ionicons
        name={focused ? name : (`${name}-outline` as IconName)}
        size={20}
        color={(focused ? activeColor : inactiveColor) as ColorValue}
      />
      <Text
        style={{
          fontSize: 11,
          fontWeight: focused ? '800' : '600',
          color: focused ? activeColor : inactiveColor,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { c, isDark } = useTheme();
  const { hidden } = useExamMode();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: isDark ? '#60A5FA' : '#1D63ED',
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: hidden
          ? { display: 'none' }
          : {
              backgroundColor: c.card,
              borderTopColor: c.border,
              borderTopWidth: 1,
              height: 70 + insets.bottom,
              paddingTop: 8,
              paddingBottom: insets.bottom + 8,
              paddingHorizontal: 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.28 : 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: -2 },
            },
        tabBarItemStyle: { paddingVertical: 0 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Học nhanh',
          tabBarIcon: ({ focused }) => (
            <FourTabItem name="albums" label="Học nhanh" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Câu hỏi',
          tabBarIcon: ({ focused }) => (
            <FourTabItem name="book" label="Câu hỏi" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="signs"
        options={{
          title: 'Biển báo',
          tabBarIcon: ({ focused }) => (
            <FourTabItem name="prism" label="Biển báo" focused={focused} isDark={isDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="theory"
        options={{
          title: 'Nội dung',
          tabBarIcon: ({ focused }) => (
            <FourTabItem name="reader" label="Nội dung" focused={focused} isDark={isDark} />
          ),
        }}
      />
      {/* Cài đặt được đặt trong biểu tượng bánh răng ⚙ trên Header Trang chủ, ẩn khỏi thanh 4 tab dưới */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Cài đặt',
        }}
      />
    </Tabs>
  );
}
