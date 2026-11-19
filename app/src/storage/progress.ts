/**
 * Tiến độ học + hệ thống streak kiểu Duolingo, lưu local (offline-first).
 *
 * Streak có 2 cơ chế:
 *  - days        : ngày thực sự có học
 *  - frozenDays  : ngày được "bảo hiểm chuỗi" (streak freeze) — mỗi tháng có
 *                  FREEZES_PER_MONTH lượt, tự dùng khi lỡ đúng 1 ngày.
 * Mục tiêu ngày: số câu tối thiểu/ngày, đếm trong `daily`.
 */
import {
  applyAutoFreeze,
  dayDiff,
  effectiveDays,
  longestStreak,
  monthKey,
  shiftDay,
  streakInfo,
  streakOf,
  todayKey,
  DEFAULT_DAILY_GOAL,
  FREEZES_PER_MONTH,
  type StreakInfo,
} from './streak';
import { KEYS, readJSON, writeJSON } from './storage';

export {
  applyAutoFreeze,
  effectiveDays,
  longestStreak,
  monthKey,
  shiftDay,
  streakInfo,
  streakOf,
  todayKey,
  DEFAULT_DAILY_GOAL,
  FREEZES_PER_MONTH,
  dayDiff,
  type StreakInfo,
};

export type ExamRecord = {
  attempts: number;
  bestScore: number;
  bestMax: number;
  passed: boolean;
  lastScore: number;
  lastMax: number;
  lastAt: number;
};

export type QuestionRecord = {
  seen: number;
  wrong: number;
  lastCorrect: boolean;
};

export type ProgressState = {
  version: 1;
  exams: Record<string, ExamRecord>;
  questions: Record<string, QuestionRecord>;
  /** ngày dạng YYYY-MM-DD có học */
  days: string[];
  /** ngày được bảo hiểm chuỗi */
  frozenDays: string[];
  /** số lượt bảo hiểm còn lại trong tháng */
  freezesLeft: number;
  /** tháng đang tính lượt bảo hiểm, dạng YYYY-MM */
  freezeMonth: string;
  /** số câu đã làm theo ngày */
  daily: Record<string, number>;
  totals: { answered: number; correct: number };
};

export const emptyProgress: ProgressState = {
  version: 1,
  exams: {},
  questions: {},
  days: [],
  frozenDays: [],
  freezesLeft: FREEZES_PER_MONTH,
  freezeMonth: '',
  daily: {},
  totals: { answered: 0, correct: 0 },
};

/** Nạp lại lượt bảo hiểm chuỗi đầu mỗi tháng. */
function ensureFreezeBudget(state: ProgressState): ProgressState {
  const month = monthKey();
  if (state.freezeMonth === month) return state;
  return { ...state, freezeMonth: month, freezesLeft: FREEZES_PER_MONTH };
}

export async function loadProgress(): Promise<ProgressState> {
  const raw = await readJSON<Partial<ProgressState>>(KEYS.progress, {});
  const base: ProgressState = {
    ...emptyProgress,
    ...raw,
    exams: raw.exams ?? {},
    questions: raw.questions ?? {},
    days: raw.days ?? [],
    frozenDays: raw.frozenDays ?? [],
    daily: raw.daily ?? {},
    totals: raw.totals ?? { answered: 0, correct: 0 },
    freezesLeft: typeof raw.freezesLeft === 'number' ? raw.freezesLeft : FREEZES_PER_MONTH,
    freezeMonth: raw.freezeMonth ?? '',
    version: 1,
  };
  const budgeted = ensureFreezeBudget(base);
  const { state: frozenState } = applyAutoFreeze(budgeted);
  if (frozenState !== budgeted) {
    await saveProgress(frozenState);
  }
  return frozenState;
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await writeJSON(KEYS.progress, state);
}

function markStudied(state: ProgressState, today: string): ProgressState {
  return { ...state, days: state.days.includes(today) ? state.days : [...state.days, today].slice(-400) };
}

/** Ghi 1 câu đã làm; cộng vào mục tiêu ngày và đánh dấu ngày học. */
export async function recordAnswer(questionId: string, correct: boolean): Promise<ProgressState> {
  const state = await loadProgress();
  const today = todayKey();
  const rec = state.questions[questionId] ?? { seen: 0, wrong: 0, lastCorrect: false };
  const next: ProgressState = {
    ...state,
    questions: {
      ...state.questions,
      [questionId]: {
        seen: rec.seen + 1,
        wrong: rec.wrong + (correct ? 0 : 1),
        lastCorrect: correct,
      },
    },
    totals: {
      answered: state.totals.answered + 1,
      correct: state.totals.correct + (correct ? 1 : 0),
    },
    daily: { ...state.daily, [today]: (state.daily[today] ?? 0) + 1 },
  };
  const withDay = markStudied(next, today);
  await saveProgress(withDay);
  return withDay;
}

/** Ghi kết quả một lượt thi. `passed` do màn thi quyết định theo quy chế. */
export async function recordExamResult(input: {
  examId: string;
  score: number;
  maxScore: number;
  passed: boolean;
}): Promise<ProgressState> {
  const state = await loadProgress();
  const prev = state.exams[input.examId];
  const best = prev ? Math.max(prev.bestScore, input.score) : input.score;
  const next: ProgressState = {
    ...state,
    exams: {
      ...state.exams,
      [input.examId]: {
        attempts: (prev?.attempts ?? 0) + 1,
        bestScore: best,
        bestMax: input.maxScore,
        passed: (prev?.passed ?? false) || input.passed,
        lastScore: input.score,
        lastMax: input.maxScore,
        lastAt: Date.now(),
      },
    },
  };
  const withDay = markStudied(next, todayKey());
  await saveProgress(withDay);
  return withDay;
}

export async function resetProgress(): Promise<void> {
  await saveProgress({ ...emptyProgress, freezeMonth: monthKey() });
}

/** Lượt thi vừa xong — màn Kết quả đọc lại (không truyền qua route param). */
export type LastAttempt = {
  examId: string;
  examLabel: string;
  examType: string;
  score: number;
  maxScore: number;
  passed: boolean;
  finishedAt: number;
  totalQuestions: number;
  correctCount?: number;
  needsScanReview?: boolean;
  paper?: unknown;
  answers?: unknown;
  result?: unknown;
};

export async function saveLastAttempt(attempt: LastAttempt): Promise<void> {
  await writeJSON(KEYS.lastExam, attempt);
}

export async function loadLastAttempt(): Promise<LastAttempt | null> {
  return readJSON<LastAttempt | null>(KEYS.lastExam, null);
}
