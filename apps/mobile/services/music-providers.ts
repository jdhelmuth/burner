import * as Linking from "expo-linking";

import type { ImportedTrack, ListenSession, ProviderPlaylistSummary, RevealedTrack } from "@burner/core";
import type { ProviderAdapter, PlaybackObservation, ProviderPlaybackStartInput } from "@burner/core";

class BaseProviderAdapter implements ProviderAdapter {
  constructor(
    public provider: ProviderAdapter["provider"],
    public displayName: string,
    public capabilities: ProviderAdapter["capabilities"],
  ) {}

  async connect() {
    return;
  }

  async importPlaylists(): Promise<ProviderPlaylistSummary[]> {
    return [];
  }

  async searchLibrary(_query: string): Promise<ImportedTrack[]> {
    return [];
  }

  async importTracks(_playlistIdOrUrl: string): Promise<ImportedTrack[]> {
    return [];
  }

  async startPlayback(input: ProviderPlaybackStartInput) {
    if (input.track.providerUri) {
      await Linking.openURL(input.track.providerUri);
    }
  }

  async observePlayback(session: ListenSession): Promise<PlaybackObservation> {
    return {
      elapsedSeconds: session.elapsedSeconds,
      finished: session.elapsedSeconds >= 30,
    };
  }

  async handoffPlayback(track: RevealedTrack) {
    if (track.providerUri) {
      await Linking.openURL(track.providerUri);
    }
  }
}

export class SpotifyAdapter extends BaseProviderAdapter {
  constructor() {
    super("spotify", "Spotify", [
      "auth",
      "playlistImport",
      "libraryImport",
      "handoffPlayback",
      "playbackObservation",
    ]);
  }
}

export class AppleMusicAdapter extends BaseProviderAdapter {
  constructor() {
    super("appleMusic", "Apple Music", [
      "auth",
      "playlistImport",
      "libraryImport",
      "nativePlayback",
      "playbackObservation",
      "handoffPlayback",
    ]);
  }
}

export class GenericImportAdapter extends BaseProviderAdapter {
  constructor() {
    super("generic", "Other Apps", ["shareSheetImport", "handoffPlayback"]);
  }
}

export const providerAdapters = [new SpotifyAdapter(), new AppleMusicAdapter(), new GenericImportAdapter()];
