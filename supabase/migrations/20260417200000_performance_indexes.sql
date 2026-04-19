-- Performance indexes for hot-path queries.
-- Postgres does not auto-index foreign keys; these lookups were full scans.

create index if not exists burners_sender_id_idx
  on public.burners (sender_id);

create index if not exists burner_share_links_burner_id_idx
  on public.burner_share_links (burner_id);

create index if not exists burner_recipient_sessions_burner_id_idx
  on public.burner_recipient_sessions (burner_id);

create index if not exists burner_recipient_sessions_share_link_id_idx
  on public.burner_recipient_sessions (share_link_id);

create index if not exists listen_sessions_burner_position_idx
  on public.listen_sessions (burner_id, position);

create index if not exists listen_sessions_recipient_session_idx
  on public.listen_sessions (recipient_session_id);

create index if not exists track_unlock_events_burner_position_idx
  on public.track_unlock_events (burner_id, position);

create index if not exists track_unlock_events_recipient_session_idx
  on public.track_unlock_events (recipient_session_id);

-- Partial index: most share-link lookups exclude revoked/expired rows.
create index if not exists burner_share_links_active_idx
  on public.burner_share_links (burner_id)
  where revoked_at is null;
