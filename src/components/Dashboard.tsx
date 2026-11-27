import { useMemo, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  Check,
  Clock,
  Feather,
  FolderPlus,
  ListTodo,
  Minus,
  Moon,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Sprout,
  Sun,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import {
  MOTIVATIONAL_QUOTES,
  formatTime12h,
  getCurrentTimeHHMM,
  getOffsetDateISO,
  getTodayDateISO,
  getTodayWeekday,
  getTodayWeekdayIndex,
} from '../data/sampleData';
import { computeHabitStreak } from '../hooks/useMyDayStore';
import { useCompanionStore, type BannerMood } from '../hooks/useCompanionStore';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { FocusCategoryCover, SkylineCoverBanner } from './EditorialCovers';
import { FocusTimerCard } from './FocusTimerCard';
import {
  HabitGardenPlant,
  getGrowthStageLabel,
  getPlantSpecies,
} from './HabitGardenPlant';
import type { RitualMode } from './RitualModal';
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
  focusCategories: string[];
  showGuide: boolean;
  rolledOverNewDay: boolean;
  onDismissGuide: () => void;
  onDismissRolloverNotice: () => void;
  onOpenRitual: (mode: Exclude<RitualMode, null>) => void;
  onAddFocusSpace: (name: string) => boolean;
  onQuickAddTask: (input: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onToggleRoutine: (id: string) => void;
  onAdjustHabit: (key: HabitKey, delta: number) => void;
  onSetHabitValue: (key: HabitKey, value: number) => void;
  onAddNote: (input: Omit<Note, 'id' | 'updatedAt'>) => void;
  onToggleNoteCompleted?: (id: string) => void;
  onDeleteJournalEntry: (id: string) => void;
  onLoadStarterRoutine: () => void;
  onLoadStarterHabits: () => void;
  onNotify?: (message: string, tone?: ToastItem['tone']) => void;
  onNavigate: (tab: AppTab) => void;
}

type DashboardTaskFilter = 'All' | 'Pending' | 'Completed';
type SpaceGalleryTab = 'Active' | 'Completed' | 'All';
type EntryMode = 'journal' | 'minddump';
type MobileBoardCol = 'todo' | 'high' | 'done';

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];
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
    response: 'Great energy for deep study, creative craft, or clearing priorities.',
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

const PERSONAL_AFFIRMATIONS: string[][] = [
  [
    'I move with calm clarity and unhurried focus.',
    'Small, consistent steps create momentum I can trust.',
    'I am worthy of building a life I genuinely love.',
  ],
  [
    'My daily discipline quietly compounds into freedom.',
    'I create thoughtful work without burning out.',
    'Everything meant for me meets my steady effort.',
  ],
  [
    'I choose intentional routines over chaotic urgency.',
    'My craft, voice, and energy grow stronger every week.',
    'I am allowed to rest and still be ambitious.',
  ],
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
      'Step away from feeds while hydrating, stretching, or setting today’s tone.',
  },
  {
    title: 'Three Quiet Wins Before Dinner',
    duration: '5 min · Evening Clarity',
    description:
      'Write down three things you moved forward today—every steady step counts.',
  },
  {
    title: '15-Minute Desk & Space Reset',
    duration: '15 min · Calm Environment',
    description:
      'Clear your workspace, refill your water glass, and start your next focus block fresh.',
  },
  {
    title: 'Single-Tab Deep Focus Session',
    duration: '25 min · Deep Work',
    description:
      'Pick your most important task and work with only one window open until the timer rings.',
  },
  {
    title: 'Kind Note to Tomorrow-You',
    duration: '3 min · Self-Compassion',
    description:
      'Leave a short encouraging note or pick tomorrow’s single top priority before rest.',
  },
];

const BANNER_MOODS: Array<{ key: BannerMood; label: string }> = [
  { key: 'skyline', label: 'Midnight City' },
  { key: 'espresso', label: 'Espresso' },
  { key: 'burgundy', label: 'Burgundy' },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({
  tasks,
  routine,
  habits,
  notes,
  focusCategories,
  showGuide,
  rolledOverNewDay,
  onDismissGuide,
  onDismissRolloverNotice,
  onOpenRitual,
  onAddFocusSpace,
  onQuickAddTask,
  onToggleTask,
  onDeleteTask,
  onToggleRoutine,
  onAdjustHabit,
  onSetHabitValue,
  onAddNote,
  onToggleNoteCompleted,
  onDeleteJournalEntry,
  onLoadStarterRoutine,
  onLoadStarterHabits,
  onNotify,
  onNavigate,
}: DashboardProps) {
  const {
    companion,
    setPreferredName,
    setMindDumpText,
    setBannerMood,
    setMoodForToday,
    setMoodNoteForToday,
    setJournalDraft,
    saveJournalEntry,
    toggleTodayChallenge,
    cycleChallenge,
  } = useCompanionStore();

  const { startTaskFocus } = useFocusTimer();

  // Editable space identity
  const [editingSpaceName, setEditingSpaceName] = useState(false);
  const [spaceNameDraft, setSpaceNameDraft] = useState('');

  // Local workspace UI states
  const [spaceGalleryTab, setSpaceGalleryTab] = useState<SpaceGalleryTab>('All');
  const [addingSpace, setAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [taskFilter, setTaskFilter] = useState<DashboardTaskFilter>('All');
  const [mobileBoardCol, setMobileBoardCol] = useState<MobileBoardCol>('todo');
  const [composerOpen, setComposerOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('10:00');
  const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('Medium');
  const [quickTaskCategory, setQuickTaskCategory] = useState<TaskCategory>(
    focusCategories[0] || 'Personal',
  );

  const [affirmationIdx, setAffirmationIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [entryMode, setEntryMode] = useState<EntryMode>('journal');
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [quickReminderTitle, setQuickReminderTitle] = useState('');
  const [moodNoteDraft, setMoodNoteDraft] = useState<string | null>(null);

  const journalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const entriesSectionRef = useRef<HTMLElement | null>(null);
  const tasksSectionRef = useRef<HTMLElement | null>(null);

  const todayISO = getTodayDateISO();
  const todayDay = getTodayWeekday();
  const todayIdx = getTodayWeekdayIndex();

  const shortDateLabel = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const compactDateBadge = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const displaySpaceTitle = companion.preferredName
    ? `${companion.preferredName}'s DayEase`
    : 'my dayease space';

  // --- Tasks & Focus Spaces Metrics ---
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

  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTodayTasks = todayTasks.length - completedTodayTasks;

  const focusSpaceStats = useMemo(() => {
    return focusCategories.map((category) => {
      const catTasks = tasks.filter((t) => t.category === category);
      const done = catTasks.filter((t) => t.completed).length;
      const pending = catTasks.length - done;
      const pct = catTasks.length === 0 ? 0 : Math.round((done / catTasks.length) * 100);
      return {
        category,
        total: catTasks.length,
        done,
        pending,
        pct,
      };
    });
  }, [tasks, focusCategories]);

  const visibleFocusSpaces = useMemo(() => {
    if (spaceGalleryTab === 'Active') {
      return focusSpaceStats.filter((s) => s.pending > 0);
    }
    if (spaceGalleryTab === 'Completed') {
      return focusSpaceStats.filter((s) => s.total > 0 && s.pending === 0);
    }
    return focusSpaceStats;
  }, [focusSpaceStats, spaceGalleryTab]);

  // Board Tasks
  const boardSourceTasks = useMemo(() => {
    const base = selectedCategory
      ? tasks.filter((t) => t.category === selectedCategory)
      : todayTasks;

    return [...base]
      .filter((t) => {
        if (taskFilter === 'Pending') return !t.completed;
        if (taskFilter === 'Completed') return t.completed;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.time || '99:99').localeCompare(b.time || '99:99');
      });
  }, [tasks, todayTasks, selectedCategory, taskFilter]);

  const todoColTasks = useMemo(
    () => boardSourceTasks.filter((t) => !t.completed && t.priority !== 'High'),
    [boardSourceTasks],
  );
  const highPriorityColTasks = useMemo(
    () => boardSourceTasks.filter((t) => !t.completed && t.priority === 'High'),
    [boardSourceTasks],
  );
  const doneColTasks = useMemo(
    () => boardSourceTasks.filter((t) => t.completed),
    [boardSourceTasks],
  );

  // --- Routine (real-time next block) ---
  const sortedRoutine = useMemo(
    () => [...routine].sort((a, b) => a.time.localeCompare(b.time)),
    [routine],
  );
  const completedRoutine = routine.filter((r) => r.completed).length;
  const nextRoutineItem = useMemo(() => {
    const nowHHMM = getCurrentTimeHHMM();
    const upcoming = sortedRoutine.find((r) => !r.completed && r.time >= nowHHMM);
    return upcoming ?? sortedRoutine.find((r) => !r.completed) ?? null;
  }, [sortedRoutine]);

  const upcomingRoutine = useMemo(() => {
    const pending = sortedRoutine.filter((r) => !r.completed);
    return (pending.length > 0 ? pending : sortedRoutine).slice(0, 6);
  }, [sortedRoutine]);

  // --- Habits ---
  const habitsMetToday = habits.filter((h) => h.todayValue >= h.targetValue).length;
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

  // --- Focus Sessions Today ---
  const todayFocusSessions = useMemo(
    () => companion.focusSessions.filter((s) => s.date === todayISO),
    [companion.focusSessions, todayISO],
  );
  const todayFocusMinutes = useMemo(
    () => todayFocusSessions.reduce((sum, s) => sum + s.minutes, 0),
    [todayFocusSessions],
  );

  // --- Ritual status today ---
  const todayMorningReset = companion.morningResets[todayISO];
  const todayEveningReflection = companion.eveningReflections[todayISO];

  // --- Overall Daily Progress ---
  const totalDailyPillars = todayTasks.length + routine.length + habits.length;
  const completedDailyPillars = completedTodayTasks + completedRoutine + habitsMetToday;
  const overallProgressPct =
    totalDailyPillars === 0
      ? 0
      : Math.round((completedDailyPillars / totalDailyPillars) * 100);

  // --- Reminders synced with Notes ---
  const reminderNotes = useMemo(
    () => notes.filter((n) => n.category === 'Reminder' || Boolean(n.reminderDate)),
    [notes],
  );

  // --- Mood, Affirmations, Prompt, Challenge ---
  const todayMoodEntry = companion.moods[todayISO];
  const selectedMoodObj = MOOD_OPTIONS.find((m) => m.key === todayMoodEntry?.mood) ?? null;

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

  const affirmationSet = PERSONAL_AFFIRMATIONS[affirmationIdx % PERSONAL_AFFIRMATIONS.length];
  const quote = MOTIVATIONAL_QUOTES[affirmationIdx % MOTIVATIONAL_QUOTES.length];
  const currentPrompt = JOURNAL_PROMPTS[promptIdx % JOURNAL_PROMPTS.length];
  const daySeed = new Date().getDate() + companion.challengeOffset;
  const todayChallenge = DAILY_CHALLENGES[daySeed % DAILY_CHALLENGES.length];
  const isChallengeDoneToday = companion.completedChallengeDates.includes(todayISO);

  // --- Handlers ---
  const handleSaveSpaceName = (e: React.FormEvent) => {
    e.preventDefault();
    setPreferredName(spaceNameDraft);
    setEditingSpaceName(false);
    onNotify?.('Space title updated.', 'success');
  };

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onAddFocusSpace(newSpaceName);
    if (ok) {
      setSelectedCategory(newSpaceName.trim());
      setNewSpaceName('');
      setAddingSpace(false);
    }
  };

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onQuickAddTask({
      title: quickTaskTitle.trim(),
      time: quickTaskTime || '10:00',
      deadline: todayISO,
      priority: quickTaskPriority,
      category: selectedCategory || quickTaskCategory,
      day: todayDay,
    });
    setQuickTaskTitle('');
    setComposerOpen(false);
  };

  const openComposerForColumn = (priority: Priority) => {
    setQuickTaskPriority(priority);
    if (selectedCategory) setQuickTaskCategory(selectedCategory);
    setComposerOpen(true);
    tasksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    setEntryMode('journal');
    const starterTitle = 'Affirmation Reflection';
    const starterBody = companion.journalDraftContent.trim()
      ? `${companion.journalDraftContent}\n\n"${affirmationSet[0]}" — `
      : `"${affirmationSet[0]}"\n\nWhat this feels like today: `;
    setJournalDraft(companion.journalDraftTitle || starterTitle, starterBody);
    entriesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const handleArchiveMindDump = () => {
    const text = companion.mindDumpText.trim();
    if (!text) return;
    onAddNote({
      title: `Mind Dump · ${compactDateBadge}`,
      content: text,
      category: 'Personal',
      completed: false,
    });
    setMindDumpText('');
  };

  const handleAddQuickReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickReminderTitle.trim();
    if (!text) return;
    onAddNote({
      title: text,
      content: text,
      category: 'Reminder',
      reminderDate: todayISO,
      completed: false,
    });
    setQuickReminderTitle('');
  };

  const handleHabitIncrement = (habit: Habit) => {
    const willReachGoal =
      habit.todayValue < habit.targetValue &&
      habit.todayValue + habit.step >= habit.targetValue;
    onAdjustHabit(habit.key, habit.step);
    if (willReachGoal) {
      onNotify?.(
        `${getPlantSpecies(habit.key, habit.plantStyle)} (${habit.name}) is now in full bloom!`,
        'success',
      );
    }
  };

  const handleHabitBloomToggle = (habit: Habit) => {
    const isMet = habit.todayValue >= habit.targetValue;
    onSetHabitValue(habit.key, isMet ? 0 : habit.targetValue);
    if (!isMet) {
      onNotify?.(
        `${getPlantSpecies(habit.key, habit.plantStyle)} (${habit.name}) reached full bloom!`,
        'success',
      );
    }
  };

  const boardColumns: Array<{
    id: MobileBoardCol;
    label: string;
    accentClass: string;
    dotColor: string;
    items: Task[];
    addPriority: Priority;
  }> = [
    {
      id: 'todo',
      label: 'To Do',
      accentClass: 'text-[#6E6359] dark:text-[#A69E94]',
      dotColor: 'bg-[#A69A8D] dark:bg-[#8E867E]',
      items: todoColTasks,
      addPriority: 'Medium',
    },
    {
      id: 'high',
      label: 'High Priority',
      accentClass: 'text-[#800020] dark:text-[#D4A85E]',
      dotColor: 'bg-[#800020] dark:bg-[#C89B54]',
      items: highPriorityColTasks,
      addPriority: 'High',
    },
    {
      id: 'done',
      label: 'Completed',
      accentClass: 'text-[#4A6B53] dark:text-[#8AB896]',
      dotColor: 'bg-[#4A6B53] dark:bg-[#8AB896]',
      items: doneColTasks,
      addPriority: 'Low',
    },
  ];

  const renderBoardColumn = (col: (typeof boardColumns)[number]) => (
    <div
      key={col.id}
      className="rounded-xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] p-3 flex flex-col justify-between gap-3"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#EAE3D9] dark:border-[#262422]">
          <span className={`flex items-center gap-1.5 text-xs font-semibold ${col.accentClass}`}>
            <span className={`w-2 h-2 rounded-full ${col.dotColor}`} aria-hidden="true" />
            <span>{col.label}</span>
          </span>
          <span className="font-mono text-xs text-[#6E6359] dark:text-[#9E958C] tabular-nums">
            {col.items.length}
          </span>
        </div>

        {col.items.length === 0 ? (
          <p className="py-5 text-xs text-[#8C8278] dark:text-[#78716A] text-center">
            Nothing here yet
          </p>
        ) : (
          <div className="space-y-2">
            {col.items.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="group rounded-xl bg-[#FFFDF9] dark:bg-[#222120] border border-[#E6DFD5] dark:border-[#302E2B] p-2.5 hover:border-[#CBBFB2] dark:hover:border-[#4A4640] transition-colors flex items-start justify-between gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleToggleTaskWithFeedback(task)}
                  className="flex items-start gap-2 min-w-0 flex-1 text-left"
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      task.completed
                        ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                        : 'border-[#CFC5B8] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#161616]'
                    }`}
                  >
                    {task.completed && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-[#8C8278] dark:text-[#7D766E]'
                          : 'text-[#292522] dark:text-[#F3EFEA]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#6E6359] dark:text-[#9E958C] tabular-nums">
                      {formatTime12h(task.time)} · {task.category}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => startTaskFocus(task.id, task.title)}
                      aria-label={`Focus on "${task.title}"`}
                      title="Start 25m focus"
                      className="p-1 rounded-md text-[#8C8278] opacity-70 group-hover:opacity-100 hover:text-[#800020] dark:hover:text-[#D4A85E] transition-opacity"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`Delete "${task.title}"`}
                      className="p-1 rounded-md text-[#8C8278] opacity-70 group-hover:opacity-100 hover:text-[#800020] dark:hover:text-[#E58A9B] transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {col.items.length > 5 && (
              <button
                type="button"
                onClick={() => onNavigate('todos')}
                className="w-full py-1.5 text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline flex items-center justify-center gap-1"
              >
                <span>View all ({col.items.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => openComposerForColumn(col.addPriority)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] dark:text-[#9E958C] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#EFE9E0]/70 dark:hover:bg-[#222120] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New task</span>
      </button>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        {/* 1. Atmospheric Skyline Cover Banner + Space Header */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
          aria-label="Personal Space Header"
          className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] overflow-hidden shadow-[0_2px_14px_rgba(41,37,34,0.05)] dark:shadow-none transition-colors"
        >
          <div className="relative">
            <SkylineCoverBanner mood={companion.bannerMood} />

            {/* Banner Atmosphere Switcher */}
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-xl bg-black/45 backdrop-blur-md border border-white/10 p-1">
              {BANNER_MOODS.map((m) => {
                const active = companion.bannerMood === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setBannerMood(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#C89B54] text-[#141414]'
                        : 'text-[#EAE3D9]/80 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6">
            <div className="relative -mt-8 mb-3 flex items-end justify-between gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F4F1EC] border border-[#E6DFD5] dark:border-[#C89B54]/45 shadow-md overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/dayease_81fc60c2.png"
                  alt="DayEase logo"
                  className="w-full h-full object-cover scale-[1.68]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pb-1">
                <p className="hidden md:block text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums mr-1">
                  <span>{getTimeGreeting()}</span>
                  <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                  <span>{shortDateLabel}</span>
                  <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                  <span className="font-mono font-medium text-[#800020] dark:text-[#D4A85E]">
                    {overallProgressPct}% today
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => onOpenRitual('morning')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF3F1] dark:bg-[#26211F] text-[#800020] dark:text-[#D4A85E] border border-[#EAD9D8] dark:border-[#493E33] hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Morning Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRitual('evening')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F8F5F0] dark:bg-[#161616] text-[#292522] dark:text-[#F3EFEA] border border-[#E6DFD5] dark:border-[#2E2C29] hover:border-[#800020] dark:hover:border-[#D4A85E] transition-colors whitespace-nowrap"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Wind-Down</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                {editingSpaceName ? (
                  <form onSubmit={handleSaveSpaceName} className="flex items-center gap-2 max-w-md">
                    <input
                      type="text"
                      value={spaceNameDraft}
                      onChange={(e) => setSpaceNameDraft(e.target.value)}
                      placeholder="Your name (e.g., Maya)"
                      aria-label="Personalize your space name"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#F8F5F0] dark:bg-[#141414] border border-[#E6DFD5] dark:border-[#34312D] text-lg font-display text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] whitespace-nowrap"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSpaceName(false)}
                      className="px-2.5 py-1.5 rounded-xl text-xs text-[#6E6359] dark:text-[#A69E94]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-display text-3xl sm:text-[38px] font-semibold tracking-[-0.02em] text-[#292522] dark:text-[#F3EFEA] truncate">
                      {displaySpaceTitle}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setSpaceNameDraft(companion.preferredName);
                        setEditingSpaceName(true);
                      }}
                      aria-label="Personalize space title"
                      title="Personalize space title"
                      className="p-1.5 rounded-lg text-[#A69A8D] dark:text-[#8E867E] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F4EFE7] dark:hover:bg-[#282624] transition-colors shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="mt-1 text-xs sm:text-sm text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                  <span>
                    {pendingTodayTasks} {pendingTodayTasks === 1 ? 'task' : 'tasks'} left today
                  </span>
                  <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                  <span>
                    {nextRoutineItem
                      ? `Up next: ${nextRoutineItem.title} at ${formatTime12h(nextRoutineItem.time)}`
                      : routine.length === 0
                        ? 'No routine blocks yet'
                        : 'Routine complete'}
                  </span>
                  <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                  <span>
                    {habits.length === 0
                      ? '0 habits planted'
                      : `${habitsMetToday}/${habits.length} habits blooming`}
                  </span>
                </p>

                {todayMorningReset?.intention && (
                  <p className="mt-2 text-xs italic text-[#800020] dark:text-[#D4A85E]">
                    Today’s intention: “{todayMorningReset.intention}”
                  </p>
                )}
              </div>

              <FocusTimerCard todayMinutes={todayFocusMinutes} />
            </div>
          </div>
        </motion.section>

        {/* Automatic Daily Rollover Notice */}
        {rolledOverNewDay && (
          <div className="rounded-2xl bg-[#FAF6EE] dark:bg-[#23201C] border border-[#E5DDD0] dark:border-[#3A342B] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#292522] dark:text-[#F3EFEA]">
              <Sun className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E] shrink-0" />
              <span>
                Good morning! Your routine checkmarks and daily habit counters rolled over fresh for today.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDismissRolloverNotice();
                  onOpenRitual('morning');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] whitespace-nowrap"
              >
                Open Morning Reset
              </button>
              <button
                type="button"
                onClick={onDismissRolloverNotice}
                aria-label="Dismiss rollover notice"
                className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Fresh Visitor Onboarding Guide */}
        {showGuide && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            aria-label="How DayEase works"
            className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#292522] dark:text-[#F3EFEA]">
                  Welcome to your personal DayEase workspace
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#6E6359] dark:text-[#A69E94]">
                  This space is completely yours and saves privately inside this browser. Start by adding your first task, building a daily routine, or planting a habit in your garden.
                </p>
              </div>
              <button
                type="button"
                onClick={onDismissGuide}
                aria-label="Dismiss guide"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F4EFE7] dark:hover:bg-[#282624] transition-colors shrink-0 whitespace-nowrap"
              >
                <span>Got it</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openComposerForColumn('Medium')}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E] transition-colors text-left"
              >
                <span>1. Add your first task</span>
                <Plus className="w-3.5 h-3.5 text-[#800020] dark:text-[#D4A85E] shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('routine')}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E] transition-colors text-left"
              >
                <span>2. Shape your routine</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#800020] dark:text-[#D4A85E] shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('habits')}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E] transition-colors text-left"
              >
                <span>3. Plant your first habit</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#800020] dark:text-[#D4A85E] shrink-0" />
              </button>
            </div>
          </motion.section>
        )}

        {/* 2. Three-Column Editorial Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
          {/* ================= LEFT RAIL (3 cols) ================= */}
          <div className="xl:col-span-3 space-y-5 order-2 xl:order-1">
            {/* Daily Rituals & Focus Log */}
            <section
              aria-label="Daily Rituals and Focus Log"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                  daily rituals &amp; focus
                </h2>
                <span className="font-mono text-xs text-[#800020] dark:text-[#D4A85E] tabular-nums">
                  {todayFocusMinutes}m today
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onOpenRitual('morning')}
                  className={`rounded-xl p-3 border text-left transition-colors ${
                    todayMorningReset
                      ? 'bg-[#F5F9F6] dark:bg-[#19231D] border-[#C5DBC9] dark:border-[#344D3D]'
                      : 'bg-[#F8F5F0]/80 dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2A2825] hover:border-[#800020] dark:hover:border-[#D4A85E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E]" />
                    {todayMorningReset && <Check className="w-3.5 h-3.5 text-[#4A6B53] dark:text-[#8AB896]" />}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#292522] dark:text-[#F3EFEA]">
                    Morning Reset
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6359] dark:text-[#A69E94]">
                    {todayMorningReset ? 'Intention set' : 'Start gently'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenRitual('evening')}
                  className={`rounded-xl p-3 border text-left transition-colors ${
                    todayEveningReflection
                      ? 'bg-[#F5F9F6] dark:bg-[#19231D] border-[#C5DBC9] dark:border-[#344D3D]'
                      : 'bg-[#F8F5F0]/80 dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2A2825] hover:border-[#800020] dark:hover:border-[#D4A85E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Moon className="w-4 h-4 text-[#800020] dark:text-[#D4A85E]" />
                    {todayEveningReflection && <Check className="w-3.5 h-3.5 text-[#4A6B53] dark:text-[#8AB896]" />}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#292522] dark:text-[#F3EFEA]">
                    Wind-Down
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E6359] dark:text-[#A69E94]">
                    {todayEveningReflection ? 'Saved today' : 'Reflect & roll'}
                  </p>
                </button>
              </div>

              <div className="pt-2.5 border-t border-[#EFE9E0] dark:border-[#2A2825] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#6E6359] dark:text-[#A69E94]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#292522] dark:text-[#F3EFEA]">
                    <Timer className="w-3.5 h-3.5 text-[#B5853B] dark:text-[#D4A85E]" />
                    <span>Focus log</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {todayFocusSessions.length} {todayFocusSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                {todayFocusSessions.length === 0 ? (
                  <p className="text-xs text-[#6E6359] dark:text-[#9E958C]">
                    Start the timer above or tap Play on any task to log deep focus minutes.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {todayFocusSessions.slice(0, 3).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 text-xs rounded-lg bg-[#F8F5F0] dark:bg-[#161616] px-2.5 py-1.5"
                      >
                        <span className="truncate text-[#4F4740] dark:text-[#CFC7BE]">
                          {s.taskTitle || 'Deep Focus Session'}
                        </span>
                        <span className="font-mono text-[11px] text-[#800020] dark:text-[#D4A85E] shrink-0">
                          {s.minutes}m
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Interactive Mood Check-In */}
            <section
              aria-label="Mood Check-In"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                    mood check-in
                  </h2>
                  <p className="mt-0.5 text-xs text-[#6E6359] dark:text-[#A69E94]">
                    {selectedMoodObj
                      ? `Feeling ${selectedMoodObj.label.toLowerCase()} today`
                      : 'How does today feel?'}
                  </p>
                </div>

                <div className="flex items-center gap-1" aria-label="7-day mood history">
                  {recentMoodRibbon.map((slot) => (
                    <span
                      key={slot.iso}
                      title={
                        slot.moodMeta
                          ? `${slot.iso}: ${slot.moodMeta.label}`
                          : `${slot.iso}: Not logged`
                      }
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                        slot.moodMeta
                          ? 'bg-[#FAF3F1] dark:bg-[#2A2224] border-[#E8D0D4] dark:border-[#4A3339]'
                          : slot.isToday
                            ? 'border-[#800020]/50 dark:border-[#D4A85E]/50 border-dashed'
                            : 'border-[#E6DFD5] dark:border-[#2E2C29]'
                      }`}
                    >
                      {slot.moodMeta ? slot.moodMeta.emoji : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MOOD_OPTIONS.map((option) => {
                  const active = todayMoodEntry?.mood === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelectMood(option.key, option.label)}
                      aria-pressed={active}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl border transition-all ${
                        active
                          ? 'bg-[#FAF3F1] dark:bg-[#2A2224] border-[#800020] dark:border-[#D4A85E]'
                          : 'bg-[#F8F5F0]/75 dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2E2C29] hover:border-[#CBBFB2] dark:hover:border-[#49443E]'
                      }`}
                    >
                      <span className="text-lg leading-none" role="img" aria-hidden="true">
                        {option.emoji}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          active
                            ? 'text-[#800020] dark:text-[#D4A85E]'
                            : 'text-[#4F4740] dark:text-[#CFC7BE]'
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedMoodObj && (
                <div className="pt-2.5 border-t border-[#EFE9E0] dark:border-[#2A2825] space-y-2">
                  <p className="text-xs text-[#5C534D] dark:text-[#BFB7AD] leading-relaxed">
                    {selectedMoodObj.response}
                  </p>
                  {moodNoteDraft !== null ? (
                    <form onSubmit={handleSaveMoodNote} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={moodNoteDraft}
                        onChange={(e) => setMoodNoteDraft(e.target.value)}
                        placeholder="Add a mood note..."
                        aria-label="Mood check-in note"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#F8F5F0] dark:bg-[#141414] border border-[#E6DFD5] dark:border-[#34312D] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMoodNoteDraft(todayMoodEntry?.note || '')}
                      className="text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline"
                    >
                      {todayMoodEntry?.note ? `“${todayMoodEntry.note}” · Edit` : '+ Add mood note'}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Daily Gentle Challenge */}
            <section
              aria-label="Daily Challenge"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-2.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#800020] dark:text-[#D4A85E]">
                  daily challenge · {todayChallenge.duration}
                </span>
                <button
                  type="button"
                  onClick={cycleChallenge}
                  aria-label="Swap daily challenge"
                  className="p-1 rounded-md text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-semibold text-[#292522] dark:text-[#F3EFEA]">
                {todayChallenge.title}
              </p>
              <p className="text-xs text-[#6E6359] dark:text-[#A69E94] leading-relaxed">
                {todayChallenge.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  const completed = toggleTodayChallenge();
                  onNotify?.(
                    completed
                      ? `Challenge completed: ${todayChallenge.title}`
                      : 'Challenge marked as in progress.',
                    completed ? 'success' : 'info',
                  );
                }}
                className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                  isChallengeDoneToday
                    ? 'bg-[#4A6B53] dark:bg-[#4E7559] text-[#FFFDF9]'
                    : 'bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E]'
                }`}
              >
                {isChallengeDoneToday ? 'Challenge Completed' : 'Accept & Complete'}
              </button>
            </section>
          </div>

          {/* ================= CENTER STAGE (6 cols) ================= */}
          <div className="xl:col-span-6 space-y-5 order-1 xl:order-2 md:col-span-2">
            {/* Focus Spaces Gallery */}
            <section
              aria-label="My Focus Spaces"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B5853B] dark:text-[#D4A85E]" />
                  <h2 className="font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                    focus spaces
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Filter focus spaces"
                    className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825]"
                  >
                    {(['All', 'Active', 'Completed'] as SpaceGalleryTab[]).map((tab) => {
                      const active = spaceGalleryTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSpaceGalleryTab(tab)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-xs dark:shadow-none'
                              : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddingSpace((v) => !v)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0] dark:bg-[#161616] text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E] transition-colors whitespace-nowrap shrink-0"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Space</span>
                  </button>
                </div>
              </div>

              {addingSpace && (
                <form onSubmit={handleCreateSpace} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Name your new focus space (e.g., Reading, Side Project)..."
                    aria-label="New focus space name"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingSpace(false)}
                    className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94]"
                    aria-label="Close new space input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {visibleFocusSpaces.length === 0 ? (
                <div className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] p-6 text-center">
                  <p className="text-xs text-[#6E6359] dark:text-[#A69E94]">
                    No {spaceGalleryTab.toLowerCase()} focus spaces yet. Select All or add your first task below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {visibleFocusSpaces.map((space) => {
                    const isSelected = selectedCategory === space.category;
                    return (
                      <button
                        key={space.category}
                        type="button"
                        onClick={() =>
                          setSelectedCategory((prev) =>
                            prev === space.category ? null : space.category,
                          )
                        }
                        className={`group text-left rounded-2xl overflow-hidden border transition-all duration-150 bg-[#F8F5F0]/80 dark:bg-[#242321] ${
                          isSelected
                            ? 'border-[#800020] dark:border-[#D4A85E] ring-2 ring-[#800020]/15 dark:ring-[#D4A85E]/20'
                            : 'border-[#E6DFD5] dark:border-[#302E2B] hover:border-[#CBBFB2] dark:hover:border-[#4A4640] hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="h-20 sm:h-24 w-full overflow-hidden">
                          <FocusCategoryCover category={space.category} />
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-semibold text-[#292522] dark:text-[#F3EFEA] truncate">
                              {space.category}
                            </span>
                            <span className="font-mono text-[11px] text-[#6E6359] dark:text-[#A69E94] tabular-nums shrink-0">
                              {space.done}/{space.total}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#E6DFD5] dark:bg-[#35322E] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#B5853B] dark:bg-[#C89B54] transition-all duration-300"
                              style={{ width: `${space.pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Task Tracker */}
            <section
              ref={tasksSectionRef}
              aria-label="Task Tracker"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ListTodo className="w-4 h-4 text-[#800020] dark:text-[#D4A85E] shrink-0" />
                  <h2 className="font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA] truncate">
                    task tracker
                  </h2>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#FAF3F1] dark:bg-[#2B2520] text-[#800020] dark:text-[#D4A85E] border border-[#EAD9D8] dark:border-[#493E33] whitespace-nowrap"
                    >
                      <span>{selectedCategory}</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Filter tracker tasks"
                    className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825]"
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-xs dark:shadow-none'
                              : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
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
                    className="text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline whitespace-nowrap"
                  >
                    All tasks →
                  </button>
                </div>
              </div>

              {composerOpen && (
                <form
                  onSubmit={handleQuickTaskSubmit}
                  className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] p-3 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder={`Add a task for ${selectedCategory || todayDay}...`}
                      aria-label="Quick add task"
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#34312D] text-xs sm:text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#7D756D] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!quickTaskTitle.trim()}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] disabled:opacity-40 whitespace-nowrap"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerOpen(false)}
                      aria-label="Close quick task composer"
                      className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={quickTaskTime}
                      onChange={(e) => setQuickTaskTime(e.target.value)}
                      aria-label="Quick task time"
                      className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#34312D] text-xs font-mono text-[#292522] dark:text-[#F3EFEA]"
                    />
                    <select
                      value={selectedCategory || quickTaskCategory}
                      onChange={(e) => setQuickTaskCategory(e.target.value as TaskCategory)}
                      aria-label="Quick task category"
                      className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#34312D] text-xs text-[#292522] dark:text-[#F3EFEA]"
                    >
                      {focusCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={quickTaskPriority}
                      onChange={(e) => setQuickTaskPriority(e.target.value as Priority)}
                      aria-label="Quick task priority"
                      className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#34312D] text-xs text-[#292522] dark:text-[#F3EFEA]"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p} Priority
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              )}

              {tasks.length === 0 && !composerOpen ? (
                <div className="rounded-2xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-dashed border-[#DFD6CA] dark:border-[#2E2C29] p-6 text-center space-y-3">
                  <p className="text-sm font-medium text-[#292522] dark:text-[#F3EFEA]">
                    No tasks added yet
                  </p>
                  <p className="text-xs text-[#6E6359] dark:text-[#A69E94] max-w-sm mx-auto">
                    Add your top intentions for {todayDay} to organize them across To Do, High Priority, and Completed.
                  </p>
                  <button
                    type="button"
                    onClick={() => openComposerForColumn('Medium')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Task</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Tabbed Column Selector */}
                  <div className="sm:hidden space-y-3">
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825]">
                      {boardColumns.map((col) => {
                        const active = mobileBoardCol === col.id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setMobileBoardCol(col.id)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                              active
                                ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#800020] dark:text-[#D4A85E]'
                                : 'text-[#6E6359] dark:text-[#A69E94]'
                            }`}
                          >
                            {col.label} ({col.items.length})
                          </button>
                        );
                      })}
                    </div>
                    {renderBoardColumn(
                      boardColumns.find((c) => c.id === mobileBoardCol) ?? boardColumns[0],
                    )}
                  </div>

                  {/* Desktop 3-Column Board */}
                  <div className="hidden sm:grid sm:grid-cols-3 gap-3">
                    {boardColumns.map((col) => renderBoardColumn(col))}
                  </div>
                </>
              )}
            </section>

            {/* Daily Timeline */}
            <section
              aria-label="Daily Schedule Timeline"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3.5 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                    daily timeline
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
                    {completedRoutine}/{routine.length} blocks checked off
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('routine')}
                  className="text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline whitespace-nowrap"
                >
                  {routine.length > 6 ? `View all (${routine.length}) →` : 'Open routine →'}
                </button>
              </div>

              {routine.length === 0 ? (
                <div className="rounded-xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-dashed border-[#DFD6CA] dark:border-[#2E2C29] p-5 text-center space-y-2.5">
                  <p className="text-xs text-[#6E6359] dark:text-[#A69E94]">
                    Create your own chronological flow, or try a gentle 7-block starter timetable.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('routine')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Build Routine</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLoadStarterRoutine}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#FFFDF9] dark:bg-[#1E1E1E] text-[#292522] dark:text-[#F3EFEA]"
                    >
                      <span>Load Starter Routine</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {upcomingRoutine.map((item) => {
                    const isUpNext = nextRoutineItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleRoutineWithFeedback(item)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border text-left transition-colors ${
                          isUpNext
                            ? 'bg-[#FAF3F1] dark:bg-[#26211F] border-[#E8D0D4] dark:border-[#C89B54]/45'
                            : 'bg-[#F8F5F0]/75 dark:bg-[#161616] border-[#EAE3D9] dark:border-[#2A2825] hover:border-[#CBBFB2] dark:hover:border-[#49443E]'
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            item.completed
                              ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                              : isUpNext
                                ? 'border-[#800020] dark:border-[#D4A85E]'
                                : 'border-[#CFC5B8] dark:border-[#49443E]'
                          }`}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium truncate ${
                              item.completed
                                ? 'line-through text-[#8C8278] dark:text-[#7D766E]'
                                : 'text-[#292522] dark:text-[#F3EFEA]'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="font-mono text-[11px] text-[#6E6359] dark:text-[#9E958C] tabular-nums">
                            {formatTime12h(item.time)}
                            {isUpNext && (
                              <span className="text-[#800020] dark:text-[#D4A85E] font-medium">
                                {' '}· up next
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Unified Habit Garden (Merged Checklist Controls + Botanical Plants) */}
            <section
              aria-label="Habit Garden"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A6B53] dark:text-[#8AB896]">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>
                      Habit Garden · {bestStreak} day best streak · {weeklyHabitConsistency}% weekly
                    </span>
                  </p>
                  <h2 className="mt-0.5 font-display text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                    nurture your botanical blooms
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('habits')}
                  className="text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline whitespace-nowrap"
                >
                  Open habit tracker →
                </button>
              </div>

              {habits.length === 0 ? (
                <div className="rounded-2xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-dashed border-[#DFD6CA] dark:border-[#2E2C29] p-6 text-center space-y-3">
                  <div className="mx-auto w-20">
                    <HabitGardenPlant habitKey="water" plantStyle="fern" progressPct={50} />
                  </div>
                  <p className="text-xs text-[#6E6359] dark:text-[#A69E94] max-w-sm mx-auto">
                    Your habit conservatory is ready. Plant a custom daily habit or add 4 classic botanical habits to begin.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('habits')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Plant Habit</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLoadStarterHabits}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#FFFDF9] dark:bg-[#1E1E1E] text-[#292522] dark:text-[#F3EFEA]"
                    >
                      <span>Try 4 Starter Habits</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {habits.map((habit) => {
                    const pct = Math.min(100, Math.round((habit.todayValue / habit.targetValue) * 100));
                    const isMet = habit.todayValue >= habit.targetValue;
                    const stageLabel = getGrowthStageLabel(pct);
                    const streak = computeHabitStreak(habit.weeklyHistory);
                    return (
                      <div
                        key={habit.key}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-2.5 transition-colors ${
                          isMet
                            ? 'bg-[#F5F9F6] dark:bg-[#19231D] border-[#C5DBC9] dark:border-[#344D3D]'
                            : 'bg-[#F8F5F0]/80 dark:bg-[#161616] border-[#E6DFD5] dark:border-[#2A2825]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 shrink-0">
                            <HabitGardenPlant
                              habitKey={habit.key}
                              plantStyle={habit.plantStyle}
                              progressPct={pct}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#292522] dark:text-[#F3EFEA] truncate">
                              {habit.name}
                            </p>
                            <p className="text-[11px] text-[#6E6359] dark:text-[#9E958C] truncate">
                              {stageLabel} · {streak}d streak
                            </p>
                            <p className="mt-0.5 font-mono text-xs font-medium text-[#292522] dark:text-[#F3EFEA] tabular-nums">
                              {habit.todayValue}/{habit.targetValue} {habit.unit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAdjustHabit(habit.key, -habit.step)}
                            disabled={habit.todayValue <= 0}
                            aria-label={`Decrease ${habit.name}`}
                            className="w-8 h-8 rounded-lg border border-[#E6DFD5] dark:border-[#34312D] bg-[#FFFDF9] dark:bg-[#222120] flex items-center justify-center text-[#4F4740] dark:text-[#CFC7BE] disabled:opacity-35 shrink-0"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHabitIncrement(habit)}
                            aria-label={`Increase ${habit.name}`}
                            className="w-8 h-8 rounded-lg bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] flex items-center justify-center shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHabitBloomToggle(habit)}
                            className={`flex-1 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                              isMet
                                ? 'bg-[#4A6B53] dark:bg-[#4E7559] text-[#FFFDF9]'
                                : 'bg-[#FFFDF9] dark:bg-[#222120] border border-[#E6DFD5] dark:border-[#34312D] text-[#292522] dark:text-[#F3EFEA] hover:border-[#800020] dark:hover:border-[#D4A85E]'
                            }`}
                          >
                            {isMet ? 'Blooming' : 'Complete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ================= RIGHT RAIL (3 cols) ================= */}
          <div className="xl:col-span-3 space-y-5 order-3">
            {/* My Affirmations */}
            <section
              aria-label="My Affirmations"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                  my affirmations
                </h2>
                <button
                  type="button"
                  onClick={() => setAffirmationIdx((prev) => prev + 1)}
                  aria-label="Shuffle affirmations"
                  className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F4EFE7] dark:hover:bg-[#282624] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <ul className="space-y-2 text-xs text-[#4F4740] dark:text-[#D5CFC7] leading-relaxed">
                {affirmationSet.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#800020] dark:text-[#D4A85E] mt-0.5" aria-hidden="true">
                      ▸
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFE9E0] dark:border-[#2A2825]">
                <p className="text-xs italic text-[#6E6359] dark:text-[#9E958C] truncate">
                  {quote.author}
                </p>
                <button
                  type="button"
                  onClick={handleReflectOnAffirmation}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline whitespace-nowrap shrink-0"
                >
                  <Feather className="w-3 h-3" />
                  <span>Reflect</span>
                </button>
              </div>
            </section>

            {/* Entries: Journal & Mind Dump */}
            <section
              ref={entriesSectionRef}
              aria-label="Entries: Journal and Mind Dump"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3.5 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                  entries
                </h2>
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#EFE9E0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825]">
                  <button
                    type="button"
                    onClick={() => setEntryMode('journal')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      entryMode === 'journal'
                        ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E]'
                        : 'text-[#6E6359] dark:text-[#A69E94]'
                    }`}
                  >
                    journal
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('minddump')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      entryMode === 'minddump'
                        ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E]'
                        : 'text-[#6E6359] dark:text-[#A69E94]'
                    }`}
                  >
                    mind dump
                  </button>
                </div>
              </div>

              {entryMode === 'journal' ? (
                <form onSubmit={handleSaveJournal} className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2A2825] p-2.5">
                    <p className="text-xs text-[#5C534D] dark:text-[#BFB7AD] italic leading-snug">
                      {currentPrompt}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPromptIdx((p) => p + 1)}
                      aria-label="Next journal prompt"
                      className="p-1 rounded-md text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] shrink-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={companion.journalDraftTitle}
                    onChange={(e) =>
                      setJournalDraft(e.target.value, companion.journalDraftContent)
                    }
                    placeholder="Entry title..."
                    aria-label="Journal entry title"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  />

                  <textarea
                    ref={journalTextareaRef}
                    rows={3}
                    value={companion.journalDraftContent}
                    onChange={(e) =>
                      setJournalDraft(companion.journalDraftTitle, e.target.value)
                    }
                    placeholder="Write your thoughts gently..."
                    aria-label="Journal entry body"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs leading-relaxed text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E] resize-none"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPastEntries((s) => !s)}
                      className="text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]"
                    >
                      {showPastEntries
                        ? 'Hide saved entries'
                        : `${companion.journalEntries.length} saved ${companion.journalEntries.length === 1 ? 'entry' : 'entries'}`}
                    </button>
                    <button
                      type="submit"
                      disabled={!companion.journalDraftContent.trim()}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] disabled:opacity-40 whitespace-nowrap"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    value={companion.mindDumpText}
                    onChange={(e) => setMindDumpText(e.target.value)}
                    placeholder="Clear your head here—every word auto-saves..."
                    aria-label="Mind dump scratchpad"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F8F5F0]/80 dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs leading-relaxed text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E] resize-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6E6359] dark:text-[#9E958C]">
                      Auto-saved locally
                    </span>
                    <button
                      type="button"
                      onClick={handleArchiveMindDump}
                      disabled={!companion.mindDumpText.trim()}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] disabled:opacity-40 whitespace-nowrap"
                    >
                      Archive to Notes
                    </button>
                  </div>
                </div>
              )}

              {showPastEntries && (
                <div className="pt-2 border-t border-[#EFE9E0] dark:border-[#2A2825] space-y-2 max-h-48 overflow-y-auto">
                  {companion.journalEntries.length === 0 ? (
                    <p className="text-xs text-[#6E6359] dark:text-[#9E958C] py-2">
                      No saved entries yet. Write your first reflection above.
                    </p>
                  ) : (
                    companion.journalEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-[#F8F5F0] dark:bg-[#161616] p-2.5 border border-[#E6DFD5] dark:border-[#2A2825] flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#292522] dark:text-[#F3EFEA] truncate">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#6E6359] dark:text-[#9E958C] line-clamp-2">
                            {entry.content}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteJournalEntry(entry.id)}
                          aria-label={`Delete journal entry "${entry.title}"`}
                          className="p-1 rounded-md text-[#8C8278] hover:text-[#800020] dark:hover:text-[#E58A9B] shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* Reminders Checklist */}
            <section
              aria-label="Reminders"
              className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 sm:p-5 space-y-3 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium text-[#292522] dark:text-[#F3EFEA]">
                  reminders
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="text-xs font-medium text-[#800020] dark:text-[#D4A85E] hover:underline"
                >
                  {reminderNotes.length > 5
                    ? `View all (${reminderNotes.length}) →`
                    : 'Notes →'}
                </button>
              </div>

              <div className="space-y-1.5">
                {reminderNotes.length === 0 ? (
                  <p className="text-xs text-[#6E6359] dark:text-[#9E958C]">
                    No reminders yet. Add a quick reminder below.
                  </p>
                ) : (
                  reminderNotes.slice(0, 5).map((note) => {
                    const isDone = Boolean(note.completed);
                    const isOverdue = !isDone && Boolean(note.reminderDate) && note.reminderDate! < todayISO;
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => onToggleNoteCompleted?.(note.id)}
                        className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl bg-[#F8F5F0]/75 dark:bg-[#161616] border border-[#EAE3D9] dark:border-[#2A2825] text-left hover:border-[#CBBFB2] dark:hover:border-[#49443E] transition-colors"
                      >
                        <span
                          className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                              : 'border-[#CFC5B8] dark:border-[#49443E]'
                          }`}
                        >
                          {isDone && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs leading-snug ${
                              isDone
                                ? 'line-through text-[#8C8278] dark:text-[#7D766E]'
                                : 'text-[#292522] dark:text-[#F3EFEA]'
                            }`}
                          >
                            {note.title}
                          </p>
                          {note.reminderDate && (
                            <p
                              className={`font-mono text-[11px] tabular-nums ${
                                isOverdue
                                  ? 'text-[#800020] dark:text-[#E58A9B] font-medium'
                                  : 'text-[#800020] dark:text-[#D4A85E]'
                              }`}
                            >
                              {isOverdue ? `Overdue (${note.reminderDate})` : note.reminderDate}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddQuickReminder} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={quickReminderTitle}
                  onChange={(e) => setQuickReminderTitle(e.target.value)}
                  placeholder="Add reminder..."
                  aria-label="Quick add reminder"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                />
                <button
                  type="submit"
                  disabled={!quickReminderTitle.trim()}
                  aria-label="Save reminder"
                  className="p-2 rounded-lg bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
