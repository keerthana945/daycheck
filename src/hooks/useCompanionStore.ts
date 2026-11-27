import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getTodayDateISO } from '../data/sampleData';
import type {
  EveningReflectionRecord,
  FocusSession,
  JournalEntry,
  MoodEntry,
  MoodKey,
  MorningResetRecord,
} from '../types';

export const COMPANION_STORAGE_KEY = 'myday_companion_v1';

export type BannerMood = 'skyline' | 'espresso' | 'burgundy';

export interface CompanionState {
  preferredName: string;
  mantra: string;
  mindDumpText: string;
  bannerMood: BannerMood;
  customQuote: string;
  moods: Record<string, MoodEntry>;
  journalEntries: JournalEntry[];
  journalDraftTitle: string;
  journalDraftContent: string;
  completedChallengeDates: string[];
  challengeOffset: number;
  focusSessions: FocusSession[];
  morningResets: Record<string, MorningResetRecord>;
  eveningReflections: Record<string, EveningReflectionRecord>;
}

const DEFAULT_COMPANION_STATE: CompanionState = {
  preferredName: '',
  mantra: 'main character',
  mindDumpText: '',
  bannerMood: 'skyline',
  customQuote: '',
  moods: {},
  journalEntries: [],
  journalDraftTitle: '',
  journalDraftContent: '',
  completedChallengeDates: [],
  challengeOffset: 0,
  focusSessions: [],
  morningResets: {},
  eveningReflections: {},
};

function sanitizeCompanionState(parsed: Partial<CompanionState>): CompanionState {
  const validMood =
    parsed.bannerMood === 'skyline' ||
    parsed.bannerMood === 'espresso' ||
    parsed.bannerMood === 'burgundy'
      ? parsed.bannerMood
      : 'skyline';

  return {
    preferredName: typeof parsed.preferredName === 'string' ? parsed.preferredName : '',
    mantra:
      typeof parsed.mantra === 'string' && parsed.mantra.trim() ? parsed.mantra : 'main character',
    mindDumpText: typeof parsed.mindDumpText === 'string' ? parsed.mindDumpText : '',
    bannerMood: validMood,
    customQuote: typeof parsed.customQuote === 'string' ? parsed.customQuote : '',
    moods: parsed.moods && typeof parsed.moods === 'object' ? parsed.moods : {},
    journalEntries: Array.isArray(parsed.journalEntries)
      ? parsed.journalEntries
      : DEFAULT_COMPANION_STATE.journalEntries,
    journalDraftTitle:
      typeof parsed.journalDraftTitle === 'string' ? parsed.journalDraftTitle : '',
    journalDraftContent:
      typeof parsed.journalDraftContent === 'string' ? parsed.journalDraftContent : '',
    completedChallengeDates: Array.isArray(parsed.completedChallengeDates)
      ? parsed.completedChallengeDates
      : [],
    challengeOffset: typeof parsed.challengeOffset === 'number' ? parsed.challengeOffset : 0,
    focusSessions: Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [],
    morningResets:
      parsed.morningResets && typeof parsed.morningResets === 'object' ? parsed.morningResets : {},
    eveningReflections:
      parsed.eveningReflections && typeof parsed.eveningReflections === 'object'
        ? parsed.eveningReflections
        : {},
  };
}

function loadCompanionState(): CompanionState {
  try {
    const raw = localStorage.getItem(COMPANION_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANION_STATE;
    return sanitizeCompanionState(JSON.parse(raw) as Partial<CompanionState>);
  } catch {
    return DEFAULT_COMPANION_STATE;
  }
}

function useCompanionStoreValue() {
  const [companion, setCompanion] = useState<CompanionState>(loadCompanionState);

  useEffect(() => {
    try {
      localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(companion));
    } catch {
      // Ignore storage quota errors
    }
  }, [companion]);

  const setPreferredName = useCallback((name: string) => {
    setCompanion((prev) => ({
      ...prev,
      preferredName: name.trim(),
    }));
  }, []);

  const setMantra = useCallback((mantra: string) => {
    setCompanion((prev) => ({
      ...prev,
      mantra: mantra.trim() || 'main character',
    }));
  }, []);

  const setMindDumpText = useCallback((text: string) => {
    setCompanion((prev) => ({
      ...prev,
      mindDumpText: text,
    }));
  }, []);

  const setBannerMood = useCallback((bannerMood: BannerMood) => {
    setCompanion((prev) => ({
      ...prev,
      bannerMood,
    }));
  }, []);

  const setCustomQuote = useCallback((customQuote: string) => {
    setCompanion((prev) => ({
      ...prev,
      customQuote: customQuote.trim(),
    }));
  }, []);

  const setMoodForToday = useCallback((mood: MoodKey, note?: string) => {
    const today = getTodayDateISO();
    setCompanion((prev) => ({
      ...prev,
      moods: {
        ...prev.moods,
        [today]: {
          date: today,
          mood,
          note: note !== undefined ? note : prev.moods[today]?.note,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const setMoodNoteForToday = useCallback((note: string) => {
    const today = getTodayDateISO();
    setCompanion((prev) => {
      const existing = prev.moods[today];
      if (!existing) return prev;
      return {
        ...prev,
        moods: {
          ...prev.moods,
          [today]: {
            ...existing,
            note,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, []);

  const setJournalDraft = useCallback((title: string, content: string) => {
    setCompanion((prev) => ({
      ...prev,
      journalDraftTitle: title,
      journalDraftContent: content,
    }));
  }, []);

  const saveJournalEntry = useCallback(
    (title: string, content: string, prompt: string): JournalEntry | null => {
      const cleanContent = content.trim();
      if (!cleanContent) return null;
      const cleanTitle = title.trim() || 'Daily Reflection';
      const entry: JournalEntry = {
        id: `jr-${Date.now()}`,
        date: getTodayDateISO(),
        prompt,
        title: cleanTitle,
        content: cleanContent,
        createdAt: new Date().toISOString(),
      };
      setCompanion((prev) => ({
        ...prev,
        journalEntries: [entry, ...prev.journalEntries],
        journalDraftTitle: '',
        journalDraftContent: '',
      }));
      return entry;
    },
    [],
  );

  const deleteJournalEntry = useCallback((id: string) => {
    setCompanion((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.filter((e) => e.id !== id),
    }));
  }, []);

  const toggleTodayChallenge = useCallback(() => {
    const today = getTodayDateISO();
    const nextCompleted = !companion.completedChallengeDates.includes(today);
    setCompanion((prev) => {
      const exists = prev.completedChallengeDates.includes(today);
      return {
        ...prev,
        completedChallengeDates: exists
          ? prev.completedChallengeDates.filter((d) => d !== today)
          : [...prev.completedChallengeDates, today],
      };
    });
    return nextCompleted;
  }, [companion.completedChallengeDates]);

  const cycleChallenge = useCallback(() => {
    setCompanion((prev) => ({
      ...prev,
      challengeOffset: prev.challengeOffset + 1,
    }));
  }, []);

  const logFocusSession = useCallback(
    (input: { minutes: number; taskId?: string; taskTitle?: string }) => {
      if (input.minutes <= 0) return;
      const session: FocusSession = {
        id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        date: getTodayDateISO(),
        minutes: Math.round(input.minutes),
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        completedAt: new Date().toISOString(),
      };
      setCompanion((prev) => ({
        ...prev,
        focusSessions: [session, ...prev.focusSessions].slice(0, 120),
      }));
    },
    [],
  );

  const saveMorningReset = useCallback(
    (input: { intention: string; rolledOverCount: number }) => {
      const today = getTodayDateISO();
      const record: MorningResetRecord = {
        date: today,
        intention: input.intention.trim(),
        rolledOverCount: input.rolledOverCount,
        completedAt: new Date().toISOString(),
      };
      setCompanion((prev) => ({
        ...prev,
        morningResets: {
          ...prev.morningResets,
          [today]: record,
        },
      }));
    },
    [],
  );

  const saveEveningReflection = useCallback(
    (input: { highlight: string; gratitude: string }) => {
      const today = getTodayDateISO();
      const highlight = input.highlight.trim();
      const gratitude = input.gratitude.trim();
      const record: EveningReflectionRecord = {
        date: today,
        highlight,
        gratitude,
        completedAt: new Date().toISOString(),
      };

      const journalContentParts = [
        highlight ? `Today’s win: ${highlight}` : '',
        gratitude ? `Grateful for: ${gratitude}` : '',
      ].filter(Boolean);

      setCompanion((prev) => {
        const nextEntries =
          journalContentParts.length > 0
            ? [
                {
                  id: `jr-eve-${Date.now()}`,
                  date: today,
                  prompt: 'Evening Reflection',
                  title: `Evening Wind-Down · ${today}`,
                  content: journalContentParts.join('\n\n'),
                  createdAt: new Date().toISOString(),
                },
                ...prev.journalEntries,
              ]
            : prev.journalEntries;

        return {
          ...prev,
          eveningReflections: {
            ...prev.eveningReflections,
            [today]: record,
          },
          journalEntries: nextEntries,
        };
      });
    },
    [],
  );

  const replaceCompanionState = useCallback((next: Partial<CompanionState>) => {
    setCompanion(sanitizeCompanionState(next));
  }, []);

  const clearCompanionWorkspace = useCallback(() => {
    setCompanion((prev) => ({
      ...DEFAULT_COMPANION_STATE,
      preferredName: prev.preferredName,
      bannerMood: prev.bannerMood,
      mantra: prev.mantra,
      customQuote: prev.customQuote,
    }));
  }, []);

  return {
    companion,
    setPreferredName,
    setMantra,
    setMindDumpText,
    setBannerMood,
    setCustomQuote,
    setMoodForToday,
    setMoodNoteForToday,
    setJournalDraft,
    saveJournalEntry,
    deleteJournalEntry,
    toggleTodayChallenge,
    cycleChallenge,
    logFocusSession,
    saveMorningReset,
    saveEveningReflection,
    replaceCompanionState,
    clearCompanionWorkspace,
  };
}

type CompanionContextValue = ReturnType<typeof useCompanionStoreValue>;

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function CompanionProvider({ children }: { children: ReactNode }) {
  const value = useCompanionStoreValue();
  return createElement(CompanionContext.Provider, { value }, children);
}

export function useCompanionStore(): CompanionContextValue {
  const ctx = useContext(CompanionContext);
  if (!ctx) {
    throw new Error('useCompanionStore must be used inside CompanionProvider');
  }
  return ctx;
}
