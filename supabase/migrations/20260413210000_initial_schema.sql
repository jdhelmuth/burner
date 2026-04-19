create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'burner-sender'),
    lower(replace(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'burner-sender'), ' ', '-'))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('spotify', 'appleMusic', 'youtubeMusic', 'tidal', 'soundcloud', 'generic')),
  access_token text,
  refresh_token text,
  provider_user_id text,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, provider)
);

create table if not exists public.burners (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null,
  sender_name text not null,
  note text,
  cover_image_url text,
  reveal_mode text not null default 'verified-or-timed' check (reveal_mode in ('timed', 'verified-or-timed')),
  total_tracks integer not null check (total_tracks > 0),
  current_revealed_index integer not null default 1,
  is_revoked boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.burner_tracks (
  id uuid primary key default gen_random_uuid(),
  burner_id uuid not null references public.burners(id) on delete cascade,
  position integer not null check (position > 0),
  provider text not null,
  encrypted_payload text not null,
  encryption_version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (burner_id, position)
);

create table if not exists public.burner_share_links (
  id uuid primary key default gen_random_uuid(),
  burner_id uuid not null references public.burners(id) on delete cascade,
  slug text not null unique,
  short_code text not null unique,
  token_hash text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  max_opens integer,
  open_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.burner_recipient_sessions (
  id uuid primary key default gen_random_uuid(),
  burner_id uuid not null references public.burners(id) on delete cascade,
  share_link_id uuid not null references public.burner_share_links(id) on delete cascade,
  client_fingerprint text not null,
  session_token_hash text not null,
  current_position integer not null default 1,
  completed_positions integer[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (share_link_id, client_fingerprint)
);

create table if not exists public.listen_sessions (
  id uuid primary key default gen_random_uuid(),
  burner_id uuid not null references public.burners(id) on delete cascade,
  recipient_session_id uuid not null references public.burner_recipient_sessions(id) on delete cascade,
  position integer not null,
  provider text not null,
  started_at timestamptz not null default timezone('utc', now()),
  elapsed_seconds integer not null default 0,
  observed_completion boolean not null default false,
  completed_at timestamptz
);

create table if not exists public.track_unlock_events (
  id uuid primary key default gen_random_uuid(),
  burner_id uuid not null references public.burners(id) on delete cascade,
  recipient_session_id uuid not null references public.burner_recipient_sessions(id) on delete cascade,
  position integer not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger handle_profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger handle_provider_accounts_updated_at
before update on public.provider_accounts
for each row execute procedure public.handle_updated_at();

create trigger handle_burners_updated_at
before update on public.burners
for each row execute procedure public.handle_updated_at();

create trigger handle_share_links_updated_at
before update on public.burner_share_links
for each row execute procedure public.handle_updated_at();

create trigger handle_recipient_sessions_updated_at
before update on public.burner_recipient_sessions
for each row execute procedure public.handle_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.provider_accounts enable row level security;
alter table public.burners enable row level security;
alter table public.burner_tracks enable row level security;
alter table public.burner_share_links enable row level security;
alter table public.burner_recipient_sessions enable row level security;
alter table public.listen_sessions enable row level security;
alter table public.track_unlock_events enable row level security;

create policy "profiles are self readable"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are self insertable"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles are self updatable"
on public.profiles
for update
using (auth.uid() = id);

create policy "provider accounts belong to sender"
on public.provider_accounts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "burners belong to sender"
on public.burners
for all
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

create policy "burner tracks visible only to burner owner"
on public.burner_tracks
for all
using (
  exists (
    select 1 from public.burners
    where burners.id = burner_tracks.burner_id
      and burners.sender_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.burners
    where burners.id = burner_tracks.burner_id
      and burners.sender_id = auth.uid()
  )
);

create policy "share links belong to sender"
on public.burner_share_links
for all
using (
  exists (
    select 1 from public.burners
    where burners.id = burner_share_links.burner_id
      and burners.sender_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.burners
    where burners.id = burner_share_links.burner_id
      and burners.sender_id = auth.uid()
  )
);

create policy "recipient sessions are service managed"
on public.burner_recipient_sessions
for all
using (false)
with check (false);

create policy "listen sessions are service managed"
on public.listen_sessions
for all
using (false)
with check (false);

create policy "unlock events are service managed"
on public.track_unlock_events
for all
using (false)
with check (false);
