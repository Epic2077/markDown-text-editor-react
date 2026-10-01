create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at bigint not null,
  updated_at bigint not null,
  last_viewed_at bigint,
  sort_order bigint not null
);

alter table public.notes enable row level security;
revoke all on table public.notes from anon, authenticated;
grant select, insert, update, delete on table public.notes to authenticated;

create index if not exists notes_user_id_idx on public.notes(user_id);

create policy "Users can read their own notes" on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own notes" on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own notes" on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own notes" on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);
