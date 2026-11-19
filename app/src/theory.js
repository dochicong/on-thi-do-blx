/**
 * theory.js — Nội dung 6 bài học lý thuyết chuyên sâu, chuẩn xác theo Luật Giao thông Nhật Bản (道路交通法).
 * Biên soạn lại chi tiết, sâu sắc, giải thích căn cứ luật và mẹo thực chiến để tránh bẫy thi.
 */

export const LESSONS = [
  {
    id: "speed",
    title_vi: "Quy tắc tốc độ",
    title_ja: "最高速度",
    icon: "speedometer",
    color: "primary",
    summary: "50cc tối đa 30 km/h. Ô tô/mô tô: 60 km/h trên đường thường (không có biển). Luôn tuân thủ biển báo.",
    sign_images: ["jp-323-30", "jp-323-50", "jp-324-30"],
    sections: [
      {
        heading: "1. Xe 50cc (原付 - Gentuki)",
        points: [
          "Tốc độ tối đa cứng: 30 km/h ở MỌI nơi.",
          "Dù biển báo cho phép 50km/h hay 60km/h, xe 50cc vẫn chỉ được chạy tối đa 30km/h.",
          "Khi xe 50cc/mô tô ≤125cc kéo một xe khác: tối đa 25 km/h.",
          "Xe 50cc không được đi vào đường cao tốc quốc gia (高速自動車国道).",
        ],
      },
      {
        heading: "2. Xe ô tô & Xe máy > 50cc (Đường thông thường)",
        points: [
          "Tốc độ tối đa theo luật (không có biển): 60 km/h (ô tô thông thường, ô tô tải thông thường, mô tô).",
          "Đường dành riêng cho ô tô (自動車専用道路) không có biển: 60 km/h. Đường cao tốc quốc gia: ô tô thông thường 100 km/h, tốc độ tối thiểu 50 km/h.",
          "Luôn tuân thủ biển báo tốc độ (最高速度). Nếu biển là 40, phải chạy <= 40.",
          "Biển tốc độ tối thiểu (最低速度 - có gạch trắng dưới): Bắt buộc chạy ở tốc độ >= con số ghi trên biển.",
        ],
      },
    ],
    traps: [
      "Bẫy 50cc: 'Đường cho phép 50km/h nên xe 50cc được chạy 40km/h' -> SAI (Luôn là 30km/h).",
      "Bẫy cảm tính: 'Vì đường rộng, vắng người nên có thể chạy theo tốc độ cảm thấy an toàn' -> SAI (Luôn tuân thủ biển báo hoặc giới hạn luật).",
    ],
    mnemonic: "50cc luôn là 30. Ô tô đường thường 60.",
  },
  {
    id: "stop_park",
    title_vi: "Quy tắc Dừng & Đỗ xe",
    title_ja: "駐停車禁止",
    icon: "ban",
    color: "danger",
    summary: "Nơi cấm dừng & đỗ: 5m (giao lộ, góc cua, vạch sang đường), 10m (đường sắt, đảo an toàn, trạm buýt). Cấm đỗ: 3m cổng gara, 5m trụ/bể nước chữa cháy, 1m hộp báo cháy.",
    sign_images: ["jp-315", "jp-316", "jp-330"],
    sections: [
      {
        heading: "1. Nơi CẤM DỪNG và CẤM ĐỖ (駐停車禁止)",
        points: [
          "Bên trong giao lộ và trong phạm vi 5m tính từ mép giao lộ; trong 5m từ góc cua đường.",
          "Vạch sang đường cho người đi bộ, dải băng qua đường cho xe đạp và trong 5m phía trước, phía sau các vạch đó.",
          "Đường ngang đường sắt (踏切) và trong 10m phía trước, phía sau.",
          "Phần bên trái đảo an toàn và trong 10m phía trước, phía sau.",
          "Gần đỉnh dốc, dốc có độ dốc lớn (khoảng 10% trở lên), trong đường hầm.",
          "Trong 10m từ biển trạm xe buýt, trong thời gian xe buýt hoạt động.",
        ],
      },
      {
        heading: "2. Nơi CẤM ĐỖ (駐車禁止) — vẫn được DỪNG (停車)",
        points: [
          "Trong 3m từ lối ra vào dành cho xe của bãi đỗ xe hoặc nhà để xe.",
          "Trong 5m từ nơi để thiết bị chữa cháy, bể nước chữa cháy, trụ nước chữa cháy hoặc lối ra vào của chúng.",
          "Trong 5m từ mép khu vực đang thi công đường.",
          "Trong 1m từ hộp báo cháy (火災報知器).",
          "Nơi mà phần mặt đường bên phải thân xe còn lại dưới 3,5m thì cấm đỗ (駐車余地).",
        ],
      },
      {
        heading: "3. Định nghĩa Dừng (停車) và Đỗ (駐車)",
        points: [
          "Dừng (停車): dừng để người lên xuống xe, hoặc dừng bốc dỡ hàng trong vòng 5 phút mà người lái vẫn ở trên xe và có thể lái đi ngay.",
          "Đỗ (駐車): dừng liên tục (chờ người, chờ hàng, xe hỏng...) hoặc người lái rời xe và không thể lái đi ngay.",
        ],
      },
    ],
    traps: [
      "Bẫy chờ người: 'Ngồi trên xe đợi người quen 3 phút vẫn chỉ là dừng xe' -> SAI. Dừng để chờ người là Đỗ xe.",
      "Bẫy biển cấm đỗ: Biển 'Cấm đỗ xe' chỉ cấm đỗ, vẫn được dừng (người lên xuống, bốc dỡ hàng trong 5 phút).",
      "Bẫy khoảng cách: 5m / 10m / 3m / 1m dễ nhầm nhau — học thuộc theo từng nhóm ở trên.",
    ],
    mnemonic: "Cấm cả dừng & đỗ: 5m (giao lộ, góc cua, vạch sang đường) · 10m (đường sắt, đảo an toàn, trạm buýt). Cấm đỗ: 3m gara · 5m cứu hỏa/công trường · 1m hộp báo cháy.",
  },
  {
    id: "right_turn",
    title_vi: "Rẽ phải 50cc hai giai đoạn",
    title_ja: "二段階右折",
    icon: "return-up-forward",
    color: "warning",
    summary: "Giao lộ có đèn tín hiệu và ≥3 làn cùng chiều (hoặc có biển bắt buộc): đi thẳng -> xoay đầu xe -> rẽ lần 2.",
    sign_images: ["jp-327-8", "jp-327-9"],
    sections: [
      {
        heading: "Quy tắc bắt buộc",
        points: [
          "Áp dụng cho xe 50cc khi giao lộ có đèn tín hiệu VÀ có từ 3 làn xe trở lên cùng chiều, trừ khi có biển cấm rẽ hai giai đoạn (二段階右折禁止); cũng áp dụng khi có biển bắt buộc rẽ hai giai đoạn.",
          "Dù đèn bật mũi tên xanh rẽ phải, xe 50cc vẫn phải rẽ hai giai đoạn.",
          "Thực hiện: (1) Bật xi-nhan phải từ trước giao lộ 30m, đi sát mép TRÁI đường -> (2) Khi đèn xanh, đi thẳng qua giao lộ tới góc bên kia -> (3) Dừng lại, tắt xi-nhan phải, xoay đầu xe sang phải -> (4) Đợi đèn tín hiệu (hướng mới) chuyển xanh rồi đi thẳng.",
        ],
      },
    ],
    traps: [
      "Bẫy xi-nhan: 'Rẽ phải hai giai đoạn thì bật xi-nhan khi đã xoay đầu' -> SAI. Phải bật xi-nhan PHẢI từ trước giao lộ 30m; tắt khi đã dừng và xoay đầu xe ở góc bên kia.",
      "Bẫy làn đường: 'Rẽ phải hai giai đoạn nên phải đi vào làn rẽ phải' -> SAI. Phải đi ở làn ngoài cùng bên TRÁI.",
    ],
    mnemonic: "Xi-nhan phải trước 30m -> Đi thẳng mép TRÁI -> Dừng, xoay đầu xe & TẮT xi-nhan -> Chờ xanh rồi đi tiếp.",
  },
  {
    id: "intersection",
    title_vi: "Quy tắc giao lộ",
    title_ja: "交差点",
    icon: "git-merge",
    color: "primary",
    summary: "Xe khẩn cấp > đường ưu tiên/đường rộng hơn > xe đến từ bên TRÁI. Xe rẽ phải nhường xe đi thẳng và rẽ trái từ hướng đối diện.",
    sign_images: ["jp-201-2", "jp-208"],
    sections: [
      {
        heading: "Thứ tự nhường đường (giao lộ không có đèn tín hiệu)",
        points: [
          "Xe khẩn cấp đang có còi/đèn: các xe khác phải nhường (tránh sang trái, ở giao lộ thì dừng lại).",
          "Đường ưu tiên (có biển hoặc vạch tim đường) và đường rộng hơn có quyền ưu tiên so với đường nhánh/đường hẹp hơn.",
          "Hai đường tương đương nhau, không biển: xe đến từ bên TRÁI được ưu tiên (左方優先).",
          "Xe rẽ phải phải nhường xe đi thẳng và xe rẽ trái từ hướng đối diện.",
          "Tại vạch sang đường: nhường người đang đi bộ qua đường.",
        ],
      },
    ],
    traps: [
      "Bẫy rẽ phải: 'Vì tôi đang rẽ phải nên tôi được ưu tiên' -> SAI. Xe rẽ phải nhường xe thẳng và xe rẽ trái đối diện.",
      "Bẫy bên trái: ở giao lộ hai đường tương đương không biển, xe từ bên TRÁI mới được đi trước (không phải bên phải).",
    ],
    mnemonic: "Khẩn cấp > Đường ưu tiên/rộng hơn > Xe bên TRÁI; rẽ phải thì nhường.",
  },
  {
    id: "railroad",
    title_vi: "Đường sắt",
    title_ja: "踏切",
    icon: "train",
    color: "danger",
    summary: "Tạm dừng trước đường sắt (trừ khi có đèn tín hiệu và đang xanh). Không chuyển số trên đường ray.",
    sign_images: ["jp-331"],
    sections: [
      {
        heading: "Quy tắc an toàn",
        points: [
          "Bắt buộc dừng tạm thời (一時停止) trước vạch dừng, xác nhận an toàn (nghe, nhìn) hai bên.",
          "Không được phép chuyển số (lên/xuống số) khi đang trên đường ray.",
          "Cấm dừng/đỗ trong đường sắt và trong 10m phía trước, phía sau; cấm vượt trong đường sắt và trong 30m phía trước.",
          "Nếu có đèn tín hiệu giao thông tại đường sắt và đang xanh, được phép đi qua không cần tạm dừng (nhưng vẫn phải cẩn thận).",
        ],
      },
    ],
    traps: [
      "Bẫy đường sắt có đèn xanh: 'Có đèn xanh vẫn phải tạm dừng trước đường sắt' -> SAI.",
      "Bẫy chết máy: 'Khi bị chết máy trên đường ray, hãy cố khởi động lại rồi đi tiếp' -> SAI. Phải đưa mọi người ra khỏi xe, báo cho tàu biết (nút khẩn cấp/đèn hiệu) và đẩy xe ra khỏi đường ray.",
    ],
    mnemonic: "Dừng (trừ khi có đèn xanh) -> Xác nhận -> Đi qua (không chuyển số).",
  },
  {
    id: "drinking",
    title_vi: "Nồng độ cồn",
    title_ja: "飲酒運転",
    icon: "wine",
    color: "danger",
    summary: "Đã uống rượu bia thì không được lái xe. Từ 0,15 mg/L khí thở trở lên là vi phạm hình sự (酒気帯び運転).",
    sign_images: [],
    sections: [
      {
        heading: "Luật nghiêm cấm",
        points: [
          "Nghiêm cấm lái xe khi đã uống rượu bia (飲酒運転).",
          "Nghiêm cấm cung cấp phương tiện cho người đã uống rượu.",
          "Nghiêm cấm mời/bán rượu bia cho người sắp lái xe.",
          "Nghiêm cấm đi nhờ xe (同乗) khi biết người lái đã uống rượu — người đi cùng cũng bị phạt.",
          "Từ 0,15 mg/L khí thở trở lên: lái xe sau khi uống rượu (酒気帯び運転). Say đến mức không điều khiển xe bình thường: 酒酔い運転 (xử phạt nặng hơn).",
        ],
      },
    ],
    traps: [
      "Bẫy nồng độ: 'Uống ít thì vẫn lái được' -> SAI. Đã uống rượu bia thì không được lái xe.",
    ],
    mnemonic: "Đã uống thì không lái; không cho mượn xe, không mời rượu, không đi nhờ xe người đã uống.",
  },
];
