import { useMemo, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Compass,
  Feather,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import welcomeBotanicalImg from '../assets/images/journal_welcome_botanical_1795077522201.jpg';
import affirmationCamelliaImg from '../assets/images/affirmation_botanical_emblem_1795077522205.jpg';
import {
  MOTIVATIONAL_QUOTES,
  WEEK_DAYS,
  formatTime12h,
  getOffsetDateISO,
  getTodayDateISO,
  getTodayWeekday,
  getTodayWeekdayIndex,
} from '../data/sampleData';
import { computeHabitStreak } from '../hooks/useMyDayStore';
import { useCompanionStore } from '../hooks/useCompanionStore';
import {
  HabitGardenPlant,
  getGrowthStageLabel,
  getPlantSpecies,
} from './HabitGardenPlant';
import type {
  AppTab,
  Habit,
  HabitKey,
  MoodKey,
  Note,
  Priority,
  RoutineItem,
  Task,
  TaskCategory,
  ToastItem,
} from '../types';

interface DashboardProps {
  tasks: Task[];
  routine: RoutineItem[];
  habits: Habit[];
  notes: Note[];
  showGuide: boolean;
  onDismissGuide: () => void;
  onQuickAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onToggleRoutine: (id: string) => void;
  onAdjustHabit: (key: HabitKey, delta: number) => void;
  onSetHabitValue: (key: HabitKey, value: number) => void;
  onAddNote: (input: Omit<Note, 'id' | 'updatedAt'>) => void;
  onNotify?: (message: string, tone?: ToastItem['tone']) => void;
  onNavigate: (tab: AppTab) => void;
}

type DashboardTaskFilter = 'All' | 'Pending' | 'Completed';

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
const CATEGORIES: TaskCategory[] = [
  'Personal',
  'Study',
  'UX Design',
  'Career',
  'Home',
  'Health',
];
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const MOOD_OPTIONS: Array<{
  key: MoodKey;
  emoji: string;
  label: string;
  response: string;
}> = [
  {
    key: 'calm',
    emoji: '😌',
    label: 'Calm',
    response: 'A steady, grounded mind makes room for thoughtful progress.',
  },
  {
    key: 'inspired',
    emoji: '✨',
    label: 'Inspired',
    response: 'Channel this creative spark into one meaningful block today.',
  },
  {
    key: 'focused',
    emoji: '🎯',
    label: 'Focused',
    response: 'Great energy for deep study, UX craft, or clearing priorities.',
  },
  {
    key: 'reflective',
    emoji: '💭',
    label: 'Reflective',
    response: 'Slow mornings and honest notes often bring the clearest answers.',
  },
  {
    key: 'tired',
    emoji: '😴',
    label: 'Tired',
    response: 'Go gently today—keep only what truly matters and protect your rest.',
  },
  {
    key: 'overwhelmed',
    emoji: '😣',
    label: 'Stressed',
    response: 'Take one small step at a time. Checking off just one task is enough.',
  },
];

const JOURNAL_PROMPTS: string[] = [
  'What deserves your gentle, unhurried focus today?',
  'What is one small win from the last 24 hours worth celebrating?',
  'If today felt calm and fulfilling by evening, what would have happened?',
  'What thought or worry can you set down on paper right now?',
  'What did you learn or practice recently that made you feel proud?',
];

const DAILY_CHALLENGES: Array<{
  title: string;
  duration: string;
  description: string;
}> = [
  {
    title: 'Screen-Free First 20 Minutes',
    duration: '20 min · Mindful Morning',
    description:
      'Step away from feeds and notifications while waking up, hydrating, or having breakfast.',
  },
  {
    title: 'Three Quiet Wins Before Dinner',
    duration: '5 min · Evening Clarity',
    description:
      'Write down three things you moved forward today—even small steps count equally.',
  },
  {
    title: '15-Minute Desk & Space Reset',
    duration: '15 min · Calm Environment',
    description:
      'Clear your workspace, refill your water glass, and start your next focus block fresh.',
  },
  {
    title: 'Single-Tab Deep Focus Session',
    duration: '25 min · Craft & Study',
    description:
      'Pick your most important task and work with only one window open until the block finishes.',
  },
  {
    title: 'Kind Note to Future Tomorrow-You',
    duration: '3 min · Self-Compassion',
    description:
      'Leave a short encouraging note or pick tomorrow’s single top priority before winding down.',
  },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMomentumPhrase(pct: number): string {
  if (pct >= 90) return 'Beautifully complete';
  if (pct >= 65) return 'Strong steady flow';
  if (pct >= 35) return 'Warm momentum';
  if (pct > 0) return 'Gentle start';
  return 'Fresh page ready';
}

function getPriorityTextClass(priority: Priority): string {
  if (priority === 'High') return 'text-[#800020] font-medium';
  return 'text-[#6E6359]';
}

export function Dashboard({
  tasks,
  routine,
  habits,
  notes,
  showGuide,
  onDismissGuide,
  onQuickAddTask,
  onToggleTask,
  onDeleteTask,
  onToggleRoutine,
  onAdjustHabit,
  onSetHabitValue,
  onAddNote,
  onNotify,
  onNavigate,
}: DashboardProps) {
  const {
    companion,
    setMoodForToday,
    setMoodNoteForToday,
    setJournalDraft,
    saveJournalEntry,
    toggleTodayChallenge,
    cycleChallenge,
  } = useCompanionStore();

  const [quoteIdx, setQuoteIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [taskFilter, setTaskFilter] = useState<DashboardTaskFilter>('All');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('10:00');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('Medium');
  const [quickTaskCategory, setQuickTaskCategory] = useState<TaskCategory>('Personal');
  const [moodNoteDraft, setMoodNoteDraft] = useState<string | null>(null);
  const [welcomeImgFailed, setWelcomeImgFailed] = useState(false);
  const [emblemImgFailed, setEmblemImgFailed] = useState(false);

  const journalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const journalSectionRef = useRef<HTMLElement | null>(null);
  const gardenSectionRef = useRef<HTMLElement | null>(null);
  const tasksSectionRef = useRef<HTMLElement | null>(null);

  const todayISO = getTodayDateISO();
  const todayDay = getTodayWeekday();
  const todayIdx = getTodayWeekdayIndex();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // --- Tasks metrics ---
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.day === todayDay)
        .sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.time || '99:99').localeCompare(b.time || '99:99');
        }),
    [tasks, todayDay],
  );

  const filteredTodayTasks = useMemo(() => {
    if (taskFilter === 'Pending') return todayTasks.filter((t) => !t.completed);
    if (taskFilter === 'Completed') return todayTasks.filter((t) => t.completed);
    return todayTasks;
  }, [todayTasks, taskFilter]);

  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTasks = todayTasks.length - completedTasks;
  const highPriorityPending = todayTasks.filter(
    (t) => !t.completed && t.priority === 'High',
  ).length;
  const tasksPct =
    todayTasks.length === 0 ? 0 : Math.round((completedTasks / todayTasks.length) * 100);

  // --- Routine metrics ---
  const sortedRoutine = useMemo(
    () => [...routine].sort((a, b) => a.time.localeCompare(b.time)),
    [routine],
  );
  const completedRoutine = routine.filter((r) => r.completed).length;
  const remainingRoutine = routine.length - completedRoutine;
  const routinePct =
    routine.length === 0 ? 0 : Math.round((completedRoutine / routine.length) * 100);
  const nextRoutineItem = sortedRoutine.find((r) => !r.completed) || null;
  const upcomingRoutine = useMemo(() => {
    const pending = sortedRoutine.filter((r) => !r.completed);
    return (pending.length > 0 ? pending : sortedRoutine).slice(0, 6);
  }, [sortedRoutine]);

  // --- Habit Garden metrics ---
  const habitsMetToday = habits.filter((h) => h.todayValue >= h.targetValue).length;
  const habitsPct =
    habits.length === 0 ? 0 : Math.round((habitsMetToday / habits.length) * 100);

  const bestStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, computeHabitStreak(h.weeklyHistory)), 0),
    [habits],
  );

  const activeDaysInWeek = todayIdx + 1;
  const totalPossibleHabitCheckIns = habits.length * activeDaysInWeek;
  const completedHabitCheckIns = habits.reduce(
    (sum, h) => sum + h.weeklyHistory.slice(0, activeDaysInWeek).filter(Boolean).length,
    0,
  );
  const weeklyHabitConsistency =
    totalPossibleHabitCheckIns === 0
      ? 0
      : Math.round((completedHabitCheckIns / totalPossibleHabitCheckIns) * 100);

  const habitByDayRates = useMemo(
    () =>
      WEEK_DAYS.map((day, idx) => {
        const metCount = habits.filter((h) => h.weeklyHistory[idx]).length;
        const pct = habits.length === 0 ? 0 : Math.round((metCount / habits.length) * 100);
        return { day, idx, metCount, pct };
      }),
    [habits],
  );

  // --- Overall Daily Progress (Tasks + Routine + Habits) ---
  const totalDailyPillars = todayTasks.length + routine.length + habits.length;
  const completedDailyPillars = completedTasks + completedRoutine + habitsMetToday;
  const overallProgressPct =
    totalDailyPillars === 0
      ? 0
      : Math.round((completedDailyPillars / totalDailyPillars) * 100);

  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (overallProgressPct / 100) * ringCircumference;

  // --- Weekly Tasks ---
  const weeklyCompleted = tasks.filter((t) => t.completed).length;
  const weeklyTotal = tasks.length;
  const weeklyPct =
    weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);

  // --- Mood & Companion ---
  const todayMoodEntry = companion.moods[todayISO];
  const selectedMoodObj =
    MOOD_OPTIONS.find((m) => m.key === todayMoodEntry?.mood) ?? null;

  const recentMoodRibbon = useMemo(() => {
    return [-6, -5, -4, -3, -2, -1, 0].map((offset) => {
      const iso = getOffsetDateISO(offset);
      const entry = companion.moods[iso];
      const moodMeta = MOOD_OPTIONS.find((m) => m.key === entry?.mood);
      const dayLabel = new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'narrow',
      });
      return { iso, dayLabel, moodMeta, isToday: offset === 0 };
    });
  }, [companion.moods]);

  const quote = MOTIVATIONAL_QUOTES[quoteIdx % MOTIVATIONAL_QUOTES.length];
  const currentPrompt = JOURNAL_PROMPTS[promptIdx % JOURNAL_PROMPTS.length];

  // Daily Challenge
  const daySeed = new Date().getDate() + companion.challengeOffset;
  const todayChallenge = DAILY_CHALLENGES[daySeed % DAILY_CHALLENGES.length];
  const isChallengeDoneToday = companion.completedChallengeDates.includes(todayISO);

  const journalCheckInsCount = companion.journalEntries.length + Object.keys(companion.moods).length;

  // --- Handlers ---
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onQuickAddTask({
      title: quickTaskTitle.trim(),
      time: quickTaskTime || '10:00',
      deadline: todayISO,
      priority: quickTaskPriority,
      category: quickTaskCategory,
      day: todayDay,
    });
    setQuickTaskTitle('');
  };

  const handleToggleTaskWithFeedback = (task: Task) => {
    const willComplete = !task.completed;
    onToggleTask(task.id);
    if (willComplete) {
      onNotify?.(`Completed "${task.title}".`, 'success');
    }
  };

  const handleToggleRoutineWithFeedback = (item: RoutineItem) => {
    const willComplete = !item.completed;
    onToggleRoutine(item.id);
    if (willComplete) {
      onNotify?.(`Checked off ${item.title}.`, 'success');
    }
  };

  const handleSelectMood = (moodKey: MoodKey, label: string) => {
    setMoodForToday(moodKey);
    onNotify?.(`Mood checked in: ${label}.`, 'success');
  };

  const handleSaveMoodNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (moodNoteDraft === null) return;
    setMoodNoteForToday(moodNoteDraft.trim());
    setMoodNoteDraft(null);
    onNotify?.('Mood reflection saved.', 'success');
  };

  const handleReflectOnAffirmation = () => {
    const starterTitle = `Reflection: ${quote.author}`;
    const starterBody = companion.journalDraftContent.trim()
      ? `${companion.journalDraftContent}\n\n"${quote.text}" — `
      : `"${quote.text}"\n\nWhat this brings up for me today: `;
    setJournalDraft(companion.journalDraftTitle || starterTitle, starterBody);
    journalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => journalTextareaRef.current?.focus(), 350);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveJournalEntry(
      companion.journalDraftTitle,
      companion.journalDraftContent,
      currentPrompt,
    );
    if (!saved) return;
    onAddNote({
      title: saved.title,
      content: `${saved.content}\n\nPrompt: ${saved.prompt}`,
      category: 'Personal',
      completed: false,
    });
  };

  const handleToggleChallenge = () => {
    const completed = toggleTodayChallenge();
    onNotify?.(
      completed
        ? `Challenge completed: ${todayChallenge.title}`
        : 'Challenge marked as in progress.',
      completed ? 'success' : 'info',
    );
  };

  const handleHabitIncrement = (habit: Habit) => {
    const willReachGoal =
      habit.todayValue < habit.targetValue &&
      habit.todayValue + habit.step >= habit.targetValue;
    onAdjustHabit(habit.key, habit.step);
    if (willReachGoal) {
      onNotify?.(`${getPlantSpecies(habit.key)} (${habit.name}) is now in full bloom!`, 'success');
    }
  };

  const handleHabitBloomToggle = (habit: Habit) => {
    const isMet = habit.todayValue >= habit.targetValue;
    onSetHabitValue(habit.key, isMet ? 0 : habit.targetValue);
    if (!isMet) {
      onNotify?.(`${getPlantSpecies(habit.key)} (${habit.name}) reached full bloom!`, 'success');
    }
  };

  const visibleTodayTasks = filteredTodayTasks.slice(0, 6);

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-8">
        {/* 1. Editorial Magazine Welcome Spread */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          aria-label="Welcome"
          className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] overflow-hidden shadow-[0_2px_12px_rgba(41,37,34,0.04)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#800020]">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formattedDate}</span>
                  <span aria-hidden="true" className="text-[#CBBFB2]">·</span>
                  <span className="text-[#6E6359]">Daily Journal &amp; Planner</span>
                </p>

                <h1 className="mt-3 text-3xl sm:text-[40px] font-medium tracking-[-0.02em] leading-[1.12] text-[#292522] text-balance">
                  {getTimeGreeting()}, welcome back to your quiet space.
                </h1>

                <p className="mt-3.5 text-sm sm:text-[15px] text-[#5C534D] leading-relaxed max-w-xl">
                  {pendingTasks > 0
                    ? `You have ${pendingTasks} pending ${pendingTasks === 1 ? 'task' : 'tasks'} for ${todayDay}`
                    : `All ${todayDay} tasks are checked off`}
                  {nextRoutineItem
                    ? `, with ${nextRoutineItem.title.toLowerCase()} coming up at ${formatTime12h(nextRoutineItem.time)}.`
                    : ', and today’s routine timetable is complete.'}{' '}
                  {habitsMetToday > 0
                    ? `${habitsMetToday} of ${habits.length} plants are blooming in your habit garden.`
                    : 'Your habit garden is waiting for its first gentle step.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('todos')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] transition-colors shadow-[0_1px_3px_rgba(128,0,32,0.22)] whitespace-nowrap shrink-0"
                >
                  <span>Plan Today&apos;s Tasks</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('routine')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E8E1D7] bg-[#F8F5F0] text-[#292522] hover:border-[#A69A8D] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Open Routine</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    journalSectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6E6359] hover:text-[#800020] transition-colors whitespace-nowrap shrink-0"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Write in Journal</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-[#F3ECE2] border-t lg:border-t-0 lg:border-l border-[#E8E1D7]">
              {!welcomeImgFailed ? (
                <img
                  src={welcomeBotanicalImg}
                  alt="Open linen journal with pressed sage and burgundy botanical sprigs on cream paper"
                  referrerPolicy="no-referrer"
                  onError={() => setWelcomeImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#FBF4F2] to-[#EFE6DA]">
                  <BookOpen className="w-8 h-8 text-[#800020]" />
                  <p className="mt-2 font-display text-lg text-[#292522]">My Day Journal</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Preserved Dismissible Quick Guide */}
        {showGuide && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.03, ease: EASE_OUT }}
            aria-label="How My Day works"
            className="rounded-2xl bg-[#FFFDF9] border border-[#E8E1D7] p-5 sm:p-6 shadow-[0_1px_3px_rgba(41,37,34,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-sans text-[15px] font-semibold text-[#292522]">
                  How My Day works
                </h2>
                <p className="mt-0.5 text-xs text-[#6E6359]">
                  Everything saves automatically in your browser—tap to check off, write, or grow your garden.
                </p>
              </div>
              <button
                type="button"
                onClick={onDismissGuide}
                aria-label="Dismiss guide"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] hover:text-[#292522] hover:bg-[#F8F5F0] transition-colors shrink-0 whitespace-nowrap"
              >
                <span>Got it</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-left rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] p-4 hover:border-[#800020]/35 transition-colors"
              >
                <p className="text-xs font-semibold text-[#800020]">1. Follow your Routine</p>
                <p className="mt-1 text-xs text-[#5C534D] leading-relaxed">
                  Tap any block in your 9 AM – 10:30 PM timetable to mark it done or edit the time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('todos')}
                className="text-left rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] p-4 hover:border-[#800020]/35 transition-colors"
              >
                <p className="text-xs font-semibold text-[#800020]">2. Add To-Dos Anywhere</p>
                <p className="mt-1 text-xs text-[#5C534D] leading-relaxed">
                  Tasks added here or in To-Do List stay synced across your Weekly Planner.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  gardenSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }
                className="text-left rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] p-4 hover:border-[#800020]/35 transition-colors"
              >
                <p className="text-xs font-semibold text-[#800020]">3. Grow Your Habit Garden</p>
                <p className="mt-1 text-xs text-[#5C534D] leading-relaxed">
                  Log Water, Exercise, Studying, Reading, and English Practice to bloom each plant.
                </p>
              </button>
            </div>
          </motion.section>
        )}

        {/* 2 & 3. Editorial Duo: Daily Affirmation + Interactive Mood Check-In */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Daily Affirmation Card */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: EASE_OUT }}
            aria-label="Daily Affirmation"
            className="lg:col-span-5 rounded-3xl bg-[#FAF3F1] border border-[#EAD9D8] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[0_1px_4px_rgba(128,0,32,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#800020]">
                  Daily Affirmation
                </p>
                <p className="mt-0.5 text-xs text-[#6E6359]">{quote.author}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#EAD9D8] bg-[#FFFDF9] shrink-0">
                {!emblemImgFailed ? (
                  <img
                    src={affirmationCamelliaImg}
                    alt="Watercolor burgundy camellia flower illustration"
                    referrerPolicy="no-referrer"
                    onError={() => setEmblemImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#800020]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            <blockquote className="font-display italic text-xl sm:text-[22px] text-[#292522] leading-[1.45]">
              &ldquo;{quote.text}&rdquo;
            </blockquote>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EAD9D8]">
              <button
                type="button"
                onClick={handleReflectOnAffirmation}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#800020] hover:underline whitespace-nowrap"
              >
                <Feather className="w-3.5 h-3.5" />
                <span>Reflect in journal</span>
              </button>

              <button
                type="button"
                onClick={() => setQuoteIdx((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#5C534D] bg-[#FFFDF9] border border-[#E8D8D8] hover:text-[#292522] hover:border-[#CBBFB2] transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New affirmation</span>
              </button>
            </div>
          </motion.section>

          {/* Interactive Mood Check-In */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: EASE_OUT }}
            aria-label="Mood Check-In"
            className="lg:col-span-7 rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[0_1px_4px_rgba(41,37,34,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-medium text-[#292522]">
                  How does today feel?
                </h2>
                <p className="mt-1 text-xs text-[#6E6359]">
                  {selectedMoodObj
                    ? `Checked in as ${selectedMoodObj.label} today · Saved automatically`
                    : 'Tap an expression to check in with yourself'}
                </p>
              </div>

              {/* 7-day Mood Ribbon */}
              <div
                aria-label="7-day mood history"
                className="flex items-center gap-1.5"
              >
                {recentMoodRibbon.map((slot) => (
                  <div
                    key={slot.iso}
                    title={
                      slot.moodMeta
                        ? `${slot.iso}: ${slot.moodMeta.label}`
                        : `${slot.iso}: Not logged`
                    }
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border ${
                        slot.moodMeta
                          ? 'bg-[#FAF3F1] border-[#E8D0D4]'
                          : slot.isToday
                            ? 'border-[#800020]/40 border-dashed bg-[#F8F5F0]'
                            : 'border-[#E8E1D7] bg-[#F8F5F0]/60'
                      }`}
                    >
                      {slot.moodMeta ? slot.moodMeta.emoji : ''}
                    </span>
                    <span
                      className={`text-[10px] ${
                        slot.isToday ? 'font-semibold text-[#800020]' : 'text-[#6E6359]'
                      }`}
                    >
                      {slot.dayLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expressive Emoji Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {MOOD_OPTIONS.map((option) => {
                const active = todayMoodEntry?.mood === option.key;
                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.14 }}
                    onClick={() => handleSelectMood(option.key, option.label)}
                    aria-pressed={active}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border transition-colors min-h-[76px] ${
                      active
                        ? 'bg-[#FAF3F1] border-[#800020] shadow-[0_2px_10px_rgba(128,0,32,0.1)]'
                        : 'bg-[#F8F5F0]/75 border-[#E8E1D7] hover:border-[#CBBFB2] hover:bg-[#FFFDF9]'
                    }`}
                  >
                    <span className="text-2xl leading-none" role="img" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        active ? 'text-[#800020]' : 'text-[#4F4740]'
                      }`}
                    >
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Empathetic Response + Optional Mood Note */}
            <div className="pt-3 border-t border-[#EFE9E0]">
              {selectedMoodObj ? (
                <div className="space-y-2.5">
                  <p className="text-xs sm:text-sm text-[#4F4740] leading-relaxed">
                    {selectedMoodObj.response}
                  </p>

                  {moodNoteDraft !== null ? (
                    <form onSubmit={handleSaveMoodNote} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={moodNoteDraft}
                        onChange={(e) => setMoodNoteDraft(e.target.value)}
                        placeholder="Add a brief note about how you feel..."
                        aria-label="Mood check-in note"
                        className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] text-xs text-[#292522] focus:outline-none focus:border-[#800020]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setMoodNoteDraft(null)}
                        className="px-2.5 py-1.5 rounded-xl text-xs text-[#6E6359] hover:text-[#292522]"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-[#6E6359] italic truncate">
                        {todayMoodEntry?.note
                          ? `Note: "${todayMoodEntry.note}"`
                          : 'Want to jot down why you feel this way?'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setMoodNoteDraft(todayMoodEntry?.note || '')}
                        className="text-xs font-medium text-[#800020] hover:underline whitespace-nowrap shrink-0"
                      >
                        {todayMoodEntry?.note ? 'Edit note' : 'Add note'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6E6359]">
                  Checking in takes two seconds and builds a gentle 7-day emotional pattern above.
                </p>
              )}
            </div>
          </motion.section>
        </div>

        {/* 4. Visually Beautiful Daily Progress Tracker */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: EASE_OUT }}
          aria-label="Daily Progress Tracker"
          className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-6 sm:p-7 shadow-[0_1px_4px_rgba(41,37,34,0.04)]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-5 shrink-0">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="#EFE9E0"
                    strokeWidth="6.5"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="#800020"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <span className="absolute font-mono text-lg font-semibold text-[#292522] tabular-nums">
                  {overallProgressPct}%
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-[#800020]">
                  {getMomentumPhrase(overallProgressPct)}
                </p>
                <h2 className="mt-0.5 text-xl font-medium text-[#292522]">
                  Today&apos;s Rhythm
                </h2>
                <p className="mt-1 text-xs text-[#6E6359] tabular-nums">
                  {completedDailyPillars} of {totalDailyPillars} tasks, routine blocks &amp; habits completed
                </p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#EFE9E0] lg:pl-8">
              <button
                type="button"
                onClick={() => {
                  setTaskFilter('Pending');
                  tasksSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }}
                className="text-left rounded-2xl bg-[#F8F5F0]/80 hover:bg-[#F8F5F0] p-3.5 transition-colors"
              >
                <p className="text-xs text-[#6E6359]">Pending Tasks</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#800020] tabular-nums">
                  {pendingTasks}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6E6359] tabular-nums">
                  {highPriorityPending > 0
                    ? `${highPriorityPending} high priority`
                    : `${todayDay} focus`}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskFilter('Completed');
                  tasksSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }}
                className="text-left rounded-2xl bg-[#F8F5F0]/80 hover:bg-[#F8F5F0] p-3.5 transition-colors"
              >
                <p className="text-xs text-[#6E6359]">Completed Tasks</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#292522] tabular-nums">
                  {completedTasks}
                  <span className="text-sm font-normal text-[#A69A8D]">/{todayTasks.length}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#6E6359] tabular-nums">
                  {tasksPct}% done
                </p>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-left rounded-2xl bg-[#F8F5F0]/80 hover:bg-[#F8F5F0] p-3.5 transition-colors"
              >
                <p className="text-xs text-[#6E6359]">Routine Flow</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#292522] tabular-nums">
                  {completedRoutine}
                  <span className="text-sm font-normal text-[#A69A8D]">/{routine.length}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#6E6359] tabular-nums">
                  {routinePct}% complete
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  gardenSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }
                className="text-left rounded-2xl bg-[#F8F5F0]/80 hover:bg-[#F8F5F0] p-3.5 transition-colors"
              >
                <p className="text-xs text-[#6E6359]">Garden Blooms</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#2D6A4F] tabular-nums">
                  {habitsMetToday}
                  <span className="text-sm font-normal text-[#A69A8D]">/{habits.length}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-[#6E6359] tabular-nums">
                  {habitsPct}% blooming
                </p>
              </button>
            </div>
          </div>
        </motion.section>

        {/* 5. Daily Schedule & Task Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Today's Tasks (7 cols) */}
          <motion.section
            ref={tasksSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease: EASE_OUT }}
            aria-label="Today's Tasks"
            className="lg:col-span-7 space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3 min-h-[46px]">
              <div>
                <h2 className="text-2xl font-medium text-[#292522]">
                  Today&apos;s Intentions
                </h2>
                <p className="mt-0.5 text-xs text-[#6E6359] tabular-nums">
                  {pendingTasks} pending
                  <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                  {completedTasks} completed
                  <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                  {todayDay}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  role="tablist"
                  aria-label="Filter today's tasks"
                  className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-[#EFE9E0]/90 border border-[#E8E1D7]"
                >
                  {(['All', 'Pending', 'Completed'] as DashboardTaskFilter[]).map((tab) => {
                    const active = taskFilter === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTaskFilter(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#FFFDF9] text-[#292522] shadow-[0_1px_2px_rgba(41,37,34,0.08)]'
                            : 'text-[#6E6359] hover:text-[#292522]'
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('todos')}
                  className="text-xs font-medium text-[#800020] hover:underline whitespace-nowrap shrink-0"
                >
                  Manage all
                </button>
              </div>
            </div>

            {/* Quick-Add Task Composer */}
            <form
              onSubmit={handleQuickTaskSubmit}
              className="rounded-2xl bg-[#FFFDF9] border border-[#E8E1D7] p-3.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] focus-within:border-[#A69A8D] transition-colors space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder={`Add a task or intention for ${todayDay}...`}
                  aria-label="Quick add task for today"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] text-sm text-[#292522] placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  aria-label="Add quick task"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] disabled:opacity-40 transition-colors shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={quickTaskTime}
                  onChange={(e) => setQuickTaskTime(e.target.value)}
                  aria-label="Task time"
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8F5F0] border border-[#E8E1D7] text-xs font-mono text-[#292522] focus:outline-none focus:border-[#800020]"
                />
                <select
                  value={quickTaskCategory}
                  onChange={(e) => setQuickTaskCategory(e.target.value as TaskCategory)}
                  aria-label="Task category"
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8F5F0] border border-[#E8E1D7] text-xs text-[#292522] focus:outline-none focus:border-[#800020]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={quickTaskPriority}
                  onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                  aria-label="Task priority"
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8F5F0] border border-[#E8E1D7] text-xs text-[#292522] focus:outline-none focus:border-[#800020]"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} priority
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {/* Task Cards */}
            {visibleTodayTasks.length === 0 ? (
              <div className="rounded-2xl bg-[#FFFDF9] border border-[#E8E1D7] px-6 py-10 text-center shadow-[0_1px_3px_rgba(41,37,34,0.04)]">
                <p className="text-sm font-medium text-[#292522]">
                  {todayTasks.length === 0
                    ? `No tasks scheduled for ${todayDay} yet.`
                    : taskFilter === 'Pending'
                      ? 'Everything on today’s list is complete.'
                      : 'No completed tasks yet today.'}
                </p>
                <p className="mt-1 text-xs text-[#6E6359]">
                  {todayTasks.length === 0
                    ? 'Add your first gentle priority above.'
                    : taskFilter === 'Pending'
                      ? 'Take a moment to appreciate what you finished.'
                      : 'Check off any task to celebrate it here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleTodayTasks.map((task) => (
                  <article
                    key={task.id}
                    className={`group rounded-2xl border px-4 py-3.5 transition-all duration-150 flex items-start justify-between gap-3 ${
                      task.completed
                        ? 'bg-[#FFFDF9]/70 border-[#EAE3D9]'
                        : 'bg-[#FFFDF9] border-[#E8E1D7] shadow-[0_1px_2px_rgba(41,37,34,0.03)] hover:border-[#CBBFB2] hover:shadow-[0_4px_14px_rgba(41,37,34,0.06)] hover:-translate-y-[1px]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTaskWithFeedback(task)}
                      aria-label={
                        task.completed
                          ? `Mark "${task.title}" incomplete`
                          : `Complete "${task.title}"`
                      }
                      className="flex items-start gap-3.5 min-w-0 flex-1 text-left py-0.5"
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          task.completed
                            ? 'bg-[#800020] border-[#800020] text-[#FFFDF9]'
                            : 'border-[#CFC5B8] bg-[#FFFDF9] group-hover:border-[#800020]'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm sm:text-[15px] font-medium leading-snug ${
                            task.completed ? 'line-through text-[#8C8278]' : 'text-[#292522]'
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.notes && (
                          <p
                            className={`mt-1 text-xs leading-relaxed ${
                              task.completed ? 'text-[#A69A8D]' : 'text-[#6E6359]'
                            }`}
                          >
                            {task.notes}
                          </p>
                        )}

                        <p
                          className={`mt-1.5 text-xs tabular-nums ${
                            task.completed ? 'text-[#8C8278]' : 'text-[#6E6359]'
                          }`}
                        >
                          <span className="font-mono">{formatTime12h(task.time)}</span>
                          <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                          <span>{task.category}</span>
                          <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                          <span
                            className={
                              task.completed ? 'text-[#8C8278]' : getPriorityTextClass(task.priority)
                            }
                          >
                            {task.priority} priority
                          </span>
                        </p>
                      </div>
                    </button>

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={`Delete "${task.title}"`}
                        className="p-2 rounded-lg text-[#A69A8D] hover:text-[#800020] hover:bg-[#F8F5F0] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </article>
                ))}

                {filteredTodayTasks.length > 6 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('todos')}
                    className="w-full py-2.5 rounded-xl text-xs font-medium text-[#6E6359] hover:text-[#800020] hover:bg-[#FFFDF9] border border-transparent hover:border-[#E8E1D7] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>
                      View all {filteredTodayTasks.length}{' '}
                      {taskFilter === 'All' ? '' : `${taskFilter.toLowerCase()} `}tasks
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </motion.section>

          {/* Daily Schedule Timeline (5 cols) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14, ease: EASE_OUT }}
            aria-label="Daily Schedule Timeline"
            className="lg:col-span-5 space-y-4"
          >
            <div className="flex items-end justify-between gap-3 min-h-[46px]">
              <div>
                <h2 className="text-2xl font-medium text-[#292522]">
                  Daily Timeline
                </h2>
                <p className="mt-0.5 text-xs text-[#6E6359] tabular-nums">
                  {remainingRoutine > 0
                    ? `${remainingRoutine} ${remainingRoutine === 1 ? 'block' : 'blocks'} ahead today`
                    : 'All routine blocks finished'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="text-xs font-medium text-[#800020] hover:underline whitespace-nowrap shrink-0"
              >
                Customize
              </button>
            </div>

            <div className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-5 shadow-[0_1px_4px_rgba(41,37,34,0.04)]">
              {upcomingRoutine.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#6E6359]">No routine blocks scheduled yet.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('routine')}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#800020] hover:underline"
                  >
                    <span>Open Daily Routine</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  {upcomingRoutine.map((item, idx) => {
                    const isUpNext = nextRoutineItem?.id === item.id;
                    const isLast = idx === upcomingRoutine.length - 1;
                    return (
                      <div key={item.id} className="relative flex">
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[19px] top-8 -bottom-3 w-px bg-[#E8E1D7]"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleRoutineWithFeedback(item)}
                          aria-label={
                            item.completed
                              ? `Mark "${item.title}" incomplete`
                              : `Complete "${item.title}"`
                          }
                          className={`w-full flex items-start gap-3.5 text-left rounded-xl px-2.5 py-2.5 group transition-colors duration-150 ${
                            isUpNext ? 'bg-[#FAF3F1]/80' : 'hover:bg-[#F8F5F0]/75'
                          }`}
                        >
                          <span
                            className={`relative z-10 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              item.completed
                                ? 'bg-[#800020] border-[#800020] text-[#FFFDF9]'
                                : isUpNext
                                  ? 'border-[#800020] bg-[#FFFDF9] ring-3 ring-[#800020]/10'
                                  : 'border-[#CFC5B8] bg-[#FFFDF9] group-hover:border-[#800020]'
                            }`}
                          >
                            {item.completed && <Check className="w-3 h-3" />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`font-mono text-xs font-medium tabular-nums ${
                                  item.completed
                                    ? 'text-[#8C8278]'
                                    : isUpNext
                                      ? 'text-[#800020]'
                                      : 'text-[#6E6359]'
                                }`}
                              >
                                {formatTime12h(item.time)}
                              </span>
                              {isUpNext && (
                                <span className="text-[11px] font-medium text-[#800020] shrink-0">
                                  Up next
                                </span>
                              )}
                            </div>

                            <p
                              className={`mt-0.5 text-sm font-medium leading-snug ${
                                item.completed ? 'line-through text-[#8C8278]' : 'text-[#292522]'
                              }`}
                            >
                              {item.title}
                            </p>

                            <p
                              className={`mt-0.5 text-xs truncate ${
                                item.completed ? 'text-[#A69A8D]' : 'text-[#6E6359]'
                              }`}
                            >
                              <span>{item.category}</span>
                              {item.notes && (
                                <>
                                  <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                                  <span>{item.notes}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3.5 border-t border-[#EFE9E0] flex items-center justify-between">
                <span className="text-xs text-[#6E6359] tabular-nums">
                  {completedRoutine} of {routine.length} blocks done
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('routine')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#292522] hover:text-[#800020] transition-colors whitespace-nowrap"
                >
                  <span>Full timetable</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.section>
        </div>

        {/* 6. Habit Garden (Completing habits grows botanical plants) */}
        <motion.section
          ref={gardenSectionRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16, ease: EASE_OUT }}
          aria-label="Habit Garden"
          className="rounded-3xl bg-[#FBF9F5] border border-[#E4DDD2] p-6 sm:p-8 shadow-[0_1px_4px_rgba(41,37,34,0.04)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#EAE3D8]">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A6B53]">
                <Sprout className="w-3.5 h-3.5 shrink-0" />
                <span>Living Habit Garden · {habitsMetToday} of {habits.length} in bloom today</span>
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-[26px] font-medium text-[#292522]">
                Nurture your daily rituals
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#6E6359]">
                Every glass, minute, and page read helps each plant grow from seed to full bloom.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('habits')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#FFFDF9] border border-[#E4DDD2] text-[#292522] hover:border-[#A69A8D] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>Adjust goals &amp; history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {habits.map((habit) => {
              const pct = Math.min(
                100,
                Math.round((habit.todayValue / habit.targetValue) * 100),
              );
              const isMet = habit.todayValue >= habit.targetValue;
              const streak = computeHabitStreak(habit.weeklyHistory);
              const species = getPlantSpecies(habit.key);
              const stageLabel = getGrowthStageLabel(pct);

              return (
                <div
                  key={habit.key}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-200 ${
                    isMet
                      ? 'bg-[#FFFDF9] border-[#D7C3C6] shadow-[0_4px_14px_rgba(128,0,32,0.05)]'
                      : 'bg-[#FFFDF9] border-[#E8E1D7] hover:border-[#CBBFB2]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-sans text-sm font-semibold text-[#292522] truncate">
                          {habit.name}
                        </h3>
                        <p className="text-[11px] text-[#6E6359] truncate">
                          {species} · {stageLabel}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-[#6E6359] tabular-nums shrink-0">
                        {streak}d
                      </span>
                    </div>

                    <HabitGardenPlant habitKey={habit.key} progressPct={pct} />

                    <div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
                      <span className="font-mono font-semibold text-[#292522]">
                        {habit.todayValue}
                        <span className="font-normal text-[#6E6359]">
                          {' '}/ {habit.targetValue} {habit.unit}
                        </span>
                      </span>
                      <span
                        className={`font-mono text-[11px] ${
                          isMet ? 'text-[#4A6B53] font-medium' : 'text-[#6E6359]'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#EFE9E0] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMet ? 'bg-[#4A6B53]' : 'bg-[#800020]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Watering / Bloom Controls */}
                  <div className="pt-2 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAdjustHabit(habit.key, -habit.step)}
                        disabled={habit.todayValue <= 0}
                        aria-label={`Decrease ${habit.name}`}
                        className="w-8 h-8 rounded-lg border border-[#E8E1D7] bg-[#F8F5F0] flex items-center justify-center text-[#292522] hover:bg-[#EFE9E0] disabled:opacity-35 transition-colors shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHabitIncrement(habit)}
                        aria-label={`Increase ${habit.name}`}
                        className="w-8 h-8 rounded-lg bg-[#800020] text-[#FFFDF9] flex items-center justify-center hover:bg-[#66001A] transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHabitBloomToggle(habit)}
                        className={`flex-1 h-8 px-2 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap truncate ${
                          isMet
                            ? 'bg-[#4A6B53] border-[#4A6B53] text-[#FFFDF9] hover:bg-[#3B5743]'
                            : 'bg-[#FFFDF9] border-[#E8E1D7] text-[#292522] hover:border-[#800020] hover:text-[#800020]'
                        }`}
                      >
                        {isMet ? 'Blooming' : 'Complete'}
                      </button>
                    </div>

                    {/* 7-day leaf dots */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE3]">
                      {WEEK_DAYS.map((dayLbl, dIdx) => {
                        const done = habit.weeklyHistory[dIdx];
                        const isTodayCell = dIdx === todayIdx;
                        return (
                          <span
                            key={dayLbl}
                            title={`${dayLbl}: ${done ? 'Goal met' : 'Not met'}`}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              done
                                ? 'bg-[#4A6B53]'
                                : isTodayCell
                                  ? 'bg-[#800020]/25 ring-1 ring-[#800020]/50'
                                  : 'bg-[#E6DDD0]'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* 7 & 8. Daily Journal Preview + Small Daily Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Daily Journal Preview with Writing Interaction (7 cols) */}
          <motion.section
            ref={journalSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18, ease: EASE_OUT }}
            aria-label="Daily Journal"
            className="lg:col-span-7 rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[0_1px_4px_rgba(41,37,34,0.04)]"
          >
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#EFE9E0]">
                <div>
                  <p className="text-xs font-medium text-[#800020]">Daily Journal</p>
                  <h2 className="mt-0.5 text-2xl font-medium text-[#292522]">
                    A page for your thoughts
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPromptIdx((prev) => prev + 1)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6359] hover:text-[#292522] transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>New prompt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('notes')}
                    className="text-xs font-medium text-[#800020] hover:underline whitespace-nowrap"
                  >
                    Open Notes ({notes.length})
                  </button>
                </div>
              </div>

              <p className="mt-4 font-display italic text-sm sm:text-[15px] text-[#5C534D]">
                Prompt: {currentPrompt}
              </p>

              <form onSubmit={handleSaveJournal} className="mt-3.5 space-y-3">
                <input
                  type="text"
                  value={companion.journalDraftTitle}
                  onChange={(e) =>
                    setJournalDraft(e.target.value, companion.journalDraftContent)
                  }
                  placeholder="Entry title (optional)"
                  aria-label="Journal entry title"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F5F0]/70 border border-[#E8E1D7] text-sm font-medium text-[#292522] placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020] transition-colors"
                />

                <textarea
                  ref={journalTextareaRef}
                  rows={4}
                  value={companion.journalDraftContent}
                  onChange={(e) =>
                    setJournalDraft(companion.journalDraftTitle, e.target.value)
                  }
                  placeholder="Write freely—your draft stays saved here until you publish it to your journal & notes..."
                  aria-label="Journal entry text"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] text-sm text-[#292522] leading-relaxed placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020] transition-colors resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#6E6359]">
                    {companion.journalDraftContent.trim()
                      ? 'Draft auto-saved in browser'
                      : 'Saved entries also sync to your Notes'}
                  </span>

                  <button
                    type="submit"
                    disabled={!companion.journalDraftContent.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] disabled:opacity-40 transition-colors whitespace-nowrap"
                  >
                    <Feather className="w-3.5 h-3.5" />
                    <span>Save Entry</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Journal Entries Preview */}
            {companion.journalEntries.length > 0 && (
              <div className="pt-4 border-t border-[#EFE9E0] space-y-2.5">
                <p className="text-xs font-medium text-[#6E6359]">Recent reflections</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {companion.journalEntries.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl bg-[#F8F5F0]/80 border border-[#EAE3D9] p-3.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-[#292522] truncate">
                          {entry.title}
                        </p>
                        <span className="font-mono text-[11px] text-[#6E6359] tabular-nums shrink-0">
                          {entry.date.slice(5)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5C534D] leading-relaxed line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>

          {/* Small Daily Challenge Section (5 cols) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: EASE_OUT }}
            aria-label="Daily Mindful Challenge"
            className="lg:col-span-5 rounded-3xl bg-[#F8F1EE] border border-[#E7D6D2] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-[0_1px_4px_rgba(128,0,32,0.04)]"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#800020]">
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span>Daily Gentle Challenge</span>
                </p>

                <button
                  type="button"
                  onClick={cycleChallenge}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#6E6359] bg-[#FFFDF9]/80 border border-[#E7D6D2] hover:text-[#292522] transition-colors whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Swap</span>
                </button>
              </div>

              <h2 className="mt-4 text-2xl font-medium text-[#292522] leading-snug">
                {todayChallenge.title}
              </h2>

              <p className="mt-1.5 text-xs font-medium text-[#800020]">
                {todayChallenge.duration}
              </p>

              <p className="mt-3 text-sm text-[#4F4740] leading-relaxed">
                {todayChallenge.description}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E7D6D2]">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleChallenge}
                className={`w-full py-3 px-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-150 ${
                  isChallengeDoneToday
                    ? 'bg-[#4A6B53] text-[#FFFDF9] hover:bg-[#3B5743]'
                    : 'bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] shadow-[0_2px_8px_rgba(128,0,32,0.18)]'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isChallengeDoneToday ? 'Completed Today' : 'Complete Today’s Challenge'}
                </span>
              </motion.button>

              <div className="flex items-center justify-between text-xs text-[#6E6359] tabular-nums">
                <span>Total mindful challenges completed</span>
                <span className="font-mono font-semibold text-[#292522]">
                  {companion.completedChallengeDates.length}
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* 9. Weekly Achievements & Reflection Preview */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22, ease: EASE_OUT }}
          aria-label="Weekly Achievements and Reflection"
          className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-6 sm:p-8 shadow-[0_1px_4px_rgba(41,37,34,0.04)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#EFE9E0]">
            <div>
              <p className="text-xs font-medium text-[#800020]">
                Weekly Achievements &amp; Reflection
              </p>
              <h2 className="mt-1 text-2xl sm:text-[26px] font-medium text-[#292522]">
                How your week is unfolding
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('weekly')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#F8F5F0] border border-[#E8E1D7] text-[#292522] hover:border-[#A69A8D] transition-colors whitespace-nowrap"
              >
                <span>Open Weekly Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Achievement Metrics */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#F8F5F0]/80 border border-[#EFE9E0] p-4">
                <p className="text-xs text-[#6E6359]">Weekly Tasks</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold text-[#800020] tabular-nums">
                  {weeklyPct}%
                </p>
                <p className="mt-1 text-[11px] text-[#6E6359] tabular-nums">
                  {weeklyCompleted} of {weeklyTotal} done
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8F5F0]/80 border border-[#EFE9E0] p-4">
                <p className="text-xs text-[#6E6359]">Best Streak</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold text-[#292522] tabular-nums">
                  {bestStreak}d
                </p>
                <p className="mt-1 text-[11px] text-[#6E6359]">
                  Active habit streak
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8F5F0]/80 border border-[#EFE9E0] p-4">
                <p className="text-xs text-[#6E6359]">Garden Rhythm</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold text-[#4A6B53] tabular-nums">
                  {weeklyHabitConsistency}%
                </p>
                <p className="mt-1 text-[11px] text-[#6E6359]">
                  Weekly consistency
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8F5F0]/80 border border-[#EFE9E0] p-4">
                <p className="text-xs text-[#6E6359]">Check-Ins</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold text-[#292522] tabular-nums">
                  {journalCheckInsCount}
                </p>
                <p className="mt-1 text-[11px] text-[#6E6359]">
                  Moods &amp; journal notes
                </p>
              </div>
            </div>

            {/* Mon-Sun Habit Consistency Bars + Reflection Note */}
            <div className="lg:col-span-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D9] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#292522]">
                  Mon – Sun Habit Garden Rhythm
                </span>
                <span className="text-[#6E6359] tabular-nums">
                  {completedHabitCheckIns} blooms this week
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end">
                {habitByDayRates.map((item) => {
                  const isTodayCol = item.idx === todayIdx;
                  return (
                    <div key={item.day} className="flex flex-col items-center gap-1.5">
                      <div className="w-full h-14 rounded-lg bg-[#EFE9E0]/80 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isTodayCol ? 'bg-[#800020]' : 'bg-[#4A6B53]'
                          }`}
                          style={{
                            height: item.metCount === 0 ? '0%' : `${Math.max(18, item.pct)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[11px] ${
                          isTodayCol ? 'font-semibold text-[#800020]' : 'text-[#6E6359]'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-[#5C534D] leading-relaxed">
                {weeklyPct >= 60 && weeklyHabitConsistency >= 60
                  ? 'You are balancing meaningful work with steady self-care this week—keep protecting your evening wind-down.'
                  : 'Small consistent check-ins matter more than perfection. Choose one gentle win before tonight.'}
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </MotionConfig>
  );
}
