/**
 * Celebration.tsx — Hiệu ứng pháo hoa confetti chúc mừng thi đỗ.
 * Kết hợp 2 tầng hiệu ứng:
 *   1. Vụ nổ trung tâm (Burst): Bung tỏa ánh sao & ruy băng từ huy hiệu cúp vàng.
 *   2. Mưa pháo hoa đa sắc (Confetti Shower): 48 mảnh confetti nhiều màu sắc lật xoay 3D rơi khắp màn hình.
 * Chạy hoàn toàn bằng useNativeDriver: true đảm bảo 60 FPS siêu mượt.
 */
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#58CC02', '#10B981', // emerald
  '#FFC800', // Gold
  '#1CB0F6', // Sky blue
  '#FF4B4B', // Vibrant red
  '#CE82FF', // Purple
  '#FF9600', // Orange
  '#00CD9C', // Mint
];

const SPARK_ICONS = ['🏆', '⭐', '✨', '🎉', '🎌', '🌟'];

type ConfettiPiece = {
  id: number;
  isRibbon: boolean;
  color: string;
  char?: string;
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  flip: Animated.Value;
};

function createPieces(): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  // 48 mảnh Confetti rơi rực rỡ khắp màn hình
  for (let i = 0; i < 48; i++) {
    const startX = Math.random() * SCREEN_WIDTH;
    const drift = (Math.random() - 0.5) * 140;
    pieces.push({
      id: i,
      isRibbon: true,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: 8 + Math.random() * 6,
      height: 12 + Math.random() * 8,
      startX,
      startY: -30 - Math.random() * 180,
      endX: startX + drift,
      endY: SCREEN_HEIGHT + 40,
      delay: Math.random() * 600,
      duration: 2100 + Math.random() * 1100,
      x: new Animated.Value(startX),
      y: new Animated.Value(-30 - Math.random() * 180),
      scale: new Animated.Value(0.8 + Math.random() * 0.5),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      flip: new Animated.Value(0),
    });
  }

  // 16 tia pháo hoa bung nổ từ tâm huy hiệu chiến thắng
  for (let j = 0; j < 16; j++) {
    const angle = (j / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const dist = 110 + Math.random() * 140;
    const startX = SCREEN_WIDTH / 2;
    const startY = SCREEN_HEIGHT * 0.34;
    pieces.push({
      id: 100 + j,
      isRibbon: false,
      color: '#FFC800',
      char: SPARK_ICONS[j % SPARK_ICONS.length],
      width: 24,
      height: 24,
      startX,
      startY,
      endX: startX + Math.cos(angle) * dist,
      endY: startY + Math.sin(angle) * dist,
      delay: 40 + j * 15,
      duration: 1100 + Math.random() * 300,
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      flip: new Animated.Value(0),
    });
  }

  return pieces;
}

export function CelebrationOverlay({ onDone }: { onDone?: () => void }) {
  const [pieces] = useState<ConfettiPiece[]>(() => createPieces());

  useEffect(() => {
    const anims = pieces.map((p) => {
      if (p.isRibbon) {
        return Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: p.endY,
              duration: p.duration,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: p.endX,
              duration: p.duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(p.rotate, {
              toValue: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4),
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.loop(
              Animated.timing(p.flip, {
                toValue: 1,
                duration: 380 + Math.random() * 250,
                useNativeDriver: true,
              }),
            ),
            Animated.sequence([
              Animated.delay(p.duration * 0.72),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: p.duration * 0.28,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
      }

      // Hiệu ứng nổ trung tâm
      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.x, {
            toValue: p.endX,
            duration: p.duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: p.endY,
            duration: p.duration,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.spring(p.scale, {
              toValue: 1.25,
              friction: 4,
              tension: 90,
              useNativeDriver: true,
            }),
            Animated.timing(p.scale, {
              toValue: 0.7,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(p.rotate, {
            toValue: (Math.random() - 0.5) * 3,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(p.duration * 0.65),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: p.duration * 0.35,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    const composite = Animated.parallel(anims);
    composite.start(() => {
      onDone?.();
    });

    const timer = setTimeout(() => {
      onDone?.();
    }, 3600);

    return () => {
      composite.stop();
      clearTimeout(timer);
    };
  }, [pieces, onDone]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => {
        const spin = p.rotate.interpolate({
          inputRange: [-8, 8],
          outputRange: ['-720deg', '720deg'],
        });
        const scaleY = p.flip.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 0.2, 1],
        });

        if (p.isRibbon) {
          return (
            <Animated.View
              key={p.id}
              style={[
                st.piece,
                {
                  width: p.width,
                  height: p.height,
                  borderRadius: p.id % 3 === 0 ? p.width / 2 : 2,
                  backgroundColor: p.color,
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { rotate: spin },
                    { scaleY },
                    { scale: p.scale },
                  ],
                },
              ]}
            />
          );
        }

        return (
          <Animated.View
            key={p.id}
            style={[
              st.spark,
              {
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <Text style={{ fontSize: 24 }}>{p.char}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  piece: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  spark: {
    position: 'absolute',
    left: -12,
    top: -12,
  },
});
