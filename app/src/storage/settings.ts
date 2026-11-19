import { KEYS, readJSON, writeJSON } from './storage';

export type ReminderConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type ProPlanId = 'free' | 'tap_trung_30d' | 'vuot_cap_90d' | 'vip_lifetime';

export type AppSettings = {
  reminder: ReminderConfig;
  streakWarning: ReminderConfig;
  dailyGoal: {
    questions: number;
  };
  examDate: string;
  licenseLevel: '50cc' | 'karimen' | 'honmen';
  studyMinutesToday: number;
  isPro?: boolean;
  proPlan?: ProPlanId;
  proActivatedAt?: string | null;
  proExpiresAt?: string | null;
  proReceiptId?: string | null;
};

function defaultExamDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

export const defaultSettings: AppSettings = {
  reminder: { enabled: false, hour: 20, minute: 0 },
  streakWarning: { enabled: true, hour: 21, minute: 30 },
  dailyGoal: { questions: 20 },
  examDate: defaultExamDate(), // mặc định 30 ngày kể từ lần mở đầu; người dùng tự chọn lại
  licenseLevel: '50cc',
  studyMinutesToday: 0,
  isPro: false,
  proPlan: 'free',
  proActivatedAt: null,
  proExpiresAt: null,
  proReceiptId: null,
};

/** Kiểm tra thời hạn Gói Pro thanh toán 1 lần (Không tự động gia hạn) */
export function isProEntitlementActive(s: AppSettings): boolean {
  if (!s.isPro || !s.proPlan || s.proPlan === 'free') return false;
  if (s.proPlan === 'vip_lifetime' || !s.proExpiresAt) return true;
  const exp = new Date(s.proExpiresAt).getTime();
  return !Number.isNaN(exp) && exp >= Date.now();
}

export function remainingProDays(s: AppSettings, refDate: Date = new Date()): number | null {
  if (!isProEntitlementActive(s)) return 0;
  if (s.proPlan === 'vip_lifetime' || !s.proExpiresAt) return null; // Vĩnh viễn
  const exp = new Date(s.proExpiresAt);
  const diff = Math.round((exp.getTime() - refDate.getTime()) / 86400000);
  return Math.max(0, diff);
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await readJSON<Partial<AppSettings>>(KEYS.settings, {});
  const merged: AppSettings = {
    ...defaultSettings,
    ...raw,
    reminder: { ...defaultSettings.reminder, ...(raw.reminder ?? {}) },
    streakWarning: { ...defaultSettings.streakWarning, ...(raw.streakWarning ?? {}) },
    dailyGoal: { ...defaultSettings.dailyGoal, ...(raw.dailyGoal ?? {}) },
  };
  if (merged.isPro && !isProEntitlementActive(merged)) {
    merged.isPro = false;
    merged.proPlan = 'free';
  }
  return merged;
}

export async function updateSettings(patch: DeepPartial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next: AppSettings = {
    ...current,
    ...(patch as Partial<AppSettings>),
    reminder: { ...current.reminder, ...(patch.reminder ?? {}) },
    streakWarning: { ...current.streakWarning, ...(patch.streakWarning ?? {}) },
    dailyGoal: { ...current.dailyGoal, ...(patch.dailyGoal ?? {}) },
  };
  await writeJSON(KEYS.settings, next);
  return next;
}

export function formatTime(hour: number, minute: number): string {
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`;
}
