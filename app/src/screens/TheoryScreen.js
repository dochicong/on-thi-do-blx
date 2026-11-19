// TheoryScreen.js — Màn hình Nội dung học tập (学習コンテンツ) chuẩn giao diện Drivey (Ảnh 1 bên phải).
// Thiết kế các thẻ chuyên đề màu xanh dương bo góc lớn kèm hình minh họa giao thông,
// nút pill trắng "Bắt đầu học", vòng tiến độ % và mũi tên, chạm mở chi tiết bài học đầy đủ.
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme, spacing, radius } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptics } from "../utils/haptics";
import { LESSONS } from "../theory";
import FadeSlideIn from "../components/FadeSlideIn";
import PressableScale from "../components/PressableScale";
import { signImage } from "../assets_map";

const CARD_TOPICS = [
  {
    id: "speed",
    displayTitle: "Tâm thế người lái xe & Tốc độ",
    sectionCountLabel: "4 phần",
    progress: 72,
    art: "crosswalk",
    bg: "#2563EB",
  },
  {
    id: "intersection",
    displayTitle: "Tuân thủ đèn tín hiệu & Giao lộ",
    sectionCountLabel: "2 phần",
    progress: null,
    art: "signal",
    bg: "#3B82F6",
  },
  {
    id: "stop_park",
    displayTitle: "Tuân thủ biển báo & Dừng đỗ xe",
    sectionCountLabel: "3 phần",
    progress: null,
    art: "signs",
    bg: "#2563EB",
  },
  {
    id: "right_turn",
    displayTitle: "Rẽ phải 50cc hai giai đoạn",
    sectionCountLabel: "2 phần",
    progress: null,
    art: "crosswalk",
    bg: "#3B82F6",
  },
  {
    id: "railroad",
    displayTitle: "Đường sắt & Rào chắn tàu",
    sectionCountLabel: "2 phần",
    progress: null,
    art: "signs",
    bg: "#2563EB",
  },
  {
    id: "drinking",
    displayTitle: "Nghiêm cấm nồng độ cồn",
    sectionCountLabel: "2 phần",
    progress: null,
    art: "signal",
    bg: "#3B82F6",
  },
];

function CardArtwork({ type }) {
  if (type === "signal") {
    return (
      <View style={st.artSignalWrap} pointerEvents="none">
        <View style={st.artSignalPole} />
        <View style={st.artSignalHousing}>
          <View style={st.artLightOff} />
          <View style={st.artLightOff} />
          <View style={[st.artLightOn, { backgroundColor: "#6366F1" }]} />
        </View>
      </View>
    );
  }
  if (type === "signs") {
    return (
      <View style={st.artSignsWrap} pointerEvents="none">
        <View style={st.artSignBoard} />
        <Ionicons
          name="trail-sign-outline"
          size={86}
          color="rgba(255,255,255,0.22)"
          style={{ position: "absolute", right: 12, bottom: -6 }}
        />
      </View>
    );
  }
  return (
    <View style={st.artCrosswalkWrap} pointerEvents="none">
      <View style={st.zebraRow}>
        <View style={st.zebraBar} />
        <View style={st.zebraBar} />
        <View style={st.zebraBar} />
        <View style={st.zebraBar} />
      </View>
      <Ionicons
        name="car-sport"
        size={58}
        color="rgba(255,255,255,0.32)"
        style={{ position: "absolute", right: 34, top: 26 }}
      />
    </View>
  );
}

export default function TheoryScreen() {
  const { c: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [signDetailId, setSignDetailId] = useState(null);
  const [learnedIds, setLearnedIds] = useState({ speed: true });

  const enrichedLessons = useMemo(() => {
    return CARD_TOPICS.map((meta) => {
      const found = LESSONS.find((l) => l.id === meta.id) || LESSONS[0];
      return {
        ...found,
        ...meta,
      };
    });
  }, []);

  const signDetail = useMemo(() => {
    if (!signDetailId) return null;
    const { allSigns } = require("../data");
    return allSigns().find((s) => s.id === signDetailId) || null;
  }, [signDetailId]);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Thanh Header Drivey giống Ảnh 1 */}
      <View style={st.topBar}>
        <Pressable
          onPress={() => {
            haptics.selection();
            router.push("/");
          }}
          style={st.brandRow}
        >
          <Ionicons name="menu-outline" size={26} color="#1E293B" />
          <Text style={st.brandText}>Drivey</Text>
        </Pressable>

        <View style={st.topRightRow}>
          <Pressable
            onPress={() => {
              haptics.selection();
              router.push("/exam");
            }}
            style={st.licensePill}
          >
            <Text style={st.licensePillText}>Bằng phổ thông</Text>
          </Pressable>
          <View style={st.avatarCircle}>
            <Text style={st.avatarText}>CO</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeSlideIn>
          <View style={{ marginBottom: 6 }}>
            <Text style={st.pageTitle}>Nội dung học tập</Text>
            <Text style={st.pageSub}>Hãy chọn nội dung bạn muốn học</Text>
          </View>
        </FadeSlideIn>

        {enrichedLessons.map((item, i) => {
          const prog = item.progress ?? (learnedIds[item.id] ? 100 : null);
          return (
            <FadeSlideIn key={item.id} delay={i * 55}>
              <PressableScale
                onPress={() => {
                  haptics.selection();
                  setLearnedIds((prev) => ({ ...prev, [item.id]: true }));
                  setSelectedLesson(item);
                }}
              >
                <View style={[st.topicCard, { backgroundColor: item.bg }]}>
                  <CardArtwork type={item.art} />

                  <View style={{ zIndex: 2 }}>
                    <Text style={st.cardTitle}>{item.displayTitle || item.title_vi}</Text>
                    <Text style={st.cardSubtitle}>{item.sectionCountLabel}</Text>
                  </View>

                  <View style={st.cardBottomRow}>
                    <View style={st.startBtnPill}>
                      <Text style={st.startBtnText}>Bắt đầu học</Text>
                    </View>

                    {prog != null ? (
                      <View style={st.progressRing}>
                        <Text style={st.progressRingText}>{prog}%</Text>
                      </View>
                    ) : (
                      <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </PressableScale>
            </FadeSlideIn>
          );
        })}
      </ScrollView>

      {/* Nút trợ giúp (?) góc phải dưới giống Ảnh 1 */}
      <Pressable
        onPress={() => {
          haptics.impactLight();
          setSelectedLesson(enrichedLessons[0]);
        }}
        style={st.fabHelp}
      >
        <Text style={st.fabHelpText}>?</Text>
      </Pressable>

      {/* Modal chi tiết bài học khi bấm "Bắt đầu học" */}
      <Modal
        visible={!!selectedLesson}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLesson(null)}
      >
        <View style={st.modalOverlay}>
          <View style={st.lessonSheet}>
            {selectedLesson ? (
              <>
                <View style={st.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.sheetTitle}>
                      {selectedLesson.displayTitle || selectedLesson.title_vi}
                    </Text>
                    <Text style={st.sheetSub}>
                      {selectedLesson.title_ja} · {selectedLesson.summary}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedLesson(null)}
                    style={st.closeCircle}
                  >
                    <Ionicons name="close" size={20} color="#1E293B" />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingBottom: 24 }}
                >
                  {/* Dải biển báo liên quan */}
                  {selectedLesson.sign_images?.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                    >
                      {selectedLesson.sign_images.map((sid) => {
                        const img = signImage(sid);
                        if (!img) return null;
                        return (
                          <Pressable
                            key={sid}
                            onPress={() => {
                              haptics.impactLight();
                              setSignDetailId(sid);
                            }}
                            style={st.signThumb}
                          >
                            <Image
                              source={img}
                              style={{ width: 58, height: 58 }}
                              resizeMode="contain"
                            />
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : null}

                  {/* Các phần kiến thức */}
                  {(selectedLesson.sections || []).map((sec, idx) => (
                    <View key={idx} style={st.secBox}>
                      <Text style={st.secHeading}>{sec.heading}</Text>
                      {(sec.points || []).map((p, j) => (
                        <View key={j} style={st.pointRow}>
                          <View style={st.bulletDot} />
                          <Text style={st.pointText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  ))}

                  {/* Bẫy thi hay gặp */}
                  {selectedLesson.traps?.length ? (
                    <View style={st.trapBox}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="warning" size={16} color="#DC2626" />
                        <Text style={st.trapHeading}>Bẫy thi hay gặp</Text>
                      </View>
                      {selectedLesson.traps.map((t, j) => (
                        <Text key={j} style={st.trapText}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  {/* Mẹo nhớ nhanh */}
                  {selectedLesson.mnemonic ? (
                    <View style={st.mnemoBox}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="bulb" size={16} color="#1D63ED" />
                        <Text style={st.mnemoHeading}>Mẹo ghi nhớ nhanh</Text>
                      </View>
                      <Text style={st.mnemoText}>{selectedLesson.mnemonic}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      setSelectedLesson(null);
                      router.push("/exam");
                    }}
                    style={[st.sheetPrimaryBtn, { flex: 1 }]}
                  >
                    <Text style={st.sheetPrimaryBtnText}>Làm câu hỏi chuyên đề này</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedLesson(null)}
                    style={st.sheetSecondaryBtn}
                  >
                    <Text style={st.sheetSecondaryBtnText}>Đóng</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Modal chi tiết biển báo minh họa */}
      <Modal
        visible={!!signDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSignDetailId(null)}
      >
        <View style={st.modalOverlay}>
          <View style={st.signModalCard}>
            {signDetail ? (
              <>
                <View style={st.signModalImgWrap}>
                  {signImage(signDetail.id) ? (
                    <Image
                      source={signImage(signDetail.id)}
                      style={{ width: 150, height: 150 }}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  {signDetail.name_vi || signDetail.shape_vi}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textDim }}>
                  {signDetail.name_ja} {signDetail.name_kana ? `(${signDetail.name_kana})` : ""}
                </Text>
              </>
            ) : null}
            <Pressable
              onPress={() => setSignDetailId(null)}
              style={[st.sheetPrimaryBtn, { alignSelf: "stretch", marginTop: 12 }]}
            >
              <Text style={st.sheetPrimaryBtnText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  licensePill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  licensePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1D63ED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 60,
    gap: 16,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  pageSub: {
    fontSize: 13.5,
    color: "#64748B",
    marginTop: 4,
  },
  topicCard: {
    borderRadius: 18,
    padding: 20,
    minHeight: 168,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    maxWidth: "82%",
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    zIndex: 2,
  },
  startBtnPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startBtnText: {
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "700",
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
  },
  artCrosswalkWrap: {
    position: "absolute",
    right: -10,
    top: 0,
    bottom: 0,
    width: 190,
    justifyContent: "center",
  },
  zebraRow: {
    gap: 10,
    transform: [{ rotate: "-25deg" }],
  },
  zebraBar: {
    width: 150,
    height: 12,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  artSignalWrap: {
    position: "absolute",
    right: 16,
    top: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  artSignalPole: {
    width: 24,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  artSignalHousing: {
    backgroundColor: "rgba(30,58,138,0.45)",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
  },
  artLightOff: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  artLightOn: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  artSignsWrap: {
    position: "absolute",
    right: 10,
    top: 16,
    bottom: 0,
    width: 150,
  },
  artSignBoard: {
    width: 90,
    height: 60,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    position: "absolute",
    right: 24,
    top: 14,
  },
  fabHelp: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1D63ED",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D63ED",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabHelpText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  lessonSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "88%",
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  signThumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  secBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D63ED",
  },
  pointRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1D63ED",
    marginTop: 7,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#1E293B",
  },
  trapBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  trapHeading: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#DC2626",
  },
  trapText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#7F1D1D",
  },
  mnemoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  mnemoHeading: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1D63ED",
  },
  mnemoText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  sheetPrimaryBtn: {
    backgroundColor: "#1D63ED",
    borderRadius: radius.m,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sheetSecondaryBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: radius.m,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSecondaryBtnText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  signModalCard: {
    backgroundColor: "#FFFFFF",
    margin: 24,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  signModalImgWrap: {
    width: 170,
    height: 170,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
