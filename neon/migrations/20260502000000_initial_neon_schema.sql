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

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
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
  owner_share_token_ciphertext text,
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

create trigger handle_users_updated_at before update on public.users for each row execute procedure public.handle_updated_at();
create trigger handle_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_provider_accounts_updated_at before update on public.provider_accounts for each row execute procedure public.handle_updated_at();
create trigger handle_burners_updated_at before update on public.burners for each row execute procedure public.handle_updated_at();
create trigger handle_share_links_updated_at before update on public.burner_share_links for each row execute procedure public.handle_updated_at();
create trigger handle_recipient_sessions_updated_at before update on public.burner_recipient_sessions for each row execute procedure public.handle_updated_at();

create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_expires_at_idx on public.user_sessions (expires_at);
create index if not exists burners_sender_id_idx on public.burners (sender_id);
create index if not exists burner_share_links_burner_id_idx on public.burner_share_links (burner_id);
create index if not exists burner_recipient_sessions_burner_id_idx on public.burner_recipient_sessions (burner_id);
create index if not exists burner_recipient_sessions_share_link_id_idx on public.burner_recipient_sessions (share_link_id);
create index if not exists listen_sessions_burner_position_idx on public.listen_sessions (burner_id, position);
create index if not exists listen_sessions_recipient_session_idx on public.listen_sessions (recipient_session_id);
create index if not exists track_unlock_events_burner_position_idx on public.track_unlock_events (burner_id, position);
create index if not exists track_unlock_events_recipient_session_idx on public.track_unlock_events (recipient_session_id);
create index if not exists burner_share_links_active_idx on public.burner_share_links (burner_id) where revoked_at is null;
