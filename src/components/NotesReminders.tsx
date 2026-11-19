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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1F1A17] text-balance">
            Notes &amp; Reminders
          </h1>
          <p className="mt-1 text-sm text-[#5C534D]">
            Capture study notes, UX critique notes, career ideas, or reminders in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DDD0] bg-white text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Detailed Note</span>
        </button>
      </div>

      {/* Inline Quick Capture */}
      <form
        onSubmit={handleQuickSave}
        className="rounded-2xl bg-white border border-[#E6DDD0] p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Write a quick note, critique, or reminder..."
          aria-label="Quick note"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#7D736B] focus:outline-none focus:border-[#6D1D2C]"
        />
        <select
          value={quickCat}
          onChange={(e) => setQuickCat(e.target.value as NoteCategory)}
          aria-label="Quick note category"
          className="px-3 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DDD0] text-xs text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] disabled:opacity-45 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Save</span>
        </button>
      </form>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F2ECE3] border border-[#E6DDD0] w-fit">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setCategoryFilter(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === opt
                  ? 'bg-white text-[#1F1A17] shadow-xs'
                  : 'text-[#5C534D] hover:text-[#1F1A17]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-60">
          <Search className="w-4 h-4 text-[#5C534D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            aria-label="Search notes and reminders"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E6DDD0] text-sm text-[#1F1A17] placeholder:text-[#7D736B] focus:outline-none focus:border-[#6D1D2C]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear note search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C534D] hover:text-[#1F1A17]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#E6DDD0] px-6 py-12 text-center">
          <div className="mx-auto w-10 h-10 rounded-xl bg-[#F2ECE3] flex items-center justify-center text-[#6D1D2C]">
            <StickyNote className="w-5 h-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-[#1F1A17]">No notes found</h2>
          <p className="mt-1 text-sm text-[#5C534D]">
            Type a note above or click Detailed Note to add a reminder date.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const isReminder = note.category === 'Reminder' || Boolean(note.reminderDate);
            const isDone = Boolean(note.completed);

            return (
              <article
                key={note.id}
                className={`rounded-2xl bg-white border border-[#E6DDD0] p-5 flex flex-col justify-between gap-3 transition-opacity ${
                  isReminder && isDone ? 'opacity-60' : ''
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
                              ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white'
                              : 'border-[#CFC5B8] bg-white hover:border-[#6D1D2C]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <div className="min-w-0">
                        <h2
                          className={`text-base font-semibold leading-snug ${
                            isReminder && isDone ? 'line-through text-[#5C534D]' : 'text-[#1F1A17]'
                          }`}
                        >
                          {note.title}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#5C534D]">
                          <span className="font-medium text-[#6D1D2C]">{note.category}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{note.updatedAt}</span>
                          {note.reminderDate && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono tabular-nums text-[#B45309]">
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
                        className="p-2 rounded-lg text-[#5C534D] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label={`Delete "${note.title}"`}
                        className="p-2 rounded-lg text-[#5C534D] hover:text-[#991B1B] hover:bg-[#F7ECEE] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {note.content !== note.title && (
                    <p className="mt-3 text-sm text-[#4A433E] leading-relaxed whitespace-pre-wrap">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1A17]/35 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E6DDD0] p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <h2 id="note-modal-title" className="text-lg font-semibold text-[#1F1A17]">
                {editingNote ? 'Edit Note' : 'New Note or Reminder'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#5C534D] hover:text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label htmlFor="note-title" className="block text-xs font-medium text-[#4A433E] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="note-category" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Category
                  </label>
                  <select
                    id="note-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="note-reminder" className="block text-xs font-medium text-[#4A433E] mb-1.5">
                    Reminder Date (optional)
                  </label>
                  <input
                    id="note-reminder"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="note-content" className="block text-xs font-medium text-[#4A433E] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2]/50 text-sm text-[#1F1A17] focus:outline-none focus:border-[#6D1D2C]"
                />
              </div>

              {formError && <p className="text-xs text-[#991B1B]">{formError}</p>}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-[#E6DDD0] text-[#1F1A17] hover:bg-[#F2ECE3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-[#6D1D2C] text-white hover:bg-[#551521] transition-colors"
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
