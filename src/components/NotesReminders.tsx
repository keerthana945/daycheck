import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Check, X, StickyNote } from 'lucide-react';
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
    <div className="space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E1D7]">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#800020]">
            Reflections &amp; Archives
          </p>
          <h1 className="mt-1.5 text-3xl sm:text-4xl font-medium tracking-[-0.02em] text-[#292522] text-balance">
            Notes &amp; Reminders
          </h1>
          <p className="mt-1.5 text-sm text-[#6E6359]">
            Capture journal entries, study notes, UX critique notes, career ideas, or reminders in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#E8E1D7] bg-[#FFFDF9] text-[#292522] hover:border-[#A69A8D] shadow-[0_1px_2px_rgba(41,37,34,0.03)] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#800020]" />
          <span>Detailed Note</span>
        </button>
      </header>

      {/* Inline Quick Capture */}
      <form
        onSubmit={handleQuickSave}
        className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-4 sm:p-5 shadow-[0_1px_4px_rgba(41,37,34,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Write a quick note, critique, or reminder..."
          aria-label="Quick note"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] text-sm text-[#292522] placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020]"
        />
        <select
          value={quickCat}
          onChange={(e) => setQuickCat(e.target.value as NoteCategory)}
          aria-label="Quick note category"
          className="px-3 py-2.5 rounded-xl bg-[#F8F5F0] border border-[#E8E1D7] text-xs text-[#292522] focus:outline-none focus:border-[#800020]"
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Save</span>
        </button>
      </form>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EFE9E0] border border-[#E8E1D7] w-fit">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setCategoryFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === opt
                  ? 'bg-[#FFFDF9] text-[#292522] shadow-[0_1px_2px_rgba(41,37,34,0.06)]'
                  : 'text-[#6E6359] hover:text-[#292522]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#6E6359] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes and reminders"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FFFDF9] border border-[#E8E1D7] text-sm text-[#292522] placeholder:text-[#A69A8D] focus:outline-none focus:border-[#800020]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear note search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6359] hover:text-[#292522]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] px-6 py-12 text-center shadow-[0_1px_3px_rgba(41,37,34,0.04)]">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-[#FAF3F1] border border-[#EAD9D8] flex items-center justify-center text-[#800020]">
            <StickyNote className="w-5 h-5" />
          </div>
          <h2 className="mt-3 text-base font-medium text-[#292522]">No notes found</h2>
          <p className="mt-1 text-sm text-[#6E6359]">
            Type a note above or click Detailed Note to add a reminder date.
          </p>
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
                className={`rounded-3xl border p-5 sm:p-6 flex flex-col justify-between gap-3 transition-all duration-150 ${
                  isReminder && isDone
                    ? 'bg-[#FFFDF9]/70 border-[#EAE3D9]'
                    : isCritique
                      ? 'bg-[#FAF3F1]/65 border-[#E8D8D8] shadow-[0_1px_3px_rgba(128,0,32,0.04)] hover:border-[#D7BFC2]'
                      : 'bg-[#FFFDF9] border-[#E8E1D7] shadow-[0_1px_3px_rgba(41,37,34,0.04)] hover:border-[#CBBFB2]'
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
                              ? 'bg-[#800020] border-[#800020] text-[#FFFDF9]'
                              : 'border-[#CFC5B8] bg-[#FFFDF9] hover:border-[#800020]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <div className="min-w-0">
                        <h2
                          className={`font-sans text-base font-semibold leading-snug ${
                            isReminder && isDone ? 'line-through text-[#8C8278]' : 'text-[#292522]'
                          }`}
                        >
                          {note.title}
                        </h2>
                        <p className="mt-1 text-xs text-[#6E6359]">
                          <span className="font-medium text-[#800020]">{note.category}</span>
                          <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                          <span className="font-mono tabular-nums">{note.updatedAt}</span>
                          {note.reminderDate && (
                            <>
                              <span aria-hidden="true" className="text-[#A69A8D]"> · </span>
                              <span className="font-mono tabular-nums text-[#800020]">
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
                        className="p-2 rounded-lg text-[#6E6359] hover:text-[#292522] hover:bg-[#F8F5F0] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label={`Delete "${note.title}"`}
                        className="p-2 rounded-lg text-[#6E6359] hover:text-[#800020] hover:bg-[#FAF3F1] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {note.content !== note.title && (
                    <p
                      className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isReminder && isDone ? 'text-[#8C8278]' : 'text-[#4F4740]'
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#292522]/35 backdrop-blur-[2px] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] border border-[#E8E1D7] p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="note-modal-title" className="text-xl font-medium text-[#292522]">
                {editingNote ? 'Edit Note' : 'New Note or Reminder'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6E6359] hover:text-[#292522] hover:bg-[#F8F5F0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label htmlFor="note-title" className="block text-xs font-medium text-[#4F4740] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#F8F5F0]/70 text-sm text-[#292522] focus:outline-none focus:border-[#800020]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="note-category" className="block text-xs font-medium text-[#4F4740] mb-1.5">
                    Category
                  </label>
                  <select
                    id="note-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#F8F5F0]/70 text-sm text-[#292522] focus:outline-none focus:border-[#800020]"
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="note-reminder" className="block text-xs font-medium text-[#4F4740] mb-1.5">
                    Reminder Date (optional)
                  </label>
                  <input
                    id="note-reminder"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#F8F5F0]/70 text-sm font-mono text-[#292522] focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="note-content" className="block text-xs font-medium text-[#4F4740] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E1D7] bg-[#F8F5F0]/70 text-sm text-[#292522] focus:outline-none focus:border-[#800020]"
                />
              </div>

              {formError && <p className="text-xs text-[#800020]">{formError}</p>}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E8E1D7] text-[#292522] hover:bg-[#F8F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#800020] text-[#FFFDF9] hover:bg-[#66001A] transition-colors"
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
