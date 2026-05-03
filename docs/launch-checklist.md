# Launch Checklist

## Product readiness

- Replace demo content and placeholder store links.
- Finalize the cover art pipeline and storage bucket rules.
- Add sender profile editing and burner revocation controls.
- Add analytics for publish, open, first play, first unlock, full completion, and drop-off position.

## Platform readiness

- Configure Universal Links and Android App Links for production domains.
- Swap placeholder bundle identifiers and EAS project ID.
- Re-enable Apple Sign In, Google Sign In, and password recovery on top of the Neon-backed auth layer or a dedicated auth provider.
- Finalize MusicKit entitlements and Spotify redirect URIs.

## Backend readiness

- Rotate `FIELD_ENCRYPTION_KEY` and define a key-version migration plan.
- Add rate limiting, abuse monitoring, and structured logs to Edge Functions.
- Seed storage buckets and CDN rules for uploaded covers.
- Add database backups, staging environments, and secret management.

## QA

- Verify burner creation from Spotify, Apple Music, and generic import flows.
- Verify tokenized share links on fresh devices and mobile browsers.
- Verify that no unrevealed tracks are returned from public network calls.
- Verify reveal progression when playback is interrupted, resumed, or handed off between apps.
