// ResultScreen.js — Màn hình Kết quả & Ôn lại đáp án theo đúng mẫu thiết kế Ảnh 3 (bên phải).
// - Nửa trên nền Xanh da trời pastel (#B4DCF2): thanh tiêu đề kèm nút ✕, hình Tên lửa phóng lên,
//   dòng chữ "Bạn đã vất vả rồi!", thanh tiến độ, điểm số lớn "10 / 14" (Câu trả lời đúng / Tổng số câu),
//   và nút viền tròn "Học lại lần nữa".
// - Nửa dưới nền Xanh băng nhạt (#E3F2FA): tiêu đề "Ôn lại đáp án", danh sách từng câu hỏi
//   kèm nhận định "Câu 1  Chính xác", nội dung câu hỏi, giải thích in đậm, và 2 huy hiệu tròn
//   màu xanh/đỏ hiển thị ○ / ✕ cho "Đáp án" và "Bạn chọn".

import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SPEC, fmtTime } from "../data";
import { answerSheetImage } from "../assets_map";
import { explain } from "../explanationsAdapter";
import { QuestionImage } from "../components/QuestionImage";
import { CelebrationOverlay } from "../components/Celebration";
import { DuoButton } from "../components/DuoButton";
import { haptics } from "../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Huy hiệu tròn hiển thị ○ (vòng tròn kép xanh lá) hoặc ✕ (đỏ) giống hệt Ảnh 3 */
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

export default function ResultScreen({
  paper,
  answers = {},
  result,
  timeSpent = 0,
  onReview,
  onRetake,
  onHome,
}) {
  const { c: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(() => Boolean(result?.passKnown === true));
  const [displayScore, setDisplayScore] = useState(0);

  const exam = paper?.exam || {};
  const questions = useMemo(() => paper?.questions || [], [paper]);
  const spec = paper?.spec || SPEC.karimen;

  const [trophyScale] = useState(() => new Animated.Value(0.1));
  const [badgeScale] = useState(() => new Animated.Value(0.4));
  const [scoreScale] = useState(() => new Animated.Value(0.6));
  const [contentOpacity] = useState(() => new Animated.Value(0));

  const stats = useMemo(() => {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const ua = answers[q.id];
      const isSit = q.section === "situational";
      if (ua == null) {
        unansweredCount += 1;
      } else if (isSit) {
        const key = q.choices_answers;
        if (key && Array.isArray(key)) {
          const nItems = (q.choices_vi || []).length;
          const answered = ua && Object.keys(ua).length >= nItems;
          const isRight =
            answered && (q.choices_vi || []).every((_, i) => ua[String(i + 1)] === key[i]);
          if (isRight) correctCount += 1;
          else wrongCount += 1;
        } else {
          unansweredCount += 1;
        }
      } else if (q.answer != null) {
        const isRight = ua === q.answer;
        if (isRight) correctCount += 1;
        else wrongCount += 1;
      }
    });

    const isPendingAll = result?.pending === questions.length;
    const isPassed = result?.passKnown === true;
    const isFailed = result?.passKnown === false;

    return {
      correctCount,
      wrongCount,
      unansweredCount,
      isPendingAll,
      isPassed,
      isFailed,
      score: result?.scoreKnown ?? correctCount,
      maxScore: result?.maxKnown > 0 ? result.maxKnown : spec.max_score,
      passScore: spec.pass_score,
    };
  }, [questions, answers, result, spec]);

  // Đếm tăng dần lên số câu đúng
  useEffect(() => {
    const target = stats.correctCount;
    if (target <= 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 700;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * target);
      setDisplayScore(current);
      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 24);
    return () => clearInterval(interval);
  }, [stats.correctCount]);

  useEffect(() => {
    let t1, t2;
    if (stats.isPassed) {
      haptics.success();
      t1 = setTimeout(() => haptics.impactMedium(), 280);
      t2 = setTimeout(() => haptics.success(), 580);
    } else if (stats.isFailed) {
      haptics.warning();
      t1 = setTimeout(() => haptics.error(), 320);
    } else {
      haptics.impactLight();
    }

    Animated.parallel([
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stats.isPassed, stats.isFailed, trophyScale, badgeScale, scoreScale, contentOpacity]);

  const scanImageSource = answerSheetImage(exam.id) || null;
  const progressPct =
    questions.length > 0 ? Math.round((stats.correctCount / questions.length) * 100) : 0;

  return (
    <View style={[st.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#E3F2FA" }}
        showsVerticalScrollIndicator={false}
      >
        {/* NỬA TRÊN: NỀN XANH DA TRỜI (#B4DCF2) + TÊN LỬA + ĐIỂM SỐ GIỐNG HỆT ẢNH 3 BÊN PHẢI */}
        <View style={st.topSkySection}>
          {/* Thanh tiêu đề trên cùng: Nút ✕ + Tên chuyên đề/bài thi */}
          <View style={st.topHeaderRow}>
            <Pressable
              onPress={() => {
                haptics.selection();
                onHome?.();
              }}
              style={st.closeIconBtn}
            >
              <Ionicons name="close" size={24} color="#0F2942" />
            </Pressable>
            <Text style={st.topHeaderTitle} numberOfLines={1}>
              {exam.title || "Tuân thủ đèn tín hiệu"}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Hình minh họa Tên lửa (Rocket) nảy spring ở giữa */}
          <Animated.View
            style={[
              st.rocketWrap,
              { transform: [{ scale: trophyScale }] },
            ]}
          >
            <Text style={st.sparkleDecorTop}>✦          ○</Text>
            <View style={st.rocketCircle}>
              <Ionicons
                name="rocket"
                size={68}
                color="#0F2942"
                style={{ transform: [{ rotate: "15deg" }] }}
              />
            </View>
            <Text style={st.sparkleDecorBottom}>○          ✦</Text>
          </Animated.View>

          {/* Lời động viên: Bạn đã vất vả rồi! (おつかれさまでした！) */}
          <Text style={st.congratsSubtitle}>Bạn đã vất vả rồi!</Text>

          {/* Thanh tiến độ ngang */}
          <View style={st.skyProgressTrack}>
            <View style={[st.skyProgressFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Điểm số phân số lớn: 10 / 14 kèm nhãn bên dưới */}
          <Animated.View
            style={[st.fractionWrap, { transform: [{ scale: scoreScale }] }]}
          >
            <View style={st.fractionNumbersRow}>
              <View style={st.fractionCol}>
                <Text style={st.fractionBigNum}>{displayScore}</Text>
                <Text style={st.fractionSubLabel}>Câu trả lời đúng</Text>
              </View>
              <Text style={st.fractionSlash}>/</Text>
              <View style={st.fractionCol}>
                <Text style={st.fractionBigNum}>{questions.length}</Text>
                <Text style={st.fractionSubLabel}>Tổng số câu</Text>
              </View>
            </View>
          </Animated.View>

          {/* Nút viền tròn: Học lại lần nữa (もういちど学習する) */}
          <Pressable
            onPress={() => {
              haptics.impactMedium();
              onRetake?.();
            }}
            style={({ pressed }) => [
              st.retakePillBtn,
              pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={st.retakePillBtnText}>Học lại lần nữa</Text>
          </Pressable>
        </View>

        {/* NỬA DƯỚI: ÔN LẠI ĐÁP ÁN (答えのおさらい) GIỐNG HỆT ẢNH 3 BÊN PHẢI */}
        <View style={st.reviewSection}>
          <Text style={st.reviewSectionHeading}>Ôn lại đáp án</Text>

          {/* Tóm tắt nhanh trạng thái Đúng / Sai / Thời gian */}
          <View style={st.miniStatsRow}>
            <View style={st.miniStatItem}>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text style={st.miniStatText}>Đúng: {stats.correctCount}</Text>
            </View>
            <View style={st.miniStatItem}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={st.miniStatText}>Sai: {stats.wrongCount}</Text>
            </View>
            {timeSpent > 0 ? (
              <View style={st.miniStatItem}>
                <Ionicons name="time" size={16} color="#0F2942" />
                <Text style={st.miniStatText}>{fmtTime(timeSpent)}</Text>
              </View>
            ) : null}
          </View>

          {scanImageSource ? (
            <Pressable
              onPress={() => {
                haptics.impactLight();
                setScanModalVisible(true);
              }}
              style={st.scanBannerBtn}
            >
              <Ionicons name="document-text-outline" size={18} color="#1E3F7F" />
              <Text style={st.scanBannerText}>Xem phiếu đáp án scan gốc</Text>
            </Pressable>
          ) : null}

          {/* Danh sách từng câu hỏi giống hệt Ảnh 3 bên phải */}
          {questions.map((q, idx) => {
            const ua = answers[q.id];
            const isSit = q.section === "situational";
            const exp = explain(q);
            let isRight = false;
            if (isSit && Array.isArray(q.choices_answers)) {
              isRight =
                ua &&
                (q.choices_vi || []).every((_, i) => ua[String(i + 1)] === q.choices_answers[i]);
            } else {
              isRight = ua != null && ua === q.answer;
            }
            const correctMark = isSit ? "D" : q.answer || "D";
            const userMark = isSit ? (isRight ? "D" : ua ? "S" : null) : ua;

            return (
              <View key={q.id} style={st.reviewItemRow}>
                <View style={st.qHeaderLine}>
                  <Text style={st.qIndexLabel}>Câu {q.number || idx + 1}</Text>
                  <Text
                    style={[
                      st.qVerdictLabel,
                      { color: isRight ? "#0F172A" : "#DC2626" },
                    ]}
                  >
                    {isRight ? "Chính xác" : ua != null ? "Chưa đúng" : "Chưa trả lời"}
                  </Text>
                </View>

                {q.images?.length ? (
                  <View style={{ marginVertical: 6 }}>
                    <QuestionImage questionId={q.id} height={170} />
                  </View>
                ) : null}

                <Text style={st.qBodyText}>{q.text_vi}</Text>

                {exp?.why ? (
                  <Text style={st.qBoldExplanation}>{exp.why}</Text>
                ) : null}

                {/* 2 Huy hiệu tròn Đáp án & Bạn chọn giống hệt Ảnh 3 */}
                <View style={st.badgesPairRow}>
                  <AnswerCircleBadge mark={correctMark} label="Đáp án" />
                  <AnswerCircleBadge mark={userMark} label="Bạn chọn" />
                </View>
              </View>
            );
          })}

          {/* Nút mở màn hình lọc câu sai/bẫy chuyên sâu */}
          <View style={{ gap: 12, marginTop: 20 }}>
            <DuoButton
              label={
                stats.isFailed
                  ? `Xem giải thích ${stats.wrongCount} câu sai & Bẫy thi`
                  : "Mở bộ lọc câu hỏi & Phân tích bẫy"
              }
              variant={stats.isFailed ? "danger" : "primary"}
              size="lg"
              onPress={() => {
                haptics.selection();
                onReview?.();
              }}
            />
          </View>
        </View>
      </ScrollView>

      {showCelebration ? (
        <CelebrationOverlay onDone={() => setShowCelebration(false)} />
      ) : null}

      <Modal visible={scanModalVisible} transparent animationType="slide">
        <View style={[st.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>
                Phiếu đáp án gốc ({exam.id})
              </Text>
              <Pressable
                onPress={() => setScanModalVisible(false)}
                style={[st.modalCloseBtn, { backgroundColor: colors.chip }]}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ alignItems: "center" }}>
              {scanImageSource ? (
                <Image
                  source={scanImageSource}
                  style={st.scanFullImage}
                  resizeMode="contain"
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B4DCF2",
  },
  topSkySection: {
    backgroundColor: "#B4DCF2",
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    alignItems: "center",
  },
  topHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F2942",
    maxWidth: "78%",
  },
  rocketWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  rocketCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleDecorTop: {
    fontSize: 12,
    color: "#0F2942",
    marginBottom: 2,
    opacity: 0.65,
  },
  sparkleDecorBottom: {
    fontSize: 12,
    color: "#0F2942",
    marginTop: 2,
    opacity: 0.65,
  },
  congratsSubtitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#0F2942",
    marginTop: 6,
  },
  skyProgressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 14,
  },
  skyProgressFill: {
    height: "100%",
    backgroundColor: "#1E3F7F",
    borderRadius: 999,
  },
  fractionWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  fractionNumbersRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  fractionCol: {
    alignItems: "center",
  },
  fractionBigNum: {
    fontSize: 40,
    fontWeight: "800",
    color: "#0F2942",
    lineHeight: 46,
  },
  fractionSlash: {
    fontSize: 34,
    fontWeight: "700",
    color: "#0F2942",
    marginTop: 4,
  },
  fractionSubLabel: {
    fontSize: 11,
    color: "rgba(15,41,66,0.65)",
    fontWeight: "600",
    marginTop: 2,
  },
  retakePillBtn: {
    marginTop: 22,
    borderWidth: 1.5,
    borderColor: "#0F2942",
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 38,
    backgroundColor: "transparent",
  },
  retakePillBtnText: {
    color: "#0F2942",
    fontSize: 13.5,
    fontWeight: "700",
  },
  reviewSection: {
    backgroundColor: "#E3F2FA",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 48,
  },
  reviewSectionHeading: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    marginBottom: 14,
  },
  miniStatsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginBottom: 14,
  },
  miniStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniStatText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  scanBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  scanBannerText: {
    color: "#1E3F7F",
    fontWeight: "700",
    fontSize: 13,
  },
  reviewItemRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,41,66,0.1)",
    gap: 8,
  },
  qHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qIndexLabel: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569",
  },
  qVerdictLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  qBodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#1E293B",
  },
  qBoldExplanation: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  badgesPairRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.m,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFullImage: {
    width: SCREEN_WIDTH - 64,
    height: 480,
  },
});
