// haptics.ts — Phản hồi xúc giác an toàn trên cả iOS, Android và Web
import { Platform } from "react-native";

let ExpoHaptics: any = null;
try {
  ExpoHaptics = require("expo-haptics");
} catch {
  ExpoHaptics = null;
}

export const haptics = {
  light: () => {
    if (Platform.OS === "web" || !ExpoHaptics) return;
    ExpoHaptics.impactAsync?.(ExpoHaptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  medium: () => {
    if (Platform.OS === "web" || !ExpoHaptics) return;
    ExpoHaptics.impactAsync?.(ExpoHaptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  success: () => {
    if (Platform.OS === "web" || !ExpoHaptics) return;
    ExpoHaptics.notificationAsync?.(ExpoHaptics.NotificationFeedbackType.Success).catch(() => {});
  },
  error: () => {
    if (Platform.OS === "web" || !ExpoHaptics) return;
    ExpoHaptics.notificationAsync?.(ExpoHaptics.NotificationFeedbackType.Error).catch(() => {});
  },
  selection: () => {
    if (Platform.OS === "web" || !ExpoHaptics) return;
    ExpoHaptics.selectionAsync?.().catch(() => {});
  },
};
export default haptics;
