import type { Habit, MyDayState, RoutineItem, Weekday } from '../types';

export const WEEK_DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DEFAULT_FOCUS_CATEGORIES: string[] = [
  'Study',
  'Work',
  'Personal',
  'Home',
  'Health',
  'Creative',
];

export const MOTIVATIONAL_QUOTES: Array<{ text: string; author: string }> = [
  {
    text: 'Small, unhurried steps repeated every day quietly build the life you want.',
    author: 'DayEase Principle',
  },
  {
    text: 'Clarity comes from deciding what matters today, not from doing everything at once.',
    author: 'Daily Focus',
  },
  {
    text: 'Consistency beats intensity. Show up gently for your craft, your health, and your rest.',
    author: 'Mindful Routine',
  },
  {
    text: 'An organized morning creates room for thoughtful work and peaceful evenings.',
    author: 'Calm Productivity',
  },
  {
    text: 'Every page read, every skill practiced, and every thoughtful step moves the needle forward.',
    author: 'Steady Progress',
  },
];

/** Returns 0 for Mon .. 6 for Sun */
export function getTodayWeekdayIndex(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function getTodayWeekday(): Weekday {
  return WEEK_DAYS[getTodayWeekdayIndex()];
}

export function getDateForWeekday(day: Weekday, weekOffset = 0): string {
  const todayIdx = getTodayWeekdayIndex();
  const targetIdx = WEEK_DAYS.indexOf(day);
  return getOffsetDateISO(targetIdx - todayIdx + weekOffset * 7);
}

export function getWeekStartISO(weekOffset = 0): string {
  const todayIdx = getTodayWeekdayIndex();
  return getOffsetDateISO(-todayIdx + weekOffset * 7);
}

export function getTodayDateISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateISO(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatTime12h(time24: string): string {
  if (!time24) return 'Anytime';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Optional starter routine template — only applied when a user explicitly clicks to load it */
export function createStarterRoutineTemplate(): RoutineItem[] {
  const ts = Date.now();
  return [
    {
      id: `rt-${ts}-1`,
      time: '07:30',
      title: 'Morning hydration & stretch',
      category: 'Morning',
      completed: false,
      notes: 'Open curtains, drink a full glass of water, and take five slow breaths.',
    },
    {
      id: `rt-${ts}-2`,
      time: '08:15',
      title: 'Breakfast & daily intention',
      category: 'Morning',
      completed: false,
      notes: 'Enjoy breakfast unhurriedly and choose one key priority.',
    },
    {
      id: `rt-${ts}-3`,
      time: '09:30',
      title: 'Deep focus block',
      category: 'Study',
      completed: false,
      notes: 'Dedicated time for your most important project or learning.',
    },
    {
      id: `rt-${ts}-4`,
      time: '12:30',
      title: 'Midday pause & lunch',
      category: 'Wellness',
      completed: false,
      notes: 'Step away from screens for a calm meal and fresh air.',
    },
    {
      id: `rt-${ts}-5`,
      time: '14:00',
      title: 'Afternoon momentum block',
      category: 'Career',
      completed: false,
      notes: 'Tackle smaller tasks, replies, or collaborative work.',
    },
    {
      id: `rt-${ts}-6`,
      time: '17:30',
      title: 'Movement & workspace reset',
      category: 'Home',
      completed: false,
      notes: 'A short walk, workout, or tidying your desk before evening.',
    },
    {
      id: `rt-${ts}-7`,
      time: '21:00',
      title: 'Evening reflection & wind-down',
      category: 'Evening',
      completed: false,
      notes: 'Jot down one win from today and dim lights for restful sleep.',
    },
  ];
}

/** Optional starter habits template — zero pre-filled fake history; only added if user chooses */
export function createStarterHabitsTemplate(): Habit[] {
  const emptyWeek: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];
  return [
    {
      key: 'water',
      name: 'Water',
      unit: 'glasses',
      step: 1,
      todayValue: 0,
      targetValue: 8,
      minTarget: 4,
      maxTarget: 14,
      plantStyle: 'fern',
      weeklyHistory: [...emptyWeek],
    },
    {
      key: 'exercise',
      name: 'Movement',
      unit: 'min',
      step: 10,
      todayValue: 0,
      targetValue: 30,
      minTarget: 15,
      maxTarget: 90,
      plantStyle: 'olive',
      weeklyHistory: [...emptyWeek],
    },
    {
      key: 'studying',
      name: 'Deep Focus',
      unit: 'min',
      step: 15,
      todayValue: 0,
      targetValue: 45,
      minTarget: 15,
      maxTarget: 180,
      plantStyle: 'camellia',
      weeklyHistory: [...emptyWeek],
    },
    {
      key: 'reading',
      name: 'Reading',
      unit: 'pages',
      step: 5,
      todayValue: 0,
      targetValue: 15,
      minTarget: 5,
      maxTarget: 60,
      plantStyle: 'peony',
      weeklyHistory: [...emptyWeek],
    },
  ];
}

/** Clean, completely empty workspace for every new visitor */
export function createInitialMyDayState(): MyDayState {
  return {
    tasks: [],
    routine: [],
    habits: [],
    notes: [],
    customCategories: [],
    lastOpenedDate: getTodayDateISO(),
    lastOpenedWeekStart: getWeekStartISO(0),
  };
}
