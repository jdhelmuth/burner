import { useMutation } from "@tanstack/react-query";

import type { ImportedTrack } from "@burner/core";

import { env, runtimeFlags } from "../lib/env";

export function useStartListenSession() {
  return useMutation({
    mutationFn: async (input: {
      burnerId: string;
      position: number;
      sessionToken: string;
      provider: string;
    }) => {
      if (!runtimeFlags.isBackendConfigured || input.sessionToken.startsWith("local-")) {
        return {
          id: `listen-${input.burnerId}-${input.position}`,
          started_at: new Date().toISOString(),
        };
      }

      const response = await fetch(`${env.burnerWebUrl.replace(/\/$/, "")}/api/start-listen-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not start listen session.");
      }

      return response.json();
    },
  });
}

export function useCompleteTrackUnlock() {
  return useMutation({
    mutationFn: async (input: {
      burnerId: string;
      position: number;
      sessionToken: string;
      elapsedSeconds: number;
      observedCompletion: boolean;
      tracks?: ImportedTrack[];
    }) => {
      if (!runtimeFlags.isBackendConfigured || input.sessionToken.startsWith("local-")) {
        const nextTrack = input.tracks?.[input.position];
        return {
          status: "unlocked",
          reason: input.observedCompletion ? "provider-playback-finished" : "thirty-second-preview",
          nextTrack: nextTrack
            ? {
                position: input.position + 1,
                title: nextTrack.title,
                artist: nextTrack.artist,
                albumArtUrl: nextTrack.albumArtUrl,
                albumName: nextTrack.albumName,
                provider: nextTrack.provider,
                providerUri: nextTrack.handoffUri ?? nextTrack.deepLink ?? nextTrack.externalUrl,
                previewUrl: nextTrack.previewUrl,
                playbackCapabilities: ["handoffPlayback"],
              }
            : null,
        };
      }

      const response = await fetch(`${env.burnerWebUrl.replace(/\/$/, "")}/api/complete-track-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not unlock track.");
      }

      return response.json();
    },
  });
}
