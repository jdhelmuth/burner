import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/client.ts";
import { encryptJson, randomToken, sha256 } from "../_shared/crypto.ts";

function createShortCode() {
  return randomToken(12)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase();
}

function createShareSlug(baseSlug: string) {
  const normalized = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `${normalized || "burner"}-${crypto.randomUUID().slice(0, 6)}`;
}

function getShareBaseUrl(request: Request) {
  const configured = Deno.env.get("EXPO_PUBLIC_BURNER_WEB_URL")?.trim();
  if (configured) {
    return configured;
  }

  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return origin;
  }

  return "https://burner.example.com";
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

    const body = await request.json().catch(() => null);
    const burnerId =
      body && typeof body === "object" ? (body as { burnerId?: unknown }).burnerId : null;

    if (typeof burnerId !== "string" || !burnerId.trim()) {
      return new Response(JSON.stringify({ error: "burnerId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);
    const { data: burner, error: burnerError } = await userClient
      .from("burners")
      .select("id, slug")
      .eq("id", burnerId)
      .single();

    if (burnerError || !burner) {
      throw burnerError ?? new Error("Burner not found");
    }

    const shareToken = randomToken(24);
    const tokenHash = await sha256(shareToken);
    const ownerShareTokenCiphertext = await encryptJson({ shareToken });

    let shareLink:
      | {
          short_code: string;
          slug: string;
        }
      | null = null;
    let shareError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = createShareSlug(burner.slug);
      const shortCode = createShortCode();
      const result = await userClient
        .from("burner_share_links")
        .insert({
          burner_id: burner.id,
          slug,
          owner_share_token_ciphertext: ownerShareTokenCiphertext,
          short_code: shortCode,
          token_hash: tokenHash,
        })
        .select("slug, short_code")
        .single();

      if (!result.error && result.data) {
        shareLink = result.data;
        shareError = null;
        break;
      }

      shareError = result.error;
      if (result.error?.code !== "23505") {
        break;
      }
    }

    if (!shareLink) {
      throw shareError ?? new Error("Could not create share link");
    }

    const shareBaseUrl = getShareBaseUrl(request);

    return new Response(
      JSON.stringify({
        burnerId: burner.id,
        shortCode: shareLink.short_code,
        slug: shareLink.slug,
        shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${shareLink.slug}?token=${shareToken}`,
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
