import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button, toast } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { streamChat, type ChatMessage } from '@/lib/ai';

const SUGGESTIONS = [
  'Build me a 7-day revision plan for my exams',
  'Explain recursion like I am five',
  'Quiz me on the French Revolution',
  'Give me a motivational pre-study pep talk',
];

export default function AITutor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setFailed(null);
    setInput('');
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setStreaming(true);
    let reply = '';
    try {
      await streamChat(history.slice(-20), token => {
        reply += token;
        setMessages([...history, { role: 'assistant', content: reply }]);
      });
      if (user) supabase.from('ai_history').insert({ user_id: user.id, kind: 'tutor', prompt: content, response: reply }).then(() => {});
    } catch {
      setMessages(history);
      setFailed(content);
      toast('Coach is offline — try again', 'error');
    }
    setStreaming(false);
  };

  return (
    <AppLayout title="AI Coach" subtitle="Your personal trainer for the mind"
      actions={messages.length > 0 ? <Button variant="ghost" onClick={() => setMessages([])}><RotateCcw size={16} /> New session</Button> : undefined}>
      <div className="mx-auto flex h-[calc(100vh-220px)] max-w-3xl flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles size={40} className="text-primary" aria-hidden />
              <h2 className="display mt-4 text-3xl">Ready when you are.</h2>
              <p className="mt-2 max-w-md text-sm text-muted">Ask anything — explanations, revision plans, practice questions, motivation. The coach streams answers in real time.</p>
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="border-2 border-white/15 px-4 py-3 text-left text-sm text-white transition-colors hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[85%] whitespace-pre-wrap border-2 px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user' ? 'border-primary bg-primary/10 text-white' : 'border-white/15 bg-card text-white/90'}`}>
                {m.content || <span className="inline-flex gap-1" aria-label="Coach is typing">
                  {[0, 1, 2].map(d => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d * 150}ms` }} />)}
                </span>}
              </div>
            </motion.div>
          ))}
          {failed && <div className="text-center"><Button variant="outline" onClick={() => send(failed)}>Retry last message</Button></div>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={e => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} disabled={streaming}
            placeholder="Ask the coach anything…" aria-label="Message the AI coach"
            className="flex-1 border-2 border-white/15 bg-surface px-4 py-3 text-white placeholder:text-muted/60 focus:border-primary focus:outline-none" />
          <Button type="submit" loading={streaming} aria-label="Send message"><Send size={16} /></Button>
        </form>
      </div>
    </AppLayout>
  );
}
