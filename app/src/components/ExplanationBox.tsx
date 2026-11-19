/**
 * ExplanationBox — khung "Giải thích chi tiết" cho một câu hỏi.
 *
 * Mục tiêu: người học đọc hiểu NGAY vì sao đúng/sai, bẫy nằm ở đâu, và mẹo nhớ.
 * Dùng được với nhiều nguồn dữ liệu: module `explanations.js` (gemini-3.8) hoặc
 * `traps.js` (phân tích bẫy tự động). Không có dữ liệu thì tự ẩn.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '../theme';

type Props = {
  /** Vì sao câu này đúng/sai — câu văn tự nhiên, không máy móc */
  why?: string | null;
  /** Câu chốt: đáp án đúng là gì và người học chọn gì */
  verdict?: string | null;
  /** Giải thích chi tiết (nếu nguồn chỉ có 1 trường) */
  explanation?: string | null;
  /** Mô tả bẫy: "bẫy từ khoá tuyệt đối", "bẫy tốc độ 50cc"... */
  trap?: string | null;
  /** Mẹo nhớ nhanh */
  tip?: string | null;
  /** Căn cứ luật (道路交通法 ...) */
  law?: string | null;
  title?: string;
  style?: StyleProp<ViewStyle>;
};

function Section({
  icon,
  color,
  label,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  text: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.s, marginTop: spacing.m }}>
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {/* Nhãn dùng màu chữ chính để đạt WCAG AA ở cả 2 theme; màu ngữ nghĩa nằm ở icon. */}
        <Text style={{ color: c.text, fontWeight: '800', fontSize: 12.5, letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Text style={{ color: c.text, fontSize: 14.5, lineHeight: 21, marginTop: 2 }}>{text}</Text>
      </View>
    </View>
  );
}

export function ExplanationBox({ why, verdict, explanation, trap, tip, law, title, style }: Props) {
  const { c, isDark } = useTheme();
  // Cam gốc (#EF6C00) chỉ đạt 2.7:1 trên nền accentSoft -> dùng cam đậm hơn ở Light.
  const trapColor = isDark ? c.warn : '#C2410C';

  const main = why ?? explanation ?? null;
  const hasAny = Boolean(main || verdict || trap || tip || law);
  if (!hasAny) return null;

  return (
    <View
      style={[
        {
          backgroundColor: isDark ? c.chip : c.accentSoft,
          borderRadius: radius.l,
          borderWidth: 1,
          borderColor: isDark ? c.border : c.accent + '33',
          padding: spacing.l,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderTopLeftRadius: radius.l,
          borderBottomLeftRadius: radius.l,
          backgroundColor: c.accent,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.accent,
          }}
        >
          <Ionicons name="bulb" size={16} color="#fff" />
        </View>
        <Text style={{ color: c.text, fontWeight: '800', fontSize: 15.5 }}>
          {title ?? 'Giải thích chi tiết'}
        </Text>
      </View>

      {verdict ? (
        <Text style={{ color: c.textDim, fontSize: 13, marginTop: spacing.s, fontWeight: '600' }}>
          {verdict}
        </Text>
      ) : null}

      {main ? <Section icon="reader-outline" color={c.accent} label="VÌ SAO" text={main} /> : null}
      {trap ? <Section icon="warning" color={trapColor} label="BẪY THI" text={trap} /> : null}
      {tip ? <Section icon="flash" color={c.success} label="MẸO NHỚ" text={tip} /> : null}
      {law ? <Section icon="document-text" color={c.textDim} label="CĂN CỨ LUẬT" text={law} /> : null}
    </View>
  );
}

export default ExplanationBox;
