/**
 * AdBanner.tsx — Quảng cáo Biểu ngữ Google AdMob thực (ca-app-pub-2481984363824427/9165796079).
 * App ID: ca-app-pub-2481984363824427~6005426058
 * Tự động ẩn khi người dùng đang có gói Pro còn hạn (isProEntitlementActive).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AD_UNIT_IDS } from './adConfig';
import { isProEntitlementActive, loadSettings } from '../storage/settings';

let RNAds: any = null;
try {
  RNAds = require('react-native-google-mobile-ads');
} catch {
  RNAds = null;
}

export default function AdBanner() {
  const [failed, setFailed] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (alive) setIsPro(isProEntitlementActive(s));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (isPro || failed || !RNAds?.BannerAd || !RNAds?.BannerAdSize) {
    return null;
  }

  const { BannerAd, BannerAdSize } = RNAds;
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AD_UNIT_IDS.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={() => setFailed(false)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 50,
  },
});
