import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Screen, SectionTitle, StatTile } from '../../components/ui';
import { DuoButton } from '../../components/DuoButton';
import { allSigns, bundleMeta } from '../../data';
import {
  purchaseOneTimePlanViaStore,
  restoreVerifiedPurchases,
  verifySignedLicenseKey,
} from '../../billing/billingService';
import { ensurePermission } from '../../notifications/reminders';
import { refreshReminders } from '../../notifications/sync';
import { loadProgress, resetProgress, streakOf } from '../../storage/progress';
import {
  defaultSettings,
  formatTime,
  isProEntitlementActive,
  loadSettings,
  remainingProDays,
  updateSettings,
  type AppSettings,
} from '../../storage/settings';
import { spacing, useTheme } from '../../theme';
import { haptics } from '../../utils/haptics';

const MODES = [
  { key: 'system', label: 'Theo hệ thống' },
  { key: 'light', label: 'Sáng' },
  { key: 'dark', label: 'Tối' },
] as const;

const PRESET_TIMES: { hour: number; minute: number }[] = [
  { hour: 7, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 },
];

const GOAL_OPTIONS = [10, 20, 30, 50];

export const ONE_TIME_PRO_PLANS = [
  {
    id: 'tap_trung_30d' as const,
    sku: 'com.docong.onthido.pass_30d',
    name: 'Học Là Đỗ',
    priceJpy: '¥980',
    durationLabel: '30 ngày',
    days: 30,
    highlight: false,
    tag: null,
    targetUser: 'Phù hợp ôn nước rút 1 hạng bằng (50cc hoặc Karimen)',
    benefits: [
      'Loại bỏ hoàn toàn quảng cáo trong 30 ngày',
      'Mở khóa giải thích chi tiết & mẹo nhớ cho 1 hạng bằng đang chọn',
      'Thống kê các câu làm sai để ôn tập lại nhanh',
    ],
  },
  {
    id: 'vuot_cap_90d' as const,
    sku: 'com.docong.onthido.pass_90d',
    name: 'Chắc Chắn Đỗ',
    priceJpy: '¥1.980',
    durationLabel: '90 ngày',
    days: 90,
    highlight: true,
    tag: 'ĐỀ XUẤT · PHỔ BIẾN NHẤT',
    targetUser: 'Tối ưu cho lộ trình học từ Karimen lên Honmen (hoặc 50cc + Ô tô)',
    benefits: [
      'Bao gồm toàn bộ quyền lợi Gói Tập Trung trong 90 ngày',
      'Mở khóa đồng thời cả 2 lộ trình: Xe máy 50cc & Ô tô (Karimen + Honmen)',
      'Mở khóa bộ đề lọc riêng các câu bẫy hay sai và câu tình huống nguy hiểm',
    ],
  },
  {
    id: 'vip_lifetime' as const,
    sku: 'com.docong.onthido.vip_lifetime',
    name: 'Đỗ Là Cái Chắc',
    priceJpy: '¥3.980',
    durationLabel: 'Trọn đời',
    days: null,
    highlight: false,
    tag: 'SỬ DỤNG VĨNH VIỄN',
    targetUser: 'Thanh toán một lần duy nhất, sử dụng lâu dài không giới hạn thời gian',
    benefits: [
      'Bao gồm toàn bộ quyền lợi Gói Vượt Cấp không giới hạn thời gian',
      'Nhận toàn bộ các đợt cập nhật ngân hàng đề mới miễn phí trọn đời',
      'Khôi phục quyền lợi trên mọi thiết bị bằng mã giao dịch đã ký số',
    ],
  },
];

export default function SettingsScreen() {
  const { c, mode, setMode } = useTheme();
  const [days, setDays] = useState<number>(14);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedPlan, setSelectedPlan] = useState<'tap_trung_30d' | 'vuot_cap_90d' | 'vip_lifetime'>('vuot_cap_90d');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCodeInput, setRestoreCodeInput] = useState('');
  const [activationKeyInput, setActivationKeyInput] = useState('');
  const [isProcessingBilling, setIsProcessingBilling] = useState(false);
  const signs = allSigns();

  const load = useCallback(async () => {
    const [progress, s] = await Promise.all([loadProgress(), loadSettings()]);
    return { days: streakOf(progress.days, progress.frozenDays), settings: s };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const data = await load();
      if (!alive) return;
      setDays(data.days || 14);
      setSettings(data.settings);
      if (data.settings.proPlan && data.settings.proPlan !== 'free') {
        setSelectedPlan(data.settings.proPlan);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const apply = useCallback(async (patch: Parameters<typeof updateSettings>[0]) => {
    const next = await updateSettings(patch);
    setSettings(next);
    await refreshReminders({ settings: next });
  }, []);

  const activePlanObj = ONE_TIME_PRO_PLANS.find((p) => p.id === selectedPlan) || ONE_TIME_PRO_PLANS[1];
  const proActive = isProEntitlementActive(settings);
  const proDaysLeft = remainingProDays(settings);

  /**
   * Xử lý thanh toán thật qua Google Play Billing / Apple StoreKit.
   * Tuyệt đối KHÔNG tự tạo mã OTD-... hay mở khóa Pro nếu Store chưa xác nhận thu tiền thành công.
   */
  const handleConfirmStorePurchase = async () => {
    if (isProcessingBilling) return;
    setIsProcessingBilling(true);
    try {
      const result = await purchaseOneTimePlanViaStore(activePlanObj.id);
      if (!result.ok) {
        haptics.warning();
        Alert.alert('Chưa hoàn tất thanh toán', result.message);
        return;
      }

      haptics.success();
      const { entitlement } = result;
      await apply({
        isPro: true,
        proPlan: entitlement.planId,
        proActivatedAt: entitlement.activatedAtIso,
        proExpiresAt: entitlement.expiresAtIso,
        proReceiptId: entitlement.receiptId,
      });
      setCheckoutOpen(false);
      Alert.alert(
        'Thanh toán thành công',
        `Mã biên lai Store: ${entitlement.receiptId}\nGói đã kích hoạt: ${activePlanObj.name}\nThời hạn: ${
          entitlement.expiresAtIso ? `Đến hết ngày ${entitlement.expiresAtIso} (Không tự gia hạn)` : 'Trọn đời'
        }`
      );
    } finally {
      setIsProcessingBilling(false);
    }
  };

  /**
   * Kích hoạt bằng mã giao dịch có chữ ký số (dành cho thanh toán qua Konbini/PayPay đã xác thực).
   */
  const handleActivateWithSignedKey = async () => {
    const result = verifySignedLicenseKey(activationKeyInput);
    if (!result.ok) {
      haptics.warning();
      Alert.alert('Mã kích hoạt không hợp lệ', result.message);
      return;
    }

    haptics.success();
    const { entitlement } = result;
    const planMeta = ONE_TIME_PRO_PLANS.find((p) => p.id === entitlement.planId) || activePlanObj;
    await apply({
      isPro: true,
      proPlan: entitlement.planId,
      proActivatedAt: entitlement.activatedAtIso,
      proExpiresAt: entitlement.expiresAtIso,
      proReceiptId: entitlement.receiptId,
    });
    setActivationKeyInput('');
    setCheckoutOpen(false);
    Alert.alert(
      'Kích hoạt thành công',
      `Đã xác thực chữ ký số hợp lệ.\nGói: ${planMeta.name}\nThời hạn: ${
        entitlement.expiresAtIso ? `Đến hết ${entitlement.expiresAtIso}` : 'Trọn đời'
      }`
    );
  };

  /**
   * Khôi phục giao dịch đã mua:
   * Bắt buộc kiểm tra chữ ký số của mã giao dịch hoặc truy vấn lịch sử mua thật từ Store.
   * Ngăn chặn hoàn toàn việc để trống hoặc nhập chuỗi bất kỳ để mở khóa Pro miễn phí.
   */
  const handleRestorePurchase = async () => {
    if (isProcessingBilling) return;
    setIsProcessingBilling(true);
    try {
      const result = await restoreVerifiedPurchases(restoreCodeInput);
      if (!result.ok) {
        haptics.warning();
        Alert.alert('Không thể khôi phục giao dịch', result.message);
        return;
      }

      haptics.success();
      const { entitlement } = result;
      const planMeta = ONE_TIME_PRO_PLANS.find((p) => p.id === entitlement.planId) || ONE_TIME_PRO_PLANS[1];
      await apply({
        isPro: true,
        proPlan: entitlement.planId,
        proActivatedAt: entitlement.activatedAtIso,
        proExpiresAt: entitlement.expiresAtIso,
        proReceiptId: entitlement.receiptId,
      });
      setRestoreCodeInput('');
      setRestoreOpen(false);
      Alert.alert(
        'Khôi phục giao dịch thành công',
        `Đã xác thực biên lai hợp lệ (${entitlement.receiptId}).\nGói khôi phục: ${planMeta.name}`
      );
    } finally {
      setIsProcessingBilling(false);
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert('Chưa có quyền thông báo', 'Vui lòng bật quyền thông báo trong Cài đặt thiết bị.');
        return;
      }
    }
    await apply({ reminder: { enabled } });
  };

  const onReset = () => {
    Alert.alert('Đặt lại tiến độ học tập?', 'Toàn bộ lịch sử làm bài và chuỗi ngày học sẽ được đặt lại từ đầu.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đặt lại',
        style: 'destructive',
        onPress: async () => {
          await resetProgress();
          const data = await load();
          setDays(data.days);
        },
      },
    ]);
  };

  const switchColors = { false: c.border, true: c.accent };

  return (
    <Screen scroll>
      <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginTop: spacing.s }}>
        Gói Pro & Cài đặt
      </Text>

      {/* Khối Quản lý Thời hạn Pro & Lựa chọn Gói Thanh toán 1 lần */}
      <View style={st.proContainer}>
        <View style={st.proHeaderRow}>
          <View style={st.proCrownBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FDE047" />
            <Text style={st.proCrownText}>
              {proActive ? 'ĐANG SỬ DỤNG GÓI PRO ĐÃ XÁC THỰC' : 'THANH TOÁN 1 LẦN · KHÔNG TỰ GIA HẠN'}
            </Text>
          </View>
        </View>

        {proActive ? (
          <View style={st.activeEntitlementBox}>
            <Text style={st.activePlanTitle}>
              Gói hiện tại: {ONE_TIME_PRO_PLANS.find((p) => p.id === settings.proPlan)?.name || 'Gói Vượt Cấp'}
            </Text>
            <Text style={st.activePlanSub}>
              Thời hạn còn lại: {proDaysLeft == null ? 'Trọn đời (Vĩnh viễn)' : `${proDaysLeft} ngày (Hết hạn: ${settings.proExpiresAt})`}
            </Text>
            <Text style={st.activePlanReceipt}>
              Mã biên lai xác thực: {settings.proReceiptId} · Tự động kết thúc khi hết hạn, không trừ tiền tự động.
            </Text>
          </View>
        ) : (
          <Text style={st.proHeadline}>
            Bạn luôn được học miễn phí đầy đủ 759 câu hỏi bộ đề và 152 biển báo mà không cần đăng ký tài khoản. Chọn gói trả một lần dưới đây nếu muốn học tập trung không quảng cáo:
          </Text>
        )}

        <View style={{ gap: 12, marginTop: 12 }}>
          {ONE_TIME_PRO_PLANS.map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => {
                  haptics.selection();
                  setSelectedPlan(plan.id);
                }}
                style={[
                  st.planCard,
                  plan.highlight && st.planCardRecommended,
                  active && st.planCardActive,
                ]}
              >
                {plan.tag ? (
                  <View style={[st.planBadge, plan.highlight ? st.planBadgeGold : st.planBadgeSlate]}>
                    <Text style={st.planBadgeText}>{plan.tag}</Text>
                  </View>
                ) : null}

                <View style={st.planTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.planName}>{plan.name}</Text>
                    <Text style={st.planTarget}>{plan.targetUser}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={st.planPrice}>{plan.priceJpy}</Text>
                    <Text style={st.planPeriod}>/ {plan.durationLabel}</Text>
                  </View>
                </View>

                <View style={st.benefitList}>
                  {plan.benefits.map((b, i) => (
                    <View key={i} style={st.benefitRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#38BDF8" />
                      <Text style={st.benefitText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 14, gap: 8 }}>
          <DuoButton
            label={`Chọn ${activePlanObj.name} (${activePlanObj.priceJpy} / ${activePlanObj.durationLabel})`}
            leadingIcon="card"
            variant="warning"
            size="lg"
            onPress={() => setCheckoutOpen(true)}
          />
          <Pressable onPress={() => setRestoreOpen(true)} style={st.restoreBtn}>
            <Text style={st.restoreBtnText}>Khôi phục giao dịch đã mua</Text>
          </Pressable>
        </View>
      </View>

      <Card>
        <SectionTitle>Giao diện hiển thị</SectionTitle>
        <View style={{ flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap', marginTop: spacing.s }}>
          {MODES.map((m) => (
            <Pill key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(m.key)} />
          ))}
        </View>
      </Card>

      <Card>
        <SectionTitle>Nhắc nhở & Mục tiêu học tập</SectionTitle>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.m }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 14.5 }}>Nhắc học mỗi ngày</Text>
            <Text style={{ color: c.textDim, fontSize: 12 }}>
              {settings.reminder.enabled
                ? `Hẹn giờ lúc ${formatTime(settings.reminder.hour, settings.reminder.minute)}`
                : 'Đang tắt'}
            </Text>
          </View>
          <Switch
            value={settings.reminder.enabled}
            onValueChange={toggleReminder}
            trackColor={switchColors}
            thumbColor="#fff"
          />
        </View>

        {settings.reminder.enabled ? (
          <View style={{ flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap', marginTop: spacing.m }}>
            {PRESET_TIMES.map((t) => (
              <Pill
                key={`${t.hour}-${t.minute}`}
                label={formatTime(t.hour, t.minute)}
                active={settings.reminder.hour === t.hour && settings.reminder.minute === t.minute}
                onPress={() => apply({ reminder: { ...settings.reminder, ...t } })}
              />
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: spacing.l, paddingTop: spacing.l, borderTopWidth: 1, borderTopColor: c.border }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 14.5 }}>
            Mục tiêu mỗi ngày: {settings.dailyGoal.questions} câu
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap', marginTop: spacing.m }}>
            {GOAL_OPTIONS.map((g) => (
              <Pill
                key={g}
                label={`${g} câu`}
                active={settings.dailyGoal.questions === g}
                onPress={() => apply({ dailyGoal: { questions: g } })}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle>Thống kê dữ liệu ngoại tuyến</SectionTitle>
        <View style={{ flexDirection: 'row', gap: spacing.l, marginTop: spacing.s }}>
          <StatTile label="Câu hỏi" value={bundleMeta.counts?.questions ?? 759} />
          <StatTile label="Biển báo" value={signs.length} />
          <StatTile label="Chuỗi ngày" value={days} />
        </View>
      </Card>

      <DuoButton
        label="Đặt lại tiến độ học tập"
        leadingIcon="refresh"
        variant="danger"
        size="md"
        onPress={onReset}
      />
      <View style={{ height: spacing.xl }} />

      {/* Modal Thanh toán 1 lần (Yêu cầu xác thực Store IAP hoặc Mã ký số) */}
      <Modal visible={checkoutOpen} transparent animationType="fade" onRequestClose={() => setCheckoutOpen(false)}>
        <Pressable style={st.modalOverlay} onPress={() => setCheckoutOpen(false)}>
          <Pressable style={st.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={st.modalTitle}>Thanh toán gói một lần</Text>
            <Text style={st.modalSub}>
              {activePlanObj.name} ({activePlanObj.priceJpy} / {activePlanObj.durationLabel})
            </Text>
            <Text style={st.modalNote}>
              • Mã sản phẩm (SKU): {activePlanObj.sku}{'
'}
              • Thanh toán 1 lần duy nhất qua Google Play / App Store (Không tự động gia hạn).{'
'}
              • Gói Pro chỉ được kích hoạt sau khi Store trả về biên lai xác nhận thanh toán thành công.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable onPress={() => setCheckoutOpen(false)} style={st.cancelBtn}>
                <Text style={st.cancelBtnText}>Huỷ</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmStorePurchase}
                disabled={isProcessingBilling}
                style={[st.confirmBtn, isProcessingBilling && { opacity: 0.6 }]}
              >
                {isProcessingBilling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={st.confirmBtnText}>Thanh toán {activePlanObj.priceJpy}</Text>
                )}
              </Pressable>
            </View>

            <View style={st.dividerBox}>
              <Text style={st.dividerLabel}>Hoặc nhập mã kích hoạt đã thanh toán (có chữ ký số):</Text>
              <TextInput
                value={activationKeyInput}
                onChangeText={setActivationKeyInput}
                placeholder="VD: OTD-90D-YYYYMMDD-XXXX-XXXXXX"
                autoCapitalize="characters"
                style={st.inputBox}
              />
              <Pressable onPress={handleActivateWithSignedKey} style={st.secondaryVerifyBtn}>
                <Text style={st.secondaryVerifyBtnText}>Xác thực mã & Kích hoạt</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Khôi phục giao dịch (Kiểm tra chữ ký số nghiêm ngặt / Store IAP) */}
      <Modal visible={restoreOpen} transparent animationType="fade" onRequestClose={() => setRestoreOpen(false)}>
        <Pressable style={st.modalOverlay} onPress={() => setRestoreOpen(false)}>
          <Pressable style={st.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={st.modalTitle}>Khôi phục giao dịch đã mua</Text>
            <Text style={st.modalNote}>
              Nhập mã giao dịch đã ký số (định dạng OTD-90D-YYYYMMDD-XXXX-XXXXXX) hoặc để trống nếu muốn truy vấn trực tiếp từ tài khoản Google Play / App Store:
            </Text>
            <TextInput
              value={restoreCodeInput}
              onChangeText={setRestoreCodeInput}
              placeholder="OTD-90D-YYYYMMDD-XXXX-XXXXXX"
              autoCapitalize="characters"
              style={st.inputBox}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable onPress={() => setRestoreOpen(false)} style={st.cancelBtn}>
                <Text style={st.cancelBtnText}>Đóng</Text>
              </Pressable>
              <Pressable
                onPress={handleRestorePurchase}
                disabled={isProcessingBilling}
                style={[st.confirmBtn, isProcessingBilling && { opacity: 0.6 }]}
              >
                {isProcessingBilling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={st.confirmBtnText}>Xác thực & Khôi phục</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const st = StyleSheet.create({
  proContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  proHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(250,204,21,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proCrownText: { color: '#FDE047', fontSize: 10.5, fontWeight: '900' },
  proHeadline: { color: '#E2E8F0', fontSize: 12.5, marginTop: 10, lineHeight: 19 },
  activeEntitlementBox: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  activePlanTitle: { color: '#34D399', fontSize: 14, fontWeight: '900' },
  activePlanSub: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  activePlanReceipt: { color: '#94A3B8', fontSize: 11 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 8,
  },
  planCardRecommended: {
    backgroundColor: 'rgba(29,99,237,0.16)',
    borderColor: 'rgba(250,204,21,0.55)',
  },
  planCardActive: {
    backgroundColor: 'rgba(29,99,237,0.28)',
    borderColor: '#38BDF8',
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planBadgeGold: { backgroundColor: '#F59E0B' },
  planBadgeSlate: { backgroundColor: '#475569' },
  planBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' },
  planTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  planName: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  planTarget: { color: '#94A3B8', fontSize: 11.5, marginTop: 2 },
  planPrice: { color: '#FDE047', fontSize: 19, fontWeight: '900' },
  planPeriod: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  benefitList: { gap: 5, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText: { color: '#E2E8F0', fontSize: 11.5, flex: 1 },
  restoreBtn: { paddingVertical: 8, alignItems: 'center' },
  restoreBtnText: { color: '#93C5FD', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
  modalSub: { fontSize: 14, fontWeight: '800', color: '#1D63ED', marginTop: 6 },
  modalNote: { fontSize: 12, color: '#475569', lineHeight: 19, marginTop: 8 },
  dividerBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  dividerLabel: { fontSize: 11.5, fontWeight: '700', color: '#334155' },
  inputBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    color: '#0F172A',
  },
  secondaryVerifyBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  secondaryVerifyBtnText: { color: '#FDE047', fontSize: 12.5, fontWeight: '800' },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontSize: 13, fontWeight: '800' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1D63ED', alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
