import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type RouteBody = {
  burnerId?: unknown;
  mode?: unknown;
};

type ShareLinkRow = {
  id: string;
  created_at: string;
  expires_at: string | null;
  owner_share_token_ciphertext: string | null;
  short_code: string;
  slug: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  return value;
}

function getSupabaseAnonKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }
  return value;
}

function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return value;
}

function getFieldEncryptionKey() {
  const value = process.env.FIELD_ENCRYPTION_KEY?.trim();
  if (!value) {
    throw new Error("FIELD_ENCRYPTION_KEY is not configured.");
  }
  return value;
}

function createServiceClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createUserClient(authHeader: string) {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

function fromBase64(value: string) {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function fromHex(value: string) {
  if (value.length % 2 !== 0) {
    throw new Error("FIELD_ENCRYPTION_KEY hex value must have an even length.");
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }

  return bytes;
}

function toBase64(value: Uint8Array) {
  return Buffer.from(value).toString("base64");
}

function parseEncryptionKey(rawKey: string) {
  const trimmed = rawKey.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return fromHex(trimmed);
  }

  return fromBase64(trimmed);
}

async function importAesKey() {
  return crypto.subtle.importKey(
    "raw",
    parseEncryptionKey(getFieldEncryptionKey()),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptJson(payload: unknown) {
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );

  return JSON.stringify({
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
  });
}

async function decryptJson<T>(payload: string): Promise<T> {
  const key = await importAesKey();
  const parsed = JSON.parse(payload) as { ciphertext: string; iv: string };
  const clearBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.ciphertext),
  );

  return JSON.parse(decoder.decode(clearBuffer)) as T;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

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
  const configured = process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim();
  if (configured) {
    return configured;
  }

  return new URL(request.url).origin;
}

function isShareLinkActive(link: ShareLinkRow) {
  return !link.expires_at || new Date(link.expires_at).getTime() >= Date.now();
}

async function createFallbackShareLink(
  serviceClient: ReturnType<typeof createServiceClient>,
  burner: { id: string; slug: string },
) {
  const shareToken = randomToken(24);
  const tokenHash = await sha256(shareToken);
  const ownerShareTokenCiphertext = await encryptJson({ shareToken });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = createShareSlug(burner.slug);
    const shortCode = createShortCode();
    const result = await serviceClient
      .from("burner_share_links")
      .insert({
        burner_id: burner.id,
        owner_share_token_ciphertext: ownerShareTokenCiphertext,
        short_code: shortCode,
        slug,
        token_hash: tokenHash,
      })
      .select("slug, short_code")
      .single();

    if (!result.error && result.data) {
      return {
        shareLink: result.data,
        shareToken,
      };
    }

    if (result.error?.code !== "23505") {
      throw result.error ?? new Error("Could not create share link");
    }
  }

  throw new Error("Could not create share link");
}

async function repairLegacyShareLink(
  serviceClient: ReturnType<typeof createServiceClient>,
  shareLink: Pick<ShareLinkRow, "id" | "short_code" | "slug">,
) {
  const shareToken = randomToken(24);
  const tokenHash = await sha256(shareToken);
  const ownerShareTokenCiphertext = await encryptJson({ shareToken });

  const { error } = await serviceClient
    .from("burner_share_links")
    .update({
      owner_share_token_ciphertext: ownerShareTokenCiphertext,
      token_hash: tokenHash,
    })
    .eq("id", shareLink.id);

  if (error) {
    throw error;
  }

  return {
    shareLink,
    shareToken,
  };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing auth header" }, { status: 401 });
    }

    const userClient = createUserClient(authHeader);
    const serviceClient = createServiceClient();
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as RouteBody;
    const burnerId = typeof body.burnerId === "string" ? body.burnerId.trim() : "";
    const mode = body.mode === "create" ? "create" : "get";

    if (!burnerId) {
      return NextResponse.json({ error: "burnerId is required" }, { status: 400 });
    }

    const { data: burner, error: burnerError } = await serviceClient
      .from("burners")
      .select("id, slug")
      .eq("id", burnerId)
      .eq("sender_id", user.id)
      .single();

    if (burnerError || !burner) {
      return NextResponse.json({ error: "Burner not found" }, { status: 404 });
    }

    let shareToken: string | null = null;
    let resolvedShareLink: Pick<ShareLinkRow, "short_code" | "slug"> | null = null;

    if (mode === "get") {
      const { data: shareLinks, error: shareLinksError } = await serviceClient
        .from("burner_share_links")
        .select(
          "id, slug, short_code, created_at, expires_at, owner_share_token_ciphertext",
        )
        .eq("burner_id", burner.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: true });

      if (shareLinksError) {
        throw shareLinksError;
      }

      let legacyShareLinkToRepair:
        | Pick<ShareLinkRow, "id" | "short_code" | "slug">
        | null = null;

      for (const shareLink of (shareLinks ?? []) as ShareLinkRow[]) {
        if (!isShareLinkActive(shareLink)) {
          continue;
        }

        if (!shareLink.owner_share_token_ciphertext) {
          legacyShareLinkToRepair ??= shareLink;
          continue;
        }

        try {
          const decrypted = await decryptJson<{ shareToken?: string }>(
            shareLink.owner_share_token_ciphertext,
          );
          if (!decrypted.shareToken) {
            legacyShareLinkToRepair ??= shareLink;
            continue;
          }

          shareToken = decrypted.shareToken;
          resolvedShareLink = shareLink;
          break;
        } catch {
          legacyShareLinkToRepair ??= shareLink;
        }
      }

      if (!shareToken || !resolvedShareLink) {
        if (legacyShareLinkToRepair) {
          const repaired = await repairLegacyShareLink(
            serviceClient,
            legacyShareLinkToRepair,
          );
          shareToken = repaired.shareToken;
          resolvedShareLink = repaired.shareLink;
        } else {
          const fallback = await createFallbackShareLink(serviceClient, burner);
          shareToken = fallback.shareToken;
          resolvedShareLink = fallback.shareLink;
        }
      }
    } else {
      const created = await createFallbackShareLink(serviceClient, burner);
      shareToken = created.shareToken;
      resolvedShareLink = created.shareLink;
    }

    const shareBaseUrl = getShareBaseUrl(request);

    return NextResponse.json({
      burnerId: burner.id,
      shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${resolvedShareLink.slug}?token=${shareToken}`,
      shortCode: resolvedShareLink.short_code,
      slug: resolvedShareLink.slug,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Burner could not open that share page." },
      { status: 400 },
    );
  }
}
