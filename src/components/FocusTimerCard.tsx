import { Check, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { FOCUS_PRESETS, useFocusTimer } from '../hooks/useFocusTimer';

export function FocusTimerCard({ todayMinutes = 0 }: { todayMinutes?: number }) {
  const {
    selectedMinutes,
    secondsLeft,
    running,
    linkedTaskTitle,
    selectPreset,
    toggleRunning,
    resetTimer,
    clearLinkedTask,
    finishAndLogEarly,
  } = useFocusTimer();

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const elapsedSeconds = selectedMinutes * 60 - secondsLeft;

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-3.5 py-2.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E] shrink-0" />
          <span className="font-mono text-base font-medium text-[#292522] dark:text-[#F3EFEA] tabular-nums">
            {mins}:{secs}
          </span>
          {todayMinutes > 0 && (
            <span className="text-[11px] font-mono text-[#6E6359] dark:text-[#A69E94] tabular-nums">
              · {todayMinutes}m today
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[#F4EFE7] dark:bg-[#151515] p-0.5 border border-[#E6DFD5] dark:border-[#2A2826]">
          {FOCUS_PRESETS.map((preset) => {
            const active = selectedMinutes === preset.minutes;
            return (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => selectPreset(preset.minutes)}
                className={`px-2 py-1 rounded-md font-mono text-xs transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#800020] dark:text-[#D4A85E] font-medium shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                    : 'text-[#6E6359] dark:text-[#9E958C] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={toggleRunning}
            aria-label={running ? 'Pause focus timer' : 'Start focus timer'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{running ? 'Pause' : 'Focus'}</span>
          </button>
          {elapsedSeconds >= 60 && (
            <button
              type="button"
              onClick={finishAndLogEarly}
              title="Finish and log elapsed focus minutes"
              aria-label="Finish and log elapsed focus minutes"
              className="p-1.5 rounded-lg text-[#4A6B53] dark:text-[#8AB896] hover:bg-[#F4EFE7] dark:hover:bg-[#262523] transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reset focus timer"
            className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#9E958C] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F4EFE7] dark:hover:bg-[#262523] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {linkedTaskTitle && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EFE9E0] dark:border-[#2A2825] text-xs text-[#6E6359] dark:text-[#A69E94]">
          <span className="truncate">
            Focusing on <span className="font-medium text-[#800020] dark:text-[#D4A85E]">{linkedTaskTitle}</span>
          </span>
          <button
            type="button"
            onClick={clearLinkedTask}
            aria-label="Clear linked task"
            className="p-0.5 rounded text-[#8C8278] hover:text-[#292522] dark:hover:text-[#F3EFEA] shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
