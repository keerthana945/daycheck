export type AppTab =
  | 'dashboard'
  | 'todos'
  | 'routine'
  | 'weekly'
  | 'habits'
  | 'notes';

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type Priority = 'High' | 'Medium' | 'Low';

export type TaskCategory =
  | 'Study'
  | 'UX Design'
  | 'Career'
  | 'Personal'
  | 'Home'
  | 'Health';

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

export type HabitKey = 'water' | 'exercise' | 'studying' | 'reading' | 'english';

export interface Habit {
  key: HabitKey;
  name: string;
  unit: string;
  step: number;
  todayValue: number;
  targetValue: number;
  minTarget: number;
  maxTarget: number;
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
  updatedAt: string;
}

export interface MyDayState {
  tasks: Task[];
  routine: RoutineItem[];
  habits: Habit[];
  notes: Note[];
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

