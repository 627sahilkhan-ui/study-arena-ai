import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sparkles, Play, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Select, Modal, EmptyState, SkeletonCards, Badge, ProgressBar, toast } from '@/components/ui';
import { useTable } from '@/hooks/useTable';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { jsonChat } from '@/lib/ai';
import { awardQuizAce } from '@/lib/achievements';
import type { Quiz, QuizQuestion, Subject } from '@/types';

/** Full-screen take-quiz flow rendered inside a modal. */
function TakeQuiz({ quiz, onDone }: { quiz: Quiz; onDone: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = quiz.questions[i];
  const last = i === quiz.questions.length - 1;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer_index) setScore(s => s + 1);
  };
  const next = () => {
    const final = score;
    if (last) { onDone(final); return; }
    setI(n => n + 1); setPicked(null);
  };

  return (
    <div>
      <ProgressBar pct={((i + (picked !== null ? 1 : 0)) / quiz.questions.length) * 100} label="Quiz progress" />
      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">Question {i + 1} / {quiz.questions.length}</p>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          <h3 className="mt-2 text-lg font-bold text-white">{q.question}</h3>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, idx) => {
              const state = picked === null ? 'idle' : idx === q.answer_index ? 'right' : idx === picked ? 'wrong' : 'idle';
              return (
                <button key={idx} onClick={() => choose(idx)} disabled={picked !== null}
                  className={`w-full border-2 px-4 py-3 text-left transition-colors ${
                    state === 'right' ? 'border-success bg-success/10 text-success'
                    : state === 'wrong' ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/15 text-white hover:border-white'}`}>
                  <span className="mr-3 font-mono text-xs text-muted">{String.fromCharCode(65 + idx)}</span>{opt}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      {picked !== null && (
        <Button onClick={next} className="mt-5 w-full">{last ? 'Finish' : 'Next question'}</Button>
      )}
    </div>
  );
}

export default function Quizzes() {
  const { user, profile, addXp } = useAuth();
  const { rows, loading, insert, remove } = useTable<Quiz>('quizzes');
  const { rows: subjects } = useTable<Subject>('subjects');
  const [aiOpen, setAiOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('5');
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState<Quiz | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const generate = async () => {
    if (!topic.trim()) { toast('Enter a topic first', 'error'); return; }
    setGenerating(true);
    try {
      const n = Math.min(10, Math.max(3, Number(count) || 5));
      const raw = await jsonChat(
        `Create a ${n}-question multiple-choice quiz about: ${topic}. Respond with JSON: {"title":"quiz title","questions":[{"question":"...","options":["a","b","c","d"],"answer_index":0}]}. Each question has exactly 4 options and answer_index is the 0-based index of the correct option.`,
        'You generate accurate multiple-choice quizzes. Respond with valid JSON only.');
      const parsed = JSON.parse(raw) as { title: string; questions: QuizQuestion[] };
      const clean = parsed.questions.filter(q => Array.isArray(q.options) && q.options.length === 4
        && Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < 4);
      if (clean.length === 0) throw new Error('empty');
      await insert({ title: parsed.title || topic, questions: clean, ai_generated: true, subject_id: null });
      toast('Quiz generated — game on');
      setAiOpen(false); setTopic('');
    } catch { toast('AI generation failed — try again', 'error'); }
    setGenerating(false);
  };

  const finish = async (quiz: Quiz, score: number) => {
    const total = quiz.questions.length;
    setPlaying(null);
    setResult({ score, total });
    if (!user) return;
    await supabase.from('quiz_attempts').insert({ user_id: user.id, quiz_id: quiz.id, score, total });
    const bonus = score * 5;
    if (bonus > 0) { await addXp(bonus); toast(`+${bonus} XP earned`); }
    if (score === total) awardQuizAce(user.id, user.email, profile?.username);
  };

  return (
    <AppLayout title="Quizzes" subtitle="Match day. Prove what you trained."
      actions={<Button onClick={() => setAiOpen(true)}><Sparkles size={16} /> AI generate quiz</Button>}>
      {loading ? <SkeletonCards /> : rows.length === 0 ? (
        <EmptyState title="No quizzes yet" hint="Generate a quiz on any topic with AI, then step into the arena."
          action={<Button onClick={() => setAiOpen(true)}><Sparkles size={16} /> Generate your first quiz</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(q => {
            const subject = subjects.find(s => s.id === q.subject_id);
            return (
              <Card key={q.id} hover>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="display text-2xl">{q.title}</h3>
                  {q.ai_generated && <Badge color="border-info text-info"><Sparkles size={12} /> AI</Badge>}
                </div>
                <p className="mt-2 font-mono text-xs text-muted">
                  {q.questions.length} questions{subject ? ` · ${subject.name}` : ''}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setPlaying(q)}><Play size={16} /> Start</Button>
                  <Button variant="ghost" aria-label="Delete quiz"
                    onClick={async () => { if (confirm('Delete this quiz?')) { await remove(q.id); toast('Quiz deleted'); } }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="AI quiz generator">
        <div className="space-y-4">
          <Input label="Topic" id="quiz-topic" placeholder="e.g. Operating systems, World War II, React hooks"
            value={topic} onChange={e => setTopic(e.target.value)} />
          <Select label="Questions" id="quiz-count" value={count} onChange={e => setCount(e.target.value)}>
            {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
          </Select>
          <Button onClick={generate} loading={generating} className="w-full"><Sparkles size={16} /> Generate quiz</Button>
        </div>
      </Modal>

      {playing && (
        <Modal open onClose={() => setPlaying(null)} title={playing.title} wide>
          <TakeQuiz quiz={playing} onDone={s => finish(playing, s)} />
        </Modal>
      )}

      {result && (
        <Modal open onClose={() => setResult(null)} title="Final score">
          <div className="text-center">
            <Trophy size={48} className={`mx-auto ${result.score === result.total ? 'text-warning' : 'text-muted'}`} aria-hidden />
            <p className="display mt-4 text-6xl">{result.score}<span className="text-muted">/{result.total}</span></p>
            <p className="mt-2 text-muted">
              {result.score === result.total ? 'Perfect game. Champion performance.'
                : result.score >= result.total * 0.7 ? 'Strong showing — keep the streak alive.'
                : 'Back to training. You will take the rematch.'}
            </p>
            <Button onClick={() => setResult(null)} className="mt-6 w-full">Back to quizzes</Button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
