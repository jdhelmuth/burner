import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/client.ts";
import { encryptJson, randomToken, sha256 } from "../_shared/crypto.ts";

const MAX_TRACKS = 30;
const MAX_TITLE_LEN = 120;
const MAX_SENDER_LEN = 80;
const MAX_NOTE_LEN = 600;
const MAX_URL_LEN = 2048;
const MAX_COVER_DATA_URL_LEN = 2_000_000;
const ALLOWED_PROVIDERS = new Set([
  "spotify",
  "appleMusic",
  "youtubeMusic",
  "tidal",
  "soundcloud",
  "generic",
]);
const ALLOWED_REVEAL_MODES = new Set(["timed", "verified-or-timed"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function createShortCode() {
  return randomToken(12)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase();
}

function assertString(
  value: unknown,
  field: string,
  { max, required = true }: { max: number; required?: boolean },
): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error(`${field} is required.`);
    }
    return null;
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
  if (value.length > max) {
    throw new Error(`${field} is too long (max ${max} characters).`);
  }
  return value;
}

function assertCoverImageValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("coverImageUrl must be a string.");
  }

  if (value.startsWith("data:") && !value.startsWith("data:image/")) {
    throw new Error("coverImageUrl must be an image URL or image data URL.");
  }

  const max = value.startsWith("data:image/")
    ? MAX_COVER_DATA_URL_LEN
    : MAX_URL_LEN;

  if (value.length > max) {
    throw new Error(
      value.startsWith("data:image/")
        ? `coverImageUrl is too large (max ${MAX_COVER_DATA_URL_LEN.toLocaleString()} characters).`
        : `coverImageUrl is too long (max ${MAX_URL_LEN} characters).`,
    );
  }

  return value;
}

function validateBody(body: unknown) {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }

  const raw = body as Record<string, unknown>;
  const title = assertString(raw.title, "title", { max: MAX_TITLE_LEN });
  const senderName = assertString(raw.senderName, "senderName", {
    max: MAX_SENDER_LEN,
  });
  const note = assertString(raw.note, "note", {
    max: MAX_NOTE_LEN,
    required: false,
  });
  const coverImageUrl = assertCoverImageValue(raw.coverImageUrl);

  const revealMode = raw.revealMode ?? "verified-or-timed";
  if (typeof revealMode !== "string" || !ALLOWED_REVEAL_MODES.has(revealMode)) {
    throw new Error("revealMode must be 'timed' or 'verified-or-timed'.");
  }

  if (!Array.isArray(raw.tracks) || raw.tracks.length === 0) {
    throw new Error("At least one track is required.");
  }
  if (raw.tracks.length > MAX_TRACKS) {
    throw new Error(`A burner can hold at most ${MAX_TRACKS} tracks.`);
  }

  const tracks = raw.tracks.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Track ${index + 1} is malformed.`);
    }
    const track = entry as Record<string, unknown>;
    if (typeof track.provider !== "string" || !ALLOWED_PROVIDERS.has(track.provider)) {
      throw new Error(`Track ${index + 1} has an unsupported provider.`);
    }
    if (track.title !== undefined && typeof track.title !== "string") {
      throw new Error(`Track ${index + 1} title must be a string.`);
    }
    if (track.title && (track.title as string).length > MAX_TITLE_LEN) {
      throw new Error(`Track ${index + 1} title is too long.`);
    }
    if (track.artist !== undefined && typeof track.artist !== "string") {
      throw new Error(`Track ${index + 1} artist must be a string.`);
    }
    return track;
  });

  return {
    title: title!,
    senderName: senderName!,
    note,
    coverImageUrl,
    revealMode,
    tracks,
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);
    const serviceClient = createServiceClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await request.json().catch(() => null);
    const body = validateBody(rawBody);
    const slugBase = slugify(body.title);
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;
    const shareToken = randomToken(24);
    const shareTokenHash = await sha256(shareToken);
    const shareBaseUrl = Deno.env.get("EXPO_PUBLIC_BURNER_WEB_URL") ?? "https://burner.example.com";

    await serviceClient.from("profiles").upsert({
      id: user.id,
      display_name:
        user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? body.senderName ?? "Burner Sender",
    });

    const { data: burner, error: burnerError } = await serviceClient
      .from("burners")
      .insert({
        sender_id: user.id,
        slug,
        title: body.title,
        sender_name: body.senderName,
        note: body.note,
        cover_image_url: body.coverImageUrl,
        reveal_mode: body.revealMode,
        total_tracks: body.tracks.length,
      })
      .select("*")
      .single();

    if (burnerError || !burner) {
      throw burnerError ?? new Error("Failed to create burner");
    }

    const tracks = await Promise.all(
      body.tracks.map(async (track, index) => ({
        burner_id: burner.id,
        position: index + 1,
        provider: track.provider,
        encrypted_payload: await encryptJson({
          position: index + 1,
          track,
        }),
      })),
    );

    const { error: tracksError } = await serviceClient.from("burner_tracks").insert(tracks);
    if (tracksError) {
      throw tracksError;
    }

    let shortCode = "";
    let shareError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      shortCode = createShortCode();
      const result = await serviceClient.from("burner_share_links").insert({
        burner_id: burner.id,
        slug,
        short_code: shortCode,
        token_hash: shareTokenHash,
      });

      if (!result.error) {
        shareError = null;
        break;
      }

      shareError = result.error;
      if (result.error.code !== "23505") {
        break;
      }
    }

    if (shareError) {
      throw shareError;
    }

    return new Response(
      JSON.stringify({
        burnerId: burner.id,
        slug,
        shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${slug}?token=${shareToken}`,
        shortCode,
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
