import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/client.ts";
import { decryptJson, sha256 } from "../_shared/crypto.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { burnerId, position, elapsedSeconds, observedCompletion, sessionToken } = await request.json();
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

    const { data: burner, error: burnerError } = await serviceClient
      .from("burners")
      .select("*")
      .eq("id", burnerId)
      .single();
    if (burnerError || !burner) {
      throw burnerError ?? new Error("Burner not found");
    }

    await serviceClient
      .from("listen_sessions")
      .update({
        elapsed_seconds: elapsedSeconds,
        observed_completion: observedCompletion,
        completed_at: new Date().toISOString(),
      })
      .eq("burner_id", burnerId)
      .eq("recipient_session_id", recipientSession.id)
      .eq("position", position)
      .is("completed_at", null);

    const nextPosition = position + 1;
    const completedPositions = [...recipientSession.completed_positions, position];

    await serviceClient.from("burner_recipient_sessions").update({
      current_position: Math.min(nextPosition, burner.total_tracks),
      completed_positions: completedPositions,
    }).eq("id", recipientSession.id);

    await serviceClient.from("track_unlock_events").insert({
      burner_id: burnerId,
      recipient_session_id: recipientSession.id,
      position,
      reason: observedCompletion ? "provider-playback-finished" : "playback-started",
    });

    if (nextPosition > burner.total_tracks) {
      return new Response(
        JSON.stringify({
          status: "unlocked",
          reason: observedCompletion ? "provider-playback-finished" : "playback-started",
          nextPosition: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: nextTrackRow, error: nextTrackError } = await serviceClient
      .from("burner_tracks")
      .select("*")
      .eq("burner_id", burnerId)
      .eq("position", nextPosition)
      .single();

    if (nextTrackError || !nextTrackRow) {
      throw nextTrackError ?? new Error("Next track missing");
    }

    const nextTrackPayload = await decryptJson<{
      position: number;
      track: Record<string, string>;
    }>(nextTrackRow.encrypted_payload);

    return new Response(
      JSON.stringify({
        status: "unlocked",
        reason: observedCompletion ? "provider-playback-finished" : "playback-started",
        nextPosition: nextPosition <= burner.total_tracks ? nextPosition : null,
        nextTrack: {
          position: nextTrackPayload.position,
          title: nextTrackPayload.track.title,
          artist: nextTrackPayload.track.artist,
          albumArtUrl: nextTrackPayload.track.albumArtUrl,
          albumName: nextTrackPayload.track.albumName,
          provider: nextTrackPayload.track.provider,
          providerUri:
            nextTrackPayload.track.handoffUri ??
            nextTrackPayload.track.deepLink ??
            nextTrackPayload.track.externalUrl,
          previewUrl: nextTrackPayload.track.previewUrl,
          playbackCapabilities: ["handoffPlayback"],
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
