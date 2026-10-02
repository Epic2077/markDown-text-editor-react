create extension if not exists pgcrypto;

create table if not exists public.note_share_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  token_hash text not null unique,
  permission text not null check (permission in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists note_share_links_note_id_idx
  on public.note_share_links(note_id);

alter table public.note_share_links enable row level security;
revoke all on table public.note_share_links from anon, authenticated;
grant select, delete on table public.note_share_links to authenticated;

create or replace function public.create_note_share_link(
  p_note_id uuid,
  p_permission text
)
returns table(link_id uuid, token text, permission text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
  created_link_id uuid;
begin
  if p_permission not in ('viewer', 'editor') then
    raise exception 'Invalid note permission';
  end if;

  if not exists (
    select 1 from public.notes n
    where n.id = p_note_id and n.user_id = (select auth.uid())
  ) then
    raise exception 'Only the note owner can create a share link';
  end if;

  insert into public.note_share_links(note_id, token_hash, permission)
  values (p_note_id, encode(digest(raw_token, 'sha256'), 'hex'), p_permission)
  returning id into created_link_id;

  return query select created_link_id, raw_token, p_permission;
end;
$$;

create or replace function public.accept_note_share_link(p_token text)
returns table(note_id uuid, permission text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  link_note_id uuid;
  link_permission text;
  recipient_email text := coalesce((select u.email from auth.users u where u.id = (select auth.uid())), '');
begin
  select l.note_id, l.permission
    into link_note_id, link_permission
  from public.note_share_links l
  where l.token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
    and l.revoked_at is null;

  if link_note_id is null then
    raise exception 'This share link is invalid or revoked';
  end if;

  insert into public.note_shares(note_id, user_id, recipient_email, permission)
  values (link_note_id, (select auth.uid()), recipient_email, link_permission)
  on conflict (note_id, user_id)
  do update set recipient_email = excluded.recipient_email,
                permission = excluded.permission;

  return query select link_note_id, link_permission;
end;
$$;

create policy "Owners can read share links" on public.note_share_links
  for select to authenticated
  using ((select private.note_owner_id(note_id)) = (select auth.uid()));

create policy "Owners can revoke share links" on public.note_share_links
  for delete to authenticated
  using ((select private.note_owner_id(note_id)) = (select auth.uid()));

revoke execute on function public.create_note_share_link(uuid, text) from public;
revoke execute on function public.accept_note_share_link(text) from public;
grant execute on function public.create_note_share_link(uuid, text) to authenticated;
grant execute on function public.accept_note_share_link(text) to authenticated;
