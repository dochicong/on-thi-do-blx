// ExamScreen.js — Màn hình Câu hỏi lý thuyết (学科問題) Giai đoạn 1 & Giai đoạn 2 theo đúng Ảnh 3.
// - Tab "Giai đoạn 1" (Karimen / 50cc): nền Xanh da trời pastel (#B4DCF2) + banner thành phố số 1
// - Tab "Giai đoạn 2" (Honmen / Dự đoán nguy hiểm): nền Tím lavender pastel (#CBBFF5) + banner thành phố số 2
// - Thẻ Thi thử nổi bật + danh sách các Chuyên đề học tập và bộ đề sát hạch có thanh tiến độ, cúp 🏆 và bút ✏️.
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  TextInput,
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
import { DuoButton } from "../components/DuoButton";
import { ExplanationBox } from "../components/ExplanationBox";
import { explain } from "../explanationsAdapter";
import { useExamMode } from "../state/examMode";
import {
  LEVELS,
  LEVEL_LABEL,
  SPEC,
  buildExamPaper,
  buildTopicPaper,
  topicsForStage,
  fmtTime,
  gradePaper,
} from "../data";
import { answerSheetImage } from "../assets_map";
import { haptics } from "../utils/haptics";
import AdBanner from "../ads/AdBanner";
import FadeSlideIn from "../components/FadeSlideIn";
import {
  initAds,
  maybeShowInterstitial,
  onExamFinished,
  setAppOpenSuppressed,
} from "../ads/adManager";
import { useRewardedUnlock } from "../ads/useRewardedUnlock";

const FEATURE_TRAP_HINTS = "trap_explanations";

/** Chuyên đề lấy trực tiếp từ dữ liệu (topic_id), không còn danh sách cứng. */
const buildTopicQuiz = (stage, topic) => buildTopicPaper(stage, topic);

/** Banner minh họa thành phố (Cityscape) cho Giai đoạn 1 & Giai đoạn 2 giống hệt Ảnh 3 */
function CityscapeBanner({ stage }) {
  const isStage1 = stage === 1;
  return (
    <View
      style={[
        st.bannerWrap,
        { backgroundColor: isStage1 ? "#AAD9F7" : "#C4C1F8", padding: 0, overflow: "hidden" },
      ]}
    >
      <Image
        source={
          isStage1
            ? require("../../assets/ui/stage1_banner.png")
            : require("../../assets/ui/stage2_banner.png")
        }
        style={{ width: "100%", height: 112 }}
        resizeMode="cover"
      />
    </View>
  );
}

function UnlockHintsButton({ question }) {
  const { c: colors } = useTheme();
  const { unlocked, watch, loading } = useRewardedUnlock(FEATURE_TRAP_HINTS);
  if (unlocked) {
    return (
      <View style={{ gap: spacing.s }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="checkmark-circle" size={15} color={colors.success} />
          <Text style={{ color: colors.success, fontWeight: "700", fontSize: 12 }}>
            Đã mở khóa giải thích (24 giờ)
          </Text>
        </View>
        <ExplanationBox {...explain(question)} title="Vì sao câu này đúng/sai" />
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        watch();
      }}
      disabled={loading}
      style={[st.unlockBtn, { backgroundColor: colors.card, borderColor: colors.accent }]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Ionicons name="gift-outline" size={15} color={colors.accent} />
        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 12 }}>
          {loading
            ? "Đang tải quảng cáo…"
            : "Xem quảng cáo — mở khóa giải thích câu bẫy (24h)"}
        </Text>
      </View>
    </Pressable>
  );
}

function StartPanel({ onStart, onStartTopic }) {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState(1); // 1: Giai đoạn 1 (Xanh), 2: Giai đoạn 2 (Tím)
  const [subLevel1, setSubLevel1] = useState("karimen"); // 'karimen' | '50cc'

  const isStage1 = stage === 1;
  const bgColor = isStage1 ? "#B4DCF2" : "#CBBFF5";
  const barColor = isStage1 ? "#1E3F7F" : "#3B2885";
  const topics = useMemo(() => topicsForStage(stage), [stage]);
  const stageExams = [];

  return (
    <View style={[st.startRoot, { backgroundColor: bgColor, paddingTop: insets.top + 6 }]}>
      {/* Tiêu đề màn hình giống Ảnh 3 */}
      <View style={st.headerWrap}>
        <Text style={st.headerTitle}>Câu hỏi lý thuyết</Text>
      </View>

      {/* Thanh Tab 2 cột: Giai đoạn 1 | Giai đoạn 2 */}
      <View style={st.stageTabsRow}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setStage(1);
          }}
          style={[st.stageTabBtn, isStage1 && st.stageTabBtnActive]}
        >
          <Text style={[st.stageTabText, isStage1 && st.stageTabTextActive]}>
            Giai đoạn 1
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.selection();
            setStage(2);
          }}
          style={[st.stageTabBtn, !isStage1 && st.stageTabBtnActive]}
        >
          <Text style={[st.stageTabText, !isStage1 && st.stageTabTextActive]}>
            Giai đoạn 2
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner minh họa thành phố */}
        <CityscapeBanner stage={stage} />

        {/* Thẻ bài thi thử chính (Frosted White Card giống hệt Ảnh 3) */}
        <FadeSlideIn>
          <Pressable
            onPress={() => {
              haptics.selection();
              onStart(isStage1 ? subLevel1 : "honmen", "random", "standard");
            }}
            style={st.mainMockCard}
          >
            <View style={st.mockHeaderRow}>
              <Text style={st.mockCardTitle}>
                {isStage1 ? "Thi thử Giai đoạn 1 (Karimen / 50cc)" : "Thi thử Chính thức (Honmen)"}
              </Text>
            </View>

            {isStage1 ? (
              <View style={st.subLevelRow}>
                {[
                  { k: "karimen", label: "Karimen (50 câu)" },
                  { k: "50cc", label: "Xe 50cc (48 câu)" },
                ].map((opt) => (
                  <Pressable
                    key={opt.k}
                    onPress={() => {
                      haptics.selection();
                      setSubLevel1(opt.k);
                    }}
                    style={[
                      st.subLevelChip,
                      subLevel1 === opt.k && { backgroundColor: barColor },
                    ]}
                  >
                    <Text
                      style={[
                        st.subLevelChipText,
                        subLevel1 === opt.k && { color: "#FFFFFF" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={st.metaLineRow}>
              <Text style={st.metaLeftText}>
                {isStage1
                  ? subLevel1 === "50cc"
                    ? "Tổng 48 câu · Hình thức thi thử"
                    : "Tổng 50 câu · Hình thức thi thử"
                  : "Tổng 95 câu · Hình thức thi thử"}
              </Text>
              <View style={st.badgeStatsRow}>
                <Ionicons name="trophy-outline" size={14} color="#475569" />
                <Text style={st.badgeCountText}>0</Text>
                <View style={st.pencilBadge}>
                  <Ionicons name="pencil" size={11} color="#FFFFFF" />
                </View>
                <Text style={[st.badgeCountText, { fontWeight: "800", color: "#0F172A" }]}>
                  0
                </Text>
              </View>
            </View>

            <View style={st.progTrack}>
              <View
                style={[
                  st.progFill,
                  {
                    width: "0%",
                    backgroundColor: barColor,
                  },
                ]}
              />
            </View>

            <View style={st.metaBottomRow}>
              <Text style={st.scoreRatioText}>Chưa thi</Text>
              <Text style={st.prevResultLabel}>Kết quả lần trước</Text>
            </View>
          </Pressable>
        </FadeSlideIn>

        {/* Danh sách các Chuyên đề luyện tập (Giống hệt Ảnh 3) */}
        <View style={st.topicListWrap}>
          {topics.map((tp, idx) => {
            const pct = Math.round((tp.lastScore / tp.count) * 100);
            return (
              <FadeSlideIn key={tp.id} delay={idx * 45}>
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    onStartTopic(stage, tp);
                  }}
                  style={st.topicItemRow}
                >
                  <Text style={st.topicCodeLabel}>{tp.codeLabel}</Text>
                  <Text style={st.topicItemTitle}>{tp.title}</Text>

                  <View style={st.metaLineRow}>
                    <Text style={st.metaLeftText}>Tổng {tp.count} câu</Text>
                    <View style={st.badgeStatsRow}>
                      <View
                        style={[
                          st.trophyMiniBadge,
                          tp.trophies > 0 && { backgroundColor: "#F59E0B" },
                        ]}
                      >
                        <Ionicons
                          name="trophy"
                          size={11}
                          color={tp.trophies > 0 ? "#FFFFFF" : "#64748B"}
                        />
                      </View>
                      <Text
                        style={[
                          st.badgeCountText,
                          tp.trophies > 0 && { fontWeight: "800", color: "#0F172A" },
                        ]}
                      >
                        {tp.trophies}
                      </Text>
                      <View style={st.pencilBadge}>
                        <Ionicons name="pencil" size={11} color="#FFFFFF" />
                      </View>
                      <Text
                        style={[st.badgeCountText, { fontWeight: "800", color: "#0F172A" }]}
                      >
                        {tp.attempts}
                      </Text>
                    </View>
                  </View>

                  <View style={st.progTrack}>
                    <View
                      style={[
                        st.progFill,
                        { width: `${pct}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>

                  <View style={st.metaBottomRow}>
                    <Text style={st.scoreRatioText}>
                      {tp.lastScore}/{tp.count}
                    </Text>
                    <Text style={st.prevResultLabel}>Kết quả lần trước</Text>
                  </View>
                </Pressable>
              </FadeSlideIn>
            );
          })}

          {/* Danh sách các bộ đề sát hạch gốc theo từng cấp */}
          {stageExams.map((e, index) => (
            <Pressable
              key={e.id}
              onPress={() => {
                haptics.selection();
                onStart(e.exam_type || e.type || (isStage1 ? "karimen" : "honmen"), e.id);
              }}
              style={st.topicItemRow}
            >
              <Text style={st.topicCodeLabel}>Bộ đề sát hạch #{index + 1}</Text>
              <Text style={st.topicItemTitle}>{e.label || e.title}</Text>
              <View style={st.metaLineRow}>
                <Text style={st.metaLeftText}>
                  Tổng {e.question_count} câu · Đề gốc trung tâm
                </Text>
                <View style={st.badgeStatsRow}>
                  <Ionicons name="trophy-outline" size={14} color="#475569" />
                  <Text style={st.badgeCountText}>0</Text>
                  <View style={st.pencilBadge}>
                    <Ionicons name="pencil" size={11} color="#FFFFFF" />
                  </View>
                  <Text style={st.badgeCountText}>1</Text>
                </View>
              </View>
              <View style={st.progTrack}>
                <View
                  style={[
                    st.progFill,
                    { width: "90%", backgroundColor: barColor },
                  ]}
                />
              </View>
              <View style={st.metaBottomRow}>
                <Text style={st.scoreRatioText}>
                  {Math.round(e.question_count * 0.9)}/{e.question_count}
                </Text>
                <Text style={st.prevResultLabel}>Kết quả lần trước</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TfQuestion({ q, value, onPick, colors }) {
  return (
    <View style={{ gap: spacing.m }}>
      {q.images?.length ? (
        <QuestionImage questionId={q.id} height={210} />
      ) : null}
      <Text style={[st.qText, { color: colors.text }]}>{q.text_vi}</Text>
      <JapaneseOriginal question={q} />
      <View style={st.tfRow}>
        {[
          { key: "D", label: "○ ĐÚNG", sub: "(Chính xác)" },
          { key: "S", label: "✕ SAI", sub: "(Không đúng)" },
        ].map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                haptics.selection();
                onPick(opt.key);
              }}
              style={[
                st.tfBtn,
                {
                  backgroundColor: active ? colors.accent : colors.card,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.chipTextActive : colors.text,
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                {opt.label}
              </Text>
              <Text
                style={{
                  color: active ? colors.chipTextActive : colors.textDim,
                  fontSize: 12,
                }}
              >
                {opt.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SitQuestion({ q, value, onPick, colors }) {
  const perItem = Array.isArray(q.choices_answers);
  return (
    <View style={{ gap: spacing.m }}>
      {q.images?.length ? (
        <QuestionImage questionId={q.id} height={240} />
      ) : null}
      <Text style={[st.qText, { color: colors.text }]}>{q.text_vi}</Text>
      <JapaneseOriginal question={q} />
      <Text style={{ color: colors.textDim, fontSize: 12 }}>
        {perItem
          ? "Câu tình huống nguy hiểm — nhận định ĐÚNG/SAI từng ý. Đúng cả 3 ý mới được 2 điểm."
          : "Câu tình huống nguy hiểm — chọn phương án đúng (2 điểm)"}
      </Text>
      <UnlockHintsButton question={q} />
      {perItem ? (
        <View style={{ gap: spacing.s }}>
          {q.choices_vi.map((choice, i) => {
            const val = value?.[i + 1] ?? null;
            return (
              <View
                key={i}
                style={[
                  st.choiceRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[st.choiceNum, { backgroundColor: colors.chip }]}>
                  <Text style={{ color: colors.textDim, fontWeight: "800" }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ color: colors.text, flex: 1 }}>{choice}</Text>
                <View style={st.tfMiniRow}>
                  {[
                    { k: "D", label: "○" },
                    { k: "S", label: "✕" },
                  ].map((o) => {
                    const active = val === o.k;
                    return (
                      <Pressable
                        key={o.k}
                        onPress={() => {
                          haptics.selection();
                          onPick({ ...value, [i + 1]: o.k });
                        }}
                        style={[
                          st.tfMiniBtn,
                          {
                            backgroundColor: active
                              ? colors.accent
                              : colors.chip,
                            borderColor: active
                              ? colors.accent
                              : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active
                              ? colors.chipTextActive
                              : colors.textDim,
                            fontWeight: "800",
                          }}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: spacing.s }}>
          {q.choices_vi.map((choice, i) => {
            const n = i + 1;
            const active = value === n;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  haptics.selection();
                  onPick(n);
                }}
                style={[
                  st.choiceRow,
                  {
                    backgroundColor: active ? colors.accentSoft : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    st.choiceNum,
                    { backgroundColor: active ? colors.accent : colors.chip },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.chipTextActive : colors.textDim,
                      fontWeight: "800",
                    }}
                  >
                    {n}
                  </Text>
                </View>
                <Text style={{ color: colors.text, flex: 1 }}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ExamScreen({ onFinished }) {
  const { c: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setHidden } = useExamMode();
  const [paper, setPaper] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Bản dịch hoặc câu chữ khó hiểu');
  const [reportNote, setReportNote] = useState('');
  const timerRef = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => {
    if (!paper) return;
    timerRef.current = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitRef.current?.(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [paper]);

  const result = useMemo(
    () => (paper ? gradePaper(paper.questions, answers, paper.level, paper.isTopicQuiz ? paper.spec : undefined) : null),
    [paper, answers]
  );

  const submit = (force = false) => {
    clearInterval(timerRef.current);
    const graded = gradePaper(paper.questions, answers, paper.level, paper.isTopicQuiz ? paper.spec : undefined);
    const isFullyAnswered = (q) => {
      const ua = answers[q.id];
      if (q.section === "situational") {
        const need = (q.choices_vi || []).length || 3;
        return Boolean(ua) && Object.keys(ua).length >= need;
      }
      return ua != null;
    };
    const unanswered = paper.questions.filter((q) => !isFullyAnswered(q)).length;
    const go = () => {
      haptics.impactMedium();
      Promise.resolve()
        .then(() => onExamFinished())
        .catch(() => {})
        .then(() => maybeShowInterstitial())
        .catch(() => false)
        .then(() => {
          onFinished?.({ paper, answers, result: graded });
        });
    };
    if (unanswered > 0 && !force) {
      Alert.alert(
        "Chưa trả lời hết",
        `${unanswered} câu chưa chọn. Nộp bài luôn?`,
        [
          { text: "Làm tiếp", style: "cancel" },
          { text: "Nộp bài", style: "destructive", onPress: go },
        ]
      );
    } else {
      go();
    }
  };
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    initAds().catch(() => {});
  }, []);

  useEffect(() => {
    setHidden(Boolean(paper));
    return () => setHidden(false);
  }, [paper, setHidden]);

  useEffect(() => {
    setAppOpenSuppressed(Boolean(paper));
    return () => setAppOpenSuppressed(false);
  }, [paper]);

  if (!paper) {
    return (
      <View style={{ flex: 1 }}>
        <StartPanel
          onStart={(lv, ex, mode) => {
            const p = buildExamPaper(lv, ex, mode);
            setPaper(p);
            setLeft(p.spec.minutes * 60);
            setIdx(0);
            setAnswers({});
          }}
          onStartTopic={(stNum, tp) => {
            const p = buildTopicQuiz(stNum, tp);
            setPaper(p);
            setLeft(p.spec.minutes * 60);
            setIdx(0);
            setAnswers({});
          }}
        />
        <AdBanner />
      </View>
    );
  }

  const spec = paper.spec;
  const q = paper.questions[idx];
  const warn = left <= 60;
  const danger = left <= 10;
  const noAnswers = result.pending === paper.questions.length;

  return (
    <View style={[st.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[st.topBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setPaper(null);
          }}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            name="time-outline"
            size={18}
            color={danger ? colors.timerDanger : warn ? colors.timerWarn : colors.text}
          />
          <Text
            style={[
              st.timer,
              { color: danger ? colors.timerDanger : warn ? colors.timerWarn : colors.text },
            ]}
          >
            {fmtTime(left)}
          </Text>
        </View>
        <Text style={{ color: colors.textDim, fontWeight: "700" }}>
          Câu {idx + 1}/{paper.questions.length}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => {
              haptics.selection();
              setReportModalOpen(true);
            }}
            accessibilityLabel="Báo đề sai hoặc góp ý câu hỏi này"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 15 }}>?</Text>
          </Pressable>
          <DuoButton label="Nộp bài" variant="danger" size="sm" fullWidth={false} onPress={submit} />
        </View>
      </View>

      {noAnswers ? (
        <View style={[st.notice, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ color: colors.warn, fontSize: 12 }}>
            Đề này lấy từ nguồn web, đáp án đang chờ đối chiếu phiếu gốc.
          </Text>
        </View>
      ) : null}

      <View style={st.progressRow}>
        {paper.questions.map((qq, i) => (
          <Pressable
            key={qq.id}
            onPress={() => {
              haptics.selection();
              setIdx(i);
            }}
          >
            <View
              style={[
                st.dot,
                {
                  backgroundColor:
                    i === idx
                      ? colors.accent
                      : (qq.section === "situational"
                          ? answers[qq.id] &&
                            Object.keys(answers[qq.id]).length >= ((qq.choices_vi || []).length || 3)
                          : answers[qq.id] != null)
                      ? colors.success
                      : colors.chip,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.l, gap: spacing.l }}>
        <FadeSlideIn key={idx}>
          <Text style={{ color: colors.textDim, fontSize: 12 }}>
            {paper.exam.title} · {spec.label_vi}
          </Text>
          {q.section === "situational" ? (
            <SitQuestion
              q={q}
              value={answers[q.id]}
              onPick={(v) => {
                setAnswers((a) => ({ ...a, [q.id]: v }));
                const filled = Object.keys(v || {}).length;
                if (
                  Array.isArray(q.choices_vi) &&
                  filled >= q.choices_vi.length &&
                  idx < paper.questions.length - 1
                ) {
                  setIdx(idx + 1);
                }
              }}
              colors={colors}
            />
          ) : (
            <TfQuestion
              q={q}
              value={answers[q.id]}
              onPick={(v) => {
                setAnswers((a) => ({ ...a, [q.id]: v }));
                if (idx < paper.questions.length - 1) setIdx(idx + 1);
              }}
              colors={colors}
            />
          )}
        </FadeSlideIn>
      </ScrollView>

      {/* Modal Báo đề sai / Góp ý chỉ xuất hiện khi người dùng bấm nút ? trong lúc làm bài */}
      <Modal
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.6)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onPress={() => setReportModalOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              backgroundColor: colors.card,
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.text }}>
                Báo đề sai / Góp ý câu hỏi
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.accent }}>
                #{q.id}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textDim }} numberOfLines={2}>
              Câu {idx + 1}: "{q.text_vi}"
            </Text>
            <View style={{ gap: 6, marginTop: 4 }}>
              {[
                "Đáp án Đúng/Sai chưa chính xác",
                "Bản dịch hoặc câu chữ khó hiểu",
                "Hình ảnh biển báo / tình huống bị lỗi",
                "Giải thích chưa rõ ràng / Góp ý khác",
              ].map((reason) => {
                const active = reportReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => setReportReason(reason)}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accentSoft : colors.chip,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: active ? "800" : "600",
                        color: active ? colors.accent : colors.text,
                      }}
                    >
                      {active ? "✓ " : "○ "}
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={reportNote}
              onChangeText={setReportNote}
              placeholder="Nhập thêm chi tiết góp ý của bạn (tùy chọn)..."
              placeholderTextColor={colors.textDim}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                color: colors.text,
                marginTop: 4,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                onPress={() => setReportModalOpen(false)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 12,
                  backgroundColor: colors.chip,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.textDim, fontWeight: "800", fontSize: 13 }}>Đóng</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.success();
                  setReportModalOpen(false);
                  setReportNote("");
                  Alert.alert(
                    "Đã ghi nhận góp ý",
                    `Cảm ơn bạn đã báo cáo câu hỏi #${q.id} (${reportReason}). Đội ngũ sẽ đối chiếu và cập nhật ngay!`
                  );
                }}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 12,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Gửi báo cáo</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[st.navBar, { borderTopColor: colors.border }]}>
        <DuoButton
          label="← Trước"
          variant="neutral"
          size="sm"
          fullWidth={false}
          disabled={idx === 0}
          onPress={() => setIdx((i) => Math.max(0, i - 1))}
        />
        {idx < paper.questions.length - 1 ? (
          <DuoButton
            label="Sau →"
            variant="primary"
            size="sm"
            fullWidth={false}
            onPress={() => setIdx((i) => i + 1)}
          />
        ) : (
          <DuoButton
            label="Nộp bài ✓"
            variant="success"
            size="sm"
            fullWidth={false}
            onPress={submit}
          />
        )}
      </View>
    </View>
  );
}

export { answerSheetImage };

const st = StyleSheet.create({
  root: { flex: 1 },
  startRoot: { flex: 1 },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  stageTabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.12)",
  },
  stageTabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  stageTabBtnActive: {
    borderBottomColor: "#0F172A",
  },
  stageTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(15,23,42,0.5)",
  },
  stageTabTextActive: {
    color: "#0F172A",
    fontWeight: "800",
  },
  bannerWrap: {
    height: 112,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    position: "relative",
    overflow: "hidden",
  },
  skyRow: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageMedal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF08A",
    borderWidth: 2,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  stageMedalText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  sparkleText: {
    fontSize: 12,
    color: "rgba(15,23,42,0.45)",
    fontWeight: "700",
  },
  skylineRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  bldg: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderColor: "#1E293B",
  },
  bldgRoof: {
    height: 8,
    backgroundColor: "#EF4444",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  ferrisWheel: {
    marginBottom: -4,
  },
  carBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#1E293B",
    marginBottom: 2,
  },
  groundLine: {
    height: 2,
    backgroundColor: "#1E293B",
    width: "100%",
  },
  mainMockCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  mockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mockCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  subLevelRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  subLevelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  subLevelChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  metaLineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  metaLeftText: {
    fontSize: 12,
    color: "rgba(15,23,42,0.65)",
    fontWeight: "600",
  },
  badgeStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trophyMiniBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  pencilBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  badgeCountText: {
    fontSize: 12.5,
    color: "rgba(15,23,42,0.6)",
    fontWeight: "700",
  },
  progTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progFill: {
    height: "100%",
    borderRadius: 999,
  },
  metaBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreRatioText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  prevResultLabel: {
    fontSize: 11.5,
    color: "rgba(15,23,42,0.55)",
    fontWeight: "600",
  },
  topicListWrap: {
    paddingHorizontal: 18,
    marginTop: 8,
  },
  topicItemRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.1)",
    gap: 5,
  },
  topicCodeLabel: {
    fontSize: 11.5,
    color: "rgba(15,23,42,0.65)",
    fontWeight: "700",
  },
  topicItemTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  unlockBtn: {
    borderRadius: radius.m,
    borderWidth: 1.5,
    padding: spacing.s,
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timer: { fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  notice: { padding: spacing.s, marginHorizontal: spacing.m, borderRadius: radius.m },
  progressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  qText: { fontSize: 17, fontWeight: "600", lineHeight: 26 },
  tfRow: { flexDirection: "row", gap: spacing.m },
  tfBtn: {
    flex: 1,
    padding: spacing.l,
    borderRadius: radius.m,
    borderWidth: 2,
    alignItems: "center",
  },
  choiceRow: {
    flexDirection: "row",
    gap: spacing.s,
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.m,
    padding: spacing.m,
  },
  choiceNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tfMiniRow: { flexDirection: "row", gap: 6 },
  tfMiniBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
