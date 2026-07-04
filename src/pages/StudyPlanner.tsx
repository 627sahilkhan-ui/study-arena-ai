import { useState } from 'react';
import { Plus, Trash2, Pencil, CalendarRange } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Textarea, Select, Modal, EmptyState, SkeletonCards, Badge, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import { formatDate } from '@/lib/utils';
import type { StudyPlan, Subject } from '@/types';

const STATUS: Record<StudyPlan['status'], { label: string; color: string }> = {
  active: { label: 'Active', color: 'border-success text-success' },
  paused: { label: 'Paused', color: 'border-warning text-warning' },
  completed: { label: 'Completed', color: 'border-info text-info' },
};

export default function StudyPlanner() {
  const { rows, loading, insert, update, remove } = useTable<StudyPlan>('study_plans');
  const { rows: subjects } = useTable<Subject>('subjects');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudyPlan | null>(null);
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', start_date: '', end_date: '', status: 'active' as StudyPlan['status'] });

  const startCreate = () => { setEditing(null); setForm({ title: '', description: '', subject_id: '', start_date: '', end_date: '', status: 'active' }); setOpen(true); };
  const startEdit = (p: StudyPlan) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description ?? '', subject_id: p.subject_id ?? '', start_date: p.start_date ?? '', end_date: p.end_date ?? '', status: p.status });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast('Give the plan a title', 'error'); return; }
    const values = { ...form, title: form.title.trim(), subject_id: form.subject_id || null, start_date: form.start_date || null, end_date: form.end_date || null };
    if (editing) { await update(editing.id, values); toast('Plan updated'); }
    else { await insert(values); toast('Plan created'); }
    setOpen(false);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AppLayout title="Study planner" subtitle="Your training program, week by week"
      actions={<Button onClick={startCreate}><Plus size={16} /> New plan</Button>}>
      {loading ? <SkeletonCards /> : rows.length === 0 ? (
        <EmptyState title="No plans yet" hint="Great athletes follow a program. Build a study plan with a start line and a finish line."
          action={<Button onClick={startCreate}><Plus size={16} /> Build a plan</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(p => {
            const subject = subjects.find(s => s.id === p.subject_id);
            return (
              <Card key={p.id} hover>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display text-2xl">{p.title}</h3>
                  <Badge color={STATUS[p.status].color}>{STATUS[p.status].label}</Badge>
                </div>
                {p.description && <p className="mt-2 text-sm text-muted line-clamp-2">{p.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                  {subject && <span className="flex items-center gap-1"><span className="h-2 w-2" style={{ background: subject.color }} />{subject.name}</span>}
                  {(p.start_date || p.end_date) && (
                    <span className="flex items-center gap-1"><CalendarRange size={14} />
                      {p.start_date ? formatDate(p.start_date) : '—'} → {p.end_date ? formatDate(p.end_date) : '—'}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" onClick={() => startEdit(p)} aria-label="Edit plan"><Pencil size={16} /> Edit</Button>
                  <Button variant="ghost" onClick={async () => { if (confirm('Delete this plan?')) { await remove(p.id); toast('Plan deleted'); } }}
                    aria-label="Delete plan"><Trash2 size={16} /> Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit plan' : 'New study plan'} wide>
        <div className="space-y-4">
          <Input label="Title" id="plan-title" value={form.title} onChange={set('title')} placeholder="e.g. Finals sprint — Semester 6" />
          <Textarea label="Description" id="plan-desc" value={form.description} onChange={set('description')} placeholder="What does this program cover?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Subject" id="plan-subject" value={form.subject_id} onChange={set('subject_id')}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Status" id="plan-status" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </Select>
            <Input label="Start date" id="plan-start" type="date" value={form.start_date} onChange={set('start_date')} />
            <Input label="End date" id="plan-end" type="date" value={form.end_date} onChange={set('end_date')} />
          </div>
          <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Create plan'}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
