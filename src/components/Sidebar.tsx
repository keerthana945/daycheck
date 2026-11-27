import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  CalendarDays,
  Activity,
  StickyNote,
  RotateCcw,
  HelpCircle,
  Monitor,
  Sun,
  Moon,
  MoreHorizontal,
  Download,
  Pause,
  Play,
  Timer,
} from 'lucide-react';
import { useFocusTimer } from '../hooks/useFocusTimer';
import type { ThemePreference } from '../hooks/useTheme';
import type { AppTab } from '../types';

export const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'todos', label: 'To-Do List', shortLabel: 'To-Do', icon: CheckSquare },
  { id: 'routine', label: 'Daily Routine', shortLabel: 'Routine', icon: Clock },
  { id: 'weekly', label: 'Weekly Planner', shortLabel: 'Weekly', icon: CalendarDays },
  { id: 'habits', label: 'Habit Tracker', shortLabel: 'Habits', icon: Activity },
  { id: 'notes', label: 'Notes & Reminders', shortLabel: 'Notes', icon: StickyNote },
];

interface SidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onRequestReset: () => void;
  onOpenGuide: () => void;
  onOpenBackup: () => void;
  pendingTodayCount: number;
  themePreference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  onSetThemePreference: (pref: ThemePreference) => void;
  onCycleTheme: () => void;
}

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-[#E8E1D7] dark:border-[#C89B54]/60 bg-[#F4F1EC] shrink-0 shadow-[0_1px_2px_rgba(41,37,34,0.08)]`}
    >
      <img
        src="/assets/aistudio/dayease_81fc60c2.png"
        alt="DayEase logo"
        className="w-full h-full object-cover scale-[1.72]"
      />
    </div>
  );
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  onRequestReset,
  onOpenGuide,
  onOpenBackup,
  pendingTodayCount,
  themePreference,
  resolvedTheme,
  onSetThemePreference,
  onCycleTheme,
}: SidebarProps) {
  const { running, secondsLeft, selectedMinutes, linkedTaskTitle, toggleRunning } = useFocusTimer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('mousedown', closeOnOutside);
    window.addEventListener('keydown', closeOnEsc);
    return () => {
      window.removeEventListener('mousedown', closeOnOutside);
      window.removeEventListener('keydown', closeOnEsc);
    };
  }, [mobileMenuOpen]);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const MobileThemeIcon =
    themePreference === 'system'
      ? Monitor
      : resolvedTheme === 'dark'
        ? Moon
        : Sun;

  const mobileThemeLabel =
    themePreference === 'system'
      ? `Theme: Auto (${resolvedTheme})`
      : `Theme: ${themePreference}`;

  const timerActiveOrPausedMidSession = running || secondsLeft < selectedMinutes * 60;
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <>
      {/* Desktop Editorial Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 bg-[#FFFDF9] dark:bg-[#181818] border-r border-[#E8E1D7] dark:border-[#2A2826] px-5 py-7 justify-between z-30 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-[#EFE9E0] dark:border-[#262422]">
            <BrandMark />
            <span className="font-display text-2xl font-semibold tracking-tight text-[#292522] dark:text-[#F3EFEA] whitespace-nowrap">
              DayEase
            </span>
          </div>

          <p className="mt-5 px-2.5 text-xs text-[#6E6359] dark:text-[#A69E94] tabular-nums">
            <span>{todayLabel}</span>
            <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
            <span>{pendingTodayCount} {pendingTodayCount === 1 ? 'task' : 'tasks'} left</span>
          </p>

          <nav aria-label="Primary navigation" className="mt-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] shadow-[0_1px_2px_rgba(128,0,32,0.18)] dark:shadow-none'
                      : 'text-[#4F4740] dark:text-[#C9C1B8] hover:bg-[#F8F5F0] dark:hover:bg-[#222120] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#FFFDF9] dark:text-[#141414]' : 'text-[#A69A8D] dark:text-[#8E867E]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Persistent Focus Timer mini-widget when away from Dashboard */}
          {timerActiveOrPausedMidSession && activeTab !== 'dashboard' && (
            <div className="mt-5 rounded-2xl bg-[#FAF3F1] dark:bg-[#231F1D] border border-[#EAD9D8] dark:border-[#3D342D] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#800020] dark:text-[#D4A85E] tabular-nums">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{mins}:{secs}</span>
                </span>
                <button
                  type="button"
                  onClick={toggleRunning}
                  aria-label={running ? 'Pause focus timer' : 'Resume focus timer'}
                  className="p-1.5 rounded-lg bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414]"
                >
                  {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
              {linkedTaskTitle && (
                <p className="text-[11px] text-[#5C534D] dark:text-[#BFB7AD] truncate">
                  {linkedTaskTitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#EFE9E0] dark:border-[#262422] space-y-3">
          {/* Appearance Switcher (Auto / Light / Dark) */}
          <div className="px-1">
            <p className="px-2 mb-1.5 text-xs font-medium text-[#6E6359] dark:text-[#A69E94]">
              Appearance
            </p>
            <div
              role="group"
              aria-label="Theme preference"
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#222120] border border-[#E8E1D7] dark:border-[#2E2C29]"
            >
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = themePreference === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSetThemePreference(opt.value)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#FFFDF9] dark:bg-[#141414] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.08)]'
                        : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={onOpenBackup}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#222120] transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0 text-[#A69A8D] dark:text-[#8E867E]" />
              <span>Backup &amp; Restore</span>
            </button>
            <button
              type="button"
              onClick={onOpenGuide}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#222120] transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#A69A8D] dark:text-[#8E867E]" />
              <span>How DayEase Works</span>
            </button>
            <button
              type="button"
              onClick={onRequestReset}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#222120] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-[#A69A8D] dark:text-[#8E867E]" />
              <span>Clear My Workspace</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Clean Header (Uncluttered: Logo + optional live timer + Theme + More menu) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#FFFDF9]/95 dark:bg-[#181818]/95 backdrop-blur-sm border-b border-[#E8E1D7] dark:border-[#2A2826] px-4 h-14 transition-colors duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark size="sm" />
          <span className="font-display text-xl font-semibold tracking-tight text-[#292522] dark:text-[#F3EFEA] whitespace-nowrap">
            DayEase
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" ref={mobileMenuRef}>
          {timerActiveOrPausedMidSession && activeTab !== 'dashboard' && (
            <button
              type="button"
              onClick={toggleRunning}
              aria-label={running ? 'Pause focus timer' : 'Resume focus timer'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#FAF3F1] dark:bg-[#26211F] text-[#800020] dark:text-[#D4A85E] border border-[#EAD9D8] dark:border-[#493E33] tabular-nums"
            >
              {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{mins}:{secs}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCycleTheme}
            aria-label={mobileThemeLabel}
            title={mobileThemeLabel}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6E6359] dark:text-[#A69E94] bg-[#F8F5F0] dark:bg-[#222120] hover:text-[#292522] dark:hover:text-[#F3EFEA] transition-colors whitespace-nowrap"
          >
            <MobileThemeIcon className="w-3.5 h-3.5" />
            <span className="capitalize">
              {themePreference === 'system' ? 'Auto' : themePreference}
            </span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-expanded={mobileMenuOpen}
              aria-label="Workspace options"
              className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] bg-[#F8F5F0] dark:bg-[#222120] hover:text-[#292522] dark:hover:text-[#F3EFEA] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] shadow-xl p-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBackup();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] text-left"
                >
                  <Download className="w-3.5 h-3.5 text-[#800020] dark:text-[#D4A85E]" />
                  <span>Backup &amp; Restore</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenGuide();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#800020] dark:text-[#D4A85E]" />
                  <span>How DayEase Works</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRequestReset();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-[#800020] dark:text-[#E58A9B] hover:bg-[#FAF3F1] dark:hover:bg-[#291C1F] text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear My Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FFFDF9]/95 dark:bg-[#181818]/95 backdrop-blur-sm border-t border-[#E8E1D7] dark:border-[#2A2826] px-1 py-1 grid grid-cols-6 gap-0.5 transition-colors duration-200"
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
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#800020] dark:text-[#D4A85E] bg-[#800020]/8 dark:bg-[#D4A85E]/12'
                  : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
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
