/**
 * billingService.ts — Dịch vụ Thanh toán In-App Purchase (Google Play Billing / Apple StoreKit)
 * và Xác thực Chữ ký số Mã Giao dịch (Cryptographic License Verification) cho ứng dụng Ôn Thi Đỗ.
 *
 * NGUYÊN TẮC BẢO MẬT THƯƠNG MẠI:
 *  1. KHÔNG BAO GIỜ tự tạo mã biên lai giả (OTD-...) hoặc tự kích hoạt `isPro: true` khi chưa có
 *     xác nhận giao dịch thành công (`transactionReceipt` / `purchaseToken`) từ Google Play / App Store
 *     hoặc mã kích hoạt đã ký số hợp lệ.
 *  2. KHÔNG BAO GIỜ cho phép khôi phục giao dịch với chuỗi rỗng (`""`) hoặc mã bất kỳ.
 *     Mọi yêu cầu khôi phục đều phải:
 *       (a) Truy vấn biên lai thật từ Store (`getAvailablePurchases` của `react-native-iap`), HOẶC
 *       (b) Kiểm tra chữ ký số 6 ký tự HMAC-FNV1a trên mã giao dịch định dạng:
 *           `OTD-<30D|90D|VIP>-<YYYYMMDD>-<NONCE4>-<SIG6>`
 */

import type { ProPlanId } from '../storage/settings';

export type PlanSkuConfig = {
  id: Exclude<ProPlanId, 'free'>;
  sku: string;
  codePrefix: '30D' | '90D' | 'VIP';
  name: string;
  priceJpy: string;
  amountJpy: number;
  durationLabel: string;
  days: number | null;
  isConsumable: boolean;
};

export const STORE_PLANS: Record<Exclude<ProPlanId, 'free'>, PlanSkuConfig> = {
  tap_trung_30d: {
    id: 'tap_trung_30d',
    sku: 'com.docong.onthido.pass_30d',
    codePrefix: '30D',
    name: 'Học Là Đỗ',
    priceJpy: '¥980',
    amountJpy: 980,
    durationLabel: '30 ngày',
    days: 30,
    isConsumable: true, // Gói trả 1 lần theo kỳ hạn, không tự động gia hạn
  },
  vuot_cap_90d: {
    id: 'vuot_cap_90d',
    sku: 'com.docong.onthido.pass_90d',
    codePrefix: '90D',
    name: 'Chắc Chắn Đỗ',
    priceJpy: '¥1.980',
    amountJpy: 1980,
    durationLabel: '90 ngày',
    days: 90,
    isConsumable: true, // Gói trả 1 lần theo kỳ hạn, không tự động gia hạn
  },
  vip_lifetime: {
    id: 'vip_lifetime',
    sku: 'com.docong.onthido.vip_lifetime',
    codePrefix: 'VIP',
    name: 'Đỗ Là Cái Chắc',
    priceJpy: '¥3.980',
    amountJpy: 3980,
    durationLabel: 'Trọn đời',
    days: null,
    isConsumable: false, // Non-consumable vĩnh viễn
  },
};

const LICENSE_SIGNING_SALT = 'ON_THI_DO_COMMERCIAL_SALT_2026_V1';
const ALPHABET_32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Tính toán chữ ký xác thực 6 ký tự (HMAC-FNV1a 64-bit mô phỏng đồng bộ)
 * cho payload: `OTD|<PREFIX>|<YYYYMMDD>|<NONCE4>`.
 */
export function computeLicenseSignature(prefix: string, yyyymmdd: string, nonce4: string): string {
  const payload = `OTD|${prefix}|${yyyymmdd}|${nonce4}|${LICENSE_SIGNING_SALT}`;
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (ch + i * 31) & 0xff;
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  let out = '';
  let v1 = h1;
  let v2 = h2;
  for (let i = 0; i < 6; i++) {
    const idx = ((i % 2 === 0 ? v1 : v2) & 0x1f) >>> 0;
    out += ALPHABET_32[idx];
    v1 = (v1 >>> 5) ^ (v2 << 3);
    v2 = (v2 >>> 5) ^ (v1 << 2);
  }
  return out;
}

export type VerifiedEntitlement = {
  planId: Exclude<ProPlanId, 'free'>;
  activatedAtIso: string;
  expiresAtIso: string | null;
  receiptId: string;
  source: 'store_iap' | 'signed_license_key';
};

export type BillingResult =
  | { ok: true; entitlement: VerifiedEntitlement }
  | {
      ok: false;
      errorCode:
        | 'STORE_UNAVAILABLE'
        | 'USER_CANCELLED'
        | 'PAYMENT_PENDING'
        | 'INVALID_RECEIPT'
        | 'EMPTY_CODE'
        | 'INVALID_CODE_FORMAT'
        | 'INVALID_SIGNATURE'
        | 'CODE_EXPIRED'
        | 'NO_PURCHASES_FOUND';
      message: string;
    };

function parseIsoDate(yyyymmdd: string): Date | null {
  if (!/^\d{8}$/.test(yyyymmdd)) return null;
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  if (y < 2025 || y > 2035 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

function toIsoDateString(dt: Date): string {
  const y = dt.getFullYear();
  const m = `${dt.getMonth() + 1}`.padStart(2, '0');
  const d = `${dt.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Xác thực mã giao dịch / mã kích hoạt có chữ ký số.
 * Định dạng chuẩn: `OTD-<30D|90D|VIP>-<YYYYMMDD>-<NONCE4>-<SIG6>`
 * Tuyệt đối từ chối chuỗi rỗng, mã tự gõ bừa hoặc chữ ký không khớp.
 */
export function verifySignedLicenseKey(
  rawInput: string,
  now: Date = new Date()
): BillingResult {
  const cleaned = (rawInput || '').trim().toUpperCase();
  if (!cleaned) {
    return {
      ok: false,
      errorCode: 'EMPTY_CODE',
      message: 'Vui lòng nhập mã giao dịch hợp lệ. Không thể khôi phục khi để trống mã.',
    };
  }

  const m = /^OTD-(30D|90D|VIP)-(\d{8})-([A-Z0-9]{4})-([A-Z0-9]{6})$/.exec(cleaned);
  if (!m) {
    return {
      ok: false,
      errorCode: 'INVALID_CODE_FORMAT',
      message:
        'Định dạng mã giao dịch không hợp lệ. Mã chuẩn phải có dạng OTD-90D-YYYYMMDD-XXXX-XXXXXX do hệ thống cấp sau khi thanh toán thành công.',
    };
  }

  const [, prefix, yyyymmdd, nonce4, providedSig] = m;
  const expectedSig = computeLicenseSignature(prefix, yyyymmdd, nonce4);
  if (providedSig !== expectedSig) {
    return {
      ok: false,
      errorCode: 'INVALID_SIGNATURE',
      message: 'Chữ ký xác thực của mã giao dịch không hợp lệ. Không thể kích hoạt gói Pro.',
    };
  }

  const issueDate = parseIsoDate(yyyymmdd);
  if (!issueDate) {
    return {
      ok: false,
      errorCode: 'INVALID_CODE_FORMAT',
      message: 'Ngày phát hành trên mã giao dịch không hợp lệ.',
    };
  }

  const planObj =
    prefix === '30D'
      ? STORE_PLANS.tap_trung_30d
      : prefix === '90D'
      ? STORE_PLANS.vuot_cap_90d
      : STORE_PLANS.vip_lifetime;

  const activatedAtIso = toIsoDateString(issueDate);
  let expiresAtIso: string | null = null;

  if (planObj.days != null) {
    const expDate = new Date(issueDate.getTime());
    expDate.setDate(expDate.getDate() + planObj.days);
    expiresAtIso = toIsoDateString(expDate);
    if (expDate.getTime() < now.getTime()) {
      return {
        ok: false,
        errorCode: 'CODE_EXPIRED',
        message: `Mã giao dịch này đã hết hạn sử dụng vào ngày ${expiresAtIso}.`,
      };
    }
  }

  return {
    ok: true,
    entitlement: {
      planId: planObj.id,
      activatedAtIso,
      expiresAtIso,
      receiptId: cleaned,
      source: 'signed_license_key',
    },
  };
}

/**
 * Nạp động module `react-native-iap` nếu chạy trên bản build Native (Google Play / App Store).
 */
function getNativeIapModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const iap = require('react-native-iap');
    if (iap && typeof iap.initConnection === 'function' && typeof iap.requestPurchase === 'function') {
      return iap;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Thực hiện giao dịch thanh toán một lần thật qua Google Play Billing / Apple StoreKit.
 * NẾU chưa tích hợp Store Native hoặc người dùng chưa hoàn tất trả tiền -> TRẢ VỀ LỖI,
 * TUYỆT ĐỐI KHÔNG tự sinh mã giả hoặc tự bật `isPro = true`.
 */
export async function purchaseOneTimePlanViaStore(
  planId: Exclude<ProPlanId, 'free'>
): Promise<BillingResult> {
  const plan = STORE_PLANS[planId];
  const iap = getNativeIapModule();

  if (!iap) {
    return {
      ok: false,
      errorCode: 'STORE_UNAVAILABLE',
      message:
        'Thiết bị hiện tại chưa kết nối với Google Play Billing / Apple StoreKit (hoặc đang chạy trên môi trường Expo Go). Ứng dụng không tự động mở khóa Pro khi chưa xác nhận thanh toán thật. Nếu bạn đã thanh toán qua cổng ngoài, vui lòng nhập Mã kích hoạt có chữ ký số.',
    };
  }

  try {
    await iap.initConnection();
    const products = await iap.getProducts({ skus: [plan.sku] });
    if (!Array.isArray(products) || products.length === 0) {
      return {
        ok: false,
        errorCode: 'STORE_UNAVAILABLE',
        message: `Không tìm thấy cấu hình sản phẩm (${plan.sku}) trên cửa hàng ứng dụng.`,
      };
    }

    const purchaseResult = await iap.requestPurchase({ sku: plan.sku });
    const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

    const receiptToken =
      purchase?.purchaseToken || purchase?.transactionReceipt || purchase?.transactionId;
    if (!purchase || !receiptToken || purchase.productId !== plan.sku) {
      return {
        ok: false,
        errorCode: 'INVALID_RECEIPT',
        message: 'Không nhận được biên lai xác nhận thanh toán hợp lệ từ Google Play / App Store.',
      };
    }

    // Kiểm tra trạng thái thanh toán trên Android (1 = PURCHASED, 2 = PENDING)
    if (typeof purchase.purchaseStateAndroid === 'number' && purchase.purchaseStateAndroid !== 1) {
      return {
        ok: false,
        errorCode: 'PAYMENT_PENDING',
        message: 'Giao dịch đang chờ xử lý tại cửa hàng (Pending). Gói Pro sẽ chỉ mở khóa sau khi tiền được thanh toán thành công.',
      };
    }

    await iap.finishTransaction({ purchase, isConsumable: plan.isConsumable });

    const now = new Date();
    const activatedAtIso = toIsoDateString(now);
    let expiresAtIso: string | null = null;
    if (plan.days != null) {
      const exp = new Date(now.getTime());
      exp.setDate(exp.getDate() + plan.days);
      expiresAtIso = toIsoDateString(exp);
    }

    return {
      ok: true,
      entitlement: {
        planId: plan.id,
        activatedAtIso,
        expiresAtIso,
        receiptId: String(purchase.transactionId || receiptToken).slice(0, 36),
        source: 'store_iap',
      },
    };
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code === 'E_USER_CANCELLED') {
      return {
        ok: false,
        errorCode: 'USER_CANCELLED',
        message: 'Bạn đã hủy bước thanh toán. Gói Pro chưa được kích hoạt.',
      };
    }
    return {
      ok: false,
      errorCode: 'STORE_UNAVAILABLE',
      message: err?.message || 'Không thể xác nhận thanh toán với Google Play / App Store.',
    };
  } finally {
    try {
      await iap.endConnection?.();
    } catch {
      // ignore
    }
  }
}

/**
 * Khôi phục giao dịch đã mua:
 *  - Nếu người dùng nhập mã (`manualCode` khác rỗng): kiểm tra chữ ký số nghiêm ngặt qua `verifySignedLicenseKey`.
 *  - Nếu người dùng không nhập mã và chọn khôi phục từ Store: truy vấn `getAvailablePurchases()` từ `react-native-iap`.
 *  - Tuyệt đối KHÔNG tự cấp Pro nếu mã rỗng/sai hoặc Store không trả về biên lai hợp lệ.
 */
export async function restoreVerifiedPurchases(manualCode?: string): Promise<BillingResult> {
  const trimmed = (manualCode || '').trim();
  if (trimmed.length > 0) {
    return verifySignedLicenseKey(trimmed);
  }

  const iap = getNativeIapModule();
  if (!iap) {
    return {
      ok: false,
      errorCode: 'EMPTY_CODE',
      message:
        'Vui lòng nhập mã giao dịch hợp lệ (định dạng OTD-90D-YYYYMMDD-XXXX-XXXXXX) để khôi phục, hoặc thực hiện trên thiết bị đã đăng nhập Google Play / App Store có lịch sử mua hàng.',
    };
  }

  try {
    await iap.initConnection();
    const purchases = await iap.getAvailablePurchases();
    if (!Array.isArray(purchases) || purchases.length === 0) {
      return {
        ok: false,
        errorCode: 'NO_PURCHASES_FOUND',
        message: 'Không tìm thấy lịch sử giao dịch Pro nào trên tài khoản Google Play / App Store của bạn.',
      };
    }

    const skuToPlan = new Map<string, PlanSkuConfig>(
      Object.values(STORE_PLANS).map((p) => [p.sku, p])
    );

    for (const p of purchases) {
      const matchedPlan = skuToPlan.get(p?.productId);
      const token = p?.purchaseToken || p?.transactionReceipt || p?.transactionId;
      if (matchedPlan && token) {
        const txDate = p?.transactionDate ? new Date(Number(p.transactionDate)) : new Date();
        const activatedAtIso = toIsoDateString(txDate);
        let expiresAtIso: string | null = null;
        if (matchedPlan.days != null) {
          const exp = new Date(txDate.getTime());
          exp.setDate(exp.getDate() + matchedPlan.days);
          expiresAtIso = toIsoDateString(exp);
          if (exp.getTime() < Date.now()) {
            continue; // Đã hết hạn
          }
        }
        return {
          ok: true,
          entitlement: {
            planId: matchedPlan.id,
            activatedAtIso,
            expiresAtIso,
            receiptId: String(p.transactionId || token).slice(0, 36),
            source: 'store_iap',
          },
        };
      }
    }

    return {
      ok: false,
      errorCode: 'NO_PURCHASES_FOUND',
      message: 'Không tìm thấy gói Pro nào còn thời hạn hiệu lực trên tài khoản Store của bạn.',
    };
  } catch (err: any) {
    return {
      ok: false,
      errorCode: 'STORE_UNAVAILABLE',
      message: err?.message || 'Không thể truy vấn lịch sử giao dịch từ Google Play / App Store.',
    };
  } finally {
    try {
      await iap.endConnection?.();
    } catch {
      // ignore
    }
  }
}
