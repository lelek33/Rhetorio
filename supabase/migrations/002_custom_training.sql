-- Custom training: user-owned scenarios and uploaded documents.

alter table public.scenarios
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.scenarios
  add column if not exists is_custom boolean not null default false;

create index if not exists scenarios_user_id_idx on public.scenarios(user_id);

drop policy if exists "Authenticated users can read scenarios" on public.scenarios;

create policy "Read default and own scenarios"
  on public.scenarios for select
  to authenticated
  using (user_id is null or user_id = auth.uid());

create policy "Insert own custom scenarios"
  on public.scenarios for insert
  to authenticated
  with check (user_id = auth.uid() and is_custom = true);

create policy "Delete own custom scenarios"
  on public.scenarios for delete
  to authenticated
  using (user_id = auth.uid() and is_custom = true);

create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  source_filename text,
  source_type text not null default 'paste' check (source_type in ('paste', 'txt', 'md', 'pdf')),
  char_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists user_documents_user_id_idx on public.user_documents(user_id);

alter table public.user_documents enable row level security;

create policy "Users read own documents"
  on public.user_documents for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own documents"
  on public.user_documents for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users delete own documents"
  on public.user_documents for delete
  to authenticated
  using (user_id = auth.uid());
