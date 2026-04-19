import type { BurnerDraft, BurnerShell, BurnerTrackSecret, ImportedTrack, RevealedTrack } from "./types";

function toProviderUri(track: ImportedTrack) {
  return track.handoffUri ?? track.deepLink ?? track.externalUrl;
}

export function createBurnerShell(input: {
  id: string;
  slug: string;
  draft: BurnerDraft;
  createdAt?: string;
}): BurnerShell {
  return {
    id: input.id,
    slug: input.slug,
    title: input.draft.title,
    senderName: input.draft.senderName,
    note: input.draft.note,
    coverImageUrl: input.draft.coverImageUrl,
    revealMode: input.draft.revealMode,
    totalTracks: input.draft.tracks.length,
    createdAt: input.createdAt ?? new Date().toISOString(),
    currentRevealedIndex: 1,
  };
}

export function buildSecretTrackPayload(tracks: ImportedTrack[]): BurnerTrackSecret[] {
  return tracks.map((track, index) => ({
    position: index + 1,
    track,
  }));
}

export function revealTrack(secret: BurnerTrackSecret): RevealedTrack {
  return {
    position: secret.position,
    title: secret.track.title,
    artist: secret.track.artist,
    albumArtUrl: secret.track.albumArtUrl,
    albumName: secret.track.albumName,
    provider: secret.track.provider,
    providerUri: toProviderUri(secret.track),
    previewUrl: secret.track.previewUrl,
    playbackCapabilities: ["handoffPlayback"],
  };
}

export function revealThroughPosition(payload: BurnerTrackSecret[], position: number): RevealedTrack[] {
  return payload.filter((item) => item.position <= position).map(revealTrack);
}

export function createShareCode(slug: string) {
  return slug.slice(0, 4).toUpperCase();
}
