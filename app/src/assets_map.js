// assets_map.js — Ánh xạ hình ảnh câu hỏi từ dataset.bundle.json và biển báo từ signs_ja.index.json
// Không dùng require() tĩnh vào các file ảnh cục bộ không tồn tại để tránh lỗi Metro Bundler.
import bundle from "../assets/data/dataset.bundle.json";
import signsIndex from "../assets/data/signs_ja.index.json";

const SIGN_URI_MAP = {};
if (signsIndex && Array.isArray(signsIndex.signs)) {
  signsIndex.signs.forEach((s) => {
    const uri = s.png_url || s.svg_url || s.image_url || null;
    if (uri) {
      SIGN_URI_MAP[s.id] = { uri };
      if (s.code) SIGN_URI_MAP[`jp-${s.code}`] = { uri };
    }
  });
}

const QUESTION_URI_MAP = {};
if (bundle && Array.isArray(bundle.exams)) {
  bundle.exams.forEach((ex) => {
    (ex.questions || []).forEach((q) => {
      if (Array.isArray(q.images) && q.images.length > 0) {
        q.images.forEach((img, idx) => {
          const url = typeof img === "string" ? img : img?.source_url || img?.url;
          if (url) {
            QUESTION_URI_MAP[`${q.id}#${idx}`] = { uri: url };
          }
        });
      } else if (q.image_url) {
        QUESTION_URI_MAP[`${q.id}#0`] = { uri: q.image_url };
      }
    });
  });
}

export const signImage = (signId) => SIGN_URI_MAP[signId] || SIGN_URI_MAP[`jp-${signId}`] || null;
export const hasSignImage = (signId) => Boolean(signImage(signId));

export const questionImage = (questionId, index = 0) => {
  return QUESTION_URI_MAP[`${questionId}#${index}`] || QUESTION_URI_MAP[`${questionId}#0`] || null;
};

export const answerSheetImage = () => null;

export default { signImage, hasSignImage, questionImage, answerSheetImage };
