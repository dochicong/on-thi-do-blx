import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';

import ExamScreen from '../../screens/ExamScreen';
import ResultScreen from '../../screens/ResultScreen';
import ReviewExamScreen from '../../screens/ReviewExamScreen';
import { recordExamResult, saveLastAttempt } from '../../storage/progress';

type Phase = 'exam' | 'result' | 'review';

type Payload = {
  paper: { exam?: { id?: string; title?: string; type?: string }; questions?: unknown[]; spec?: { max_score?: number } };
  answers: Record<string, unknown>;
  result: {
    scoreKnown?: number;
    maxKnown?: number;
    pending?: number;
    passKnown?: boolean | null;
    needsScanReview?: boolean;
  };
};

/**
 * Luồng Thi thử: ExamScreen (glm-5,2) → ResultScreen (gemini-3.8) → ReviewExamScreen.
 * Giữ state trong một route để không phải serialize board/answers qua URL.
 */
export default function ExamRoute() {
  const [phase, setPhase] = useState<Phase>('exam');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [round, setRound] = useState(0);

  const restart = useCallback(() => {
    setPayload(null);
    setRound((r) => r + 1);
    setPhase('exam');
  }, []);

  const onFinished = useCallback(async (data: Payload) => {
    setPayload(data);
    setPhase('result');
    const examId = data?.paper?.exam?.id ?? 'unknown';
    const score = data?.result?.scoreKnown ?? 0;
    const maxScore = data?.result?.maxKnown || data?.paper?.spec?.max_score || 0;
    try {
      await recordExamResult({
        examId,
        score,
        maxScore,
        passed: data?.result?.passKnown === true,
      });
      await saveLastAttempt({
        examId,
        examLabel: data?.paper?.exam?.title ?? 'Đề thi thử',
        examType: data?.paper?.exam?.type ?? '',
        score,
        maxScore,
        passed: data?.result?.passKnown === true,
        finishedAt: Date.now(),
        totalQuestions: data?.paper?.questions?.length ?? 0,
        needsScanReview: Boolean(data?.result?.needsScanReview),
        paper: data?.paper,
        answers: data?.answers,
        result: data?.result,
      });
    } catch {
      // lưu lỗi không chặn việc xem kết quả
    }
  }, []);

  if (phase === 'result' && payload) {
    return (
      <ResultScreen
        paper={payload.paper}
        answers={payload.answers}
        result={payload.result}
        timeSpent={0}
        onReview={() => setPhase('review')}
        onRetake={restart}
        onHome={() => {
          restart();
          router.replace('/');
        }}
      />
    );
  }

  if (phase === 'review' && payload) {
    return (
      <ReviewExamScreen
        paper={payload.paper}
        answers={payload.answers}
        result={payload.result}
        onBack={() => setPhase('result')}
        onRetake={restart}
      />
    );
  }

  return <ExamScreen key={round} onFinished={onFinished} />;
}
