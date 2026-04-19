import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/client.ts";
import { decryptJson, randomToken, sha256 } from "../_shared/crypto.ts";

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { slug, token, clientFingerprint } = await request.json();
    if (!slug || !token) {
      return new Response(JSON.stringify({ error: "Missing slug or token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createServiceClient();
    const tokenHash = await sha256(token);

    const { data: shareLink, error: shareError } = await serviceClient
      .from("burner_share_links")
      .select("*")
      .eq("slug", slug)
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .single();

    if (shareError || !shareLink) {
      throw shareError ?? new Error("Share link not found");
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at).getTime() < Date.now()) {
      throw new Error("Share link expired");
    }

    const { data: burner, error: burnerError } = await serviceClient
      .from("burners")
      .select("*")
      .eq("id", shareLink.burner_id)
      .single();
    if (burnerError || !burner || burner.is_revoked) {
      throw burnerError ?? new Error("Burner unavailable");
    }

    const sessionToken = randomToken(24);
    const sessionTokenHash = await sha256(sessionToken);
    const fingerprint = clientFingerprint ?? "unknown-recipient";
    const existingSession = await serviceClient
      .from("burner_recipient_sessions")
      .select("*")
      .eq("share_link_id", shareLink.id)
      .eq("client_fingerprint", fingerprint)
      .maybeSingle();

    let recipientSessionId = existingSession.data?.id;
    if (recipientSessionId) {
      const { error } = await serviceClient
        .from("burner_recipient_sessions")
        .update({
          session_token_hash: sessionTokenHash,
        })
        .eq("id", recipientSessionId);
      if (error) {
        throw error;
      }
    } else {
      const { data, error } = await serviceClient
        .from("burner_recipient_sessions")
        .insert({
          burner_id: burner.id,
          share_link_id: shareLink.id,
          client_fingerprint: fingerprint,
          session_token_hash: sessionTokenHash,
        })
        .select("id")
        .single();
      if (error || !data) {
        throw error ?? new Error("Could not create recipient session");
      }
      recipientSessionId = data.id;
    }

    const startedPositions = [...(existingSession.data?.completed_positions ?? [])].sort(
      (left, right) => left - right,
    );

    const { data: firstTrackRow, error: firstTrackError } = await serviceClient
      .from("burner_tracks")
      .select("*")
      .eq("burner_id", burner.id)
      .eq("position", 1)
      .single();
    if (firstTrackError || !firstTrackRow) {
      throw firstTrackError ?? new Error("First track missing");
    }

    const firstTrackPayload = await decryptJson<{
      position: number;
      track: Record<string, string>;
    }>(firstTrackRow.encrypted_payload);

    const firstTrack = {
      position: firstTrackPayload.position,
      title: firstTrackPayload.track.title,
      artist: firstTrackPayload.track.artist,
      albumArtUrl: firstTrackPayload.track.albumArtUrl,
      albumName: firstTrackPayload.track.albumName,
      provider: firstTrackPayload.track.provider,
      providerUri:
        firstTrackPayload.track.handoffUri ??
        firstTrackPayload.track.deepLink ??
        firstTrackPayload.track.externalUrl,
      previewUrl: firstTrackPayload.track.previewUrl,
      playbackCapabilities: ["handoffPlayback"],
    };

    let revealedTracks: typeof firstTrack[] = [];
    if (startedPositions.length > 0) {
      const { data: revealedTrackRows, error: trackError } = await serviceClient
        .from("burner_tracks")
        .select("*")
        .eq("burner_id", burner.id)
        .in("position", startedPositions)
        .order("position", { ascending: true });
      if (trackError) {
        throw trackError;
      }

      revealedTracks = await Promise.all(
        (revealedTrackRows ?? []).map(async (trackRow) => {
          const trackPayload = await decryptJson<{
            position: number;
            track: Record<string, string>;
          }>(trackRow.encrypted_payload);

          return {
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
          };
        }),
      );
    }

    await serviceClient
      .from("burner_share_links")
      .update({ open_count: shareLink.open_count + 1 })
      .eq("id", shareLink.id);

    const currentRevealedIndex = startedPositions.at(-1) ?? 0;
    const nextPlayablePosition =
      startedPositions.length >= burner.total_tracks
        ? null
        : Math.max(existingSession.data?.current_position ?? 1, 1);

    return new Response(
      JSON.stringify({
        sessionToken,
        recipientSessionId,
        burner: {
          id: burner.id,
          slug: burner.slug,
          title: burner.title,
          senderName: burner.sender_name,
          note: burner.note,
          coverImageUrl: burner.cover_image_url,
          revealMode: burner.reveal_mode,
          totalTracks: burner.total_tracks,
          createdAt: burner.created_at,
          currentRevealedIndex,
        },
        firstTrack,
        revealedTracks,
        nextLockedPosition: nextPlayablePosition,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
