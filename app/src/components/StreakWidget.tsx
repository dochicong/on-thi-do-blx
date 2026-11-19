/**
 * Widget chuỗi ngày học: lửa, kỷ lục, bảo hiểm chuỗi, 7 ngày gần
 * nhất và tiến độ mục tiêu ngày. Chỉ đọc dữ liệu local, không gọi mạng.
 */
import React from 'react';
import { Text, View } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import type { StreakInfo } from '../storage/progress';

export function StreakWidget({ info, compact = false }: { info: StreakInfo; compact?: boolean }) {
  const { c } = useTheme();
  const pct = info.goal > 0 ? Math.min(100, Math.round((info.todayCount / info.goal) * 100)) : 0;
  const atRisk = !info.todayStudied && info.current > 0;

  return (
    <View
      style={{
        backgroundColor: c.card,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: radius.l,
        padding: spacing.l,
        gap: spacing.m,
      }}
    >
      {!compact ? (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 34 }}>{info.current > 0 ? '🔥' : '🌱'}</Text>
        <View style={{ flex: 1, marginLeft: spacing.m }}>
          <Text style={{ color: c.text, fontSize: 24, fontWeight: '800' }}>
            {info.current > 0 ? `${info.current} ngày` : 'Chưa có chuỗi'}
          </Text>
          <Text style={{ color: c.textDim, fontSize: 12.5 }}>
            Kỷ lục {info.longest} ngày · Mục tiêu {info.goal} câu/ngày
          </Text>
        </View>
        <View
          style={{
            backgroundColor: c.chip,
            borderRadius: radius.round,
            paddingHorizontal: spacing.m,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: c.textDim, fontSize: 12, fontWeight: '700' }}>❄ {info.freezesLeft}</Text>
        </View>
      </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {info.last7.map((d) => {
          const studied = d.state === 'studied';
          const frozen = d.state === 'frozen';
          return (
            <View key={d.day} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: studied ? c.accent : frozen ? c.warn : c.chip,
                  borderWidth: studied || frozen ? 0 : 1,
                  borderColor: c.border,
                }}
              >
                <Text style={{ fontSize: 12, color: studied ? '#fff' : frozen ? '#fff' : c.textDim }}>
                  {studied ? '✓' : frozen ? '❄' : ''}
                </Text>
              </View>
              <Text style={{ color: c.textDim, fontSize: 10.5 }}>{d.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: c.textDim, fontSize: 12 }}>Hôm nay {info.todayCount}/{info.goal} câu</Text>
          <Text style={{ color: info.goalReached ? c.success : c.textDim, fontSize: 12, fontWeight: '700' }}>
            {info.goalReached ? 'Đạt mục tiêu 🎉' : `${pct}%`}
          </Text>
        </View>
        <View style={{ height: 8, backgroundColor: c.chip, borderRadius: 999, overflow: 'hidden' }}>
          <View
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: info.goalReached ? c.success : c.accent,
            }}
          />
        </View>
      </View>

      {atRisk ? (
        <View
          style={{
            backgroundColor: c.warn + '22',
            borderRadius: radius.m,
            padding: spacing.m,
          }}
        >
          <Text style={{ color: c.warn, fontSize: 12.5, fontWeight: '600' }}>
            Hôm nay chưa học — chuỗi {info.current} ngày sẽ mất nếu bỏ qua hôm nay.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
