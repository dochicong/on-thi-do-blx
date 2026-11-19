/**
 * Ảnh minh hoạ câu hỏi — to, rõ, chạm để phóng to toàn màn hình.
 * Dùng chung cho màn Thi thử và Xem lại bài làm.
 */
import React, { useState } from 'react';
import { Image, Modal, Pressable, Text } from 'react-native';

import { radius, spacing, useTheme } from '../theme';
import { questionImage } from '../assets_map';

type Props = {
  questionId: string;
  /** chiều cao khung ảnh (mặc định 220) */
  height?: number;
  /** bo góc + nền trắng để ảnh nổi trên nền tối */
  framed?: boolean;
};

export function QuestionImage({ questionId, height = 220, framed = true }: Props) {
  const { c, isDark } = useTheme();
  const [zoom, setZoom] = useState(false);
  const src = questionImage(questionId, 0);

  if (!src) return null;

  return (
    <>
      <Pressable
        onPress={() => setZoom(true)}
        accessibilityLabel="Ảnh minh hoạ câu hỏi, chạm để phóng to"
        style={{
          backgroundColor: isDark ? '#FFFFFF' : c.card,
          borderRadius: framed ? radius.m : 0,
          borderWidth: 1,
          borderColor: c.border,
          padding: 6,
        }}
      >
        <Image
          source={src}
          style={{ width: '100%', height, borderRadius: radius.s }}
          resizeMode="contain"
        />
        <Text
          style={{
            color: isDark ? '#5B6472' : c.textDim,
            fontSize: 10.5,
            textAlign: 'right',
            paddingTop: 4,
            paddingRight: 2,
          }}
        >
          ⤢ chạm để phóng to
        </Text>
      </Pressable>

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <Pressable
          onPress={() => setZoom(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' }}
        >
          <Image source={src} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              paddingVertical: spacing.l,
              opacity: 0.85,
              fontSize: 13,
            }}
          >
            Chạm vào ảnh để đóng
          </Text>
        </Pressable>
      </Modal>
    </>
  );
}
