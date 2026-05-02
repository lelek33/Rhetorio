create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'premium')),
  free_sessions_used int not null default 0,
  training_goal text
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  difficulty text not null,
  duration_minutes int not null,
  system_prompt text not null,
  is_premium boolean not null default false,
  situation text not null default '',
  goal text not null default '',
  criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int,
  score_total int,
  status text not null default 'active' check (status in ('active', 'completed', 'analyzing', 'failed'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  audio_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  score_total int not null,
  conversation_flow int not null,
  confidence int not null,
  clarity int not null,
  questions_score int not null,
  filler_words_count int not null default 0,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  better_phrases jsonb not null default '[]'::jsonb,
  next_exercise text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists messages_session_id_idx on public.messages(session_id);
create index if not exists analyses_session_id_idx on public.analyses(session_id);

alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.analyses enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Authenticated users can read scenarios"
  on public.scenarios for select
  to authenticated
  using (true);

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read messages for own sessions"
  on public.messages for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert messages for own sessions"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can update messages for own sessions"
  on public.messages for update
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
      and sessions.user_id = auth.uid()
    )
  );

create policy "Users can read analyses for own sessions"
  on public.analyses for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = analyses.session_id
      and sessions.user_id = auth.uid()
    )
  );

insert into public.scenarios (id, title, category, description, difficulty, duration_minutes, system_prompt, is_premium, situation, goal, criteria)
values
('11111111-1111-1111-1111-111111111111', 'Smalltalk auf einer Party', 'Smalltalk', 'Übe, ein lockeres Gespräch mit einer fremden Person zu starten.', 'Leicht', 3, 'Du bist ein realistischer Gesprächspartner für ein deutsches Smalltalk-Training. Bleibe im Szenario. Antworte kurz, natürlich und menschlich. Stelle gelegentlich offene Rückfragen. Wenn der Nutzer sehr kurz antwortet, hilf ihm sanft, weiterzusprechen. Gib während des Gesprächs kein Coaching-Feedback. Sprich Deutsch.', false, 'Du bist auf einer Party und kennst kaum jemanden.', 'Halte das Gespräch 3 Minuten am Laufen.', '["Rückfragen", "Natürlichkeit", "Gesprächsfluss", "Pausen"]'),
('22222222-2222-2222-2222-222222222222', 'Smalltalk beim Networking', 'Smalltalk', 'Übe, bei einem beruflichen Event natürlich ins Gespräch zu kommen.', 'Mittel', 3, 'Du bist ein realistischer Gesprächspartner für ein deutsches Smalltalk-Training. Bleibe im Szenario. Antworte kurz, natürlich und menschlich. Stelle gelegentlich offene Rückfragen. Wenn der Nutzer sehr kurz antwortet, hilf ihm sanft, weiterzusprechen. Gib während des Gesprächs kein Coaching-Feedback. Sprich Deutsch.', false, 'Du bist auf einem beruflichen Event und triffst neue Kontakte.', 'Starte natürlich ein Gespräch und finde Anknüpfungspunkte.', '["Einstieg", "Offene Fragen", "Relevanz", "Gesprächsfluss"]'),
('33333333-3333-3333-3333-333333333333', 'Bewerbung: Erzählen Sie etwas über sich', 'Bewerbung', 'Trainiere eine überzeugende, strukturierte Selbstvorstellung.', 'Mittel', 5, 'Du bist ein deutscher Interviewer. Stelle realistische Interviewfragen. Sei professionell und freundlich, aber nicht zu einfach. Frage nach, wenn Antworten vage sind. Gib während des Gesprächs kein Feedback. Sprich Deutsch.', false, 'Ein Bewerbungsgespräch beginnt mit der klassischen Selbstvorstellung.', 'Antworte klar, strukturiert und passend zur Stelle.', '["Struktur", "Klarheit", "Selbstbewusstsein", "Relevanz"]'),
('44444444-4444-4444-4444-444444444444', 'Bewerbung: Was sind Ihre Schwächen?', 'Bewerbung', 'Übe eine souveräne Antwort auf eine klassische Interviewfrage.', 'Mittel', 5, 'Du bist ein deutscher Interviewer. Stelle realistische Interviewfragen. Sei professionell und freundlich, aber nicht zu einfach. Frage nach, wenn Antworten vage sind. Gib während des Gesprächs kein Feedback. Sprich Deutsch.', false, 'Der Interviewer fragt nach deinen Schwächen.', 'Zeige Reflexion, ohne dich kleinzumachen.', '["Ehrlichkeit", "Lernbereitschaft", "Konkretheit", "Souveränität"]'),
('55555555-5555-5555-5555-555555555555', 'Gehaltsverhandlung mit skeptischem Chef', 'Gehalt', 'Übe, deine Gehaltsforderung ruhig und überzeugend zu begründen.', 'Schwer', 5, 'Du bist ein skeptischer, aber fairer Vorgesetzter in einer Gehaltsverhandlung. Frage, warum der Nutzer eine Gehaltserhöhung verdient. Frage nach konkreten Leistungen, Zahlen und Verantwortung. Bleibe realistisch, nicht aggressiv. Gib während des Gesprächs kein Coaching-Feedback. Sprich Deutsch.', true, 'Dein Vorgesetzter ist offen, aber kritisch gegenüber deiner Forderung.', 'Begründe deine Forderung mit Leistung, Verantwortung und Wirkung.', '["Argumentation", "Ruhe", "Zahlen", "Umgang mit Einwänden"]'),
('66666666-6666-6666-6666-666666666666', '60-Sekunden-Pitch', 'Karriere', 'Erkläre eine Idee kurz, klar und überzeugend.', 'Mittel', 2, 'Du bist ein deutscher Interviewer. Stelle realistische Interviewfragen. Sei professionell und freundlich, aber nicht zu einfach. Frage nach, wenn Antworten vage sind. Gib während des Gesprächs kein Feedback. Sprich Deutsch.', false, 'Du hast eine Minute, um eine Idee überzeugend vorzustellen.', 'Komme schnell auf den Punkt und mache neugierig.', '["Kürze", "Struktur", "Nutzen", "Abschluss"]')
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  system_prompt = excluded.system_prompt,
  is_premium = excluded.is_premium,
  situation = excluded.situation,
  goal = excluded.goal,
  criteria = excluded.criteria;
