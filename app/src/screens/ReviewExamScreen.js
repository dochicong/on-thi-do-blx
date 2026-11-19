// ReviewExamScreen.js — Màn hình Ôn lại đáp án chi tiết (答えのおさらい) theo đúng mẫu Ảnh 3 bên phải.
// Hỗ trợ bộ lọc (Tất cả / Câu sai / Câu bẫy / Tình huống), hiển thị Câu N + Chính xác/Chưa đúng,
// giải thích in đậm kèm ExplanationBox và 2 huy hiệu tròn xanh/đỏ cho "Đáp án" và "Bạn chọn".

import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuestionImage } from "../components/QuestionImage";
import JapaneseOriginal from "../components/JapaneseOriginal";
import { ExplanationBox } from "../components/ExplanationBox";
import { explain } from "../explanationsAdapter";
import { answerSheetImage } from "../assets_map";
import { analyzeQuestionTrap } from "../traps";
import { haptics } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function AnswerCircleBadge({ mark, label }) {
  const isTrue = mark === "D" || mark === "○" || mark === true;
  const isFalse = mark === "S" || mark === "✕" || mark === false;
  const bg = isTrue ? "#68C37D" : isFalse ? "#EF5350" : "#94A3B8";

  return (
    <View style={st.circleBadgeCol}>
      <View style={[st.circleBadge, { backgroundColor: bg }]}>
        {isTrue ? (
          <View style={st.doubleRingOuter}>
            <View style={st.doubleRingInner} />
          </View>
        ) : isFalse ? (
          <Ionicons name="close" size={24} color="#FFFFFF" />
        ) : (
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 16 }}>—</Text>
        )}
      </View>
      <Text style={st.circleBadgeCaption}>{label}</Text>
    </View>
  );
}

export default function ReviewExamScreen({
  paper,
  answers = {},
  result,
  onBack,
  onRetake,
}) {
  const { c: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all");
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const exam = paper?.exam || {};
  const questions = useMemo(() => paper?.questions || [], [paper]);

  const questionsWithStatus = useMemo(() => {
    return questions.map((q) => {
      const ua = answers[q.id];
      const isSit = q.section === "situational";
      const isAnswered = ua != null;

      let isCorrect = false;
      let isKnown =
        q.answer != null ||
        (isSit && Array.isArray(q.choices_answers) && q.choices_answers.length > 0);

      if (isKnown && isAnswered) {
        if (isSit) {
          const choices_answers = q.choices_answers || [];
          isCorrect = (q.choices_vi || []).every(
            (_, i) => ua && ua[String(i + 1)] === choices_answers[i]
          );
        } else {
          isCorrect = ua === q.answer;
        }
      }

      const trap = analyzeQuestionTrap(q);
      const hasTrap = trap.category.key !== "GENERAL_RULE";

      return {
        ...q,
        userAnswer: ua,
        isAnswered,
        isCorrect,
        isKnown,
        trap,
        hasTrap,
      };
    });
  }, [questions, answers]);

  const counts = useMemo(() => {
    const wrong = questionsWithStatus.filter((q) => q.isAnswered && !q.isCorrect).length;
    const unanswered = questionsWithStatus.filter((q) => !q.isAnswered).length;
    const traps = questionsWithStatus.filter((q) => q.hasTrap).length;
    const sit = questionsWithStatus.filter((q) => q.section === "situational").length;
    return { all: questions.length, wrong, unanswered, traps, sit };
  }, [questionsWithStatus, questions.length]);

  const filteredQuestions = useMemo(() => {
    if (filter === "wrong") return questionsWithStatus.filter((q) => q.isAnswered && !q.isCorrect);
    if (filter === "unanswered") return questionsWithStatus.filter((q) => !q.isAnswered);
    if (filter === "traps") return questionsWithStatus.filter((q) => q.hasTrap);
    if (filter === "sit") return questionsWithStatus.filter((q) => q.section === "situational");
    return questionsWithStatus;
  }, [questionsWithStatus, filter]);

  const scanImageSource = answerSheetImage(exam.id) || null;

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      {/* Thanh Header màu xanh da trời nhạt đồng bộ Ảnh 3 */}
      <View style={st.header}>
        <Pressable
          onPress={() => {
            haptics.selection();
            onBack?.();
          }}
          style={st.headerBtn}
        >
          <Ionicons name="close" size={22} color="#0F2942" />
        </Pressable>
        <Text style={st.headerTitle} numberOfLines={1}>
          Ôn lại đáp án
        </Text>
        <Pressable
          onPress={() => {
            haptics.selection();
            onRetake?.();
          }}
          style={st.headerBtn}
        >
          <Text style={{ color: "#1E3F7F", fontSize: 13, fontWeight: "800" }}>Làm lại</Text>
        </Pressable>
      </View>

      {/* Thanh lọc nhanh */}
      <View style={st.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.s }}
        >
          {[
            { key: "all", label: `Tất cả (${counts.all})` },
            { key: "wrong", label: `Câu sai (${counts.wrong})` },
            { key: "traps", label: `Câu bẫy (${counts.traps})` },
            { key: "sit", label: `Tình huống (${counts.sit})` },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  haptics.selection();
                  setFilter(tab.key);
                }}
                style={[st.filterChip, active ? st.filterChipActive : st.filterChipInactive]}
              >
                <Text
                  style={[
                    st.filterChipText,
                    { color: active ? "#FFFFFF" : "#0F2942" },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredQuestions}
        keyExtractor={(item) => item.id}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={st.listPadding}
        renderItem={({ item, index }) => {
          const isSit = item.section === "situational";
          const expData = explain(
            item,
            item.isAnswered
              ? { isCorrect: item.isCorrect }
              : { correctLabel: "Câu này bạn chưa trả lời" }
          );
          const choices_answers = item.choices_answers || [];

          return (
            <View style={st.questionBlock}>
              <View style={st.qTopRow}>
                <Text style={st.qNumText}>Câu {item.number || index + 1}</Text>
                <Text
                  style={[
                    st.qVerdictText,
                    { color: item.isCorrect ? "#0F172A" : "#DC2626" },
                  ]}
                >
                  {item.isCorrect
                    ? "Chính xác"
                    : item.isAnswered
                    ? "Chưa đúng"
                    : "Chưa trả lời"}
                </Text>
              </View>

              <QuestionImage questionId={item.id} height={190} />
              <Text style={st.qText}>{item.text_vi}</Text>
              <JapaneseOriginal question={item} />

              {expData?.why ? (
                <Text style={st.boldWhyText}>{expData.why}</Text>
              ) : null}

              {isSit ? (
                <View style={{ gap: 8, marginTop: 6 }}>
                  {(item.choices_vi || []).map((choice, i) => {
                    const cNum = String(i + 1);
                    const userChoice = item.userAnswer ? item.userAnswer[cNum] : null;
                    const correctChoice = choices_answers[i];
                    return (
                      <View key={cNum} style={st.sitItemCard}>
                        <Text style={st.sitChoiceText}>
                          Ý {cNum}: {choice}
                        </Text>
                        <View style={st.badgesPairRow}>
                          <AnswerCircleBadge mark={correctChoice} label="Đáp án" />
                          <AnswerCircleBadge mark={userChoice} label="Bạn chọn" />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={st.badgesPairRow}>
                  <AnswerCircleBadge mark={item.answer} label="Đáp án" />
                  <AnswerCircleBadge mark={item.userAnswer} label="Bạn chọn" />
                </View>
              )}

              <ExplanationBox {...expData} title="Chi tiết luật & Mẹo tránh bẫy" />
            </View>
          );
        }}
      />

      <Modal visible={scanModalVisible} transparent animationType="slide">
        <View style={[st.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <Pressable onPress={() => setScanModalVisible(false)}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>Đóng</Text>
            </Pressable>
            {scanImageSource ? (
              <Image
                source={scanImageSource}
                style={{ width: SCREEN_WIDTH - 64, height: 460 }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FA",
  },
  header: {
    height: 54,
    backgroundColor: "#B4DCF2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F2942",
  },
  headerBtn: {
    padding: 6,
  },
  filterBar: {
    backgroundColor: "#D5ECF9",
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: "#0F2942",
    borderColor: "#0F2942",
  },
  filterChipInactive: {
    backgroundColor: "transparent",
    borderColor: "rgba(15,41,66,0.4)",
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  questionBlock: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,41,66,0.12)",
    gap: 10,
  },
  qTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qNumText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  qVerdictText: {
    fontSize: 14.5,
    fontWeight: "800",
  },
  qText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#1E293B",
  },
  boldWhyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
    color: "#0F172A",
  },
  sitItemCard: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  sitChoiceText: {
    fontSize: 13.5,
    color: "#0F172A",
    fontWeight: "600",
  },
  badgesPairRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 4,
  },
  circleBadgeCol: {
    alignItems: "center",
    gap: 4,
  },
  circleBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  doubleRingOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  doubleRingInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  circleBadgeCaption: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.m,
  },
  modalContent: {
    borderRadius: radius.l,
    padding: spacing.l,
  },
});
