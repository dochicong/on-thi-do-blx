/**
 * adConfig.ts — Cấu hình Google AdMob cho ứng dụng.
 * Bản phát hành (production) dùng ID thật; khi chạy dev (__DEV__) tự chuyển sang ID thử
 * nghiệm của Google để tránh "click ảo / traffic không hợp lệ" làm khoá tài khoản AdMob.
 */
import { Platform } from 'react-native';

export const ADMOB_APP_ID = 'ca-app-pub-2481984363824427~6005426058';

const PROD = {
  REWARDED: 'ca-app-pub-2481984363824427/2464977152',
  BANNER: 'ca-app-pub-2481984363824427/9165796079',
  APP_OPEN: 'ca-app-pub-2481984363824427/3890398605',
} as const;

// ID thử nghiệm chính thức của Google (https://developers.google.com/admob/android/test-ads)
const TEST_ANDROID = {
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
} as const;
const TEST_IOS = {
  REWARDED: 'ca-app-pub-3940256099942544/1712485313',
  BANNER: 'ca-app-pub-3940256099942544/2934735716',
  APP_OPEN: 'ca-app-pub-3940256099942544/5575463023',
} as const;

const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

export const AD_UNIT_IDS: { REWARDED: string; BANNER: string; APP_OPEN: string } = IS_DEV
  ? Platform.OS === 'ios'
    ? TEST_IOS
    : TEST_ANDROID
  : PROD;
