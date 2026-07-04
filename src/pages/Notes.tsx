import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Textarea, Select, Modal, EmptyState, SkeletonCards, Badge, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import { useAuth } from '@/contexts/AuthContext';
import { checkAchievements } from '@/lib/achievements';
import { formatDate } from '@/lib/utils';
import type { Note, Subject } from '@/types';

const CATEGORIES = ['General', 'Lecture', 'Revision', 'Formula sheet', 'Exam prep'];

export default function Notes() {
  const { user } = useAuth();
  const notes = useTable<Note>('notes', 'updated_at');
  const subjects = useTable<Subject>('subjects');
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', subject_id: '' });

  const filtered = useMemo(() => notes.rows.filter(n =>
    (!filterCat || n.category === filterCat) &&
    (n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()))
  ), [notes.rows, query, filterCat]);

  const startCreate = () => { setEditing(null); setForm({ title: '', content: '', category: 'General', subject_id: '' }); setOpen(true); };
  const startEdit = (n: Note) => { setEditing(n); setForm({ title: n.title, content: n.content, category: n.category, subject_id: n.subject_id ?? '' }); setOpen(true); };

  const save = async () => {
    if (!form.title.trim()) { toast('Add a title', 'error'); return; }
    const values = { ...form, subject_id: form.subject_id || null, updated_at: new Date().toISOString() };
    if (editing) { await notes.update(editing.id, values as Partial<Note>); toast('Note updated'); }
    else {
      await notes.insert(values as Partial<Note>);
      toast('Note created');
      if (user) checkAchievements(user.id, user.email ?? undefined);
    }
    setOpen(false);
  };

  return (
    <AppLayout title="Notes" subtitle="Your playbook"
      actions={<Button onClick={startCreate}><Plus size={16} /> New note</Button>}>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…" aria-label="Search notes"
            className="w-full border-2 border-white/15 bg-surface py-3 pl-10 pr-4 text-white placeholder:text-muted/60 focus:border-primary focus:outline-none" />
        </div>
        <Select aria-label="Filter by category" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>

      {notes.loading ? <SkeletonCards /> : filtered.length === 0 ? (
        <EmptyState title={notes.rows.length ? 'No matches' : 'The playbook is empty'}
          hint={notes.rows.length ? 'Try a different search or filter.' : 'Write your first note — lecture summaries, formulas, anything worth keeping.'}
          action={!notes.rows.length ? <Button onClick={startCreate}><Plus size={16} /> Write a note</Button> : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(n => (
            <Card key={n.id} hover className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="display text-xl">{n.title}</h3>
                <Badge>{n.category}</Badge>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap text-sm text-muted line-clamp-5">{n.content || '—'}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-mono text-[10px] text-muted">{formatDate(n.updated_at)}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(n)} aria-label={`Edit ${n.title}`} className="text-muted hover:text-info"><Pencil size={16} /></button>
                  <button onClick={async () => { if (confirm('Delete this note?')) { await notes.remove(n.id); toast('Note deleted'); } }}
                    aria-label={`Delete ${n.title}`} className="text-muted hover:text-primary"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit note' : 'New note'} wide>
        <div className="space-y-4">
          <Input id="note-title" label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Binary Trees — traversal cheat sheet" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="note-cat" label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
            <Select id="note-subj" label="Subject" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
              <option value="">No subject</option>
              {subjects.rows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <Textarea id="note-content" label="Content" rows={10} value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write it down. Future-you will thank you." />
          <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Create note'}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
