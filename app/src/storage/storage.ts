/**
 * Tầng lưu trữ local — bọc AsyncStorage để cả app dùng chung một quy ước khoá.
 *
 * Vì sao AsyncStorage: dữ liệu ở đây nhỏ (tiến độ học, cài đặt, lịch sử thi).
 * Khi nào chuyển sang SQLite: nếu cần truy vấn/thống kê phức tạp hoặc dữ liệu
 * hàng chục nghìn dòng. Tầng này được tách riêng để đổi backend không phải sửa
 * màn hình.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  settings: '@jplicense/v1/settings',
  progress: '@jplicense/v1/progress',
  lastExam: '@jplicense/v1/last-exam',
  notifications: '@jplicense/v1/notification-ids',
  adsState: '@jplicense/v1/ads-state',
  rewarded: '@jplicense/v1/rewarded-unlock',
} as const;

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ghi lỗi không được làm sập UI học tập (offline-first vẫn chạy tiếp).
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    // ignore
  }
}
