import { create } from "zustand";

import type { BurnerDraft, ImportedTrack } from "@burner/core";

import { demoDraft } from "../lib/demo-data";

type BurnerComposerState = BurnerDraft & {
  selectedProvider?: string;
  setField(field: keyof BurnerDraft, value: BurnerDraft[keyof BurnerDraft]): void;
  setTracks(tracks: ImportedTrack[]): void;
  addTrack(track: ImportedTrack): void;
  setSelectedProvider(provider: string): void;
  reset(): void;
};

export const useBurnerComposer = create<BurnerComposerState>((set) => ({
  ...demoDraft,
  selectedProvider: "spotify",
  setField(field, value) {
    set({ [field]: value } as Pick<BurnerComposerState, keyof BurnerDraft>);
  },
  setTracks(tracks) {
    set({ tracks });
  },
  addTrack(track) {
    set((state) => ({ tracks: [...state.tracks, track] }));
  },
  setSelectedProvider(provider) {
    set({ selectedProvider: provider });
  },
  reset() {
    set({ ...demoDraft, selectedProvider: "spotify" });
  },
}));
