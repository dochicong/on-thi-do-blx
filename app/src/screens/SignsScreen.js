// SignsScreen.js — Màn hình Biển báo & Vạch kẻ (標識・表示) theo đúng mẫu thiết kế Ảnh 2.
// Nền màn hình tự động chuyển màu pastel theo từng nhóm:
// - Biển cấm (Tròn viền đỏ): Hồng phấn (#F4C2C7)
// - Biển hiệu lệnh (Tròn xanh): Xanh da trời nhạt (#C5E1F8)
// - Biển cảnh báo (Tam giác vàng): Vàng ấm (#F8DF95)
// - Biển chỉ dẫn (Chữ nhật xanh): Xanh ngọc (#C7E8D4)
// - Biển phụ: Tím lavender nhạt (#E2D8F5)
// - Vạch kẻ đường: Cam đào nhạt (#F5D8C2)
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signImage } from "../assets_map";
import { haptics } from "../utils/haptics";
import AdBanner from "../ads/AdBanner";
import FadeSlideIn from "../components/FadeSlideIn";

const DETAIL_SIGN_SIZE = 140;

const CATEGORY_TABS = [
  {
    key: "regulatory",
    label: "Biển cấm",
    ja: "規制標識",
    shapeLabel: "Tròn viền đỏ — Cấm / Hạn chế",
    bg: "#F4C2C7",
    divider: "rgba(60, 20, 25, 0.10)",
  },
  {
    key: "instruction",
    label: "Biển hiệu lệnh",
    ja: "指示標識",
    shapeLabel: "Tròn xanh — Hiệu lệnh bắt buộc",
    bg: "#C5E1F8",
    divider: "rgba(20, 45, 75, 0.10)",
  },
  {
    key: "warning",
    label: "Biển cảnh báo",
    ja: "警戒標識",
    shapeLabel: "Tam giác vàng — Cảnh báo nguy hiểm",
    bg: "#F8DF95",
    divider: "rgba(65, 50, 15, 0.11)",
  },
  {
    key: "guide",
    label: "Biển chỉ dẫn",
    ja: "案内標識",
    shapeLabel: "Vuông / Chữ nhật xanh — Chỉ dẫn",
    bg: "#C7E8D4",
    divider: "rgba(20, 60, 35, 0.10)",
  },
  {
    key: "auxiliary",
    label: "Biển phụ",
    ja: "補助標識",
    shapeLabel: "Biển phụ bổ sung phạm vi",
    bg: "#E2D8F5",
    divider: "rgba(45, 30, 75, 0.10)",
  },
  {
    key: "marking",
    label: "Vạch kẻ đường",
    ja: "道路標示",
    shapeLabel: "Vạch kẻ đường & ký hiệu mặt đường",
    bg: "#F5D8C2",
    divider: "rgba(65, 35, 15, 0.10)",
  },
];

const CURATED_DESCRIPTIONS = {
  "301": "Người đi bộ, xe cộ và tàu điện mặt đất đều không được phép đi qua khu vực này.",
  "302": "Các loại xe (ô tô, xe gắn máy 50cc, xe thô sơ) đều không được phép đi qua. Người đi bộ vẫn được đi.",
  "303": "Đặt ở lối ra của đường một chiều, nghiêm cấm mọi phương tiện đi ngược chiều vào từ hướng biển này.",
  "304": "Cấm các loại xe ô tô (trừ xe mô tô 2 bánh và xe gắn máy 50cc vẫn được phép lưu thông).",
  "305": "Cấm xe tải chở hàng cỡ lớn và xe chuyên dụng đặc chủng đi vào đoạn đường này.",
  "306": "Cấm các loại xe buýt, xe khách cỡ lớn lưu thông qua đoạn đường có biển báo.",
  "307": "Cấm cả xe mô tô hai bánh và xe gắn máy 50cc (原付) lưu thông qua đường này.",
  "308": "Cấm các loại xe thô sơ (xe kéo, xe bò...), ngoại trừ xe đạp vẫn được phép đi.",
  "309": "Cấm xe đạp đi vào đường này (người dắt bộ xe đạp được tính là người đi bộ nên được đi).",
  "310": "Cấm xe mô tô 2 bánh (cỡ lớn và cỡ thường) chở hai người lưu thông trên đoạn đường này.",
  "312": "Nghiêm cấm phương tiện băng ngang qua đường (cắt ngang sang bên kia đường).",
  "313": "Cấm xe quay đầu (U-turn). Lưu ý bẫy thi: Biển này chỉ cấm quay đầu, KHÔNG cấm lùi xe.",
  "314": "Cấm vượt xe bằng cách lấn sang phần đường bên phải vạch trung tâm.",
  "315": "Cấm cả dừng xe lẫn đỗ xe (kể cả dừng dưới 5 phút để đón trả khách cũng bị cấm).",
  "316": "Cấm đỗ xe (trên 5 phút hoặc rời xe). Vẫn được phép dừng xe dưới 5 phút để đón trả khách.",
  "329": "Phải giảm tốc độ đi chậm lại (徐行 - có thể dừng ngay trong vòng 1m), không bắt buộc dừng hẳn.",
  "330": "Bắt buộc dừng lại hoàn toàn (一時停止) trước vạch dừng và quan sát an toàn hai bên trước khi đi.",
  "201-A": "Báo hiệu phía trước có ngã tư giao lộ hình chữ thập (+), chú ý giảm tốc và quan sát xe cắt ngang.",
  "201-B": "Báo hiệu phía trước có ngã ba giao lộ hình chữ T hoặc chữ ト, chú ý quan sát phương tiện từ đường nhánh.",
  "201-C": "Báo hiệu phía trước có ngã ba đường nhánh ghép vào bên phải/trái, cần chú ý điểm mù.",
  "201-D": "Báo hiệu phía trước có ngã ba giao lộ hình chữ Y, chú ý hướng ưu tiên và giảm tốc độ.",
  "201-2": "Báo hiệu phía trước có nút giao vòng xuyến (ロータリー), đi chậm theo chiều mũi tên vòng xuyến.",
};

function getSignDescriptionVi(sign) {
  if (CURATED_DESCRIPTIONS[sign.code]) {
    return CURATED_DESCRIPTIONS[sign.code];
  }
  if (Array.isArray(sign.desc_vi) && sign.desc_vi.length > 0) {
    return sign.desc_vi.join(" ");
  }
  if (sign.tip_vi) {
    return sign.tip_vi;
  }
  const vi = sign.name_vi || "";
  if (sign.group === "regulatory") {
    return `${vi}. Người điều khiển phương tiện bắt buộc phải tuân thủ quy định cấm/hạn chế trên biển báo này.`;
  }
  if (sign.group === "warning") {
    return `Biển cảnh báo: ${vi}. Khi gặp biển tam giác vàng này cần chủ động giảm tốc độ và chú ý quan sát nguy hiểm.`;
  }
  if (sign.group === "instruction") {
    return `Biển hiệu lệnh & chỉ dẫn: ${vi}. Cho phép hoặc quy định làn đường, khu vực ưu tiên cho phương tiện/người đi bộ.`;
  }
  if (sign.group === "guide") {
    return `Biển chỉ dẫn lộ trình: ${vi}. Giúp người lái xe nắm rõ hướng đi, địa danh hoặc làn đường phía trước.`;
  }
  if (sign.group === "auxiliary") {
    return `Biển phụ đi kèm biển chính: ${vi}. Xác định phạm vi, thời gian hoặc loại phương tiện áp dụng hiệu lực.`;
  }
  return `Ký hiệu vạch kẻ mặt đường: ${vi}. Quy định làn đường, hướng di chuyển hoặc vị trí dừng xe trên mặt đường.`;
}

function SignDetailModal({ sign, onClose, colors }) {
  const img = signImage(sign.id);
  const desc = getSignDescriptionVi(sign);
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[st.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[st.sheet, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[st.detailImgWrap, { backgroundColor: colors.chip }]}>
              {img ? (
                <Image source={img} style={st.detailImg} resizeMode="contain" />
              ) : null}
            </View>
            {sign.name_kana ? (
              <Text style={[st.dKana, { color: colors.textDim }]}>
                {sign.name_kana}
              </Text>
            ) : null}
            <Text style={[st.dJa, { color: colors.text }]}>
              {sign.name_ja || sign.code}
            </Text>
            <Text style={[st.dVi, { color: colors.text }]}>
              {sign.name_vi || sign.shape_vi || "—"}
            </Text>
            <View
              style={[
                st.groupBadge,
                { backgroundColor: colors.accentSoft, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
                Mã {sign.code} · {sign.shape_vi || sign.group_vi || ""}
              </Text>
            </View>
            <View style={{ gap: spacing.xs, marginTop: spacing.m }}>
              <Text style={[st.descLine, { color: colors.text }]}>{desc}</Text>
            </View>
            {sign.tip_vi ? (
              <View
                style={[
                  st.tipBox,
                  { backgroundColor: colors.accentSoft, borderColor: colors.border },
                ]}
              >
                <Ionicons name="bulb-outline" size={16} color={colors.warn} />
                <Text style={[st.tipText, { color: colors.text, flex: 1 }]}>
                  Mẹo thi: {sign.tip_vi}
                </Text>
              </View>
            ) : null}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={[st.closeBtn, { backgroundColor: "#2B2523" }]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Đóng</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const SignRow = React.memo(function SignRow({ sign, onPress, dividerColor }) {
  const img = signImage(sign.id);
  const desc = getSignDescriptionVi(sign);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.rowItem,
        { borderBottomColor: dividerColor, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={st.rowImgWrap}>
        {img ? (
          <Image source={img} style={st.rowImg} resizeMode="contain" />
        ) : (
          <View style={st.rowImgPlaceholder} />
        )}
      </View>
      <View style={st.rowTextCol}>
        <Text style={st.rowTitle}>
          {sign.name_vi || sign.name_ja || sign.code}
          {sign.name_ja ? (
            <Text style={st.rowTitleJa}> ({sign.name_ja})</Text>
          ) : null}
        </Text>
        <Text style={st.rowDesc} numberOfLines={3}>
          {desc}
        </Text>
      </View>
    </Pressable>
  );
});

export default function SignsScreen() {
  const { c: colors } = useTheme();
  const insets = useSafeAreaInsets();
  const signs = useMemo(() => {
    const { allSigns } = require("../data");
    return allSigns();
  }, []);

  const [activeGroup, setActiveGroup] = useState("regulatory");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);

  const currentTab = useMemo(
    () => CATEGORY_TABS.find((t) => t.key === activeGroup) || CATEGORY_TABS[0],
    [activeGroup]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signs.filter((s) => {
      if (!q && s.group !== activeGroup) return false;
      if (!q) return true;
      return [s.name_vi, s.name_ja, s.name_kana, s.code, s.shape_vi, s.group_vi]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q));
    });
  }, [signs, activeGroup, query]);

  return (
    <View
      style={[
        st.root,
        { backgroundColor: currentTab.bg, paddingTop: insets.top + 8 },
      ]}
    >
      {/* Header Tiêu đề + Nút Tìm kiếm */}
      <View style={st.headerArea}>
        <View style={st.titleRow}>
          <Text style={st.screenTitle}>Biển báo & Vạch kẻ</Text>
          <Pressable
            onPress={() => {
              haptics.selection();
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery("");
            }}
            style={st.searchToggleBtn}
          >
            <Ionicons
              name={searchOpen ? "close" : "search"}
              size={20}
              color="#2B2523"
            />
          </Pressable>
        </View>

        {searchOpen ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm biển báo: tên Việt / 日本語 / furigana…"
            placeholderTextColor="rgba(43,37,35,0.5)"
            style={st.searchInput}
          />
        ) : null}

        {/* Thanh Pill lọc nhóm biển báo giống hệt Ảnh 2 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={st.pillsScroll}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeGroup === tab.key && !query.trim();
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  haptics.selection();
                  setQuery("");
                  setActiveGroup(tab.key);
                }}
                style={[st.pill, isActive ? st.pillActive : st.pillInactive]}
              >
                <Text
                  style={[
                    st.pillText,
                    isActive ? st.pillTextActive : st.pillTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Danh sách 1 cột phân tách bằng đường kẻ mảnh giống Ảnh 2 */}
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={st.listContainer}
        renderItem={({ item, index }) => (
          <FadeSlideIn delay={Math.min(index * 20, 200)}>
            <SignRow
              sign={item}
              dividerColor={currentTab.divider}
              onPress={() => {
                haptics.impactLight();
                setDetail(item);
              }}
            />
          </FadeSlideIn>
        )}
        ListEmptyComponent={
          <Text style={st.emptyText}>Không tìm thấy biển báo phù hợp</Text>
        }
        ListFooterComponent={<AdBanner />}
      />

      {detail ? (
        <SignDetailModal
          sign={detail}
          colors={colors}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2B2523",
    letterSpacing: -0.3,
  },
  searchToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: "#2B2523",
    borderWidth: 1,
    borderColor: "rgba(43,37,35,0.2)",
  },
  pillsScroll: {
    gap: 8,
    paddingRight: 18,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: "#2B2523",
    borderColor: "#2B2523",
  },
  pillInactive: {
    backgroundColor: "transparent",
    borderColor: "rgba(43,37,35,0.45)",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  pillTextInactive: {
    color: "#2B2523",
  },
  listContainer: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  rowImgWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  rowImg: {
    width: 56,
    height: 56,
  },
  rowImgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  rowTextCol: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F1918",
    lineHeight: 20,
  },
  rowTitleJa: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(31,25,24,0.7)",
  },
  rowDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(31,25,24,0.8)",
  },
  emptyText: {
    textAlign: "center",
    padding: 32,
    color: "rgba(31,25,24,0.65)",
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  detailImgWrap: {
    alignItems: "center",
    paddingVertical: spacing.l,
    borderRadius: radius.l,
  },
  detailImg: {
    width: DETAIL_SIGN_SIZE,
    height: DETAIL_SIGN_SIZE,
  },
  dKana: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 6,
  },
  dJa: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
  },
  dVi: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  groupBadge: {
    alignSelf: "center",
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  descLine: {
    fontSize: 14,
    lineHeight: 22,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.m,
    borderWidth: 1,
    padding: spacing.m,
    marginTop: spacing.m,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
  },
  closeBtn: {
    marginTop: spacing.m,
    padding: spacing.m,
    borderRadius: radius.m,
    alignItems: "center",
  },
});
