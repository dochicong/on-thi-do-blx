// traps.js — Phân loại các bẫy đề thi bằng lái xe Nhật Bản & cơ sở tri thức giải thích chi tiết.
// Dựa trên phân tích 759 câu hỏi thi thật (50cc, Karimen, Honmen) và Luật Giao thông đường bộ Nhật (道路交通法).

export const TRAP_CATEGORIES = {
  ABSOLUTE_KEYWORD: {
    key: "ABSOLUTE_KEYWORD",
    name: "Bẫy từ khóa tuyệt đối",
    icon: "⚠️",
    tag: "Từ khóa tuyệt đối",
    color: "#E53935",
    desc: "Chứa các từ: 'bất kể trường hợp nào', 'tuyệt đối', 'nhất định phải', 'luôn luôn', 'chỉ có'...",
    goldenRule:
      "Quy tắc vàng: Luật giao thông Nhật luôn có trường hợp ngoại lệ (xe ưu tiên cứu thương, tình thế nguy cấp...). Khi thấy từ mang tính tuyệt đối, khả năng rất cao (85-90%) câu này là SAI (✕).",
  },
  SPEED_DISTANCE: {
    key: "SPEED_DISTANCE",
    name: "Bẫy tốc độ & Khoảng cách",
    icon: "⚡",
    tag: "Tốc độ & Khoảng cách",
    color: "#FB8C00",
    desc: "Sai lệch giữa tốc độ quy định của xe 50cc (tối đa 30km/h), ô tô đường thường (60km/h), cao tốc (100km/h).",
    goldenRule:
      "Xe máy 50cc tuyệt đối không được chạy quá 30km/h dù đường có biển cho phép 40km/h hay 50km/h. Trời mưa đường trơn khoảng cách dừng xe tăng gấp khoảng 2 lần so với đường khô.",
  },
  STOP_PARK: {
    key: "STOP_PARK",
    name: "Bẫy dừng và đỗ xe (駐停車)",
    icon: "🛑",
    tag: "Dừng & Đỗ xe",
    color: "#8E24AA",
    desc: "Nhầm lẫn giữa Dừng xe (停車 - dưới 5 phút, không rời xe) và Đỗ xe (駐車 - trên 5 phút, rời khỏi xe).",
    goldenRule:
      "Cấm dừng và đỗ xe (駐停車禁止): trong vòng 5m từ giao lộ, khúc quanh, đỉnh dốc, đường hầm. Cấm đỗ xe (駐車禁止): trong vòng 3m từ lối ra vào bãi đỗ/nhà xe, 10m từ biển trạm xe buýt/xe điện.",
  },
  TWO_STEP_RIGHT: {
    key: "TWO_STEP_RIGHT",
    name: "Bẫy rẽ phải 2 giai đoạn (二段階右折)",
    icon: "↪️",
    tag: "Rẽ phải 50cc",
    color: "#039BE5",
    desc: "Quy tắc rẽ phải của xe gắn máy 50cc trên đường nhiều làn xe.",
    goldenRule:
      "Xe 50cc khi rẽ phải tại giao lộ có từ 3 làn xe trở lên (cùng chiều) HOẶC có biển báo hiệu lệnh rẽ phải 2 giai đoạn thì BẮT BUỘC phải rẽ 2 giai đoạn, không được xi-nhan áp sát làn trong để rẽ trực tiếp như ô tô.",
  },
  SIGNALS_CROSSWALK: {
    key: "SIGNALS_CROSSWALK",
    name: "Bẫy đèn tín hiệu & Người đi bộ",
    icon: "🚦",
    tag: "Tín hiệu & Người đi bộ",
    color: "#43A047",
    desc: "Phân biệt đèn vàng/đỏ nhấp nháy, quy tắc tuyệt đối nhường đường người đi bộ qua đường.",
    goldenRule:
      "Đèn vàng nhấp nháy: chú ý an toàn rồi đi tiếp. Đèn đỏ nhấp nháy: BẮT BUỘC dừng lại tạm thời (一時停止), xác nhận an toàn mới được đi. Tại vạch sang đường, nếu có người đi bộ hoặc có khả năng có người sang đường, bắt buộc phải giảm tốc độ hoặc dừng lại nhường đường.",
  },
  RAILWAY_CROSSING: {
    key: "RAILWAY_CROSSING",
    name: "Bẫy đường tàu xe lửa (踏切)",
    icon: "🚆",
    tag: "Đường tàu",
    color: "#D81B60",
    desc: "Quy định khi vượt qua rào chắn và đường sắt.",
    goldenRule:
      "Trước đường sắt BẮT BUỘC phải tạm dừng trước vạch dừng, hạ cửa kính để nghe ngóng âm thanh còi tàu và quan sát an toàn. Chỉ được đi vào đường sắt khi bờ bên kia có đủ khoảng trống cho xe mình thoát qua.",
  },
  KIKEN_SITUATIONAL: {
    key: "KIKEN_SITUATIONAL",
    name: "Bẫy tình huống nguy hiểm (危険予測)",
    icon: "👁️",
    tag: "Kiken Yosoku",
    color: "#E65100",
    desc: "Câu hỏi tình huống mô phỏng thực tế với 3 phương án lựa chọn.",
    goldenRule:
      "Luôn dự đoán nguy cơ tiềm ẩn (trẻ em chạy ra bất ngờ, người mở cửa xe phía trước, xe máy trong điểm mù). Không bao giờ được chủ quan phán đoán 'chắc là xe kia sẽ nhường'.",
  },
  GENERAL_RULE: {
    key: "GENERAL_RULE",
    name: "Quy tắc an toàn chung",
    icon: "📖",
    tag: "Kiến thức luật",
    color: "#546E7A",
    desc: "Các quy định pháp luật giao thông đường bộ tiêu chuẩn.",
    goldenRule:
      "Lái xe phòng vệ: kiểm tra gương chiếu hậu, xác nhận điểm mù bằng mắt thường (目視 - Mokushi) trước khi chuyển làn.",
  },
};

/**
 * Phân tích nội dung câu hỏi để xác định bẫy và tạo lời giải thích chi tiết.
 */
export function analyzeQuestionTrap(question) {
  const text = (question.text_vi || "").normalize("NFC").trim();
  const lower = text.toLowerCase();
  const isSit = question.section === "situational" || question.section === "scenario";

  if (isSit) {
    return {
      category: TRAP_CATEGORIES.KIKEN_SITUATIONAL,
      trapWarning: "CÂU TÌNH HUỐNG MINH HỌA NGUY HIỂM (2 ĐIỂM)",
      ruleSummary:
        "Quan sát toàn diện gương chiếu hậu và điểm mù, phanh giảm tốc độ từ xa để dự phòng tình huống đột xuất.",
      lawRef: "Điều 70 Luật Giao thông Đường bộ Nhật Bản (Nghĩa vụ lái xe an toàn)",
      tip: "Chọn phương án lái xe phòng vệ cẩn trọng nhất, không phanh gấp gây bất ngờ cho xe sau.",
    };
  }

  // 1. Kiểm tra bẫy từ khóa tuyệt đối
  const absoluteKeywords = [
    "bất kể",
    "bất kỳ",
    "tuyệt đối",
    "nhất định phải",
    "luôn luôn",
    "bất cứ",
    "không cần phải",
    "mọi nơi",
    "trong mọi trường hợp",
    "chỉ có thể",
  ];
  for (const kw of absoluteKeywords) {
    if (lower.includes(kw)) {
      return {
        category: TRAP_CATEGORIES.ABSOLUTE_KEYWORD,
        trapWarning: `BẪY TỪ KHÓA TUYỆT ĐỐI: "${kw.toUpperCase()}"`,
        ruleSummary: `Câu chứa cụm từ tuyệt đối "${kw}" thường là khẳng định sai vì Luật luôn có ngoại lệ xe cứu thương, trường hợp cấp bách hoặc điều kiện đường bộ đặc thù.`,
        lawRef: "Quy tắc suy luận đề thi lý thuyết Nhật Bản (Đạo luật Sát hạch NPA)",
        tip: `Gặp "${kw}", hãy đặt câu hỏi: "Có trường hợp nào ngoại lệ không?" Nếu có ngoại lệ, chọn SAI (✕).`,
      };
    }
  }

  // 2. Kiểm tra bẫy rẽ phải 2 giai đoạn cho 50cc
  if (
    lower.includes("rẽ phải") &&
    (lower.includes("50cc") || lower.includes("xe gắn máy") || lower.includes("2 giai đoạn") || lower.includes("hai giai đoạn"))
  ) {
    return {
      category: TRAP_CATEGORIES.TWO_STEP_RIGHT,
      trapWarning: "BẪY RẼ PHẢI XE 50CC (二段階右折)",
      ruleSummary:
        "Xe 50cc trên đường từ 3 làn xe trở lên cùng chiều, hoặc giao lộ có biển hiệu lệnh rẽ phải 2 giai đoạn, BẮT BUỘC phải rẽ 2 giai đoạn (đi thẳng qua giao lộ, xoay đầu xe rồi chờ đèn xanh hướng cắt ngang).",
      lawRef: "Điều 34, Khoản 5 Luật Giao thông đường bộ Nhật Bản",
      tip: "Xe 50cc không bao giờ được chuyển sang làn sát dải phân cách giữa để rẽ phải trực tiếp tại giao lộ lớn.",
    };
  }

  // 3. Kiểm tra bẫy dừng đỗ
  if (lower.includes("dừng") || lower.includes("đỗ") || lower.includes("đậu")) {
    return {
      category: TRAP_CATEGORIES.STOP_PARK,
      trapWarning: "BẪY VỊ TRÍ & KHÁI NIỆM DỪNG / ĐỖ XE (駐停車)",
      ruleSummary:
        "Dừng xe (dưới 5 phút, người lái không rời xe). Đỗ xe (trên 5 phút hoặc người lái rời khỏi xe). Cấm dừng đỗ trong phạm vi 5m từ giao lộ/góc quanh. Cấm đỗ trong phạm vi 3m lối ra vào.",
      lawRef: "Điều 44 & Điều 45 Luật Giao thông đường bộ Nhật Bản",
      tip: "Phân biệt kỹ: 'Cấm dừng và đỗ' (駐停車禁止) nghiêm ngặt hơn nhiều so với 'Cấm đỗ xe' (駐車禁止).",
    };
  }

  // 4. Kiểm tra bẫy tốc độ & khoảng cách
  if (lower.includes("tốc độ") || lower.includes("km/h") || lower.includes("khoảng cách") || lower.includes("phanh gấp")) {
    return {
      category: TRAP_CATEGORIES.SPEED_DISTANCE,
      trapWarning: "BẪY TỐC ĐỘ PHÁP ĐỊNH & QUY TẮC PHANH",
      ruleSummary:
        "Tốc độ tối đa theo luật định của xe 50cc là 30km/h (kể cả đường cho phép 50km/h). Xe ô tô thông thường trên đường bằng là 60km/h, cao tốc là 100km/h. Nghiêm cấm phanh gấp trừ trường hợp khẩn cấp tránh nguy hiểm.",
      lawRef: "Điều 22 & Lệnh thi hành Luật Giao thông đường bộ",
      tip: "Nhớ con số cốt lõi: 50cc luôn là 30km/h! Trời mưa khoảng cách phanh dừng xe tăng gấp 2 lần.",
    };
  }

  // 5. Kiểm tra bẫy đường sắt
  if (lower.includes("đường sắt") || lower.includes("đường tàu") || lower.includes("xe lửa") || lower.includes("rào chắn")) {
    return {
      category: TRAP_CATEGORIES.RAILWAY_CROSSING,
      trapWarning: "BẪY BĂNG QUA ĐƯỜNG SẮT (踏切の通過)",
      ruleSummary:
        "Trước đường sắt phải tạm dừng hoàn toàn trước vạch dừng, hạ kính cửa sổ để nghe âm thanh còi tàu và nhìn an toàn hai bên. Chỉ tiến vào khi bờ bên kia còn chỗ trống cho cả xe.",
      lawRef: "Điều 33 Luật Giao thông đường bộ Nhật Bản",
      tip: "Kể cả rào chắn đang mở và đèn chưa đỏ, vẫn BẮT BUỘC phải dừng lại nghe ngóng (trừ khi có cảnh sát điều khiển).",
    };
  }

  // 6. Kiểm tra bẫy đèn tín hiệu & người đi bộ
  if (
    lower.includes("tín hiệu") ||
    lower.includes("đèn vàng") ||
    lower.includes("đèn đỏ") ||
    lower.includes("người đi bộ") ||
    lower.includes("vạch kẻ")
  ) {
    return {
      category: TRAP_CATEGORIES.SIGNALS_CROSSWALK,
      trapWarning: "BẪY ĐÈN TÍN HIỆU & VẠCH CHO NGƯỜI ĐI BỘ",
      ruleSummary:
        "Đèn đỏ nhấp nháy = Dừng lại tạm thời (一時停止). Đèn vàng nhấp nháy = Chú ý an toàn đi tiếp. Tại vạch người đi bộ: Người đi bộ luôn có quyền ưu tiên tối thượng.",
      lawRef: "Điều 7 & Điều 38 Luật Giao thông đường bộ Nhật Bản",
      tip: "Đèn đỏ nhấp nháy giống như biển STOP (止まれ) — bánh xe phải dừng lại 0 km/h hoàn toàn.",
    };
  }

  return {
    category: TRAP_CATEGORIES.GENERAL_RULE,
    trapWarning: "QUY TẮC AN TOÀN TIÊU CHUẨN",
    ruleSummary:
      "Thực hiện quan sát trực tiếp bằng mắt (目視) kết hợp kính chiếu hậu, bật đèn xi-nhan trước 30m hoặc 3 giây trước khi đổi hướng.",
    lawRef: "Quy chuẩn lái xe an toàn Nhật Bản (JAF / MLIT)",
    tip: "Chú ý phân tích nguyên nhân và hệ quả trong câu: nếu hệ quả gây nguy cơ tai nạn thì câu đó là SAI.",
  };
}

/**
 * Thống kê các nhóm bẫy người dùng làm sai trong bài thi.
 */
export function summarizeTraps(questions, userAnswers) {
  const counts = {};
  Object.keys(TRAP_CATEGORIES).forEach((k) => {
    counts[k] = { category: TRAP_CATEGORIES[k], total: 0, wrong: 0, correct: 0 };
  });

  questions.forEach((q) => {
    const analysis = analyzeQuestionTrap(q);
    const catKey = analysis.category.key;
    const ua = userAnswers[q.id];
    const isSit = q.section === "situational" || q.section === "scenario";
    const isAnswered = ua != null;

    counts[catKey].total += 1;

    let isCorrect = false;
    if (isSit) {
      const key = q.choices_answers;
      isCorrect =
        isAnswered &&
        Array.isArray(key) &&
        key.every((a, i) => ua?.[String(i + 1)] === a);
    } else if (q.answer != null && isAnswered) {
      isCorrect = ua === q.answer;
    }

    if (isAnswered) {
      if (isCorrect) counts[catKey].correct += 1;
      else counts[catKey].wrong += 1;
    } else {
      counts[catKey].wrong += 1; // chưa làm tính là cần ôn lại
    }
  });

  return Object.values(counts).filter((c) => c.total > 0);
}
