export type AppTab =
  | 'dashboard'
  | 'todos'
  | 'routine'
  | 'weekly'
  | 'habits'
  | 'notes';

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type Priority = 'High' | 'Medium' | 'Low';

export type DefaultTaskCategory =
  | 'Study'
  | 'UX Design'
  | 'Career'
  | 'Personal'
  | 'Home'
  | 'Health';

export type TaskCategory = DefaultTaskCategory | (string & {});

export type TaskFilter = 'All' | 'Pending' | 'Completed' | 'High Priority';

export interface Task {
  id: string;
  title: string;
  time: string; // HH:MM
  deadline: string; // YYYY-MM-DD
  priority: Priority;
  category: TaskCategory;
  day: Weekday;
  completed: boolean;
  notes?: string;
}

export type RoutineCategory = 'Morning' | 'Study' | 'Career' | 'Home' | 'Wellness' | 'Evening';

export interface RoutineItem {
  id: string;
  time: string; // HH:MM
  title: string;
  category: RoutineCategory;
  completed: boolean;
  notes?: string;
}

export type DefaultHabitKey = 'water' | 'exercise' | 'studying' | 'reading' | 'english';
export type HabitKey = DefaultHabitKey | (string & {});

export type PlantStyle = 'fern' | 'olive' | 'camellia' | 'peony' | 'lavender';

export interface Habit {
  key: HabitKey;
  name: string;
  unit: string;
  step: number;
  todayValue: number;
  targetValue: number;
  minTarget: number;
  maxTarget: number;
  plantStyle?: PlantStyle;
  isCustom?: boolean;
  /** 7 booleans representing Mon..Sun of the current week */
  weeklyHistory: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
}

export type NoteCategory = 'Personal' | 'Study' | 'Career' | 'Critique' | 'Reminder';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  reminderDate?: string;
  completed?: boolean;
  pinned?: boolean;
  updatedAt: string;
}

export interface MyDayState {
  tasks: Task[];
  routine: RoutineItem[];
  habits: Habit[];
  notes: Note[];
  customCategories?: string[];
  lastOpenedDate?: string; // YYYY-MM-DD for automatic daily rollover
  lastOpenedWeekStart?: string; // Monday YYYY-MM-DD for weekly habit rollover
}

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
}

export type MoodKey =
  | 'calm'
  | 'inspired'
  | 'focused'
  | 'reflective'
  | 'tired'
  | 'overwhelmed';

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: MoodKey;
  note?: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  prompt: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  taskId?: string;
  taskTitle?: string;
  completedAt: string;
}

export interface MorningResetRecord {
  date: string; // YYYY-MM-DD
  intention: string;
  rolledOverCount: number;
  completedAt: string;
}

export interface EveningReflectionRecord {
  date: string; // YYYY-MM-DD
  highlight: string;
  gratitude: string;
  completedAt: string;
}
