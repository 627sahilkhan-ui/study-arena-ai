-- ============================================================
-- STUDY ARENA AI — Database Schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ---------- PROFILES (extends auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  xp integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  last_study_date date,
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- SUBJECTS ----------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#FF2E2E',
  created_at timestamptz not null default now()
);

-- ---------- NOTES ----------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  content text not null default '',
  category text not null default 'General',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- STUDY PLANS ----------
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text default '',
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active','completed','paused')),
  created_at timestamptz not null default now()
);

-- ---------- GOALS ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_hours numeric not null default 1,
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- FLASHCARDS ----------
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  front text not null,
  back text not null,
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- QUIZZES ----------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  questions jsonb not null default '[]',
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null,
  total integer not null,
  created_at timestamptz not null default now()
);

-- ---------- STUDY SESSIONS (timer results, fuels analytics + XP) ----------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  minutes integer not null,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- ACHIEVEMENTS ----------
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null default 'trophy',
  xp_reward integer not null default 50
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

insert into public.achievements (id, title, description, icon, xp_reward) values
  ('first_session','First Rep','Complete your first study session.','zap',50),
  ('streak_3','Warming Up','Hit a 3-day study streak.','flame',75),
  ('streak_7','On Fire','Hit a 7-day study streak.','flame',150),
  ('xp_500','Rising Star','Earn 500 total XP.','star',100),
  ('xp_2000','Elite Athlete','Earn 2,000 total XP.','medal',250),
  ('quiz_ace','Perfect Game','Score 100% on a quiz.','target',100),
  ('note_taker','Playbook Author','Create 10 notes.','notebook',75),
  ('card_shark','Card Shark','Create 25 flashcards.','layers',75)
on conflict (id) do nothing;

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- AI HISTORY ----------
create table if not exists public.ai_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  prompt text,
  response text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.notes enable row level security;
alter table public.study_plans enable row level security;
alter table public.goals enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.study_sessions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_history enable row level security;

-- Profiles: everyone signed in can read (leaderboard), only owner edits
create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);
create policy "own profile update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Achievements catalog: readable by all signed-in users
create policy "achievements readable" on public.achievements
  for select to authenticated using (true);

-- Generic owner-only policies
do $$
declare t text;
begin
  foreach t in array array['subjects','notes','study_plans','goals','flashcards',
                           'quizzes','quiz_attempts','study_sessions',
                           'user_achievements','notifications','ai_history']
  loop
    execute format('create policy "own rows select" on public.%I for select to authenticated using (auth.uid() = user_id);', t);
    execute format('create policy "own rows insert" on public.%I for insert to authenticated with check (auth.uid() = user_id);', t);
    execute format('create policy "own rows update" on public.%I for update to authenticated using (auth.uid() = user_id);', t);
    execute format('create policy "own rows delete" on public.%I for delete to authenticated using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true),
  ('uploads','uploads', false)
on conflict (id) do nothing;

create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatar owner write" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads owner all" on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
