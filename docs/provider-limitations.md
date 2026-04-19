# Provider Limitations

## Spotify

- Burner can use Spotify OAuth, Web API playlist import, and handoff URIs.
- Mobile playback is mediated by Spotify app handoff or App Remote-style flows rather than unrestricted in-app streaming.
- Playback verification should prefer provider callbacks when available and degrade to the 30-second rule when not.

## Apple Music

- Apple Music supports stronger native playback via MusicKit across Apple platforms and supported environments.
- Playlist import requires a developer token and user token.
- App Store production builds should use proper MusicKit entitlements and native configuration instead of Expo Go.

## Other apps

- “Other popular apps” are supported through URL import, share-sheet ingestion, and playback handoff.
- Burner should not scrape or reverse-engineer unsupported music services.
- UX parity means the same reveal ritual, not identical API depth for every provider.
