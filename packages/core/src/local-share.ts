import { createBurnerShell } from "./burners";
import type { BurnerDraft, ImportedTrack, RevealedTrack, ShareExchangeResult } from "./types";

export interface LocalSharePacket {
  version: 1;
  draft: BurnerDraft;
}

export function encodeLocalSharePacket(draft: BurnerDraft) {
  return encodeURIComponent(
    JSON.stringify({
      version: 1,
      draft,
    } satisfies LocalSharePacket),
  );
}

export function decodeLocalSharePacket(packet: string): LocalSharePacket {
  return JSON.parse(decodeURIComponent(packet)) as LocalSharePacket;
}

export function createLocalShareExchange(slug: string, packet: string): ShareExchangeResult & {
  localTracks: ImportedTrack[];
  isLocalShare: true;
} {
  const parsed = decodeLocalSharePacket(packet);
  const burner = createBurnerShell({
    id: `local-${slug}`,
    slug,
    draft: parsed.draft,
  });
  const first = parsed.draft.tracks[0];

  const firstTrack: RevealedTrack = {
    position: 1,
    title: first.title,
    artist: first.artist,
    albumArtUrl: first.albumArtUrl,
    albumName: first.albumName,
    provider: first.provider,
    providerUri: first.handoffUri ?? first.deepLink ?? first.externalUrl,
    previewUrl: first.previewUrl,
    playbackCapabilities: ["handoffPlayback"],
  };

  return {
    sessionToken: `local-${slug}`,
    burner,
    firstTrack,
    revealedTracks: [],
    nextLockedPosition: parsed.draft.tracks.length > 0 ? 1 : null,
    localTracks: parsed.draft.tracks,
    isLocalShare: true,
  };
}
