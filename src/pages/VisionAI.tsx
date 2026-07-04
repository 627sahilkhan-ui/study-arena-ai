import { useRef, useState } from 'react';
import { ScanEye, Upload, Save, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, Card, Select, Skeleton, toast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { compressImage, visionRequest } from '@/lib/ai';
import type { QuizQuestion } from '@/types';

const TASKS = [
  { id: 'extract', label: 'Extract text (OCR)' },
  { id: 'summarize', label: 'Summarize the content' },
  { id: 'explain', label: 'Explain the diagram / concept' },
  { id: 'solve', label: 'Solve the questions' },
  { id: 'flashcards', label: 'Generate flashcards' },
  { id: 'quiz', label: 'Generate a quiz' },
] as const;

export default function VisionAI() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [task, setTask] = useState<string>('extract');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return; }
    try {
      setResult('');
      setImage(await compressImage(file)); // compressed client-side before upload
    } catch { toast('Could not read that image', 'error'); }
  };

  const analyze = async () => {
    if (!image) { toast('Upload an image first', 'error'); return; }
    setBusy(true); setResult('');
    try {
      const content = await visionRequest(image, task);
      setResult(content);
      if (user) supabase.from('ai_history').insert({ user_id: user.id, kind: `vision:${task}`, prompt: task, response: content.slice(0, 4000) }).then(() => {});
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Vision analysis failed', 'error');
    }
    setBusy(false);
  };

  /** Save AI-generated flashcards or quiz JSON straight into the database. */
  const saveStructured = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(result);
      if (task === 'flashcards' && Array.isArray(parsed.cards)) {
        const rows = parsed.cards.slice(0, 15).map((c: { front: string; back: string }) =>
          ({ user_id: user.id, front: c.front, back: c.back }));
        await supabase.from('flashcards').insert(rows);
        toast(`${rows.length} flashcards saved to your deck`);
      } else if (task === 'quiz' && Array.isArray(parsed.questions)) {
        const questions = (parsed.questions as QuizQuestion[]).filter(q => q.options?.length === 4);
        await supabase.from('quizzes').insert({ user_id: user.id, title: parsed.title || 'Vision quiz', questions, ai_generated: true });
        toast('Quiz saved — find it on the Quizzes page');
      }
    } catch { toast('Could not parse the AI output — regenerate and retry', 'error'); }
    setSaving(false);
  };

  const structured = (task === 'flashcards' || task === 'quiz') && !!result;

  return (
    <AppLayout title="Vision AI" subtitle="Point the camera at anything — notes, textbooks, diagrams, question papers">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="eyebrow mb-4 text-muted">1 · Upload</h2>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Upload an image"
            onChange={e => onFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className="flex min-h-[220px] w-full flex-col items-center justify-center border-2 border-dashed border-white/20 p-4 transition-colors hover:border-primary"
            aria-label="Upload or drop an image">
            {image ? (
              <img src={image} alt="Uploaded study material" className="max-h-72 object-contain" />
            ) : (
              <>
                <Upload size={32} className="text-muted" aria-hidden />
                <p className="mt-3 text-sm text-white">Click or drop an image here</p>
                <p className="mt-1 font-mono text-xs text-muted">Handwritten notes · textbook pages · diagrams · assignments</p>
              </>
            )}
          </button>

          <div className="mt-4 space-y-4">
            <Select label="2 · What should the AI do?" id="vision-task" value={task}
              onChange={e => { setTask(e.target.value); setResult(''); }}>
              {TASKS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
            <Button onClick={analyze} loading={busy} disabled={!image} className="w-full">
              <ScanEye size={16} /> Analyze image
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="eyebrow text-muted">3 · Result</h2>
            {structured && (
              <Button variant="outline" onClick={saveStructured} loading={saving}>
                <Save size={16} /> Save to {task === 'quiz' ? 'quizzes' : 'deck'}
              </Button>
            )}
          </div>
          {busy ? (
            <div className="space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
          ) : result ? (
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90">{result}</pre>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <Sparkles size={28} className="text-muted" aria-hidden />
              <p className="mt-3 text-sm text-muted">Upload an image and hit analyze — the AI output lands here.</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
