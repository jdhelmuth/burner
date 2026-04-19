# Burner Architecture

## Monorepo layout

- `apps/mobile` holds the Expo app with Expo Router, Supabase auth, provider adapters, and sender/receiver flows.
- `apps/web` is the anonymous receiver surface for share links, install prompts, and app handoff.
- `packages/core` defines burner types, share/reveal state, provider contracts, and unlock logic used across clients and backend logic.
- `packages/ui` centralizes retro color, spacing, and presentation helpers so the visual language stays consistent.
- `supabase` contains the relational model and privileged edge functions that prevent unrevealed tracks from leaking.

## Reveal model

1. Sender publishes burner metadata and encrypted track payloads.
2. A tokenized share link is created and stored as a hash.
3. Recipient exchanges slug + token for an anonymous session token.
4. Only track 1 is returned initially.
5. Recipient starts a listen session for the current position.
6. Completion is accepted when playback finishes or 30 seconds elapse.
7. The backend decrypts and returns only the next track.

## Security model

- Hidden track metadata is encrypted in Edge Functions with `FIELD_ENCRYPTION_KEY`.
- Share links are verified by token hash rather than storing plaintext tokens.
- Recipient sessions are anonymous and keyed by client fingerprint + regenerated session token.
- Burner authorship and provider credentials remain protected by RLS on sender-owned rows.
- Recipient-facing tables are service-managed only and accessed via Edge Functions.
