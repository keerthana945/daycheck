import { useCallback, useEffect, useState } from 'react';
import { getTodayDateISO } from '../data/sampleData';
import type { JournalEntry, MoodEntry, MoodKey } from '../types';

const COMPANION_STORAGE_KEY = 'myday_companion_v1';

interface CompanionState {
  preferredName: string;
  moods: Record<string, MoodEntry>;
  journalEntries: JournalEntry[];
  journalDraftTitle: string;
  journalDraftContent: string;
  completedChallengeDates: string[];
  challengeOffset: number;
}

const DEFAULT_COMPANION_STATE: CompanionState = {
  preferredName: '',
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
    return {
      preferredName:
        typeof parsed.preferredName === 'string' ? parsed.preferredName : '',
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

export function useCompanionStore() {
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
    setMoodForToday,
    setMoodNoteForToday,
    setJournalDraft,
    saveJournalEntry,
    toggleTodayChallenge,
    cycleChallenge,
  };
}
