import {
  LayoutDashboard,
  CheckSquare,
  Clock3,
  CalendarDays,
  Activity,
  StickyNote,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import type { AppTab } from '../types';

export const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'todos', label: 'To-Do List', shortLabel: 'To-Do', icon: CheckSquare },
  { id: 'routine', label: 'Daily Routine', shortLabel: 'Routine', icon: Clock3 },
  { id: 'weekly', label: 'Weekly Planner', shortLabel: 'Weekly', icon: CalendarDays },
  { id: 'habits', label: 'Habit Tracker', shortLabel: 'Habits', icon: Activity },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', icon: StickyNote },
];

interface SidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onRequestReset: () => void;
  onOpenGuide: () => void;
  pendingTodayCount: number;
}

function MyDayMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="9" fill="#6D1D2C" />
      <circle cx="14" cy="14" r="5.2" stroke="#FAF7F2" strokeWidth="1.8" />
      <path
        d="M14 11.2V14L16 15.2"
        stroke="#FAF7F2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar({
  activeTab,
  onSelectTab,
  onRequestReset,
  onOpenGuide,
  pendingTodayCount,
}: SidebarProps) {
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 bg-[#F2ECE3] border-r border-[#E6DDD0] px-5 py-7 justify-between z-30">
        <div>
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-[#E6DDD0]">
            <MyDayMark />
            <span className="font-display text-2xl font-semibold tracking-tight text-[#1F1A17] whitespace-nowrap">
              My Day
            </span>
          </div>

          <p className="mt-5 px-2 text-xs text-[#6B625B] tabular-nums">
            {todayLabel} · {pendingTodayCount} {pendingTodayCount === 1 ? 'task' : 'tasks'} left
          </p>

          <nav aria-label="Primary navigation" className="mt-4 flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-[#6D1D2C] text-white'
                      : 'text-[#4A433E] hover:bg-[#E7DDD0] hover:text-[#1F1A17]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E6DDD0] space-y-1">
          <button
            type="button"
            onClick={onOpenGuide}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#E7DDD0] transition-colors whitespace-nowrap"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>How My Day Works</span>
          </button>
          <button
            type="button"
            onClick={onRequestReset}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6B625B] hover:text-[#1F1A17] hover:bg-[#E7DDD0] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-4 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#E6DDD0] px-4 h-14">
        <div className="flex items-center gap-2.5 min-w-0">
          <MyDayMark />
          <span className="font-display text-xl font-semibold tracking-tight text-[#1F1A17] whitespace-nowrap">
            My Day
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="How My Day Works"
            className="p-2 rounded-lg text-[#6B625B] bg-[#F2ECE3] hover:text-[#1F1A17] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRequestReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B625B] bg-[#F2ECE3] hover:bg-[#E7DDD0] hover:text-[#1F1A17] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-[#E6DDD0] px-1 py-1 grid grid-cols-6 gap-0.5"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#6D1D2C] bg-[#F7ECEE]'
                  : 'text-[#6B625B] hover:text-[#1F1A17]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="mt-0.5 text-[10px] font-medium leading-tight whitespace-nowrap truncate max-w-full">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
