/**
 * Phần tính toán THUẦN của streak (không dính AsyncStorage/React) — dễ test.
 * progress.ts re-export lại để màn hình không phải đổi import.
 */

export const FREEZES_PER_MONTH = 2;
export const DEFAULT_DAILY_GOAL = 20;

/** Phần state cần cho tính streak. */
export type StreakSource = {
  days: string[];
  frozenDays: string[];
  daily: Record<string, number>;
  freezesLeft: number;
};

export type StreakInfo = {
  current: number;
  longest: number;
  todayStudied: boolean;
  todayCount: number;
  goal: number;
  goalReached: boolean;
  freezesLeft: number;
  /** 7 ngày gần nhất, cũ → mới */
  last7: { day: string; state: 'studied' | 'frozen' | 'empty'; label: string }[];
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
}

export function shiftDay(key: string, delta: number): string {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

export function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

export function effectiveDays(source: Pick<StreakSource, 'days' | 'frozenDays'>): string[] {
  return [...new Set([...(source.days ?? []), ...(source.frozenDays ?? [])])];
}

/**
 * Chuỗi ngày liên tiếp tính tới hôm nay.
 * Nếu hôm nay chưa học nhưng hôm qua có thì chuỗi vẫn còn (chưa mất cho tới hết hôm nay).
 */
export function streakOf(
  days: string[],
  frozenDays: string[] = [],
  today = todayKey(),
): number {
  const sorted = [...new Set([...days, ...frozenDays])].sort();
  if (sorted.length === 0) return 0;
  const last = sorted[sorted.length - 1];
  if (dayDiff(last, today) > 1) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (dayDiff(sorted[i - 1], sorted[i]) === 1) streak += 1;
    else break;
  }
  return streak;
}

export function longestStreak(days: string[], frozenDays: string[] = []): number {
  const sorted = [...new Set([...days, ...frozenDays])].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && dayDiff(sorted[i - 1], sorted[i]) === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Tự dùng 1 lượt bảo hiểm khi lỡ đúng 1 ngày (hôm qua) mà trước đó có chuỗi.
 * Không bao giờ dùng quá số lượt còn lại; không dùng khi hôm nay đã học.
 */
export function applyAutoFreeze<T extends StreakSource>(
  state: T,
  today = todayKey(),
): { state: T; used: number } {
  const yesterday = shiftDay(today, -1);
  const dayBefore = shiftDay(today, -2);
  const studied = new Set([...state.days, ...state.frozenDays]);

  if (studied.has(today) || studied.has(yesterday)) return { state, used: 0 };
  if (!studied.has(dayBefore)) return { state, used: 0 };
  if (state.freezesLeft <= 0) return { state, used: 0 };

  return {
    state: {
      ...state,
      frozenDays: [...state.frozenDays, yesterday],
      freezesLeft: state.freezesLeft - 1,
    },
    used: 1,
  };
}

export function streakInfo(
  state: StreakSource,
  goal = DEFAULT_DAILY_GOAL,
  today = todayKey(),
): StreakInfo {
  const studied = new Set(state.days);
  const frozen = new Set(state.frozenDays);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    const weekday = new Date(`${day}T00:00:00`).getDay();
    return {
      day,
      state: studied.has(day) ? ('studied' as const) : frozen.has(day) ? ('frozen' as const) : ('empty' as const),
      label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][weekday],
    };
  });
  const todayCount = state.daily?.[today] ?? 0;
  return {
    current: streakOf(state.days, state.frozenDays, today),
    longest: longestStreak(state.days, state.frozenDays),
    todayStudied: studied.has(today),
    todayCount,
    goal,
    goalReached: todayCount >= goal,
    freezesLeft: state.freezesLeft,
    last7,
  };
}
