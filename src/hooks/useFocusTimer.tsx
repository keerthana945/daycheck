import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useCompanionStore } from './useCompanionStore';
import type { ToastItem } from '../types';

export const FOCUS_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: '25m', minutes: 25 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
];

interface FocusTimerContextValue {
  selectedMinutes: number;
  secondsLeft: number;
  running: boolean;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  selectPreset: (minutes: number) => void;
  toggleRunning: () => void;
  resetTimer: () => void;
  startTaskFocus: (taskId: string, taskTitle: string, minutes?: number) => void;
  clearLinkedTask: () => void;
  finishAndLogEarly: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export function FocusTimerProvider({
  children,
  onNotify,
}: {
  children: ReactNode;
  onNotify?: (message: string, tone?: ToastItem['tone']) => void;
}) {
  const { logFocusSession } = useCompanionStore();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null);

  const metaRef = useRef({ selectedMinutes, linkedTaskId, linkedTaskTitle });
  metaRef.current = { selectedMinutes, linkedTaskId, linkedTaskTitle };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const { selectedMinutes: mins, linkedTaskId: tId, linkedTaskTitle: tTitle } =
            metaRef.current;
          setRunning(false);
          logFocusSession({
            minutes: mins,
            taskId: tId || undefined,
            taskTitle: tTitle || undefined,
          });
          onNotify?.(
            tTitle
              ? `Completed ${mins}m focus on "${tTitle}".`
              : `${mins}-minute focus session logged.`,
            'success',
          );
          return mins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, logFocusSession, onNotify]);

  const selectPreset = useCallback((minutes: number) => {
    setRunning(false);
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
  }, []);

  const toggleRunning = useCallback(() => {
    setRunning((r) => !r);
  }, []);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setSecondsLeft(selectedMinutes * 60);
  }, [selectedMinutes]);

  const startTaskFocus = useCallback(
    (taskId: string, taskTitle: string, minutes = 25) => {
      setSelectedMinutes(minutes);
      setSecondsLeft(minutes * 60);
      setLinkedTaskId(taskId);
      setLinkedTaskTitle(taskTitle);
      setRunning(true);
      onNotify?.(`Focus timer started (${minutes}m) for "${taskTitle}".`, 'info');
    },
    [onNotify],
  );

  const clearLinkedTask = useCallback(() => {
    setLinkedTaskId(null);
    setLinkedTaskTitle(null);
  }, []);

  const finishAndLogEarly = useCallback(() => {
    const elapsedMinutes = Math.floor((selectedMinutes * 60 - secondsLeft) / 60);
    setRunning(false);
    setSecondsLeft(selectedMinutes * 60);
    if (elapsedMinutes >= 1) {
      logFocusSession({
        minutes: elapsedMinutes,
        taskId: linkedTaskId || undefined,
        taskTitle: linkedTaskTitle || undefined,
      });
      onNotify?.(`Logged ${elapsedMinutes}m of focus.`, 'success');
    } else {
      onNotify?.('Timer reset (less than 1 minute elapsed).', 'info');
    }
  }, [selectedMinutes, secondsLeft, linkedTaskId, linkedTaskTitle, logFocusSession, onNotify]);

  return (
    <FocusTimerContext.Provider
      value={{
        selectedMinutes,
        secondsLeft,
        running,
        linkedTaskId,
        linkedTaskTitle,
        selectPreset,
        toggleRunning,
        resetTimer,
        startTaskFocus,
        clearLinkedTask,
        finishAndLogEarly,
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer(): FocusTimerContextValue {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) {
    throw new Error('useFocusTimer must be used inside FocusTimerProvider');
  }
  return ctx;
}
