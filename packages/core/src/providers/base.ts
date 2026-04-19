import type {
  ImportedTrack,
  ListenSession,
  MusicProvider,
  ProviderCapability,
  ProviderPlaylistSummary,
  RevealedTrack,
} from "../types";

export interface ProviderPlaybackStartInput {
  track: RevealedTrack;
  contextUri?: string;
}

export interface PlaybackObservation {
  elapsedSeconds: number;
  finished: boolean;
}

export interface ProviderAdapter {
  provider: MusicProvider;
  displayName: string;
  capabilities: ProviderCapability[];
  connect(): Promise<void>;
  importPlaylists(): Promise<ProviderPlaylistSummary[]>;
  searchLibrary(query: string): Promise<ImportedTrack[]>;
  importTracks(playlistIdOrUrl: string): Promise<ImportedTrack[]>;
  startPlayback(input: ProviderPlaybackStartInput): Promise<void>;
  observePlayback(session: ListenSession): Promise<PlaybackObservation>;
  handoffPlayback(track: RevealedTrack): Promise<void>;
}
