import { useMutation, useQuery } from "@tanstack/react-query";
import { createBurnerShell, createLocalShareExchange, encodeLocalSharePacket } from "@burner/core";

import { demoDraft } from "../lib/demo-data";
import { env, runtimeFlags } from "../lib/env";
import { supabase } from "../lib/supabase";
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

  return useMutation({
    mutationFn: async () => {
      if (!runtimeFlags.isSupabaseConfigured) {
        const packet = encodeLocalSharePacket(draft);
        const slug = draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "burner";
        return {
          slug,
          shareUrl: `${env.burnerWebUrl || "http://localhost:3000"}/b/${slug}?payload=${packet}`,
          shortCode: slug.slice(0, 6).toUpperCase().padEnd(6, "X"),
        };
      }

      const { data, error } = await supabase.functions.invoke("create-burner", {
        body: draft,
      });

      if (error) {
        throw error;
      }

      return data as { slug: string; shareUrl: string; shortCode: string };
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

      if (!runtimeFlags.isSupabaseConfigured) {
        return createLocalShareExchange(slug, encodeLocalSharePacket(demoDraft));
      }

      const { data, error } = await supabase.functions.invoke("exchange-share-access", {
        body: {
          slug,
          token,
          clientFingerprint: "mobile-anon",
        },
      });

      if (error) {
        return createLocalShareExchange(slug, encodeLocalSharePacket(demoDraft));
      }

      return data;
    },
  });
}
