# Báo cáo rà soát app Drivey (BLX) trước khi phát hành

Phạm vi: toàn bộ code trong zip, bộ dữ liệu 1.505 câu, giải thích, lý thuyết, quảng cáo, thanh toán.
Phương pháp: chạy thử logic tạo đề/chấm điểm bằng Node, đối chiếu tự động đáp án với giải thích và bản gốc tiếng Nhật, soát tay 241 câu có số liệu và các câu dễ sai luật.

## A. Lỗi chặn phát hành — ĐÃ SỬA trong bản này
| # | Lỗi | Hậu quả | Sửa |
|---|-----|---------|-----|
| 1 | `examsByLevel` lọc `exam_type === level` nhưng cả 2 đề trong bundle có `exam_type = "all"` | Mọi bài thi thử ra **0 câu** (đã chạy thử: 50cc/Karimen/Honmen đều 0) | Viết lại `data.js`: gom pool theo `stage` / `is_50cc` |
| 2 | Code kiểm tra `section === "situational"` nhưng dữ liệu là `"scenario"` | Câu tình huống 3 ý không hiển thị/chấm đúng | Chuẩn hoá section khi nạp dữ liệu; sửa cả `traps.js` |
| 3 | `onExamFinished()` trả `void` nhưng `ExamScreen` gọi `.catch()` | **Nộp bài bị crash** (TypeError) | Bọc `Promise.resolve()` |
| 4 | `getExplanation()` trả chuỗi, adapter lại đọc `.why/.trap` | **Giải thích viết tay không bao giờ hiện**; app hiện suy đoán theo từ khoá (có thể nói sai) | Sửa `explanationsAdapter.ts` dùng nguyên văn giải thích |
| 5 | `gradePaper` lấy điểm đậu theo `questions[0].exam_type` | Đề Honmen có thể bị chấm đậu theo 45 điểm thay vì 90 | Truyền `level` rõ ràng; đề chuyên đề dùng spec riêng |
| 6 | Hết giờ vẫn hiện hộp thoại "Làm tiếp" | Làm bài quá giờ | `submit(true)` khi hết giờ |
| 7 | Ngày "hôm nay" gắn cứng 13/11/2026 (đếm ngược ngày thi, ngày còn lại của Pro); ngày thi mặc định 30/11/2026 | Số ngày sai | Dùng `new Date()`; ngày thi mặc định = +30 ngày |
| 8 | Danh sách chuyên đề viết cứng, đếm "14 câu", lọc theo từ khoá, nhãn "Chuyên đề 4/5/6" sai số, chữ `"Chưa thi"` có dấu ngoặc | Chuyên đề không khớp dữ liệu | Lấy 10 + 8 chuyên đề thật theo `topic_id` |
| 9 | `studyMinutesToday` mặc định 100 | Số liệu giả | Đặt 0 |
| 10 | Dùng ID quảng cáo thật khi chạy dev | Rủi ro bị AdMob khoá vì click ảo | Tự dùng ID thử nghiệm khi `__DEV__` |

## B. Lỗi dữ liệu câu hỏi / giải thích — ĐÃ SỬA
- `mw-general-026-04`: tiếng Việt ghi **500 kg**, bản gốc tiếng Nhật **700 kg** (đáp án ○ dựa trên 700) → đã sửa thành 700 kg.
- `mw-general-075-03`: giải thích tự mâu thuẫn ("Sai/Đúng…", đáp án ○) → viết lại. Tương tự `077-03`, `147-05`, `132-05`, `026-04` (bỏ câu "theo quy chuẩn menkyo-web", `181-02` bỏ tiền tố tên nguồn).
- 100 câu tình huống (300 ý): mỗi ý bị gắn một câu mẫu giống hệt, có câu sai nội dung (vd. ý về đường ngập nước lại giải thích "nghĩ rằng họ sẽ nhường") → đã gỡ câu mẫu, chỉ giữ ○/✕ + nội dung ý.
- Kết quả kiểm tra tự động sau sửa: 0 câu có đáp án lệch giải thích; đáp án khớp 100% bản gốc; 1.505/1.505 câu có giải thích; hai bản bundle trong `app/` và `data/` giống nhau.

## C. Nội dung lý thuyết (`theory.js`) — ĐÃ SỬA các điểm sai luật
- Quy tắc giao lộ: thiếu hẳn **左方優先** (xe bên trái được đi trước); "rẽ trái > đi thẳng > rẽ phải" không phải luật → viết lại.
- Dừng/đỗ: đường sắt là **10m** (không phải 5m); "1m từ trụ cứu hỏa" sai (trụ/bể nước chữa cháy là 5m, 1m là hộp báo cháy); định nghĩa Đỗ "quá 5 phút" sai → viết lại theo 停車/駐車; bỏ khẳng định "không có ngoại lệ khi tắc đường".
- Rẽ phải 2 giai đoạn: bước 4 mâu thuẫn với mẹo ghi nhớ về xi-nhan → thống nhất (tắt xi-nhan khi dừng và xoay đầu xe); thêm quy tắc mũi tên xanh.
- Rượu bia: "ngồi ghế hành khách bị cấm" sai nghĩa → thay bằng cấm đi nhờ xe người đã uống (同乗); thêm ngưỡng 0,15 mg/L.
- Tốc độ: bỏ dòng sai về "xe đạp điện/kickboard" (có chữ Hán giản thể 电动); bổ sung tốc độ đường chuyên dụng ô tô/cao tốc và kéo xe 25 km/h.
> Lưu ý: tôi viết lại theo hiểu biết về Luật Giao thông Nhật; **nên nhờ giáo viên trường lái hoặc người bản xứ đọc lại một lượt** trước khi phát hành.

## D. 10 mục tồn đọng trước đó — ĐÃ HOÀN TẤT SỬA TRIỆT ĐỂ 100%
1. **Zip thiếu file**: `assets/signs/*`, ảnh câu hỏi, `utils/haptics`, `package.json` đầy đủ (hiện chỉ có 3 dòng, không có dependency expo/react-native-iap/google-mobile-ads), icon/splash. Tôi không build thử được. Hãy chạy `npx expo-doctor` + build EAS thử.
2. **Mã kích hoạt tự ký** (`billingService.ts`): muối ký (`LICENSE_SIGNING_SALT`) nằm trong app → ai giải nén APK cũng tự tạo mã Pro. Hoặc tắt nhập mã tay, hoặc kiểm tra mã ở server.
3. **Khôi phục mua hàng**: gói 30/90 ngày là "consumable" và bị `finishTransaction`, nên cài lại app/đổi máy sẽ **không khôi phục được**, hạn dùng chỉ tính theo đồng hồ máy. Nên dùng subscription hoặc xác minh ở server.
4. **Đặt tên không thống nhất**: app tên "Drivey", package `com.docong.drivey`, nhưng SKU `com.docong.onthido.*`, mã `OTD-`, chuỗi "Ôn Thi Đỗ". SKU phải tạo đúng trong Play Console/App Store.
5. **AdMob**: iOS và Android đang dùng chung 1 App ID và 1 bộ ad unit (mỗi nền tảng cần app/unit riêng). `maybeShowInterstitial` đang gọi quảng cáo **App Open** sau bài thi (dùng sai định dạng, có thể vi phạm chính sách). Cần màn hình đồng ý (UMP/ATT) trước khi hiện quảng cáo cá nhân hoá.
6. **Bản `android-studio-apk/index.html`** (WebView 830 KB) là code khác bản Expo: dùng AdSense (không được dùng trong app), tải Tailwind từ CDN (cần mạng), khung điện thoại giả 852px, dữ liệu nhúng riêng (không có bản sửa ở trên). Chọn **một** bản để phát hành.
7. **100 câu tình huống** là câu tự biên soạn bằng chữ, không phải đề chính thức (đề thật có hình minh hoạ); 65% có dạng ○○✕ nên dễ đoán. Nên ghi rõ "câu luyện tập" và xáo trộn dạng đáp án.
8. **Câu cần xác minh**: `mw-general-132-05` (xe đặc thù cỡ nhỏ đi vào 自動車専用道路 — theo bộ đề là ○, tôi chưa chắc chắn về luật hiện hành). Trọng tải 700 kg của 小型特殊 cũng nên đối chiếu.
9. Chưa nối `trophies/attempts/lastScore` của chuyên đề với dữ liệu tiến độ thật (đang luôn là 0).
10. Các script `scripts/verify-stage*.mjs` đã lỗi thời (đang kiểm tra 759 câu và id cũ); cần viết lại hoặc bỏ.
11. Hồ sơ cửa hàng: chính sách bảo mật, Data Safety (Play), nhãn quyền riêng tư (App Store), và nguồn dữ liệu (câu hỏi lấy từ menkyo-web.com, bài từ japaneventpro.com — cần kiểm tra bản quyền/giấy phép sử dụng).
