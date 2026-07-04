import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Trophy, BrainCircuit, ScanEye, BarChart3, Timer, Layers,
  ChevronDown, ArrowRight, Menu, X,
} from 'lucide-react';
import { Button, Counter, Card, toast } from '@/components/ui';
import { sendEmail } from '@/lib/ai';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

/* ---------- Nav ---------- */
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-white/10 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="display text-xl">STUDY<span className="text-primary">ARENA</span></Link>
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-muted md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#stats" className="hover:text-white">Stats</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/signup"><Button>Enter the Arena</Button></Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t-2 border-white/10 bg-bg px-4 py-4 md:hidden">
          {['features', 'how', 'stats', 'faq'].map(id => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="block py-2 font-mono text-sm uppercase tracking-widest text-muted">{id}</a>
          ))}
          <div className="mt-3 flex gap-3">
            <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Log in</Button></Link>
            <Link to="/signup" className="flex-1"><Button className="w-full">Sign up</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="noise relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
      <div className="stripe absolute left-0 top-0 h-2 w-full opacity-60" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow mb-6">
          Season 01 · Open tryouts
        </motion.p>
        <h1 className="display text-[15vw] leading-[0.9] md:text-8xl lg:text-9xl">
          {['TRAIN YOUR MIND', 'LIKE AN', 'ATHLETE.'].map((line, i) => (
            <motion.span key={line} className={cn('block', i === 2 && 'text-primary')}
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.15, duration: 0.7, ease: 'easeOut' }}>
              {line}
            </motion.span>
          ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-8 max-w-xl text-lg text-muted">
          Study Arena AI turns studying into training. Log sessions, earn XP, build streaks,
          climb the leaderboard — with an AI coach in your corner the whole way.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
          className="mt-10 flex flex-wrap gap-4">
          <Link to="/signup"><Button className="text-base px-8 py-4">Start training <ArrowRight size={18} /></Button></Link>
          <a href="#how"><Button variant="outline" className="text-base px-8 py-4">See how it works</Button></a>
        </motion.div>
      </div>

      {/* Ticker */}
      <div className="mt-20 overflow-hidden border-y-2 border-white/10 bg-surface py-3" aria-hidden>
        <div className="flex w-max animate-marquee gap-8 font-mono text-xs uppercase tracking-[0.3em] text-muted">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-8">
              {['No pain no gain', 'XP earned, never given', 'Streaks build champions', 'Your mind is a muscle', 'Show up daily', 'Leaderboards don\'t lie'].map(t => (
                <span key={t} className="flex items-center gap-8">{t} <span className="text-primary">///</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Features ---------- */
const FEATURES = [
  { icon: Timer, title: 'Training Sessions', text: 'A focused study timer that logs every rep and converts minutes into XP.' },
  { icon: Zap, title: 'XP & Levels', text: 'A quadratic progression curve. Level up from Rookie to Legend.' },
  { icon: Flame, title: 'Streaks', text: 'Miss a day, lose the fire. Consistency is the whole sport.' },
  { icon: BrainCircuit, title: 'AI Coach', text: 'A Groq-powered tutor that explains, quizzes, plans and pushes you.' },
  { icon: ScanEye, title: 'Vision AI', text: 'Snap handwritten notes or textbook pages — get summaries, flashcards and solved answers.' },
  { icon: Layers, title: 'Flashcards & Quizzes', text: 'Create decks manually or generate them with AI from any topic or image.' },
  { icon: BarChart3, title: 'Performance Analytics', text: 'WHOOP-style dashboards: hours, accuracy, subject splits, XP growth.' },
  { icon: Trophy, title: 'Leaderboard', text: 'Compete with everyone in the Arena. XP decides the standings.' },
];
function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <motion.div {...fadeUp}>
        <p className="eyebrow">The kit</p>
        <h2 className="display mt-2 text-5xl md:text-7xl">BUILT TO <span className="text-primary">COMPETE.</span></h2>
      </motion.div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }}>
            <Card hover className="h-full">
              <f.icon className="text-primary" size={28} aria-hidden />
              <h3 className="display mt-4 text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- How AI works ---------- */
const STEPS = [
  { n: '01', title: 'Upload or ask', text: 'Type a question, paste a topic, or upload a photo of handwritten notes, a diagram or a question paper.' },
  { n: '02', title: 'AI breaks it down', text: 'Groq models extract text, explain diagrams, solve problems and identify what matters for your exam.' },
  { n: '03', title: 'Train on it', text: 'One tap turns the output into flashcards, quizzes and a revision plan — then you earn XP working through them.' },
];
function How() {
  return (
    <section id="how" className="border-y-2 border-white/10 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <motion.div {...fadeUp}>
          <p className="eyebrow">The playbook</p>
          <h2 className="display mt-2 text-5xl md:text-7xl">HOW THE <span className="text-primary">AI COACH</span> WORKS</h2>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }}
              className="border-l-4 border-primary bg-card p-8">
              <span className="display text-6xl text-white/10">{s.n}</span>
              <h3 className="display mt-4 text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm text-muted">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */
function Stats() {
  const items = [
    { v: 12500, s: '+', l: 'Study sessions logged' },
    { v: 480, s: 'K', l: 'XP earned by athletes' },
    { v: 96, s: '%', l: 'Say streaks changed their habits' },
    { v: 31, s: ' days', l: 'Longest active streak' },
  ];
  return (
    <section id="stats" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div key={it.l} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            className="card-brutal p-8 text-center">
            <p className="display text-5xl text-primary md:text-6xl"><Counter to={it.v} suffix={it.s} /></p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">{it.l}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
const QUOTES = [
  { q: 'I stopped "studying when I feel like it" and started training. My streak is 24 days and counting.', a: 'Aarav — Engineering, 3rd year' },
  { q: 'The Vision AI turned my messy handwritten notes into flashcards in seconds. Unreal before exams.', a: 'Meera — Medical entrance prep' },
  { q: 'Competing with my roommates on the leaderboard did more for my grades than any planner ever has.', a: 'Rohan — B.Com finalist' },
];
function Testimonials() {
  return (
    <section className="border-y-2 border-white/10 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <motion.h2 {...fadeUp} className="display text-5xl md:text-7xl">FROM THE <span className="text-primary">LOCKER ROOM</span></motion.h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {QUOTES.map((t, i) => (
            <motion.blockquote key={t.a} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              className="card-brutal flex h-full flex-col justify-between p-8">
              <p className="text-lg leading-relaxed">“{t.q}”</p>
              <footer className="mt-6 font-mono text-xs uppercase tracking-widest text-primary">{t.a}</footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
const FAQS = [
  { q: 'Is Study Arena AI free?', a: 'Yes. This build is a college major project and is completely free to use. Sign up and start training.' },
  { q: 'How do I earn XP?', a: 'Every minute of a logged study session earns XP, plus bonuses for quiz scores and unlocked achievements. XP decides your level and leaderboard rank.' },
  { q: 'What can the Vision AI read?', a: 'Handwritten notes, textbook pages, diagrams, formulas, tables and question papers. It extracts, explains, summarizes and can generate flashcards or quizzes from what it sees.' },
  { q: 'Which AI powers the coach?', a: 'Groq-hosted Llama models — extremely fast responses for chat, and a vision model for image understanding.' },
  { q: 'Is my data private?', a: 'Every table is protected with Supabase Row Level Security, so you can only ever read and write your own data.' },
];
function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-24 md:px-8">
      <motion.h2 {...fadeUp} className="display text-5xl md:text-7xl">RULES OF THE <span className="text-primary">GAME</span></motion.h2>
      <div className="mt-12">
        {FAQS.map((f, i) => (
          <div key={f.q} className="border-b-2 border-white/10">
            <button className="flex w-full items-center justify-between gap-4 py-5 text-left"
              onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-expanded={openIdx === i}>
              <span className="display text-lg md:text-xl">{f.q}</span>
              <ChevronDown className={cn('shrink-0 text-primary transition-transform', openIdx === i && 'rotate-180')} />
            </button>
            <motion.div initial={false} animate={{ height: openIdx === i ? 'auto' : 0, opacity: openIdx === i ? 1 : 0 }}
              className="overflow-hidden">
              <p className="pb-5 text-muted">{f.a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Newsletter + Footer ---------- */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email', 'error'); return; }
    setSending(true);
    await sendEmail(email, 'newsletter');
    setSending(false); setEmail('');
    toast('You are on the list. Check your inbox.');
  };
  return (
    <section className="stripe relative border-y-2 border-primary">
      <div className="mx-auto max-w-7xl bg-bg/95 px-4 py-20 md:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="display text-4xl md:text-6xl">GET ARENA <span className="text-primary">UPDATES</span></h2>
          <p className="mt-4 text-muted">New drills, features and season announcements. No spam, just gains.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@college.edu"
              aria-label="Email address"
              className="flex-1 border-2 border-white/20 bg-surface px-4 py-3 text-white placeholder:text-muted/60 focus:border-primary focus:outline-none" />
            <Button onClick={submit} loading={sending}>Subscribe</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <span className="display text-xl">STUDY<span className="text-primary">ARENA</span></span>
        <p className="font-mono text-xs text-muted">Train your mind like an athlete. © {new Date().getFullYear()} Study Arena AI.</p>
        <div className="flex gap-6 font-mono text-xs uppercase tracking-widest text-muted">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link to="/signup" className="hover:text-white">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="bg-bg text-white">
      <Nav />
      <Hero />
      <Features />
      <How />
      <Stats />
      <Testimonials />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
