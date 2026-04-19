export type MusicProvider =
  | "spotify"
  | "appleMusic"
  | "youtubeMusic"
  | "tidal"
  | "soundcloud"
  | "generic";

export type ProviderCapability =
  | "auth"
  | "playlistImport"
  | "libraryImport"
  | "librarySearch"
  | "nativePlayback"
  | "playbackObservation"
  | "handoffPlayback"
  | "shareSheetImport";

export interface ProviderPlaylistSummary {
  id: string;
  provider: MusicProvider;
  name: string;
  artworkUrl?: string;
  ownerName?: string;
  trackCount: number;
}

export interface ImportedTrack {
  provider: MusicProvider;
  providerTrackId: string;
  title: string;
  artist: string;
  albumName?: string;
  albumArtUrl?: string;
  durationMs?: number;
  previewUrl?: string;
  deepLink?: string;
  externalUrl?: string;
  handoffUri?: string;
}

export interface BurnerTrackSecret {
  position: number;
  track: ImportedTrack;
}

export interface BurnerShell {
  id: string;
  slug: string;
  title: string;
  senderName: string;
  note?: string;
  coverImageUrl?: string;
  revealMode: "timed" | "verified-or-timed";
  totalTracks: number;
  createdAt: string;
  currentRevealedIndex: number;
}

export interface RevealedTrack {
  position: number;
  title: string;
  artist: string;
  albumArtUrl?: string;
  albumName?: string;
  provider: MusicProvider;
  providerUri?: string;
  previewUrl?: string;
  playbackCapabilities: ProviderCapability[];
}

export interface RevealState {
  burnerId: string;
  revealedTracks: RevealedTrack[];
  nextLockedPosition: number | null;
  completedPositions: number[];
}

export type UnlockReason =
  | "playback-started"
  | "provider-playback-finished"
  | "thirty-second-preview"
  | "awaiting-playback"
  | "already-unlocked"
  | "invalid-sequence";

export interface UnlockDecision {
  status: "pending" | "unlocked" | "blocked";
  reason: UnlockReason;
  nextPosition?: number;
}

export interface ListenSession {
  burnerId: string;
  position: number;
  provider: MusicProvider;
  startedAt: string;
  elapsedSeconds: number;
  observedCompletion: boolean;
}

export interface ShareExchangeResult {
  sessionToken: string;
  recipientSessionId?: string;
  burner: BurnerShell;
  firstTrack: RevealedTrack;
  revealedTracks?: RevealedTrack[];
  nextLockedPosition?: number | null;
}

export interface BurnerDraft {
  title: string;
  senderName: string;
  note?: string;
  coverImageUrl?: string;
  tracks: ImportedTrack[];
  revealMode: BurnerShell["revealMode"];
}
