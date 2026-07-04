import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Target } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Modal, EmptyState, SkeletonCards, Badge, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import { useAuth } from '@/contexts/AuthContext';
import { sendEmail } from '@/lib/ai';
import { formatDate } from '@/lib/utils';
import type { Goal } from '@/types';

export default function Goals() {
  const { user, profile } = useAuth();
  const { rows, loading, insert, update, remove } = useTable<Goal>('goals');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('10');
  const [deadline, setDeadline] = useState('');

  const save = async () => {
    if (!title.trim()) { toast('Give the goal a title', 'error'); return; }
    await insert({ title: title.trim(), target_hours: Number(hours) || 0, deadline: deadline || null });
    toast('Goal locked in'); setOpen(false); setTitle(''); setHours('10'); setDeadline('');
  };

  const toggle = async (g: Goal) => {
    const completed = !g.completed;
    await update(g.id, { completed });
    if (completed) {
      toast('🎯 Goal completed — respect.');
      if (user?.email) sendEmail(user.email, 'goal', profile?.username, g.title);
    }
  };

  const active = rows.filter(g => !g.completed);
  const done = rows.filter(g => g.completed);

  return (
    <AppLayout title="Goals" subtitle="Set the target. Hit the target."
      actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> New goal</Button>}>
      {loading ? <SkeletonCards /> : rows.length === 0 ? (
        <EmptyState title="No goals set" hint="Athletes without goals are just exercising. Set a target and chase it down."
          action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Set your first goal</Button>} />
      ) : (
        <div className="space-y-8">
          {[{ label: 'In play', list: active }, { label: 'Completed', list: done }].map(({ label, list }) => list.length > 0 && (
            <section key={label}>
              <h2 className="eyebrow mb-3 text-muted">{label} · {list.length}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {list.map(g => (
                  <Card key={g.id} hover className={g.completed ? 'opacity-60' : ''}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggle(g)} aria-label={g.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={g.completed ? 'text-success' : 'text-muted hover:text-success'}>
                        {g.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-bold text-white ${g.completed ? 'line-through' : ''}`}>{g.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge color="border-info text-info"><Target size={12} /> {g.target_hours}h target</Badge>
                          {g.deadline && <Badge color="border-warning text-warning">Due {formatDate(g.deadline)}</Badge>}
                        </div>
                      </div>
                      <button onClick={async () => { if (confirm('Delete this goal?')) { await remove(g.id); toast('Goal removed'); } }}
                        aria-label="Delete goal" className="text-muted hover:text-primary"><Trash2 size={16} /></button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <div className="space-y-4">
          <Input label="What are you chasing?" id="goal-title" placeholder="e.g. Finish calculus revision"
            value={title} onChange={e => setTitle(e.target.value)} />
          <Input label="Target study hours" id="goal-hours" type="number" min={1} value={hours} onChange={e => setHours(e.target.value)} />
          <Input label="Deadline (optional)" id="goal-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          <Button onClick={save} className="w-full">Lock it in</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
