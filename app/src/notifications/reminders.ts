// reminders.ts — Quản lý thông báo nhắc học hàng ngày thân thiện như người bạn đồng hành
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch {
  Notifications = null;
}

export const FRIENDLY_REMINDERS = [
  { title: "Này bạn ơi, vào làm 1 đề cho nhớ bài nhé! 🚗", body: "Chỉ 10 phút mỗi ngày là cầm chắc tấm bằng lái xe tại Nhật trong tay rồi!" },
  { title: "Học là đỗ — Trượt là do bạn không học! 🎯", body: "Cùng ôn nhanh 15 câu biển báo & tình huống hay bẫy trước khi đi ngủ nào!" },
  { title: "Chuỗi ngày học liên tiếp đang chờ bạn nối dài! 🔥", body: "Vào làm vài câu khởi động nhẹ nhàng để giữ phong độ đạt ≥ 90% nhé!" },
];

export async function configureNotifications(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const msg = FRIENDLY_REMINDERS[0];
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: { hour, minute, repeats: true },
    });
  } catch {}
}

export async function cancelReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
