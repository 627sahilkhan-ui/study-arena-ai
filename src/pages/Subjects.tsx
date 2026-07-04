import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Modal, EmptyState, SkeletonCards, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import type { Subject } from '@/types';

const COLORS = ['#FF2E2E', '#00C2FF', '#39FF14', '#FF9800', '#FFFFFF', '#B026FF'];

export default function Subjects() {
  const { rows, loading, insert, update, remove } = useTable<Subject>('subjects');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const startCreate = () => { setEditing(null); setName(''); setColor(COLORS[0]); setOpen(true); };
  const startEdit = (s: Subject) => { setEditing(s); setName(s.name); setColor(s.color); setOpen(true); };

  const save = async () => {
    if (!name.trim()) { toast('Give the subject a name', 'error'); return; }
    if (editing) { await update(editing.id, { name: name.trim(), color }); toast('Subject updated'); }
    else { await insert({ name: name.trim(), color }); toast('Subject added'); }
    setOpen(false);
  };

  return (
    <AppLayout title="Subjects" subtitle="Your training disciplines"
      actions={<Button onClick={startCreate}><Plus size={16} /> New subject</Button>}>
      {loading ? <SkeletonCards /> : rows.length === 0 ? (
        <EmptyState title="No subjects yet" hint="Add the subjects you are training for — every note, quiz and session can be tagged to one."
          action={<Button onClick={startCreate}><Plus size={16} /> Add your first subject</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map(s => (
            <Card key={s.id} hover className="relative">
              <div className="h-2 w-16" style={{ background: s.color }} aria-hidden />
              <h3 className="display mt-4 text-2xl">{s.name}</h3>
              <div className="mt-4 flex items-center justify-between">
                <BookOpen size={18} className="text-muted" aria-hidden />
                <div className="flex gap-2">
                  <button onClick={() => startEdit(s)} aria-label={`Edit ${s.name}`} className="text-muted hover:text-info"><Pencil size={16} /></button>
                  <button onClick={async () => { if (confirm(`Delete ${s.name}?`)) { await remove(s.id); toast('Subject deleted'); } }}
                    aria-label={`Delete ${s.name}`} className="text-muted hover:text-primary"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit subject' : 'New subject'}>
        <div className="space-y-5">
          <Input id="subject-name" label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Data Structures" />
          <div>
            <p className="eyebrow mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
                  className={`h-9 w-9 border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Add subject'}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
