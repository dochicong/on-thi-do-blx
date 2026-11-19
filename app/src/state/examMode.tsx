/**
 * Chế độ Full-screen khi làm bài thi.
 *
 * Màn Thi thử bật cờ này lúc bắt đầu làm bài; Tab Bar đọc cờ và ẩn hoàn toàn
 * để người dùng không bấm nhầm tab khi đang tập trung thi.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ExamModeValue = {
  /** true = đang trong bài thi, ẩn Tab Bar */
  hidden: boolean;
  setHidden: (value: boolean) => void;
};

const ExamModeContext = createContext<ExamModeValue>({ hidden: false, setHidden: () => {} });

export function ExamModeProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((value: boolean) => setHiddenState(value), []);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden, setHidden]);
  return <ExamModeContext.Provider value={value}>{children}</ExamModeContext.Provider>;
}

export function useExamMode(): ExamModeValue {
  return useContext(ExamModeContext);
}
