import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Check, X, StickyNote } from 'lucide-react';
import { useCompanionStore } from '../hooks/useCompanionStore';
import { PageCoverHeader } from './EditorialCovers';
import type { Note, NoteCategory } from '../types';

interface NotesRemindersProps {
  notes: Note[];
  onAddNote: (input: Omit<Note, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<Omit<Note, 'id'>>) => void;
  onToggleNoteCompleted: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

const NOTE_CATEGORIES: NoteCategory[] = ['Personal', 'Study', 'Career', 'Critique', 'Reminder'];
const FILTER_OPTIONS: Array<'All' | NoteCategory> = [
  'All',
  'Personal',
  'Study',
  'Career',
  'Critique',
  'Reminder',
];

export function NotesReminders({
  notes,
  onAddNote,
  onUpdateNote,
  onToggleNoteCompleted,
  onDeleteNote,
}: NotesRemindersProps) {
  const { companion } = useCompanionStore();
  const [categoryFilter, setCategoryFilter] = useState<'All' | NoteCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick capture bar
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState<NoteCategory>('Personal');

  // Detailed modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Personal');
  const [reminderDate, setReminderDate] = useState('');
  const [formError, setFormError] = useState('');

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      if (categoryFilter !== 'All' && note.category !== categoryFilter) return false;
      if (q) {
        const hay = `${note.title} ${note.content} ${note.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, categoryFilter, searchQuery]);

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddNote({
      title: quickTitle.trim(),
      content: quickTitle.trim(),
      category: quickCat,
      completed: false,
    });
    setQuickTitle('');
  };

  const openAddModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('Personal');
    setReminderDate('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setReminderDate(note.reminderDate || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a title.');
      return;
    }
    if (!content.trim()) {
      setFormError('Please enter note details.');
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      reminderDate: reminderDate || undefined,
      completed: editingNote?.completed ?? false,
    };

    if (editingNote) {
      onUpdateNote(editingNote.id, payload);
    } else {
      onAddNote(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageCoverHeader
        mood={companion.bannerMood}
        eyebrow="reflections & archives"
        title="notes & reminders"
        subtitle="Capture journal entries, study notes, UX critique notes, career ideas, and checklists in one editorial archive."
        icon={<StickyNote className="w-6 h-6" />}
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Detailed Note</span>
          </button>
        }
      />

      {/* Inline Quick Capture */}
      <form
        onSubmit={handleQuickSave}
        className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-4 shadow-[0_1px_4px_rgba(41,37,34,0.04)] dark:shadow-none flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Write a quick note, critique, or reminder..."
          aria-label="Quick note"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        />
        <select
          value={quickCat}
          onChange={(e) => setQuickCat(e.target.value as NoteCategory)}
          aria-label="Quick note category"
          className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] text-xs text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
        >
          {NOTE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Save</span>
        </button>
      </form>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] w-fit">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setCategoryFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === opt
                  ? 'bg-[#FFFDF9] dark:bg-[#262523] text-[#292522] dark:text-[#D4A85E] shadow-[0_1px_2px_rgba(41,37,34,0.06)] dark:shadow-none'
                  : 'text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#6E6359] dark:text-[#A69E94] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes and reminders"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear note search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] px-6 py-12 text-center space-y-3 shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none">
          <div className="w-11 h-11 rounded-2xl bg-[#F8F5F0] dark:bg-[#161616] border border-[#E6DFD5] dark:border-[#2E2C29] mx-auto flex items-center justify-center text-[#800020] dark:text-[#D4A85E]">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-medium text-[#292522] dark:text-[#F3EFEA]">No notes found</h2>
            <p className="mt-1 text-sm text-[#6E6359] dark:text-[#A69E94]">
              Type a note above or click Detailed Note to add a reminder date.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const isReminder = note.category === 'Reminder' || Boolean(note.reminderDate);
            const isDone = Boolean(note.completed);
            const isCritique = note.category === 'Critique';

            return (
              <article
                key={note.id}
                className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-3 transition-all duration-150 ${
                  isReminder && isDone
                    ? 'bg-[#FFFDF9]/70 dark:bg-[#1E1E1E]/60 border-[#EAE3D9] dark:border-[#262422]'
                    : isCritique
                      ? 'bg-[#FAF6EE] dark:bg-[#24201C] border-[#E5DDD0] dark:border-[#3D352B] shadow-[0_1px_3px_rgba(128,0,32,0.04)] dark:shadow-none hover:border-[#C89B54]/60'
                      : 'bg-[#FFFDF9] dark:bg-[#1E1E1E] border-[#E6DFD5] dark:border-[#2E2C29] shadow-[0_1px_3px_rgba(41,37,34,0.04)] dark:shadow-none hover:border-[#CBBFB2] dark:hover:border-[#4A4640]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {isReminder && (
                        <button
                          type="button"
                          onClick={() => onToggleNoteCompleted(note.id)}
                          aria-label={
                            isDone
                              ? `Mark reminder "${note.title}" active`
                              : `Complete reminder "${note.title}"`
                          }
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-[#800020] dark:bg-[#C89B54] border-[#800020] dark:border-[#C89B54] text-[#FFFDF9] dark:text-[#141414]'
                              : 'border-[#CFC5B8] dark:border-[#49443E] bg-[#FFFDF9] dark:bg-[#161616] hover:border-[#800020] dark:hover:border-[#D4A85E]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <div className="min-w-0">
                        <h2
                          className={`font-display text-lg font-medium leading-snug ${
                            isReminder && isDone ? 'line-through text-[#8C8278] dark:text-[#7D766E]' : 'text-[#292522] dark:text-[#F3EFEA]'
                          }`}
                        >
                          {note.title}
                        </h2>
                        <p className="mt-1 text-xs text-[#6E6359] dark:text-[#A69E94]">
                          <span className="font-medium text-[#800020] dark:text-[#D4A85E]">{note.category}</span>
                          <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                          <span className="font-mono tabular-nums">{note.updatedAt}</span>
                          {note.reminderDate && (
                            <>
                              <span aria-hidden="true" className="text-[#A69A8D] dark:text-[#5C5650]"> · </span>
                              <span className="font-mono tabular-nums text-[#800020] dark:text-[#D4A85E]">
                                Due {note.reminderDate}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(note)}
                        aria-label={`Edit "${note.title}"`}
                        className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label={`Delete "${note.title}"`}
                        className="p-2 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#800020] dark:hover:text-[#E58A9B] hover:bg-[#FAF3F1] dark:hover:bg-[#291C1F] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {note.content !== note.title && (
                    <p
                      className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isReminder && isDone ? 'text-[#8C8278] dark:text-[#7D766E]' : 'text-[#4F4740] dark:text-[#CFC7BE]'
                      }`}
                    >
                      {note.content}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detailed Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#292522]/35 dark:bg-black/65 backdrop-blur-[2px] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="note-modal-title" className="text-xl font-medium text-[#292522] dark:text-[#F3EFEA]">
                {editingNote ? 'Edit Note' : 'New Note or Reminder'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6E6359] dark:text-[#A69E94] hover:text-[#292522] dark:hover:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label htmlFor="note-title" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                  Title
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., UX Critique notes or Follow-up reminder"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="note-category" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Category
                  </label>
                  <select
                    id="note-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="note-reminder" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                    Reminder Date (optional)
                  </label>
                  <input
                    id="note-reminder"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm font-mono text-[#292522] dark:text-[#F3EFEA] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="note-content" className="block text-xs font-medium text-[#4F4740] dark:text-[#CFC7BE] mb-1.5">
                  Details
                </label>
                <textarea
                  id="note-content"
                  rows={4}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Write your note, critique, or reminder details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#2E2C29] bg-[#F8F5F0]/70 dark:bg-[#161616] text-sm text-[#292522] dark:text-[#F3EFEA] placeholder:text-[#A69A8D] dark:placeholder:text-[#78716A] focus:outline-none focus:border-[#800020] dark:focus:border-[#D4A85E]"
                />
              </div>

              {formError && <p className="text-xs text-[#800020] dark:text-[#E58A9B]">{formError}</p>}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DFD5] dark:border-[#2E2C29] text-[#292522] dark:text-[#F3EFEA] hover:bg-[#F8F5F0] dark:hover:bg-[#262523] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] dark:bg-[#C89B54] text-[#FFFDF9] dark:text-[#141414] hover:bg-[#66001A] dark:hover:bg-[#D6AB65] transition-colors"
                >
                  {editingNote ? 'Save Changes' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
