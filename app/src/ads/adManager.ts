/**
 * adManager.ts — Quản lý khởi tạo AdMob (kèm UMP Consent), App Open Ad (chỉ khi mở app)
 * và Rewarded Video Ad (Quảng cáo video trả thưởng).
 * Đã tách biệt maybeShowInterstitial để không gọi nhầm App Open Ad sau khi nộp bài thi.
 */
import { AD_UNIT_IDS, ADMOB_APP_ID } from "./adConfig";

let initialized = false;
let nonPersonalizedOnly = true;
let appOpenSuppressed = false;
let lastAppOpenShownAt = 0;
const APP_OPEN_COOLDOWN_MS = 4 * 60 * 1000;

let mobileAdsModule: any = null;
try {
  mobileAdsModule = require("react-native-google-mobile-ads");
} catch {
  mobileAdsModule = null;
}

export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    if (mobileAdsModule?.AdsConsent) {
      const { AdsConsent, AdsConsentStatus } = mobileAdsModule;
      const consentInfo = await AdsConsent.requestInfoUpdate();
      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
        const result = await AdsConsent.showForm();
        nonPersonalizedOnly = result.status !== AdsConsentStatus.OBTAINED;
      } else if (consentInfo.status === AdsConsentStatus.OBTAINED || consentInfo.status === AdsConsentStatus.NOT_REQUIRED) {
        nonPersonalizedOnly = false;
      }
    }
    if (mobileAdsModule?.default) {
      await mobileAdsModule.default().initialize();
    }
  } catch (err) {
    console.warn("[AdMob] Init fallback:", err);
  }
}

export function setAppOpenSuppressed(suppressed: boolean): void {
  appOpenSuppressed = suppressed;
}

export async function maybeShowAppOpen(): Promise<boolean> {
  if (appOpenSuppressed) return false;
  const now = Date.now();
  if (now - lastAppOpenShownAt < APP_OPEN_COOLDOWN_MS) return false;

  try {
    if (mobileAdsModule?.AppOpenAd) {
      const { AppOpenAd, AdEventType } = mobileAdsModule;
      const appOpenAd = AppOpenAd.createForAdRequest(AD_UNIT_IDS.APP_OPEN, {
        requestNonPersonalizedAdsOnly: nonPersonalizedOnly,
      });
      return await new Promise<boolean>((resolve) => {
        const unsubLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
          unsubLoaded();
          lastAppOpenShownAt = Date.now();
          appOpenAd.show();
          resolve(true);
        });
        const unsubError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
          unsubError();
          resolve(false);
        });
        appOpenAd.load();
      });
    }
  } catch (err) {
    console.warn("[AdMob] AppOpen error:", err);
  }
  return false;
}

/**
 * Không gọi App Open Ad sau khi nộp bài thi để tuân thủ chính sách định dạng quảng cáo của Google AdMob.
 */
export async function maybeShowInterstitial(): Promise<boolean> {
  return false;
}

export function onExamFinished(): void {
  setAppOpenSuppressed(false);
}

export { AD_UNIT_IDS, ADMOB_APP_ID };
