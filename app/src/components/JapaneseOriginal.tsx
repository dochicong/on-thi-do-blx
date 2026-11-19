/**
 * JapaneseOriginal.tsx — Nút bật/tắt hiển thị nguyên văn tiếng Nhật (text_ja)
 * của câu hỏi, giúp người học đối chiếu với đề thi thực tế.
 *
 * Trung thực theo dữ liệu:
 *  - Câu có `text_ja` (status matched) → hiện chip "日本語 原文", bấm mở khung
 *    nguyên văn + giải thích Nhật (nếu có).
 *  - Câu `unmatched` → KHÔNG hiện gì (không gắn bừa câu Nhật khác).
 *  - Mặc định thu gọn để không rối mắt khi làm bài.
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius } from "../theme";
import { haptics } from "../utils/haptics";

type Props = {
  question: { text_ja?: string | null; explanation_ja?: string | null };
};

export default function JapaneseOriginal({ question }: Props) {
  const { c: colors } = useTheme();
  const [open, setOpen] = useState(false);
  const ja = question?.text_ja;
  if (!ja) return null;

  return (
    <View style={st.wrap}>
      <Pressable
        onPress={() => {
          haptics.selection();
          setOpen((v) => !v);
        }}
        style={[
          st.chip,
          {
            backgroundColor: open ? colors.accentSoft : colors.chip,
            borderColor: colors.border,
          },
        ]}
        accessibilityLabel="Xem nguyên văn tiếng Nhật"
      >
        <Ionicons name="language" size={13} color={colors.accent} />
        <Text style={[st.chipText, { color: colors.accent }]}>
          日本語 原文
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={12}
          color={colors.accent}
        />
      </Pressable>
      {open ? (
        <View
          style={[
            st.box,
            { backgroundColor: colors.chip, borderColor: colors.border },
          ]}
        >
          <Text style={[st.jaText, { color: colors.text }]}>{ja}</Text>
          {question.explanation_ja ? (
            <View style={[st.explWrap, { borderColor: colors.border }]}>
              <Text style={[st.explLabel, { color: colors.textDim }]}>
                解説（nguồn gốc）
              </Text>
              <Text style={[st.jaExpl, { color: colors.textDim }]}>
                {question.explanation_ja}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: spacing.xs },
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  box: {
    borderRadius: radius.m,
    borderWidth: 1,
    padding: spacing.m,
    gap: spacing.s,
  },
  jaText: { fontSize: 15, lineHeight: 24 },
  explWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.s },
  explLabel: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  jaExpl: { fontSize: 12, lineHeight: 19 },
});
