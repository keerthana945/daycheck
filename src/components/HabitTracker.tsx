import { useState } from 'react';
import { Minus, Plus, SlidersHorizontal, Check, Sprout, Trash2, Sparkles } from 'lucide-react';
import { WEEK_DAYS, getTodayWeekdayIndex } from '../data/sampleData';
import { computeHabitStreak } from '../hooks/useMyDayStore';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { PageCoverHeader } from './EditorialCovers';
import {
  HabitGardenPlant,
  getGrowthStageLabel,
  getPlantSpecies,
} from './HabitGardenPlant';
import { ModalShell } from './ModalShell';
import type { Habit, HabitKey, PlantStyle } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
  onAdjustValue: (key: HabitKey, delta: number) => void;
  onSetValue: (key: HabitKey, value: number) => void;
  onUpdateTarget: (key: HabitKey, targetValue: number) => void;
  onToggleWeekday: (key: HabitKey, dayIndex: number) => void;
  onAddCustomHabit: (input: {
    name: string;
    unit: string;
    targetValue: number;
    step: number;
    plantStyle: PlantStyle;
  }) => void;
  onLoadStarterHabits: () => void;
  onDeleteHabit: (key: HabitKey) => void;
}

const PLANT_OPTIONS: Array<{ value: PlantStyle; label: string }> = [
  { value: 'camellia', label: 'Burgundy Camellia' },
  { value: 'fern', label: 'River Fern' },
  { value: 'peony', label: 'Dusty Blush Peony' },
  { value: 'olive', label: 'Sun Olive' },
  { value: 'lavender', label: 'Garden Lavender' },
];

export function HabitTracker({
  habits,
  onAdjustValue,
  onSetValue,
  onUpdateTarget,
  onToggleWeekday,
  onAddCustomHabit,
  onLoadStarterHabits,
  onDeleteHabit,
}: HabitTrackerProps) {
  const { companion } = useCompanionStore();
  const [editingTargetKey, setEditingTargetKey] = useState<HabitKey | null>(null);
  const [draftTarget, setDraftTarget] = useState<number>(0);

  // Plant New Habit modal
  const [plantOpen, setPlantOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('min');
  const [newTarget, setNewTarget] = useState(20);
  const [newStep, setNewStep] = useState(5);
  const [newPlantStyle, setNewPlantStyle] = useState<PlantStyle>('camellia');
  const [formError, setFormError] = useState('');

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

  const handlePlantHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Please enter a habit name.');
      return;
    }
    onAddCustomHabit({
      name: newName.trim(),
      unit: newUnit.trim() || 'times',
      targetValue: Math.max(1, Number(newTarget) || 1),
      step: Math.max(1, Number(newStep) || 1),
      plantStyle: newPlantStyle,
    });
    setNewName('');
    setNewUnit('min');
    setNewTarget(20);
    setNewStep(5);
    setFormError('');
    setPlantOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageCoverHeader
        mood={companion.bannerMood}
        variant="habits"
        eyebrow="living habit garden"
        title="habit tracker"
        subtitle="Plant habits that matter to you. Log daily progress to watch each botanical grow from seed to bloom."
        icon={<Sprout className="w-6 h-6" />}
        actions={
          <button
            type="button"
            onClick={() => setPlantOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Plant Habit</span>
          </button>
        }
      />

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
          <p className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">Weekly Consistency</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#800020] dark:text-[#D4A85E] tabular-nums">
            {weeklyConsistencyPct}%
          </p>
          <p className="mt-1 text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
            {completedUpToToday} of {totalPossibleUpToToday} check-ins this week
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
          <p className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">Blooming Today</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#4A6B53] dark:text-[#8AB896] tabular-nums">
            {habitsMetToday} / {habits.length}
          </p>
          <p className="mt-1 text-xs text-[#6E6359] dark:text-[#A69E94]">
            {habits.length === 0
              ? 'Plant your first habit below'
              : habitsMetToday === habits.length
                ? `All ${habits.length} daily habits completed`
                : `${habits.length - habitsMetToday} remaining today`}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FAF6EE] dark:bg-[#23201C] border border-[#E5DDD0] dark:border-[#3A342B] p-5 shadow-[0_1px_3px_rgba(128,0,32,0.04)] dark:shadow-none">
          <p className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">Longest Active Streak</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#292522] dark:text-[#F3EFEA] tabular-nums">
            {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-[#6E6359] dark:text-[#A69E94]">Consecutive days reaching goal</p>
        </div>
      </div>

      {/* Empty State or Habit Cards */}
      {habits.length === 0 ? (
        <div className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-6 py-12 text-center shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none">
          <div className="mx-auto w-24">
            <HabitGardenPlant habitKey="water" plantStyle="camellia" progressPct={50} />
          </div>
          <h2 className="mt-2 font-display text-2xl font-medium text-[#292522] dark:text-[#F3EFEA]">
            Your conservatory is waiting
          </h2>
          <p className="mt-1.5 text-sm text-[#6E6359] dark:text-[#A69E94] max-w-md mx-auto">
            Create custom habits like Water, Journaling, Reading, or Movement—each gets its own illustrated botanical that blooms as you check in.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPlantOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Plant First Habit</span>
            </button>
            <button
              type="button"
              onClick={onLoadStarterHabits}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0] dark:bg-[#161616] text-[#292522] dark:text-[#F3EFEA] hover:bg-[#EFE9E0] dark:hover:bg-[#262523] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B5853B] dark:text-[#D4A85E]" />
              <span>Try 4 Starter Habits</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habits.map((habit) => {
            const pct = Math.min(100, Math.round((habit.todayValue / habit.targetValue) * 100));
            const isMet = habit.todayValue >= habit.targetValue;
            const streak = computeHabitStreak(habit.weeklyHistory);
            const weekHits = habit.weeklyHistory.filter(Boolean).length;
            const isEditingTarget = editingTargetKey === habit.key;
            const species = getPlantSpecies(habit.key, habit.plantStyle);
            const stageLabel = getGrowthStageLabel(pct);

            return (
              <div
                key={habit.key}
                className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-5 transition-colors ${
                  isMet
                    ? 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#C5DBC9] dark:border-[#3A5442] shadow-[0_4px_14px_rgba(74,107,83,0.06)] dark:shadow-none'
                    : 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#E6DFD5] dark:border-[#2E2C29] shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                        {habit.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                        <span>{species}</span>
                        <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                        <span>{streak} day streak</span>
                        <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                        <span>{weekHits}/7 days</span>
                        <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                        <span className={isMet ? 'text-[#4A6B53] dark:text-[#8AB896] font-medium' : 'text-[#800020] dark:text-[#D4A85E]'}>
                          {stageLabel}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditingTarget(habit)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors whitespace-nowrap"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Goal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.key)}
                        aria-label={`Remove "${habit.name}" habit`}
                        className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#E58A9B] hover:bg-[#FAF3F1] dark:hover:bg-[#291C1F] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditingTarget && (
                    <div className="mt-3 p-3 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] flex items-center justify-between gap-3">
                      <span className="text-xs text-[#4F4740] dark:text-[#CFC7BE]">Daily goal ({habit.unit}):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={habit.minTarget}
                          max={habit.maxTarget}
                          step={habit.step}
                          value={draftTarget}
                          onChange={(e) => setDraftTarget(Number(e.target.value))}
                          aria-label={`Daily goal for ${habit.name}`}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm font-mono text-[#292522] dark:text-[#F3EFEA] tabular-nums focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateTarget(habit.key, draftTarget);
                            setEditingTargetKey(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 shrink-0">
                        <HabitGardenPlant
                          habitKey={habit.key}
                          plantStyle={habit.plantStyle}
                          progressPct={pct}
                        />
                      </div>
                      <div className="flex items-baseline gap-1.5 tabular-nums">
                        <span className="font-mono text-3xl font-semibold text-[#292522] dark:text-[#F3EFEA]">
                          {habit.todayValue}
                        </span>
                        <span className="text-sm text-[#6E6359] dark:text-[#A69E94]">
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
                        className="w-10 h-10 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0] dark:bg-[#161616] flex items-center justify-center text-[#292522] dark:text-[#F3EFEA] hover:bg-[#EFE9E0] dark:hover:bg-[#262523] disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustValue(habit.key, habit.step)}
                        aria-label={`Increase ${habit.name}`}
                        className="w-10 h-10 rounded-xl bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] flex items-center justify-center hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
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
                            ? 'bg-[#4A6B53] dark:bg-[#4E7559] border-[#4A6B53] dark:border-[#4E7559] text-[#FFFDF9] hover:bg-[#3B5743] dark:hover:bg-[#3F6049]'
                            : 'bg-[#FFFDF9] dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E] hover:text-[#800020] dark:hover:text-[#D4A85E]'
                        }`}
                      >
                        {isMet ? 'Blooming' : 'Complete'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-[#EFE9E0] dark:bg-[#2A2825] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isMet ? 'bg-[#4A6B53] dark:bg-[#8AB896]' : 'bg-[#B5853B] dark:bg-[#C89B54]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#EFE9E0] dark:border-[#2A2825]">
                  <div className="flex items-center justify-between text-xs text-[#6E6359] dark:text-[#A69E94] mb-2.5">
                    <span>Weekly check-ins</span>
                    <span className="font-mono tabular-nums">{pct}% today</span>
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
                            isFuture ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#F8F5F0] dark:hover:bg-[#262523]'
                          }`}
                        >
                          <span
                            className={`text-[11px] font-medium ${
                              isToday ? 'text-[#800020] dark:text-[#D4A85E] font-semibold' : 'text-[#6E6359] dark:text-[#A69E94]'
                            }`}
                          >
                            {dayLabel}
                          </span>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                              done
                                ? 'bg-[#4A6B53] dark:bg-[#4E7559] border-[#4A6B53] dark:border-[#4E7559] text-[#FFFDF9]'
                                : isToday
                                  ? 'border-[#800020] dark:border-[#D4A85E] bg-[#FAF3F1] dark:bg-[#262320]'
                                  : 'border-[#D8CFC3] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#161616]'
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
      )}

      {/* Plant New Habit Modal */}
      <ModalShell
        open={plantOpen}
        onClose={() => setPlantOpen(false)}
        title="Plant a New Habit"
        subtitle="Each habit grows its own botanical illustration as you check in daily."
        titleId="habit-modal-title"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handlePlantHabit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="habit-name" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
              Habit Name
            </label>
            <input
              id="habit-name"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="e.g., Meditation, Journal, Skincare, Walk"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="habit-target" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                Daily Goal
              </label>
              <input
                id="habit-target"
                type="number"
                min={1}
                max={500}
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA]"
              />
            </div>
            <div>
              <label htmlFor="habit-step" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                Step Size
              </label>
              <input
                id="habit-step"
                type="number"
                min={1}
                max={100}
                value={newStep}
                onChange={(e) => setNewStep(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA]"
              />
            </div>
            <div>
              <label htmlFor="habit-unit" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                Unit
              </label>
              <input
                id="habit-unit"
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="min, pages..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA]"
              />
            </div>
          </div>

          <div>
            <p className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-2">
              Choose Botanical Species
            </p>
            <div className="grid grid-cols-5 gap-2">
              {PLANT_OPTIONS.map((opt) => {
                const active = newPlantStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewPlantStyle(opt.value)}
                    title={opt.label}
                    className={`rounded-xl border p-1.5 flex flex-col items-center gap-1 transition-colors ${
                      active
                        ? 'border-[#800020] dark:border-[#D4A85E] bg-[#FAF3F1] dark:bg-[#262320]'
                        : 'border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/60 dark:bg-[#161616]'
                    }`}
                  >
                    <div className="w-12 h-12 overflow-hidden flex items-center justify-center">
                      <div className="scale-50 origin-center">
                        <HabitGardenPlant habitKey={opt.value} plantStyle={opt.value} progressPct={100} />
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#292522] dark:text-[#F3EFEA] truncate max-w-full">
                      {opt.label.split(' ').pop()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {formError && <p className="text-xs text-[#800020] dark:text-[#E58A9B]">{formError}</p>}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPlantOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
            >
              Plant Habit
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
