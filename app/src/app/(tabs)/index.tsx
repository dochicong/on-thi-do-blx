import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdBanner from '../../ads/AdBanner';
import { useRewardedUnlock } from '../../ads/useRewardedUnlock';
import { DuoButton } from '../../components/DuoButton';
import FadeSlideIn from '../../components/FadeSlideIn';
import PressableScale from '../../components/PressableScale';
import { bundleMeta } from '../../data';
import { refreshReminders } from '../../notifications/sync';
import { loadProgress, streakOf, type ProgressState } from '../../storage/progress';
import {
  defaultSettings,
  loadSettings,
  updateSettings,
  type AppSettings,
} from '../../storage/settings';
import { useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';

function parseExamDate(dateStr: string): Date {
  const parts = (dateStr || '').split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const f = new Date();
  f.setDate(f.getDate() + 30);
  return new Date(f.getFullYear(), f.getMonth(), f.getDate());
}

function formatViDate(dateStr: string): string {
  const d = parseExamDate(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function daysUntil(dateStr: string): number {
  const target = parseExamDate(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return Math.max(0, diff);
}

function makeDateOffset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEK_DAYS = [
  { label: 'T2', done: false },
  { label: 'T3', done: false },
  { label: 'T4', done: false },
  { label: 'T5', done: false },
  { label: 'T6', done: false },
  { label: 'T7', done: false },
  { label: 'CN', done: false },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { c, isDark, toggle } = useTheme();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const { unlocked, watch } = useRewardedUnlock('trap_explanations');

  const vehicleAnim = useRef(new Animated.Value(1)).current;
  const flameAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [flameAnim]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [p, s] = await Promise.all([loadProgress(), loadSettings()]);
        if (alive) {
          setProgress(p);
          setSettings(s);
        }
        void refreshReminders({ settings: s, progress: p });
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  const is50cc = settings.licenseLevel === '50cc';
  const answered = progress?.totals.answered ?? 0;
  const displayAnswered = answered;
  const totalQuestions = bundleMeta.counts?.questions ?? 759;
  const streak = progress ? streakOf(progress.days, progress.frozenDays) : 0;
  const displayStreak = streak;
  const remainingDays = useMemo(() => daysUntil(settings.examDate), [settings.examDate]);
  const formattedExamDate = useMemo(() => formatViDate(settings.examDate), [settings.examDate]);

  const switchTrack = async (target: '50cc' | 'honmen') => {
    haptics.selection();
    vehicleAnim.setValue(0.9);
    Animated.spring(vehicleAnim, {
      toValue: 1,
      friction: 6,
      tension: 130,
      useNativeDriver: true,
    }).start();
    const next = await updateSettings({ licenseLevel: target });
    setSettings(next);
  };

  const applyDaysOffset = async (days: number) => {
    haptics.selection();
    const nextDate = makeDateOffset(days);
    const next = await updateSettings({ examDate: nextDate });
    setSettings(next);
    setDateModalOpen(false);
  };

  return (
    <View style={[st.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header chuẩn theo hướng dẫn: Tên ứng dụng + Công tắc hạng bằng + Nút Sáng/Tối + Nút Cài đặt bánh răng ⚙ */}
        <FadeSlideIn>
          <View style={[st.headerCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={st.brandBannerRow}>
              <View style={st.brandCrestBox}>
                <Ionicons name="shield-checkmark" size={20} color="#4ADE80" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[st.brandMainTitle, { color: c.text }]}>Ôn Thì Đỗ</Text>
                  <View style={st.passBadge}>
                    <Text style={st.passBadgeText}>PASS</Text>
                  </View>
                </View>
                <Text style={st.brandSubSlogan}>Học là đỗ — Trượt là do bạn không học!</Text>
              </View>
            </View>

            <View style={st.headerActionsRow}>
              <View style={[st.vehicleSwitchPill, { backgroundColor: c.chip }]}>
                <Pressable
                  onPress={() => switchTrack('50cc')}
                  style={[st.vehicleBtn, is50cc && st.vehicleBtnActive50]}
                >
                  <Ionicons
                    name="bicycle"
                    size={13}
                    color={is50cc ? '#FFFFFF' : c.textDim}
                  />
                  <Text style={[st.vehicleBtnText, { color: is50cc ? '#FFFFFF' : c.textDim }]}>
                    50cc
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => switchTrack('honmen')}
                  style={[st.vehicleBtn, !is50cc && st.vehicleBtnActiveCar]}
                >
                  <Ionicons
                    name="car-sport"
                    size={13}
                    color={!is50cc ? '#FFFFFF' : c.textDim}
                  />
                  <Text style={[st.vehicleBtnText, { color: !is50cc ? '#FFFFFF' : c.textDim }]}>
                    Ô tô
                  </Text>
                </Pressable>
              </View>

              {/* Nút chuyển Chế độ Sáng / Tối */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  toggle();
                }}
                accessibilityLabel="Chuyển chế độ Sáng/Tối"
                style={[st.iconCircleBtn, { backgroundColor: c.chip, borderColor: c.border }]}
              >
                <Ionicons
                  name={isDark ? 'sunny' : 'moon'}
                  size={17}
                  color={isDark ? '#FACC15' : '#475569'}
                />
              </Pressable>

              {/* Nút Cài đặt (Bánh răng ⚙ đặt trong header theo đúng thiết kế) */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  router.push('/settings');
                }}
                accessibilityLabel="Mở Cài đặt và Gói Pro"
                style={[st.iconCircleBtn, { backgroundColor: c.chip, borderColor: c.border }]}
              >
                <Ionicons name="settings-outline" size={18} color={c.text} />
              </Pressable>
            </View>
          </View>
        </FadeSlideIn>

        {/* Thẻ Đếm ngược Ngày thi gọn gàng */}
        <FadeSlideIn delay={30}>
          <Animated.View
            style={[
              st.heroBlueCard,
              {
                backgroundColor: is50cc ? '#0284C7' : '#1D63ED',
                transform: [{ scale: vehicleAnim }],
              },
            ]}
          >
            <View style={st.heroTopRow}>
              <View style={{ flex: 1 }}>
                <View style={st.heroBadge}>
                  <Ionicons
                    name={is50cc ? 'bicycle' : 'car-sport'}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={st.heroBadgeText}>
                    {is50cc ? 'Hạng 50cc (48 câu)' : 'Hạng Ô tô (Karimen & Honmen)'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={st.heroBigDays}>{remainingDays}</Text>
                  <Text style={st.heroDaysUnit}>ngày đến kỳ thi ({formattedExamDate})</Text>
                </View>
              </View>
            </View>

            <View style={st.heroBtnRow}>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setDateModalOpen(true);
                }}
                style={st.changeDateBtn}
              >
                <Text style={st.changeDateBtnText}>Đổi ngày thi</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.impactLight();
                  router.push('/exam');
                }}
                style={st.quickExamBtn}
              >
                <Text style={st.quickExamBtnText}>Thi thử ngay →</Text>
              </Pressable>
            </View>
          </Animated.View>
        </FadeSlideIn>

        {/* 1. Thẻ Điểm bài thi gần nhất (Giống thẻ 18/30 quiz score trong ảnh mẫu) */}
        <FadeSlideIn delay={60}>
          <PressableScale onPress={() => router.push('/exam')}>
            <View style={[st.quizScoreCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[st.gradCapCircle, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="school-outline" size={24} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.quizScoreBig, { color: c.text }]}>
                  {answered > 0 ? `${progress?.totals.correct ?? 0}/${answered}` : 'Chưa có bài thi'}
                </Text>
                <Text style={[st.quizScoreSub, { color: c.textDim }]}>
                  điểm thi thử gần nhất (13/11/2026)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textDim} />
            </View>
          </PressableScale>
        </FadeSlideIn>

        {/* 2. Thẻ Chuỗi ngày học (Giống thẻ Your streak Mo..Su có dấu tích ✓ trong ảnh mẫu) */}
        <FadeSlideIn delay={90}>
          <PressableScale onPress={() => router.push('/exam')}>
            <View style={[st.streakCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={st.streakHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Animated.View style={[st.flameBadgeWrap, { transform: [{ scale: flameAnim }] }]}>
                    <Ionicons name="flame" size={28} color="#F97316" />
                    <View style={[st.flameNumPill, { backgroundColor: c.card }]}>
                      <Text style={[st.flameNumText, { color: c.text }]}>{displayStreak}</Text>
                    </View>
                  </Animated.View>
                  <Text style={[st.streakTitle, { color: c.text }]}>Chuỗi ngày học</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="share-outline" size={18} color={c.textDim} />
                  <Ionicons name="ellipsis-vertical" size={16} color={c.textDim} />
                </View>
              </View>

              <View style={st.weekRow}>
                {WEEK_DAYS.map((w) => (
                  <View key={w.label} style={st.dayCol}>
                    <Text
                      style={[
                        st.dayLabel,
                        { color: w.done ? c.text : c.textDim, fontWeight: w.done ? '800' : '600' },
                      ]}
                    >
                      {w.label}
                    </Text>
                    <View
                      style={[
                        st.dayCircle,
                        w.done
                          ? { backgroundColor: isDark ? '#4F46E5' : '#C7D2FE' }
                          : { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                      ]}
                    >
                      {w.done ? (
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={isDark ? '#FFFFFF' : '#1E1B4B'}
                        />
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </PressableScale>
        </FadeSlideIn>

        {/* 3. Lưới 2x2 Bento Stat Cards (Giống hệt 4 ô 142 New words / 6 Bookmarked / 9 Reviewed / 14 Quizzes) */}
        <FadeSlideIn delay={120}>
          <View style={st.bentoGrid}>
            <View style={st.bentoRow}>
              <Pressable
                onPress={() => router.push('/exam')}
                style={[st.bentoCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={st.bentoTopRight}>
                  <View style={[st.bentoIconBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Ionicons name="list-outline" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                  </View>
                </View>
                <Text style={[st.bentoValue, { color: c.text }]}>{displayAnswered}</Text>
                <Text style={[st.bentoLabel, { color: c.textDim }]}>Câu đã học</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/signs')}
                style={[st.bentoCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={st.bentoTopRight}>
                  <View style={[st.bentoIconBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Ionicons name="heart-outline" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                  </View>
                </View>
                <Text style={[st.bentoValue, { color: c.text }]}>0</Text>
                <Text style={[st.bentoLabel, { color: c.textDim }]}>Câu đánh dấu</Text>
              </Pressable>
            </View>

            <View style={st.bentoRow}>
              <Pressable
                onPress={() => router.push('/theory')}
                style={[st.bentoCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={st.bentoTopRight}>
                  <View style={[st.bentoIconBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Ionicons name="bookmark-outline" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                  </View>
                </View>
                <Text style={[st.bentoValue, { color: c.text }]}>{progress?.totals.correct ?? 0}</Text>
                <Text style={[st.bentoLabel, { color: c.textDim }]}>Câu làm đúng</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/exam')}
                style={[st.bentoCard, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={st.bentoTopRight}>
                  <View style={[st.bentoIconBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Ionicons name="school-outline" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
                  </View>
                </View>
                <Text style={[st.bentoValue, { color: c.text }]}>{Object.keys(progress?.exams ?? {}).length}</Text>
                <Text style={[st.bentoLabel, { color: c.textDim }]}>Đề đã giải ({totalQuestions} câu)</Text>
              </Pressable>
            </View>
          </View>
        </FadeSlideIn>

        {/* 4. Thẻ Xếp hạng Năng lực (Giống thẻ You outrank 62% of learners trong ảnh mẫu) */}
        <FadeSlideIn delay={150}>
          <View style={[st.rankCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[st.rankTitle, { color: c.text }]}>
              {answered > 0 ? `Độ chính xác hiện tại: ${Math.round(((progress?.totals.correct ?? 0) / answered) * 100)}%` : 'Chưa có dữ liệu xếp hạng'}
            </Text>
            <Text style={[st.rankSub, { color: c.textDim }]}>
              {answered > 0 ? `Đã làm đúng ${progress?.totals.correct ?? 0} / ${answered} câu` : 'Hãy hoàn thành bài thi thử đầu tiên để tính điểm năng lực'}
            </Text>

            <View style={st.bellCurveBox}>
              <View style={[st.bellCurveArc, { borderColor: isDark ? '#818CF8' : '#6366F1' }]} />
              <View style={[st.bellAvgLine, { borderColor: c.border }]} />
              <View style={st.bellUserPin}>
                <Text style={[st.bellUserLabel, { color: c.text }]}>Bạn</Text>
                <View style={[st.bellUserDot, { borderColor: isDark ? '#818CF8' : '#6366F1', backgroundColor: c.card }]} />
                <View style={[st.bellUserStem, { backgroundColor: isDark ? '#818CF8' : '#6366F1' }]} />
              </View>
            </View>

            <View style={st.bellAxisRow}>
              <Text style={[st.bellAxisText, { color: c.textDim }]}>0</Text>
              <Text style={[st.bellAxisText, { color: c.textDim }]}>Trung bình</Text>
              <Text style={[st.bellAxisText, { color: c.textDim }]}>100</Text>
            </View>
          </View>
        </FadeSlideIn>

        {/* Nút mở khóa Mẹo câu bẫy bằng Quảng cáo Video trả thưởng */}
        <FadeSlideIn delay={180}>
          <DuoButton
            label={
              unlocked
                ? 'Đã mở khóa Mẹo câu bẫy 24h — Vào luyện thi ngay'
                : 'Xem video ngắn — Mở khóa Mẹo câu bẫy (24h)'
            }
            leadingIcon={unlocked ? 'checkmark-circle' : 'gift'}
            variant={unlocked ? 'success' : 'warning'}
            size="md"
            onPress={() => (unlocked ? router.push('/exam') : watch())}
          />
        </FadeSlideIn>

        <AdBanner />
      </ScrollView>

      {/* Modal Đổi ngày thi */}
      <Modal
        visible={dateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalOpen(false)}
      >
        <Pressable style={st.modalOverlay} onPress={() => setDateModalOpen(false)}>
          <View style={[st.modalCard, { backgroundColor: c.card }]}>
            <Text style={[st.modalTitle, { color: c.text }]}>Chọn ngày thi dự kiến</Text>
            <View style={{ gap: 8, marginTop: 10 }}>
              {[7, 14, 17, 28, 45].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => applyDaysOffset(d)}
                  style={[st.modalOption, { backgroundColor: c.chip }]}
                >
                  <Text style={[st.modalOptionText, { color: c.text }]}>Còn {d} ngày nữa</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.textDim} />
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 96, gap: 12 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  brandBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  brandCrestBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMainTitle: { fontSize: 16, fontWeight: '900' },
  passBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  passBadgeText: { fontSize: 8.5, fontWeight: '900', color: '#92400E' },
  brandSubSlogan: { fontSize: 11, fontWeight: '800', color: '#E11D48', marginTop: 1 },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vehicleSwitchPill: {
    flexDirection: 'row',
    padding: 2.5,
    borderRadius: 999,
    gap: 2,
  },
  vehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  vehicleBtnActive50: { backgroundColor: '#0284C7' },
  vehicleBtnActiveCar: { backgroundColor: '#1D63ED' },
  vehicleBtnText: { fontSize: 11, fontWeight: '800' },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlueCard: {
    borderRadius: 20,
    padding: 16,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  heroBadgeText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' },
  heroBigDays: { color: '#FDE047', fontSize: 32, fontWeight: '900' },
  heroDaysUnit: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  heroBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  changeDateBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  changeDateBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  quickExamBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  quickExamBtnText: { color: '#1D63ED', fontSize: 12, fontWeight: '800' },
  quizScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  gradCapCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizScoreBig: { fontSize: 22, fontWeight: '900' },
  quizScoreSub: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  streakCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flameBadgeWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameNumPill: {
    position: 'absolute',
    bottom: -2,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  flameNumText: { fontSize: 10, fontWeight: '900' },
  streakTitle: { fontSize: 17, fontWeight: '900' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dayCol: { alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 12 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoGrid: { gap: 12 },
  bentoRow: { flexDirection: 'row', gap: 12 },
  bentoCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  bentoTopRight: { alignItems: 'flex-end' },
  bentoIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoValue: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  bentoLabel: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  rankCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  rankTitle: { fontSize: 17, fontWeight: '900' },
  rankSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3 },
  bellCurveBox: {
    height: 92,
    marginTop: 14,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bellCurveArc: {
    width: '88%',
    height: 74,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    borderTopWidth: 2.5,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  bellAvgLine: {
    position: 'absolute',
    top: 14,
    bottom: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  bellUserPin: {
    position: 'absolute',
    right: '24%',
    bottom: 0,
    alignItems: 'center',
  },
  bellUserLabel: { fontSize: 10.5, fontWeight: '900', marginBottom: 3 },
  bellUserDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3 },
  bellUserStem: { width: 2, height: 42 },
  bellAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  bellAxisText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { width: '100%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '900' },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  modalOptionText: { fontSize: 14, fontWeight: '700' },
});
