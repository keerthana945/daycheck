import { useState } from 'react';
import { Minus, Plus, SlidersHorizontal, Check, Sprout } from 'lucide-react';
import { WEEK_DAYS, getTodayWeekdayIndex } from '../data/sampleData';
import { computeHabitStreak } from '../hooks/useMyDayStore';
import {
  HabitGardenPlant,
  getGrowthStageLabel,
  getPlantSpecies,
} from './HabitGardenPlant';
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
    <div className="space-y-7">
      <header className="pb-5 border-b border-[#E8E1D7]">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-[#4A6B53]">
          <Sprout className="w-3.5 h-3.5 shrink-0" />
          <span>Living Habit Garden</span>
        </p>
        <h1 className="mt-1.5 text-3xl sm:text-4xl font-medium tracking-[-0.02em] text-[#292522] text-balance">
          Habit Tracker
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6359]">
          Tap + to log progress, or tap Complete to bring each habit plant into full bloom.
        </p>
      </header>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8E1D7] p-5 shadow-[0_1px_3px_rgba(41,37,34,0.04)]">
          <p className="text-xs font-medium text-[#6E6359]">Weekly Consistency</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#800020] tabular-nums">
            {weeklyConsistencyPct}%
          </p>
          <p className="mt-1 text-xs text-[#6E6359] tabular-nums">
            {completedUpToToday} of {totalPossibleUpToToday} check-ins this week
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8E1D7] p-5 shadow-[0_1px_3px_rgba(41,37,34,0.04)]">
          <p className="text-xs font-medium text-[#6E6359]">Blooming Today</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#4A6B53] tabular-nums">
            {habitsMetToday} / {habits.length}
          </p>
          <p className="mt-1 text-xs text-[#6E6359]">
            {habitsMetToday === habits.length
              ? 'All 5 daily habits completed'
              : `${habits.length - habitsMetToday} remaining today`}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAF3F1] border border-[#EAD9D8] p-5 shadow-[0_1px_3px_rgba(128,0,32,0.04)]">
          <p className="text-xs font-medium text-[#6E6359]">Longest Active Streak</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#292522] tabular-nums">
            {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-[#6E6359]">Consecutive days reaching goal</p>
        </div>
      </div>

      {/* 5 Core Habit Garden Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {habits.map((habit) => {
          const pct = Math.min(100, Math.round((habit.todayValue / habit.targetValue) * 100));
          const isMet = habit.todayValue >= habit.targetValue;
          const streak = computeHabitStreak(habit.weeklyHistory);
          const weekHits = habit.weeklyHistory.filter(Boolean).length;
          const isEditingTarget = editingTargetKey === habit.key;
          const species = getPlantSpecies(habit.key);
          const stageLabel = getGrowthStageLabel(pct);

          return (
            <div
              key={habit.key}
              className={`rounded-3xl border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-colors ${
                isMet
                  ? 'bg-[#FFFDF9] border-[#D7C3C6] shadow-[0_4px_14px_rgba(128,0,32,0.05)]'
                  : 'bg-[#FFFDF9] border-[#E8E1D7] shadow-[0_1px_4px_rgba(41,37,34,0.04)]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-sans text-base font-semibold text-[#292522]">
                      {habit.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-[#6E6359] tabular-nums">
                      <span>{species}</span>
                      <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                      <span>{streak} day streak</span>
                      <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                      <span>{weekHits}/7 days</span>
                      <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                      <span className={isMet ? 'text-[#4A6B53] font-medium' : 'text-[#6E6359]'}>
                        {stageLabel}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEditingTarget(habit)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] hover:text-[#292522] hover:bg-[#F8F5F0] transition-colors whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Goal</span>
                  </button>
                </div>

                {isEditingTarget && (
                  <div className="mt-3 p-3 rounded-2xl bg-[#F8F5F0] border border-[#E8E1D7] flex items-center justify-between gap-3">
                    <span className="text-xs text-[#4F4740]">Daily goal ({habit.unit}):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={habit.minTarget}
                        max={habit.maxTarget}
                        step={habit.step}
                        value={draftTarget}
                        onChange={(e) => setDraftTarget(Number(e.target.value))}
                        aria-label={`Daily goal for ${habit.name}`}
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#E8E1D7] text-sm font-mono text-[#292522] tabular-nums focus:outline-none focus:border-[#800020]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateTarget(habit.key, draftTarget);
                          setEditingTargetKey(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 shrink-0">
                      <HabitGardenPlant habitKey={habit.key} progressPct={pct} />
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="font-mono text-3xl font-semibold text-[#292522]">
                        {habit.todayValue}
                      </span>
                      <span className="text-sm text-[#6E6359]">
                        / {habit.targetValue} {habit.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAdjustValue(habit.key, -habit.step)}
                      disabled={habit.todayValue <= 0}
                      aria-label={`Decrease ${habit.name}`}
                      className="w-10 h-10 rounded-xl border border-[#E8E1D7] bg-[#F8F5F0] flex items-center justify-center text-[#292522] hover:bg-[#EFE9E0] disabled:opacity-40 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdjustValue(habit.key, habit.step)}
                      aria-label={`Increase ${habit.name}`}
                      className="w-10 h-10 rounded-xl bg-[#800020] text-[#FFFDF9] flex items-center justify-center hover:bg-[#66001A] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSetValue(habit.key, isMet ? 0 : habit.targetValue)
                      }
                      className={`h-10 px-3.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                        isMet
                          ? 'bg-[#4A6B53] border-[#4A6B53] text-[#FFFDF9] hover:bg-[#3B5743]'
                          : 'bg-[#FFFDF9] border-[#E8E1D7] text-[#292522] hover:border-[#800020] hover:text-[#800020]'
                      }`}
                    >
                      {isMet ? 'Blooming' : 'Complete'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-[#EFE9E0] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isMet ? 'bg-[#4A6B53]' : 'bg-[#800020]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE9E0]">
                <div className="flex items-center justify-between text-xs text-[#6E6359] mb-2.5">
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
                          isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F8F5F0]'
                        }`}
                      >
                        <span
                          className={`text-[11px] font-medium ${
                            isToday ? 'text-[#800020] font-semibold' : 'text-[#6E6359]'
                          }`}
                        >
                          {dayLabel}
                        </span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                            done
                              ? 'bg-[#4A6B53] border-[#4A6B53] text-[#FFFDF9]'
                              : isToday
                                ? 'border-[#800020] bg-[#FAF3F1]'
                                : 'border-[#D8CFC3] bg-[#FFFDF9]'
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
