# Burner

Burner is a retro mixtape app for building secret tracklists from YouTube links, publishing a private burner URL, and revealing songs one by one only after the listener starts each track.

## Workspace

- `apps/mobile`: Expo React Native app for senders and recipients.
- `apps/web`: Next.js sender studio and browser-first receiver flow.
- `packages/core`: shared burner types, reveal logic, and provider contracts.
- `packages/ui`: shared retro design tokens and view helpers.
- `neon`: SQL migrations for the Neon Postgres backend used by the web app.
- `docs`: architecture notes, launch checklists, and older provider research.

## Getting Started

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon Postgres connection string.
2. Install dependencies with `pnpm install`.
3. Apply the Neon schema with `DATABASE_URL=... pnpm neon:migrate`.
4. Start the web app with `pnpm dev:web`.
5. Rebuild the mobile dev client when native modules change with `pnpm --filter burner-mobile ios` or `pnpm --filter burner-mobile android`.
6. Start the Expo app with `pnpm dev:mobile`.

## Core Behavior

- Senders authenticate with Burner’s cookie-backed email/password auth stored in Neon.
- Burners store encrypted track payloads in Neon Postgres.
- Share links include a secret token and short code.
- Recipients only receive the burner shell and the next allowed track.
- Track reveals unlock after playback begins and progress is recorded.

## OAuth Notes

- Google sign-in is handled by the web app directly (no Supabase). Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` in your env, and register `<your-origin>/api/auth/google/callback` as an authorized redirect URI in your Google Cloud OAuth client. Override the redirect URI with `GOOGLE_OAUTH_REDIRECT_URI` if needed.
- Email/password sign-up, sign-in, and password recovery run through the web app API alongside Google sign-in.

## Demo Mode

- Works without any music-provider credentials.
- If backend env is disabled with `NEXT_PUBLIC_DISABLE_BACKEND=true`, Burner publishes a local share URL whose payload is encoded into the link.
- The web receiver reveals the actual selected YouTube tracks in order in both modes.
