# Provider Limitations

## Spotify

- Burner can use Spotify OAuth, Web API playlist import, and handoff URIs.
- Mobile playback is mediated by Spotify app handoff or App Remote-style flows rather than unrestricted in-app streaming.
- Playback verification should prefer provider callbacks when available and degrade to the 30-second rule when not.

## Apple Music

- Apple Music song-link import uses the server-side Apple Music catalog API with a Media Services private key or pre-generated developer token.
- Apple Music supports stronger native playback via MusicKit across Apple platforms and supported environments.
- The browser receiver cannot embed Apple Music inline yet: starting an Apple Music track reveals it and unlocks the next one, then hands off to the Apple Music link for actual listening. Inline preview playback in the receiver is planned for later.
- Playlist and library import require a developer token plus a user token.
- App Store production builds should use proper MusicKit entitlements and native configuration instead of Expo Go.

## Other apps

- “Other popular apps” are supported through URL import, share-sheet ingestion, and playback handoff.
- Burner should not scrape or reverse-engineer unsupported music services.
- UX parity means the same reveal ritual, not identical API depth for every provider.
