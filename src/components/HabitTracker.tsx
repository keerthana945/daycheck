import { useState } from 'react';
import { Minus, Plus, SlidersHorizontal, Check } from 'lucide-react';
import { WEEK_DAYS, getTodayWeekdayIndex } from '../data/sampleData';
import { computeHabitStreak } from '../hooks/useMyDayStore';
import type { Habit, HabitKey } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
  onAdjustValue: (key: HabitKey, delta: number) => void;
  onSetValue: (key: HabitKey, value: number) => void;
  onUpdateTarget: (key: HabitKey, targetValue: number) => void;
  onToggleWeekday: (key: HabitKey, dayIndex: number) => void;
}

export function HabitTracker({
  habits,
  onAdjustValue,
  onSetValue,
  onUpdateTarget,
  onToggleWeekday,
}: HabitTrackerProps) {
  const [editingTargetKey, setEditingTargetKey] = useState<HabitKey | null>(null);
  const [draftTarget, setDraftTarget] = useState<number>(0);

  const todayIdx = getTodayWeekdayIndex();
  const activeDaysInWeek = todayIdx + 1;
  const totalPossibleUpToToday = habits.length * activeDaysInWeek;
  const completedUpToToday = habits.reduce(
    (sum, h) => sum + h.weeklyHistory.slice(0, activeDaysInWeek).filter(Boolean).length,
    0,
  );
  const weeklyConsistencyPct =
    totalPossibleUpToToday === 0
      ? 0
      : Math.round((completedUpToToday / totalPossibleUpToToday) * 100);

  const habitsMetToday = habits.filter((h) => h.todayValue >= h.targetValue).length;
  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, computeHabitStreak(h.weeklyHistory)),
    0,
  );

  const startEditingTarget = (habit: Habit) => {
    if (editingTargetKey === habit.key) {
      setEditingTargetKey(null);
      return;
    }
    setEditingTargetKey(habit.key);
    setDraftTarget(habit.targetValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1F1A17] text-balance">
          Habit Tracker
        </h1>
        <p className="mt-1 text-sm text-[#5C534D]">
          Tap + to log progress, or tap Mark Done once you finish your daily goal.
        </p>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#E6DDD0] p-5">
          <p className="text-xs font-medium text-[#5C534D]">Weekly Progress</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#6D1D2C] tabular-nums">
            {weeklyConsistencyPct}%
          </p>
          <p className="mt-1 text-xs text-[#5C534D] tabular-nums">
            {completedUpToToday} of {totalPossibleUpToToday} check-ins this week
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E6DDD0] p-5">
          <p className="text-xs font-medium text-[#5C534D]">Completed Today</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#1F1A17] tabular-nums">
            {habitsMetToday} / {habits.length}
          </p>
          <p className="mt-1 text-xs text-[#5C534D]">
            {habitsMetToday === habits.length
              ? 'All 5 daily habits completed'
              : `${habits.length - habitsMetToday} remaining today`}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F2ECE3] border border-[#E6DDD0] p-5">
          <p className="text-xs font-medium text-[#5C534D]">Longest Active Streak</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#1F1A17] tabular-nums">
            {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-[#5C534D]">Consecutive days reaching goal</p>
        </div>
      </div>

      {/* 5 Core Habit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {habits.map((habit) => {
          const pct = Math.min(100, Math.round((habit.todayValue / habit.targetValue) * 100));
          const isMet = habit.todayValue >= habit.targetValue;
          const streak = computeHabitStreak(habit.weeklyHistory);
          const weekHits = habit.weeklyHistory.filter(Boolean).length;
          const isEditingTarget = editingTargetKey === habit.key;

          return (
            <div
              key={habit.key}
              className="rounded-2xl bg-white border border-[#E6DDD0] p-5 sm:p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[#1F1A17]">{habit.name}</h2>
                    <p className="mt-0.5 text-xs text-[#5C534D] tabular-nums">
                      <span>{streak} day streak</span>
                      <span aria-hidden="true"> · </span>
                      <span>{weekHits}/7 days this week</span>
                      <span aria-hidden="true"> · </span>
                      <span className={isMet ? 'text-[#2D6A4F] font-medium' : 'text-[#5C534D]'}>
                        {isMet ? 'Goal reached' : 'In progress'}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEditingTarget(habit)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5C534D] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Goal</span>
                  </button>
                </div>

                {isEditingTarget && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] flex items-center justify-between gap-3">
                    <span className="text-xs text-[#4A433E]">Daily goal ({habit.unit}):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={habit.minTarget}
                        max={habit.maxTarget}
                        step={habit.step}
                        value={draftTarget}
                        onChange={(e) => setDraftTarget(Number(e.target.value))}
                        aria-label={`Daily goal for ${habit.name}`}
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-white border border-[#E6DDD0] text-sm font-mono text-[#1F1A17] tabular-nums focus:outline-none focus:border-[#6D1D2C]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateTarget(habit.key, draftTarget);
                          setEditingTargetKey(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-1.5 tabular-nums">
                    <span className="font-mono text-3xl font-semibold text-[#1F1A17]">
                      {habit.todayValue}
                    </span>
                    <span className="text-sm text-[#5C534D]">
                      / {habit.targetValue} {habit.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAdjustValue(habit.key, -habit.step)}
                      disabled={habit.todayValue <= 0}
                      aria-label={`Decrease ${habit.name}`}
                      className="w-10 h-10 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2] flex items-center justify-center text-[#1F1A17] hover:bg-[#F2ECE3] disabled:opacity-40 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustValue(habit.key, habit.step)}
                      aria-label={`Increase ${habit.name}`}
                      className="w-10 h-10 rounded-xl bg-[#6D1D2C] text-white flex items-center justify-center hover:bg-[#551521] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSetValue(habit.key, isMet ? 0 : habit.targetValue)
                      }
                      className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                        isMet
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white hover:bg-[#23533D]'
                          : 'bg-white border-[#E6DDD0] text-[#1F1A17] hover:border-[#6D1D2C] hover:text-[#6D1D2C]'
                      }`}
                    >
                      {isMet ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 h-2 w-full rounded-full bg-[#F2ECE3] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isMet ? 'bg-[#2D6A4F]' : 'bg-[#6D1D2C]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE9E0]">
                <div className="flex items-center justify-between text-xs text-[#5C534D] mb-2.5">
                  <span>Weekly check-ins</span>
                  <span className="tabular-nums">{pct}% today</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map((dayLabel, idx) => {
                    const done = habit.weeklyHistory[idx];
                    const isToday = idx === todayIdx;
                    const isFuture = idx > todayIdx;
                    return (
                      <button
                        key={dayLabel}
                        type="button"
                        disabled={isFuture}
                        onClick={() => onToggleWeekday(habit.key, idx)}
                        aria-label={`${habit.name} on ${dayLabel}: ${done ? 'completed' : 'not completed'}`}
                        className={`flex flex-col items-center gap-1.5 py-1.5 rounded-lg transition-colors ${
                          isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-medium ${
                            isToday ? 'text-[#6D1D2C] font-semibold' : 'text-[#5C534D]'
                          }`}
                        >
                          {dayLabel}
                        </span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                            done
                              ? 'bg-[#6D1D2C] border-[#6D1D2C] text-white'
                              : isToday
                                ? 'border-[#6D1D2C] bg-[#F7ECEE]'
                                : 'border-[#D8CFC3] bg-white'
                          }`}
                        >
                          {done && <Check className="w-3 h-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
