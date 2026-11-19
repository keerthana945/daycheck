import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getTodayDateISO } from '../data/sampleData';
import type { JournalEntry, MoodEntry, MoodKey } from '../types';

const COMPANION_STORAGE_KEY = 'myday_companion_v1';

export type BannerMood = 'skyline' | 'espresso' | 'burgundy';

interface CompanionState {
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
}

const DEFAULT_COMPANION_STATE: CompanionState = {
  preferredName: '',
  mantra: 'main character',
  mindDumpText: '',
  bannerMood: 'skyline',
  customQuote: '',
  moods: {},
  journalEntries: [
    {
      id: 'jr-welcome',
      date: getTodayDateISO(),
      prompt: 'What deserves your gentle, unhurried focus today?',
      title: 'A quiet start to the morning',
      content:
        'Taking ten calm minutes before opening messages helps set the tone for the rest of the day. Focusing on steady progress over rushing.',
      createdAt: new Date().toISOString(),
    },
  ],
  journalDraftTitle: '',
  journalDraftContent: '',
  completedChallengeDates: [],
  challengeOffset: 0,
};

function loadCompanionState(): CompanionState {
  try {
    const raw = localStorage.getItem(COMPANION_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANION_STATE;
    const parsed = JSON.parse(raw) as Partial<CompanionState>;
    const validMood =
      parsed.bannerMood === 'skyline' ||
      parsed.bannerMood === 'espresso' ||
      parsed.bannerMood === 'burgundy'
        ? parsed.bannerMood
        : 'skyline';

    return {
      preferredName:
        typeof parsed.preferredName === 'string' ? parsed.preferredName : '',
      mantra:
        typeof parsed.mantra === 'string' && parsed.mantra.trim()
          ? parsed.mantra
          : 'main character',
      mindDumpText:
        typeof parsed.mindDumpText === 'string' ? parsed.mindDumpText : '',
      bannerMood: validMood,
      customQuote:
        typeof parsed.customQuote === 'string' ? parsed.customQuote : '',
      moods:
        parsed.moods && typeof parsed.moods === 'object' ? parsed.moods : {},
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
      challengeOffset:
        typeof parsed.challengeOffset === 'number' ? parsed.challengeOffset : 0,
    };
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
    toggleTodayChallenge,
    cycleChallenge,
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
