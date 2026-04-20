import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/client.ts";
import { decryptJson, encryptJson, randomToken, sha256 } from "../_shared/crypto.ts";

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

type ShareLinkRow = {
  created_at: string;
  expires_at: string | null;
  owner_share_token_ciphertext: string | null;
  short_code: string;
  slug: string;
};

function isShareLinkActive(link: ShareLinkRow) {
  return (
    !link.expires_at || new Date(link.expires_at).getTime() >= Date.now()
  );
}

async function createFallbackShareLink(
  userClient: ReturnType<typeof createUserClient>,
  burner: { id: string; slug: string },
) {
  const shareToken = randomToken(24);
  const tokenHash = await sha256(shareToken);
  const ownerShareTokenCiphertext = await encryptJson({ shareToken });

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
      return {
        shareToken,
        shareLink: result.data,
      };
    }

    if (result.error?.code !== "23505") {
      throw result.error ?? new Error("Could not create share link");
    }
  }

  throw new Error("Could not create share link");
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

    const { data: shareLinks, error: shareLinksError } = await userClient
      .from("burner_share_links")
      .select(
        "slug, short_code, created_at, expires_at, owner_share_token_ciphertext",
      )
      .eq("burner_id", burner.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: true });

    if (shareLinksError) {
      throw shareLinksError;
    }

    let shareToken: string | null = null;
    let resolvedShareLink: Pick<ShareLinkRow, "short_code" | "slug"> | null =
      null;

    for (const shareLink of (shareLinks ?? []) as ShareLinkRow[]) {
      if (!shareLink.owner_share_token_ciphertext || !isShareLinkActive(shareLink)) {
        continue;
      }

      try {
        const decrypted = await decryptJson<{ shareToken?: string }>(
          shareLink.owner_share_token_ciphertext,
        );
        if (!decrypted.shareToken) {
          continue;
        }

        shareToken = decrypted.shareToken;
        resolvedShareLink = shareLink;
        break;
      } catch {
        // Ignore unreadable legacy values and fall through to the next link.
      }
    }

    if (!shareToken || !resolvedShareLink) {
      const fallback = await createFallbackShareLink(userClient, burner);
      shareToken = fallback.shareToken;
      resolvedShareLink = fallback.shareLink;
    }

    const shareBaseUrl = getShareBaseUrl(request);

    return new Response(
      JSON.stringify({
        burnerId: burner.id,
        shortCode: resolvedShareLink.short_code,
        slug: resolvedShareLink.slug,
        shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${resolvedShareLink.slug}?token=${shareToken}`,
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
