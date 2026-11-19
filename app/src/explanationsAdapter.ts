/**
 * Adapter giải thích câu hỏi.
 *
 * Mục đích: màn hình chỉ phụ thuộc vào MỘT hàm `explain()`; khi module nội dung
 * `src/explanations.js` (gemini-3.8) sẵn sàng, chỉ cần import vào đây và ưu tiên
 * dùng nó — không phải sửa ExamScreen/ReviewExamScreen.
 *
 * Hiện tại lấy từ `traps.js` (phân tích bẫy theo luật) nếu module nội dung chưa có.
 */
import { getExplanation } from './explanations';
import { analyzeQuestionTrap } from './traps';

export type ExplanationData = {
  verdict?: string | null;
  why?: string | null;
  trap?: string | null;
  tip?: string | null;
  law?: string | null;
};

type ExplainOptions = {
  isCorrect?: boolean;
  correctLabel?: string;
};

/** Trả về dữ liệu giải thích cho 1 câu hỏi; thiếu dữ liệu thì trả object rỗng. */
export function explain(question: any, opts: ExplainOptions = {}): ExplanationData {
  const rich = getExplanation(question) as unknown;
  const richText = typeof rich === 'string' && rich.trim().length > 0 ? rich.trim() : null;

  const verdict =
    typeof opts.isCorrect === 'boolean'
      ? opts.isCorrect
        ? '✓ Câu này bạn làm đúng'
        : '✗ Câu này bạn làm sai'
      : opts.correctLabel ?? null;

  // explanations.js trả về CHUỖI giải thích đã soát theo từng câu: dùng nguyên văn,
  // không trộn thêm "phân tích bẫy" theo từ khoá (dễ nói sai với câu có đáp án ○).
  if (richText) {
    return { verdict, why: richText, trap: null, tip: null, law: null };
  }

  // Dự phòng: chỉ khi câu hoàn toàn không có giải thích.
  const trap = analyzeQuestionTrap(question);
  const isGeneric = trap?.category?.key === 'GENERAL_RULE';
  return {
    verdict,
    why: trap?.ruleSummary ?? null,
    trap: isGeneric ? null : trap?.trapWarning ?? null,
    tip: trap?.tip ?? null,
    law: trap?.lawRef ?? null,
  };
}
