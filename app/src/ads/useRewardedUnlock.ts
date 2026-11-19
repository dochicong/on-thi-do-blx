/**
 * useRewardedUnlock.ts — Hook Quảng cáo Video trả thưởng thực tế
 * App ID: ca-app-pub-2481984363824427~6005426058
 * Rewarded Unit ID: ca-app-pub-2481984363824427/2464977152
 * CHỈ mở khóa khi người dùng xem hết video và nhận sự kiện EARNED_REWARD từ Google AdMob SDK.
 */
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { AD_UNIT_IDS } from './adConfig';

let RNAds: any = null;
try {
  RNAds = require('react-native-google-mobile-ads');
} catch {
  RNAds = null;
}

const unlockedFeatures = new Map<string, number>();
const UNLOCK_DURATION_MS = 24 * 60 * 60 * 1000;

export function useRewardedUnlock(featureKey: string) {
  const [loading, setLoading] = useState(false);
  const expiresAt = unlockedFeatures.get(featureKey) ?? 0;
  const [unlocked, setUnlocked] = useState<boolean>(expiresAt > Date.now());

  const watch = useCallback(async () => {
    if (!RNAds?.RewardedAd || !RNAds?.RewardedAdEventType || !RNAds?.AdEventType) {
      Alert.alert(
        'Chưa tải được quảng cáo',
        'Google Mobile Ads SDK chỉ hoạt động trên bản cài đặt Android/iOS chính thức.'
      );
      return;
    }

    setLoading(true);
    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = RNAds;
      const rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
        requestNonPersonalizedAdsOnly: false,
      });

      await new Promise<void>((resolve) => {
        const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          unsubLoaded();
          rewarded.show().catch(() => resolve());
        });
        const unsubEarned = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            unsubEarned();
            const until = Date.now() + UNLOCK_DURATION_MS;
            unlockedFeatures.set(featureKey, until);
            setUnlocked(true);
            resolve();
          }
        );
        const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
          unsubClosed();
          resolve();
        });
        const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, (err: any) => {
          unsubError();
          Alert.alert(
            'Không thể tải quảng cáo video',
            err?.message || 'Hiện chưa có quảng cáo từ Google AdMob. Vui lòng thử lại sau.'
          );
          resolve();
        });
        rewarded.load();
      });
    } finally {
      setLoading(false);
    }
  }, [featureKey]);

  return {
    unlocked,
    loading,
    watch,
    rewardedUnitId: AD_UNIT_IDS.REWARDED,
  };
}
