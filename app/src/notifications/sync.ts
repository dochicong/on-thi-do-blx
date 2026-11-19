// sync.ts — Đồng bộ cài đặt thông báo nhắc học
import { loadSettings } from "../storage/settings";
import { cancelReminders, configureNotifications, scheduleDailyReminder } from "./reminders";

export async function refreshReminders(): Promise<void> {
  try {
    const s = await loadSettings();
    if (!s.remindersEnabled) {
      await cancelReminders();
      return;
    }
    const ok = await configureNotifications();
    if (ok) {
      const [h, m] = (s.reminderTime || "20:00").split(":").map(Number);
      await scheduleDailyReminder(Number.isFinite(h) ? h : 20, Number.isFinite(m) ? m : 0);
    }
  } catch {}
}
