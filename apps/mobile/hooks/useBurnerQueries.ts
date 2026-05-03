import { useMutation, useQuery } from "@tanstack/react-query";
import { createBurnerShell, createLocalShareExchange, encodeLocalSharePacket } from "@burner/core";

import { demoDraft } from "../lib/demo-data";
import { env, runtimeFlags } from "../lib/env";
import { useAuth } from "../contexts/AuthContext";
import { useBurnerComposer } from "./useBurnerComposer";

export function usePreviewBurner() {
  const draft = useBurnerComposer();

  return useQuery({
    queryKey: ["preview-burner", draft.title, draft.senderName, draft.tracks.length],
    queryFn: async () =>
      createBurnerShell({
        id: "preview",
        slug: "preview",
        draft,
      }),
  });
}

export function usePublishBurner() {
  const draft = useBurnerComposer();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!runtimeFlags.isBackendConfigured || !session?.access_token) {
        const packet = encodeLocalSharePacket(draft);
        const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "burner";
        return {
          slug,
          shareUrl: `${env.burnerWebUrl || "http://localhost:3000"}/b/${slug}?payload=${packet}`,
          shortCode: slug.slice(0, 6).toUpperCase().padEnd(6, "X"),
        };
      }

      const response = await fetch(`${env.burnerWebUrl.replace(/\/$/, "")}/api/create-burner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not publish burner.");
      }

      return response.json() as Promise<{ slug: string; shareUrl: string; shortCode: string }>;
    },
  });
}

export function useRecipientBurner(slug: string, token?: string, payload?: string) {
  return useQuery({
    queryKey: ["recipient-burner", slug, token],
    queryFn: async () => {
      if (payload) {
        return createLocalShareExchange(slug, payload);
      }

      if (!runtimeFlags.isBackendConfigured) {
        return createLocalShareExchange(slug, encodeLocalSharePacket(demoDraft));
      }

      const response = await fetch(`${env.burnerWebUrl.replace(/\/$/, "")}/api/exchange-share-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          token,
          clientFingerprint: "mobile-anon",
        }),
      });

      if (!response.ok) {
        return createLocalShareExchange(slug, encodeLocalSharePacket(demoDraft));
      }

      return response.json();
    },
  });
}
