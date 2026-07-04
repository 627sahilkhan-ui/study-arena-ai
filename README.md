# Study Arena AI

**Train Your Mind Like an Athlete.**

A gamified study platform where students train like professional athletes — earn XP for every study session, level up through ranks (Rookie → Legend), build streaks, unlock achievements, compete on a global leaderboard, and get coached by AI.

Built with React + Vite + TypeScript, Supabase, Groq AI (chat + vision), Resend, Recharts and Framer Motion, deployed on Vercel.

---

## ✅ College Requirements Coverage

| Requirement | Where |
|---|---|
| Supabase Authentication | Sign up / login / logout / forgot & reset password (`src/contexts/AuthContext.tsx`) |
| Protected Routes | `Protected` guard in `src/App.tsx` — all app pages require a session |
| CRUD Operations | Notes, Subjects, Flashcards, Quizzes, Study Plans, Goals, Profile (`useTable` hook) |
| Supabase Database | 14 normalized tables with relationships + RLS (`supabase/schema.sql`) |
| Analytics Dashboard (Recharts) | `/analytics` — bar, pie, line and area charts |
| Landing Page | `/` — hero, features, how AI works, stats, testimonials, FAQ, newsletter |
| Good UI/UX | Athletic brutalist design system, Framer Motion, skeletons, empty states, a11y |
| Vercel Deployment | `vercel.json` + `/api` Edge Functions |
| GitHub Repository | Ready-to-push structure with `.gitignore` |
| Resend Email Integration | Welcome, achievement, goal-completed, weekly report, newsletter (`api/send-email.ts`) |
| Groq AI Integration | Streaming AI Coach, quiz generator, flashcard generator (`api/groq-chat.ts`) |
| Groq Vision Integration | OCR, summarize, explain, solve, generate cards/quizzes from images (`api/groq-vision.ts`) |

---

## 🚀 Setup

### 1. Prerequisites
- Node.js 18+
- Free accounts: [Supabase](https://supabase.com), [Groq](https://console.groq.com), [Resend](https://resend.com), [Vercel](https://vercel.com)

### 2. Supabase
1. Create a new Supabase project.
2. Open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → **Run**.
   This creates all tables, the auto-profile trigger, RLS policies and the `avatars` / `uploads` storage buckets.
3. Copy your **Project URL** and **anon public key** from *Settings → API*.

### 3. Environment variables
```bash
cp .env.example .env
```
Fill in:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (client-side) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (client-side, RLS-protected) |
| `GROQ_API_KEY` | Groq API key — **server-side only**, used by `/api` functions |
| `RESEND_API_KEY` | Resend API key — server-side only |
| `RESEND_FROM` | Verified sender, e.g. `Study Arena <noreply@yourdomain.com>` (use `onboarding@resend.dev` for testing) |

### 4. Run locally
```bash
npm install
npm run dev
```
> The `/api` Edge Functions run on Vercel. For full AI/email functionality locally, use `npx vercel dev` instead of `npm run dev` so the serverless functions are served too.

### 5. Deploy to Vercel
```bash
npm i -g vercel
vercel
```
Then in the Vercel dashboard → *Project → Settings → Environment Variables*, add all five variables above and redeploy. `vercel.json` already handles SPA rewrites while keeping `/api/*` live.

### 6. Push to GitHub
```bash
git init && git add . && git commit -m "Study Arena AI"
git remote add origin https://github.com/<you>/study-arena-ai.git
git push -u origin main
```

---

## 🏟️ Feature Tour

- **Dashboard** — study timer (2 XP/minute), level & rank card, streak flame, 7-day training chart, quick actions, daily motivation.
- **Notes** — full CRUD with live search, category filter and subject tagging.
- **Flashcards** — 3D flip cards, favorites, subject filter, and one-click AI deck generation.
- **Quizzes** — AI-generated multiple-choice quizzes, animated take-quiz flow, attempt tracking, XP bonuses, and a *Perfect Game* achievement for 100%.
- **Study Planner & Goals** — programs with dates and status; goals fire a congratulation email on completion.
- **AI Coach** — real-time streaming chat (Groq `llama-3.3-70b-versatile`) with retry handling and conversation history saved to `ai_history`.
- **Vision AI** — upload handwritten notes, textbook pages or question papers (compressed client-side); extract text, summarize, explain diagrams, solve questions, or generate flashcards/quizzes straight into your library (Groq Llama 4 Scout).
- **Analytics** — Recharts dashboards for study minutes, subject split, quiz accuracy and cumulative XP growth.
- **Leaderboard** — top 50 athletes ranked by XP with your row highlighted.
- **Achievements** — 8 unlockable trophies awarded automatically with toasts, notifications and emails.

## 🔒 Security
- Row Level Security on every table — users can only touch their own rows (profiles are read-only public for the leaderboard).
- API keys never reach the browser: Groq and Resend are called only from Vercel Edge Functions.
- Zod validation on auth forms; HTML escaping in email templates; private storage bucket for uploads.

## ⚡ Performance
- Route-based code splitting (all 20 pages lazy-loaded) with vendor/chart/motion chunk splitting.
- GPU-friendly animations only (`transform`/`opacity`), `prefers-reduced-motion` respected.
- `React.memo` on hot components, memoized chart datasets, optimistic UI updates, skeleton loaders, lazy images.

## 🗂️ Structure
```
api/                 Vercel Edge Functions (Groq chat, Groq vision, Resend)
supabase/schema.sql  Full database schema + RLS + storage
src/
  components/        ui primitives, layout, dashboard widgets
  contexts/          AuthContext (session, profile, XP/streak engine)
  hooks/             useTable — generic CRUD hook
  lib/               supabase client, AI helpers, XP engine, achievements
  pages/             20 lazy-loaded routes
  types/             shared TypeScript models
```

Built as a college major project — engineered like a product.
