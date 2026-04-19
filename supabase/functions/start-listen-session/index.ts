import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/client.ts";
import { decryptJson, sha256 } from "../_shared/crypto.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { burnerId, position, provider, sessionToken } = await request.json();
    const sessionTokenHash = await sha256(sessionToken);
    const serviceClient = createServiceClient();

    const { data: recipientSession, error: sessionError } = await serviceClient
      .from("burner_recipient_sessions")
      .select("*")
      .eq("burner_id", burnerId)
      .eq("session_token_hash", sessionTokenHash)
      .single();

    if (sessionError || !recipientSession) {
      throw sessionError ?? new Error("Recipient session not found");
    }

    if (recipientSession.current_position !== position) {
      return new Response(
        JSON.stringify({
          status: "blocked",
          reason: "invalid-sequence",
          nextPosition: recipientSession.current_position,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data, error } = await serviceClient
      .from("listen_sessions")
      .insert({
        burner_id: burnerId,
        recipient_session_id: recipientSession.id,
        position,
        provider,
      })
      .select("id, started_at")
      .single();

    if (error || !data) {
      throw error ?? new Error("Could not create listen session");
    }

    const { data: trackRow, error: trackError } = await serviceClient
      .from("burner_tracks")
      .select("*")
      .eq("burner_id", burnerId)
      .eq("position", position)
      .single();

    if (trackError || !trackRow) {
      throw trackError ?? new Error("Track missing");
    }

    const trackPayload = await decryptJson<{
      position: number;
      track: Record<string, string>;
    }>(trackRow.encrypted_payload);

    return new Response(JSON.stringify({
      ...data,
      track: {
        position: trackPayload.position,
        title: trackPayload.track.title,
        artist: trackPayload.track.artist,
        albumArtUrl: trackPayload.track.albumArtUrl,
        albumName: trackPayload.track.albumName,
        provider: trackPayload.track.provider,
        providerUri:
          trackPayload.track.handoffUri ??
          trackPayload.track.deepLink ??
          trackPayload.track.externalUrl,
        previewUrl: trackPayload.track.previewUrl,
        playbackCapabilities: ["handoffPlayback"],
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
