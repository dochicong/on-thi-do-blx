# Ôn Thi Đỗ — Bằng Lái Xe Nhật Bản (Drivey / BLX)

App ôn thi bằng lái xe Nhật Bản cho người Việt: 1.505 câu hỏi, giải thích tiếng Việt, đối chiếu bản gốc tiếng Nhật.

- **App Expo / React Native:** `app/` — package `com.docong.onthido`, version 2.0.0
- **Dữ liệu:** `data/` và `app/assets/data/dataset.bundle.json`
- **Bản WebView Android Studio:** `android-studio-apk/`
- **Báo cáo rà soát trước phát hành:** `BAO_CAO_RA_SOAT.md`

## Chạy thử

```bash
cd app
npm install
npx expo start
```

## Lưu ý trước khi phát hành công khai

Xem mục D trong `BAO_CAO_RA_SOAT.md` — đặc biệt: mã muối ký license trong `app/src/billing/billingService.ts`, AdMob ID thật, và nguồn dữ liệu câu hỏi cần kiểm tra bản quyền. Vì vậy repo này nên để **Private** cho đến khi các mục đó được xử lý.
