create schema if not exists private;

alter table public.notes
  add column if not exists revision bigint not null default 0;

create table if not exists public.note_shares (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  permission text not null check (permission in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

create index if not exists note_shares_user_id_idx on public.note_shares(user_id);

alter table public.note_shares enable row level security;
revoke all on table public.note_shares from anon, authenticated;
grant select, insert, update, delete on table public.note_shares to authenticated;

create or replace function private.note_owner_id(p_note_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select n.user_id from public.notes n where n.id = p_note_id;
$$;

create or replace function private.has_note_share(
  p_note_id uuid,
  p_user_id uuid,
  p_permission text default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.note_shares s
    where s.note_id = p_note_id
      and s.user_id = p_user_id
      and (p_permission is null or s.permission = p_permission)
  );
$$;

drop policy if exists "Users can read their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;

create policy "Owners and recipients can read notes" on public.notes
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (select private.has_note_share(id, (select auth.uid())))
  );

create policy "Owners and editors can update notes" on public.notes
  for update to authenticated
  using (
    (select auth.uid()) = user_id
    or (select private.has_note_share(id, (select auth.uid()), 'editor'))
  )
  with check (user_id = (select private.note_owner_id(id)));

create policy "Owners can read note shares" on public.note_shares
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.note_owner_id(note_id)) = (select auth.uid())
  );

create policy "Owners can create note shares" on public.note_shares
  for insert to authenticated
  with check ((select private.note_owner_id(note_id)) = (select auth.uid()));

create policy "Owners can update note shares" on public.note_shares
  for update to authenticated
  using ((select private.note_owner_id(note_id)) = (select auth.uid()));

create policy "Owners can delete note shares" on public.note_shares
  for delete to authenticated
  using ((select private.note_owner_id(note_id)) = (select auth.uid()));

create or replace function public.share_note_by_email(
  p_note_id uuid,
  p_email text,
  p_permission text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  normalized_email text := lower(trim(p_email));
begin
  if p_permission not in ('viewer', 'editor') then
    raise exception 'Invalid note permission';
  end if;

  if not exists (
    select 1 from public.notes n
    where n.id = p_note_id and n.user_id = (select auth.uid())
  ) then
    raise exception 'Only the note owner can share this note';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = normalized_email;

  if target_user_id is null then
    raise exception 'No account exists for that email address';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'You cannot share a note with yourself';
  end if;

  insert into public.note_shares(note_id, user_id, recipient_email, permission)
  values (p_note_id, target_user_id, normalized_email, p_permission)
  on conflict (note_id, user_id)
  do update set recipient_email = excluded.recipient_email,
                permission = excluded.permission;
end;
$$;

revoke execute on function private.note_owner_id(uuid) from public;
revoke execute on function private.has_note_share(uuid, uuid, text) from public;
revoke execute on function public.share_note_by_email(uuid, text, text) from public;
grant usage on schema private to authenticated;
grant execute on function private.note_owner_id(uuid) to authenticated;
grant execute on function private.has_note_share(uuid, uuid, text) to authenticated;
grant execute on function public.share_note_by_email(uuid, text, text) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.notes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.note_shares;
  exception when duplicate_object then null;
  end;
end;
$$;
