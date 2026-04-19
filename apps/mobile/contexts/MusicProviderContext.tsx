import { type PropsWithChildren, createContext, useContext, useMemo } from "react";
import type { ImportedTrack, ProviderPlaylistSummary } from "@burner/core";

import { providerAdapters } from "../services/music-providers";

type MusicProviderContextValue = {
  providers: typeof providerAdapters;
  connect(providerId: string): Promise<void>;
  importPlaylists(providerId: string): Promise<ProviderPlaylistSummary[]>;
  importTracks(providerId: string, playlistIdOrUrl: string): Promise<ImportedTrack[]>;
};

const MusicProviderContext = createContext<MusicProviderContextValue | null>(null);

export function MusicProviderProvider({ children }: PropsWithChildren) {
  const value = useMemo<MusicProviderContextValue>(
    () => ({
      providers: providerAdapters,
      async connect(providerId) {
        const adapter = providerAdapters.find((candidate) => candidate.provider === providerId);
        if (adapter) {
          await adapter.connect();
        }
      },
      async importPlaylists(providerId) {
        const adapter = providerAdapters.find((candidate) => candidate.provider === providerId);
        return adapter ? adapter.importPlaylists() : [];
      },
      async importTracks(providerId, playlistIdOrUrl) {
        const adapter = providerAdapters.find((candidate) => candidate.provider === providerId);
        return adapter ? adapter.importTracks(playlistIdOrUrl) : [];
      },
    }),
    [],
  );

  return <MusicProviderContext.Provider value={value}>{children}</MusicProviderContext.Provider>;
}

export function useMusicProviders() {
  const context = useContext(MusicProviderContext);
  if (!context) {
    throw new Error("useMusicProviders must be used inside MusicProviderProvider");
  }
  return context;
}
