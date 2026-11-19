import type { Habit, MyDayState, RoutineItem, Weekday } from '../types';

export const WEEK_DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MOTIVATIONAL_QUOTES: Array<{ text: string; author: string }> = [
  {
    text: 'Small, unhurried steps repeated every day quietly build the life you want.',
    author: 'My Day Principle',
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
    text: 'Every page read, every design practiced, and every application sent moves the needle forward.',
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

export function getDateForWeekday(day: Weekday): string {
  const todayIdx = getTodayWeekdayIndex();
  const targetIdx = WEEK_DAYS.indexOf(day);
  return getOffsetDateISO(targetIdx - todayIdx);
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

export function createDefaultRoutine(): RoutineItem[] {
  return [
    {
      id: 'rt-1',
      time: '09:00',
      title: 'Wake up',
      category: 'Morning',
      completed: true,
      notes: 'Open curtains, hydrate, and stretch for 5 minutes.',
    },
    {
      id: 'rt-2',
      time: '09:30',
      title: 'Breakfast',
      category: 'Morning',
      completed: true,
      notes: 'Balanced breakfast without rushing.',
    },
    {
      id: 'rt-3',
      time: '10:00',
      title: 'Study',
      category: 'Study',
      completed: true,
      notes: 'Focused deep learning session.',
    },
    {
      id: 'rt-4',
      time: '11:00',
      title: 'Bath and household work',
      category: 'Home',
      completed: false,
      notes: 'Freshen up, tidy workspace, and light chores.',
    },
    {
      id: 'rt-5',
      time: '12:30',
      title: 'Lunch',
      category: 'Wellness',
      completed: false,
      notes: 'Step away from screens during lunch.',
    },
    {
      id: 'rt-6',
      time: '13:30',
      title: 'UX design practice',
      category: 'Study',
      completed: false,
      notes: 'Wireframing, case study polish, or component audit.',
    },
    {
      id: 'rt-7',
      time: '15:00',
      title: 'English practice',
      category: 'Study',
      completed: false,
      notes: 'Speaking, vocabulary notes, or listening exercise.',
    },
    {
      id: 'rt-8',
      time: '16:00',
      title: 'Job searching and applications',
      category: 'Career',
      completed: false,
      notes: 'Tailor resume, apply to target roles, and follow up.',
    },
    {
      id: 'rt-9',
      time: '17:00',
      title: 'Hobbies',
      category: 'Wellness',
      completed: false,
      notes: 'Sketching, music, walk outdoors, or creative play.',
    },
    {
      id: 'rt-10',
      time: '19:00',
      title: 'Dinner',
      category: 'Wellness',
      completed: false,
      notes: 'Warm dinner and unwind.',
    },
    {
      id: 'rt-11',
      time: '20:00',
      title: 'Revision and tomorrow planning',
      category: 'Evening',
      completed: false,
      notes: 'Review study notes and pick top 3 priorities for tomorrow.',
    },
    {
      id: 'rt-12',
      time: '22:30',
      title: 'Sleep',
      category: 'Evening',
      completed: false,
      notes: 'Screens off by 10:15 PM for restful sleep.',
    },
  ];
}

function buildInitialWeeklyHistory(
  pattern: boolean[],
): [boolean, boolean, boolean, boolean, boolean, boolean, boolean] {
  const todayIdx = getTodayWeekdayIndex();
  return [0, 1, 2, 3, 4, 5, 6].map((idx) => (idx <= todayIdx ? pattern[idx] : false)) as [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
    boolean,
  ];
}

export function createInitialHabits(): Habit[] {
  const todayIdx = getTodayWeekdayIndex();

  const water = buildInitialWeeklyHistory([true, true, true, true, false, true, true]);
  water[todayIdx] = false;

  const exercise = buildInitialWeeklyHistory([true, false, true, true, true, false, true]);
  exercise[todayIdx] = true;

  const studying = buildInitialWeeklyHistory([true, true, true, true, true, true, true]);
  studying[todayIdx] = true;

  const reading = buildInitialWeeklyHistory([true, true, false, true, true, true, false]);
  reading[todayIdx] = false;

  const english = buildInitialWeeklyHistory([true, true, true, false, true, true, true]);
  english[todayIdx] = false;

  return [
    {
      key: 'water',
      name: 'Water',
      unit: 'glasses',
      step: 1,
      todayValue: 5,
      targetValue: 8,
      minTarget: 4,
      maxTarget: 14,
      weeklyHistory: water,
    },
    {
      key: 'exercise',
      name: 'Exercise',
      unit: 'min',
      step: 10,
      todayValue: 30,
      targetValue: 30,
      minTarget: 15,
      maxTarget: 90,
      weeklyHistory: exercise,
    },
    {
      key: 'studying',
      name: 'Studying',
      unit: 'min',
      step: 15,
      todayValue: 60,
      targetValue: 60,
      minTarget: 20,
      maxTarget: 180,
      weeklyHistory: studying,
    },
    {
      key: 'reading',
      name: 'Reading',
      unit: 'pages',
      step: 5,
      todayValue: 10,
      targetValue: 20,
      minTarget: 5,
      maxTarget: 60,
      weeklyHistory: reading,
    },
    {
      key: 'english',
      name: 'English Practice',
      unit: 'min',
      step: 10,
      todayValue: 20,
      targetValue: 30,
      minTarget: 10,
      maxTarget: 90,
      weeklyHistory: english,
    },
  ];
}

export function createInitialMyDayState(): MyDayState {
  const today = getTodayWeekday();
  const nextDay = WEEK_DAYS[(getTodayWeekdayIndex() + 1) % 7];
  const prevDay = WEEK_DAYS[(getTodayWeekdayIndex() + 6) % 7];
  const plus2Day = WEEK_DAYS[(getTodayWeekdayIndex() + 2) % 7];
  const plus3Day = WEEK_DAYS[(getTodayWeekdayIndex() + 3) % 7];

  return {
    tasks: [
      {
        id: 'td-1',
        title: 'Complete Figma component library spacing audit',
        time: '13:30',
        deadline: getTodayDateISO(),
        priority: 'High',
        category: 'UX Design',
        day: today,
        completed: false,
        notes: 'Verify 8px grid alignment across mobile cards and buttons.',
      },
      {
        id: 'td-2',
        title: 'Read 15 minutes of English article & note 5 phrases',
        time: '15:00',
        deadline: getTodayDateISO(),
        priority: 'Medium',
        category: 'Study',
        day: today,
        completed: false,
      },
      {
        id: 'td-3',
        title: 'Submit 2 tailored UX Designer job applications',
        time: '16:00',
        deadline: getTodayDateISO(),
        priority: 'High',
        category: 'Career',
        day: today,
        completed: false,
        notes: 'Attach updated portfolio PDF and short cover note.',
      },
      {
        id: 'td-4',
        title: 'Morning study notes & flashcard review',
        time: '10:00',
        deadline: getTodayDateISO(),
        priority: 'Medium',
        category: 'Study',
        day: today,
        completed: true,
      },
      {
        id: 'td-5',
        title: 'Organize desk & laundry fold',
        time: '11:15',
        deadline: getTodayDateISO(),
        priority: 'Low',
        category: 'Home',
        day: today,
        completed: true,
      },
      {
        id: 'td-6',
        title: 'Finalize case study hero mockups',
        time: '14:00',
        deadline: getDateForWeekday(nextDay),
        priority: 'High',
        category: 'UX Design',
        day: nextDay,
        completed: false,
      },
      {
        id: 'td-7',
        title: 'Practice 20-min English mock interview responses',
        time: '15:00',
        deadline: getDateForWeekday(nextDay),
        priority: 'Medium',
        category: 'Career',
        day: nextDay,
        completed: false,
      },
      {
        id: 'td-8',
        title: 'Grocery restock & meal prep basics',
        time: '17:30',
        deadline: getDateForWeekday(plus2Day),
        priority: 'Medium',
        category: 'Personal',
        day: plus2Day,
        completed: false,
      },
      {
        id: 'td-9',
        title: 'Weekly portfolio LinkedIn post draft',
        time: '16:00',
        deadline: getDateForWeekday(plus3Day),
        priority: 'Low',
        category: 'Career',
        day: plus3Day,
        completed: false,
      },
      {
        id: 'td-10',
        title: 'Review design systems typography chapter',
        time: '10:00',
        deadline: getDateForWeekday(prevDay),
        priority: 'Medium',
        category: 'Study',
        day: prevDay,
        completed: true,
      },
    ],
    routine: createDefaultRoutine(),
    habits: createInitialHabits(),
    notes: [
      {
        id: 'nt-1',
        title: 'UX Portfolio Interview Talking Points',
        content:
          'Explain problem framing first, show before/after user flow simplification, and share measurable task completion improvements.',
        category: 'Career',
        updatedAt: getTodayDateISO(),
      },
      {
        id: 'nt-critique',
        title: 'Daily Planner UX Critique Notes',
        content:
          'Keep primary actions reachable in one click, avoid deep nested modals for quick tasks, and ensure comfortable contrast on warm neutral surfaces.',
        category: 'Critique',
        updatedAt: getTodayDateISO(),
      },
      {
        id: 'nt-2',
        title: 'English Speaking Practice Phrases',
        content:
          'Practice transition phrases: "To put that in context...", "What stood out during testing was...", "My main takeaway is...".',
        category: 'Study',
        updatedAt: getOffsetDateISO(-1),
      },
      {
        id: 'nt-3',
        title: 'Follow up with recruiter at Studio North',
        content: 'Send a polite check-in email regarding the product design application submitted last week.',
        category: 'Reminder',
        reminderDate: getOffsetDateISO(1),
        completed: false,
        updatedAt: getTodayDateISO(),
      },
      {
        id: 'nt-4',
        title: 'Evening Wind-Down Checklist',
        content: 'Refill water bottle, pack tomorrow study notes, and turn on sleep focus mode at 10:15 PM.',
        category: 'Personal',
        updatedAt: getOffsetDateISO(-2),
      },
    ],
  };
}
