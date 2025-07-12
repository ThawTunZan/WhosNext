import React, { useRef } from 'react';
import { Alert } from 'react-native';
import { AdMobRewarded } from 'expo-ads-admob';
import { Platform } from 'react-native';

// Test ad unit ID for Android/iOS (replace with your real one in production)
const TEST_AD_UNIT_ID =
  Platform.OS === 'ios'
  // TODO
    ? 'ca-app-pub-7550053764536482~8277769599'
    : 'ca-app-pub-7550053764536482~8277769599';

export async function showRewardedAd(onReward: () => void) {
  try {
    await AdMobRewarded.setAdUnitID(TEST_AD_UNIT_ID);
    await AdMobRewarded.requestAdAsync();
    AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', onReward);
    AdMobRewarded.addEventListener('rewardedVideoDidFailToLoad', () => {
      Alert.alert('Ad failed to load');
    });
    AdMobRewarded.addEventListener('rewardedVideoDidDismiss', () => {
      AdMobRewarded.removeAllListeners();
    });
    await AdMobRewarded.showAdAsync();
  } catch (e) {
    Alert.alert('Ad Error', e?.message || 'Failed to show ad');
  }
}
