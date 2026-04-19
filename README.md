# Burner

Burner is a retro mixtape app for building secret tracklists from YouTube links, publishing a private burner URL, and revealing songs one by one only after the listener starts each track.

## Workspace

- `apps/mobile`: Expo React Native app for senders and recipients.
- `apps/web`: Next.js sender studio and browser-first receiver flow.
- `packages/core`: shared burner types, reveal logic, and provider contracts.
- `packages/ui`: shared retro design tokens and view helpers.
- `supabase`: SQL migrations and Edge Functions.
- `docs`: architecture notes, launch checklists, and older provider research.

## Getting Started

1. Copy `.env.example` to `.env` and fill in the Supabase settings you want locally.
2. Install dependencies with `pnpm install`.
3. If you want to test Google or Apple OAuth locally, add `SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET`, `SUPABASE_AUTH_APPLE_CLIENT_ID`, and `SUPABASE_AUTH_APPLE_SECRET` to `.env`, then flip the matching provider blocks in `supabase/config.toml` from `enabled = false` to `enabled = true`.
4. Start local Supabase with `pnpm supabase:start`.
5. Serve Edge Functions with `pnpm supabase:functions`.
6. Start the web app with `pnpm dev:web`.
7. Rebuild the mobile dev client after adding the Apple/WebBrowser native modules with `pnpm --filter burner-mobile ios` or `pnpm --filter burner-mobile android`.
8. Start the Expo app with `pnpm dev:mobile`.
9. On the welcome screen, use `Demo` for a fast local sender session backed by the local Supabase stack, use magic link for passwordless auth, or use Apple/Google once the provider credentials are configured.

## Core Behavior

- Senders authenticate with Supabase Auth.
- Burners store encrypted track payloads in Supabase.
- Share links include a secret token and short code.
- Recipients only receive the burner shell and the next allowed track.
- Track reveals unlock after playback begins and progress is recorded.

## OAuth Notes

- Mobile Google auth uses Supabase OAuth plus `expo-web-browser` and the app callback `burner://auth/callback`.
- iOS Apple auth uses native `expo-apple-authentication` and exchanges the returned identity token with Supabase.
- Android and non-iOS Apple auth fall back to the Supabase-hosted Apple OAuth flow in the browser.
- For hosted Supabase projects, enable Google and Apple providers in the Supabase Auth dashboard and add `burner://auth/callback` to the project's redirect URLs.
- For local Supabase CLI projects, restart `pnpm supabase:start` after changing provider settings in `supabase/config.toml` or `.env`.

## Demo Mode

- Works without any music-provider credentials.
- If the local Supabase env is present, the `Demo` button creates or signs into a real local sender account using email/password behind the scenes.
- If Supabase env is absent, Burner publishes a local share URL whose payload is encoded into the link.
- The web receiver reveals the actual selected YouTube tracks in order in both modes.
