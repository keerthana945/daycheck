import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import type { ToastItem } from '../types';

interface FocusTimerCardProps {
  onNotify?: (message: string, tone?: ToastItem['tone']) => void;
}

const PRESETS: Array<{ label: string; minutes: number }> = [
  { label: '25m', minutes: 25 },
  { label: '15m', minutes: 15 },
  { label: '5m', minutes: 5 },
];

export function FocusTimerCard({ onNotify }: FocusTimerCardProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          onNotify?.(`${selectedMinutes}-minute focus session complete.`, 'success');
          return selectedMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, selectedMinutes, onNotify]);

  const handleSelectPreset = (minutes: number) => {
    setRunning(false);
    setSelectedMinutes(minutes);
    setSecondsLeft(minutes * 60);
  };

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(selectedMinutes * 60);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-3.5 py-2.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E] shrink-0" />
        <span className="font-mono text-base font-medium text-[#292522] dark:text-[#F3EFEA] tabular-nums">
          {mins}:{secs}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-[#F4EFE7] dark:bg-[#151515] p-0.5 border border-[#E6DFD5] dark:border-[#2A2826]">
        {PRESETS.map((preset) => {
          const active = selectedMinutes === preset.minutes;
          return (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => handleSelectPreset(preset.minutes)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#800020] dark:text-[#D4A85E] font-medium shadow-xs dark:shadow-none'
                  : 'text-[#6E6359] dark:text-[#9E958C] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? 'Pause focus timer' : 'Start focus timer'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap"
        >
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{running ? 'Pause' : 'Focus'}</span>
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset focus timer"
          className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#9E958C] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F4EFE7] dark:hover:bg-[#262523] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
