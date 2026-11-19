/**
 * AnimatedStreak.tsx — Thẻ chuỗi ngày học với animation ngọn lửa.
 */
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { haptics } from '../utils/haptics';

type Props = {
  streak: number;
  dailyGoalDone?: boolean;
  onPress?: () => void;
};

export function AnimatedStreakCard({ streak, dailyGoalDone = false, onPress }: Props) {
  const { c } = useTheme();
  const [flameAnim] = useState(() => new Animated.Value(1));
  const [glowAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Animation nhịp đập của ngọn lửa
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.18,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1.0,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    if (streak > 0) {
      pulse.start();
      glow.start();
    }

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [streak, flameAnim, glowAnim]);

  const handlePress = () => {
    haptics.impactLight();
    onPress?.();
  };

  const hasStreak = streak > 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        st.card,
        {
          backgroundColor: hasStreak ? c.accentSoft : c.card,
          borderColor: hasStreak ? c.accent : c.border,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={st.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={st.badgeRow}>
            <View
              style={[
                st.tag,
                {
                  backgroundColor: hasStreak ? c.accent : c.chip,
                },
              ]}
            >
              <Text
                style={[
                  st.tagText,
                  { color: hasStreak ? c.chipTextActive : c.textDim },
                ]}
              >
                {hasStreak ? 'GIỮ CHUỖI ĐỀU' : 'MỤC TIÊU HÔM NAY'}
              </Text>
            </View>
            {dailyGoalDone && (
              <View style={[st.tag, { backgroundColor: c.success }]}>
                <Text style={[st.tagText, { color: '#fff' }]}>✓ ĐÃ ĐẠT CHỈ TIÊU</Text>
              </View>
            )}
          </View>

          <Text style={[st.title, { color: hasStreak ? c.accent : c.text }]}>
            {hasStreak ? `Chuỗi ${streak} ngày giữ lửa` : 'Bắt đầu chuỗi học tập'}
          </Text>

          <Text style={[st.desc, { color: c.textDim }]}>
            {hasStreak
              ? 'Mỗi ngày hoàn thành 1 bài thi hoặc ôn 15 biển báo để duy trì phong độ.'
              : 'Học 5 phút hôm nay để thắp sáng chuỗi streak đầu tiên của bạn!'}
          </Text>
        </View>

        {/* Biểu tượng lửa animated */}
        <Animated.View
          style={[
            st.flameContainer,
            {
              transform: [{ scale: hasStreak ? flameAnim : 1 }],
            },
          ]}
        >
          <Text style={st.flameEmoji}>{hasStreak ? '🔥' : '🌱'}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: radius.l,
    borderWidth: 1.5,
    padding: spacing.l,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: 2,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.s,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  flameContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameEmoji: {
    fontSize: 42,
  },
});
