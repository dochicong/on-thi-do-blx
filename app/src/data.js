// data.js — Tầng dữ liệu cho app: bundle, đề thi, quy chế chấm điểm.
// (Bản đã sửa: chuẩn hoá section "scenario" -> "situational", gom pool theo cấp độ
//  dựa trên stage/is_50cc thay vì exam_type của đề, chấm điểm theo đúng cấp.)
import bundle from "../assets/data/dataset.bundle.json";

export const SPEC = bundle.official_spec; // { '50cc', karimen, honmen }
export const LEVELS = ["50cc", "karimen", "honmen"];
export const LEVEL_LABEL = {
  "50cc": "50cc (原付)",
  karimen: "Karimen (仮免)",
  honmen: "Honmen (本免)",
};
export const SIGN_GROUPS = bundle.sign_bank.groups; // { '1'|'2'|'3'|'4'|'5'|'marking': {ja, vi} }

/** 6 nhóm thực tế theo signs_ja.index.json: {group, group_ja, group_vi, count} */
export const signGroupsFromIndex = () => {
  const signs = allSigns();
  const m = new Map();
  signs.forEach((s) => {
    const k = s.group;
    if (!m.has(k)) m.set(k, { group: k, group_ja: s.group_ja, group_vi: s.group_vi, count: 0 });
    m.get(k).count += 1;
  });
  return [...m.values()];
};

export const examById = (id) => bundle.exams.find((e) => e.id === id);

export const allSigns = () => {
  // bundle không nhúng index (nặng) — app import riêng signs index
  return require("../assets/data/signs_ja.index.json").signs;
};

/** Chuẩn hoá nội dung câu để khử trùng lặp (bỏ khoảng cách, dấu câu, hoa/thường). */
export const qKey = (t) =>
  (t || "")
    .toLowerCase()
    .replace(/[，,、。.．\s\u3000()（）]/g, "");

/** Dữ liệu dùng "scenario" cho câu tình huống 3 ý; toàn bộ app dùng "situational". */
const isSituational = (q) => q.section === "situational" || q.section === "scenario" || q.type === "scenario";
const normalizeQ = (q) => (q.section === "scenario" ? { ...q, section: "situational" } : q);

const ALL_QUESTIONS = bundle.exams.flatMap((e) => e.questions.map(normalizeQ));

/**
 * Câu nào thuộc cấp nào (exam_type của đề trong bundle là "all" và exam_type của
 * từng câu chỉ là nhãn gốc, KHÔNG dùng để chia pool):
 *  - 50cc   : câu ○✕ có is_50cc + câu tình huống
 *  - karimen: toàn bộ câu ○✕ Giai đoạn 1
 *  - honmen : toàn bộ câu ○✕ Giai đoạn 2 + câu tình huống
 */
const LEVEL_FILTER = {
  "50cc": (q) => isSituational(q) || q.is_50cc === true,
  karimen: (q) => !isSituational(q) && q.stage === 1,
  honmen: (q) => isSituational(q) || q.stage === 2,
};

const poolCache = {};
/** Pool câu hỏi của 1 cấp, đã khử trùng lặp. */
export function levelPool(level) {
  if (poolCache[level]) return poolCache[level];
  const f = LEVEL_FILTER[level];
  const seen = new Set();
  const out = [];
  ALL_QUESTIONS.forEach((q) => {
    if (!f || !f(q)) return;
    if (q.duplicate_of) return;
    const k = `${isSituational(q) ? "S" : "T"}:${qKey(q.text_vi)}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(q);
  });
  poolCache[level] = out;
  return out;
}

/** Danh sách 20 bộ đề đánh số (Đề số 1 → Đề số 20) cho từng cấp độ (50cc, Karimen, Honmen). */
export const examsByLevel = (level = "50cc") => {
  const spec = SPEC[level] || SPEC["50cc"];
  return Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    return {
      id: `${level}-de-${num}`,
      setNum: num,
      exam_type: level,
      type: level,
      title: `Đề số ${num} – ${LEVEL_LABEL[level] || level} (${spec.total_questions} câu · ${spec.max_score}đ)`,
    };
  });
};

/** Fisher–Yates (không thiên lệch như sort ngẫu nhiên). */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Chuyên đề thật từ dữ liệu (stage 1: 10 chuyên đề, stage 2: 8 chuyên đề). */
export function topicsForStage(stage, progress = null) {
  const level = stage === 1 ? "karimen" : "honmen";
  const pool = levelPool(level);
  const map = new Map();
  pool.forEach((q) => {
    if (isSituational(q)) return;
    if (!q.topic_id) return;
    if (!map.has(q.topic_id)) {
      const raw = String(q.topic_title || q.topic_id);
      const m = /^(Chuyên đề\s*\d+)\s*:\s*(.+)$/.exec(raw);
      map.set(q.topic_id, {
        id: `${stage === 1 ? "s1" : "s2"}-${q.topic_id}`,
        topic_id: q.topic_id,
        codeLabel: m ? m[1] : "Chuyên đề",
        title: m ? m[2] : raw,
        total: 0,
      });
    }
    map.get(q.topic_id).total += 1;
  });
  const extraSit = stage === 2 ? pool.filter(isSituational).length : 0;
  return [...map.values()]
    .sort((a, b) => parseInt(a.topic_id.split("_t")[1], 10) - parseInt(b.topic_id.split("_t")[1], 10))
    .map((t) => {
      const history = Array.isArray(progress?.examHistory)
        ? progress.examHistory.filter((h) => h.examId === t.id || h.topicId === t.topic_id)
        : [];
      const attempts = history.length;
      const trophies = history.filter((h) => h.passed).length;
      const lastScore = attempts > 0 ? Math.round(((history[0].score || 0) / Math.max(1, history[0].max || 1)) * 100) : 0;
      const tot = t.total + (stage === 2 && t.topic_id === "s2_t1" ? extraSit : 0);
      return {
        ...t,
        total: tot,
        count: Math.min(15, tot),
        trophies,
        attempts,
        lastScore,
      };
    });
}

/** Bộ câu hỏi luyện theo chuyên đề (tối đa 15 câu, ngẫu nhiên trong chuyên đề). */
export function buildTopicPaper(stage, topic) {
  const level = stage === 1 ? "karimen" : "honmen";
  const pool = levelPool(level);
  const inTopic = pool.filter((q) =>
    isSituational(q) ? stage === 2 && topic.topic_id === "s2_t1" : q.topic_id === topic.topic_id
  );
  const picked = shuffle(inTopic).slice(0, topic.count || 15);
  return {
    exam: { id: topic.id, type: level, title: topic.title, codeLabel: topic.codeLabel },
    level,
    questions: picked,
    spec: {
      ...SPEC[level],
      total_questions: picked.length,
      max_score: picked.reduce((s, q) => s + (isSituational(q) ? 2 : 1), 0),
      pass_score: Math.ceil(
        picked.reduce((s, q) => s + (isSituational(q) ? 2 : 1), 0) * 0.9
      ),
      minutes: 15,
      label_vi: `${topic.codeLabel} · ${topic.title}`,
    },
    isSynthetic: true,
    isTopicQuiz: true,
  };
}

/**
 * Lắp đề "thi thật" theo quy chế, có KHỬ TRÙNG LẶP:
 *  - 50cc   : 46 câu ○✕ + 2 câu tình huống (tổng 48 câu = 50 điểm)
 *  - karimen: 50 câu ○✕
 *  - honmen : 90 câu ○✕ + 5 câu tình huống
 * mode "traps": ưu tiên câu có từ khoá bẫy (không đổi cấu trúc đề).
 * Trả về { exam, level, questions, spec, isSynthetic, mode }
 */
export function buildExamPaper(level, examId, mode = "standard") {
  const spec = SPEC[level] || SPEC["50cc"];
  const pool = levelPool(level);
  const tfPool = pool.filter((q) => !isSituational(q));
  const sitPool = pool.filter(isSituational);
  const nTf = spec.text_questions;
  const nSit = spec.illustration_questions;

  const mSet = typeof examId === "string" ? /-de-(\d+)$/.exec(examId) : null;
  const setNum = mSet ? Math.max(1, Math.min(20, parseInt(mSet[1], 10))) : null;

  let tf;
  let sit;
  if (setNum !== null && mode !== "traps") {
    const startTf = ((setNum - 1) * nTf) % Math.max(1, tfPool.length);
    tf = Array.from({ length: Math.min(nTf, tfPool.length) }, (_, i) => tfPool[(startTf + i) % tfPool.length]);
    const startSit = ((setNum - 1) * Math.max(1, nSit)) % Math.max(1, sitPool.length);
    sit = Array.from({ length: Math.min(nSit, sitPool.length) }, (_, i) => sitPool[(startSit + i) % sitPool.length]);
  } else if (mode === "traps") {
    const trapWord = [
      "bất kể", "tuyệt đối", "luôn luôn", "không cần", "cũng được",
      "miễn là", "tuy nhiên", "bất cứ", "chỉ cần",
    ];
    const traps = tfPool.filter((q) =>
      trapWord.some((w) => (q.text_vi || "").toLowerCase().includes(w))
    );
    const rest = tfPool.filter((q) => !traps.includes(q));
    tf = [...shuffle(traps), ...shuffle(rest)].slice(0, nTf);
    sit = shuffle(sitPool).slice(0, nSit);
  } else {
    tf = shuffle(tfPool).slice(0, nTf);
    sit = shuffle(sitPool).slice(0, nSit);
  }
  const questions = [...tf, ...sit];
  const stamp = Date.now();
  return {
    exam: {
      id: `${level}-${mode === "traps" ? "traps" : "random"}-${stamp}`,
      title:
        mode === "traps"
          ? `Luyện câu bẫy – ${LEVEL_LABEL[level]}`
          : `Thi thử ngẫu nhiên – ${LEVEL_LABEL[level]}`,
      source_url: null,
    },
    level,
    questions,
    spec,
    isSynthetic: true,
    mode,
  };
}

/**
 * Chấm điểm theo quy chế Nhật:
 *  - ○✕: 1đ, khớp "D"/"S" với q.answer.
 *  - Tình huống: 2đ, CHỈ khi đúng CẢ các ý. userAnswers[q.id] = {1:"D"|"S", 2:..., 3:...}
 *  - Bỏ trống không có điểm, trạng thái chưa trả lời.
 * level: cấp của đề (bắt buộc để lấy đúng điểm đậu). specOverride: dùng cho đề chuyên đề.
 */
export function gradePaper(questions, userAnswers, level, specOverride) {
  let scoreKnown = 0;
  let maxKnown = 0;
  let pending = 0;
  const detail = questions.map((q) => {
    const ua = userAnswers[q.id];
    const isSit = isSituational(q);
    const value = isSit ? 2 : 1;
    if (isSit) {
      const key = Array.isArray(q.choices_answers) ? q.choices_answers : null;
      if (!key) {
        pending += 1;
        return { id: q.id, user: ua ?? null, correct: null, value, graded: false };
      }
      maxKnown += value;
      const nItems = q.choices_vi.length;
      const answered = ua && Object.keys(ua).length >= nItems;
      const perItemCorrect = answered
        ? q.choices_vi.every(
            (_, i) => ua[String(i + 1)] != null && ua[String(i + 1)] === key[i]
          )
        : false;
      if (perItemCorrect) scoreKnown += value;
      return {
        id: q.id,
        user: ua ?? null,
        correct: answered ? perItemCorrect : null,
        perItem: Array.from({ length: nItems }, (_, i) => ({
          user: ua?.[String(i + 1)] ?? null,
          correct: ua?.[String(i + 1)] != null ? ua[String(i + 1)] === key[i] : null,
        })),
        value,
        graded: answered,
      };
    }
    if (q.answer == null) {
      pending += 1;
      return { id: q.id, user: ua ?? null, correct: null, value, graded: false };
    }
    maxKnown += value;
    if (ua == null) {
      return { id: q.id, user: null, correct: null, value, graded: false, unanswered: true };
    }
    const correct = ua === q.answer;
    if (correct) scoreKnown += value;
    return { id: q.id, user: ua, correct, value, graded: true };
  });
  const spec = specOverride || SPEC[level] || SPEC[questions[0]?.exam_type] || SPEC.karimen;
  const passKnown = maxKnown > 0 ? scoreKnown >= spec.pass_score : null;
  return {
    scoreKnown,
    maxKnown,
    pending,
    passKnown,
    detail,
    needsScanReview: pending > 0,
  };
}

export const fmtTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const bundleMeta = {
  version: bundle.version,
  generated_at: bundle.generated_at,
  counts: bundle.counts,
};
