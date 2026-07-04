import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Trash2, Pencil, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Textarea, Select, Modal, EmptyState, SkeletonCards, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import { useAuth } from '@/contexts/AuthContext';
import { jsonChat } from '@/lib/ai';
import { checkAchievements } from '@/lib/achievements';
import type { Flashcard, Subject } from '@/types';

/** Single flip-card. Only transform + opacity are animated (GPU friendly). */
function FlipCard({ card, onFav, onEdit, onDelete }:
  { card: Flashcard; onFav: () => void; onEdit: () => void; onDelete: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative h-56 [perspective:1000px]">
      <motion.button
        type="button"
        onClick={() => setFlipped(f => !f)}
        aria-label={flipped ? 'Show front of card' : 'Show back of card'}
        className="h-full w-full text-left [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="card-brutal absolute inset-0 flex flex-col p-5 [backface-visibility:hidden]">
          <span className="eyebrow text-muted">Question</span>
          <p className="mt-3 flex-1 overflow-auto font-semibold text-white">{card.front}</p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Tap to flip</span>
        </div>
        <div className="card-brutal absolute inset-0 flex flex-col border-primary p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="eyebrow text-primary">Answer</span>
          <p className="mt-3 flex-1 overflow-auto text-white/90">{card.back}</p>
        </div>
      </motion.button>
      <div className="absolute right-3 top-3 z-10 flex gap-1">
        <button onClick={onFav} aria-label={card.favorite ? 'Unfavorite' : 'Favorite'}
          className={card.favorite ? 'text-warning' : 'text-muted hover:text-warning'}>
          <Star size={16} fill={card.favorite ? 'currentColor' : 'none'} />
        </button>
        <button onClick={onEdit} aria-label="Edit card" className="text-muted hover:text-white"><Pencil size={16} /></button>
        <button onClick={onDelete} aria-label="Delete card" className="text-muted hover:text-primary"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

export default function Flashcards() {
  const { user, profile } = useAuth();
  const { rows, loading, insert, update, remove } = useTable<Flashcard>('flashcards');
  const { rows: subjects } = useTable<Subject>('subjects');
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  const visible = useMemo(() => rows.filter(c =>
    (!favOnly || c.favorite) && (filterSubject === 'all' || c.subject_id === filterSubject)), [rows, favOnly, filterSubject]);

  const startCreate = () => { setEditing(null); setFront(''); setBack(''); setSubjectId(''); setOpen(true); };
  const startEdit = (c: Flashcard) => { setEditing(c); setFront(c.front); setBack(c.back); setSubjectId(c.subject_id ?? ''); setOpen(true); };

  const save = async () => {
    if (!front.trim() || !back.trim()) { toast('Both sides of the card are required', 'error'); return; }
    const values = { front: front.trim(), back: back.trim(), subject_id: subjectId || null };
    if (editing) { await update(editing.id, values); toast('Card updated'); }
    else {
      await insert(values); toast('Card added');
      if (user) checkAchievements(user.id, user.email, profile?.username);
    }
    setOpen(false);
  };

  const generate = async () => {
    if (!topic.trim()) { toast('Enter a topic first', 'error'); return; }
    setGenerating(true);
    try {
      const raw = await jsonChat(
        `Create exactly 6 study flashcards about: ${topic}. Respond with JSON: {"cards":[{"front":"question","back":"answer"}]}`,
        'You generate concise, accurate study flashcards. Respond with valid JSON only.');
      const parsed = JSON.parse(raw) as { cards: { front: string; back: string }[] };
      for (const c of parsed.cards.slice(0, 10)) await insert({ front: c.front, back: c.back, subject_id: null });
      toast(`${parsed.cards.length} AI cards added`);
      if (user) checkAchievements(user.id, user.email, profile?.username);
      setAiOpen(false); setTopic('');
    } catch { toast('AI generation failed — try again', 'error'); }
    setGenerating(false);
  };

  return (
    <AppLayout title="Flashcards" subtitle="Rapid-fire recall training"
      actions={<div className="flex gap-2">
        <Button variant="outline" onClick={() => setAiOpen(true)}><Sparkles size={16} /> AI generate</Button>
        <Button onClick={startCreate}><Plus size={16} /> New card</Button>
      </div>}>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Select label="Subject" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="all">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <Button variant={favOnly ? 'white' : 'ghost'} onClick={() => setFavOnly(f => !f)}>
          <Star size={16} /> Favorites
        </Button>
      </div>

      {loading ? <SkeletonCards /> : visible.length === 0 ? (
        <EmptyState title="No cards in the deck" hint="Create cards manually or let the AI coach build a deck from any topic."
          action={<Button onClick={() => setAiOpen(true)}><Sparkles size={16} /> Generate with AI</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(c => (
            <FlipCard key={c.id} card={c}
              onFav={() => update(c.id, { favorite: !c.favorite })}
              onEdit={() => startEdit(c)}
              onDelete={async () => { if (confirm('Delete this card?')) { await remove(c.id); toast('Card deleted'); } }} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit card' : 'New card'}>
        <div className="space-y-4">
          <Textarea label="Front (question)" id="front" value={front} onChange={e => setFront(e.target.value)} className="min-h-[80px]" />
          <Textarea label="Back (answer)" id="back" value={back} onChange={e => setBack(e.target.value)} className="min-h-[80px]" />
          <Select label="Subject (optional)" id="fc-subject" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Add card'}</Button>
        </div>
      </Modal>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="AI flashcard generator">
        <div className="space-y-4">
          <Input label="Topic" id="topic" placeholder="e.g. Photosynthesis, SQL joins, French Revolution"
            value={topic} onChange={e => setTopic(e.target.value)} />
          <Button onClick={generate} loading={generating} className="w-full"><Sparkles size={16} /> Generate 6 cards</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
