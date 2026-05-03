import type { ImportedTrack, RevealedTrack } from "@burner/core";
import { decryptJson, encryptJson, randomToken, sha256 } from "./crypto";
import { sql } from "./db";

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

type BurnerRow = {
  id: string;
  slug: string;
  title: string;
  sender_name: string;
  note: string | null;
  cover_image_url: string | null;
  reveal_mode: "timed" | "verified-or-timed";
  total_tracks: number;
  current_revealed_index: number;
  is_revoked: boolean;
  created_at: string | Date;
};

type ShareLinkRow = {
  id: string;
  burner_id: string;
  created_at: string | Date;
  expires_at: string | Date | null;
  open_count: number;
  owner_share_token_ciphertext: string | null;
  short_code: string;
  slug: string;
};

type RecipientSessionRow = {
  id: string;
  current_position: number;
  completed_positions: number[];
};

export function slugify(value: string) {
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

function createShareSlug(baseSlug: string) {
  const normalized = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${normalized || "burner"}-${crypto.randomUUID().slice(0, 6)}`;
}

export function getShareBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim();
  return configured || new URL(request.url).origin;
}

function assertString(
  value: unknown,
  field: string,
  { max, required = true }: { max: number; required?: boolean },
): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) throw new Error(`${field} is required.`);
    return null;
  }
  if (typeof value !== "string") throw new Error(`${field} must be a string.`);
  if (value.length > max) throw new Error(`${field} is too long (max ${max} characters).`);
  return value;
}

function assertCoverImageValue(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("coverImageUrl must be a string.");
  if (value.startsWith("data:") && !value.startsWith("data:image/")) {
    throw new Error("coverImageUrl must be an image URL or image data URL.");
  }
  const max = value.startsWith("data:image/") ? MAX_COVER_DATA_URL_LEN : MAX_URL_LEN;
  if (value.length > max) throw new Error("coverImageUrl is too large.");
  return value;
}

export function validateBurnerDraft(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Request body must be a JSON object.");
  const raw = body as Record<string, unknown>;
  const title = assertString(raw.title, "title", { max: MAX_TITLE_LEN });
  const senderName = assertString(raw.senderName, "senderName", { max: MAX_SENDER_LEN });
  const note = assertString(raw.note, "note", { max: MAX_NOTE_LEN, required: false });
  const coverImageUrl = assertCoverImageValue(raw.coverImageUrl);
  const revealMode = raw.revealMode ?? "verified-or-timed";
  if (typeof revealMode !== "string" || !ALLOWED_REVEAL_MODES.has(revealMode)) {
    throw new Error("revealMode must be 'timed' or 'verified-or-timed'.");
  }
  if (!Array.isArray(raw.tracks) || raw.tracks.length === 0) {
    throw new Error("At least one track is required.");
  }
  if (raw.tracks.length > MAX_TRACKS) throw new Error(`A burner can hold at most ${MAX_TRACKS} tracks.`);
  const tracks = raw.tracks.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Track ${index + 1} is malformed.`);
    const track = entry as ImportedTrack;
    if (typeof track.provider !== "string" || !ALLOWED_PROVIDERS.has(track.provider)) {
      throw new Error(`Track ${index + 1} has an unsupported provider.`);
    }
    return track;
  });
  return { title: title!, senderName: senderName!, note, coverImageUrl, revealMode, tracks };
}

export function toRevealedTrack(payload: { position: number; track: ImportedTrack }): RevealedTrack {
  return {
    position: payload.position,
    title: payload.track.title,
    artist: payload.track.artist,
    albumArtUrl: payload.track.albumArtUrl,
    albumName: payload.track.albumName,
    provider: payload.track.provider,
    providerUri: payload.track.handoffUri ?? payload.track.deepLink ?? payload.track.externalUrl,
    previewUrl: payload.track.previewUrl,
    playbackCapabilities: ["handoffPlayback"],
  };
}

export async function createBurner(input: {
  body: unknown;
  request: Request;
  user: { id: string; email: string; user_metadata: { display_name?: string } };
}) {
  const body = validateBurnerDraft(input.body);
  const slug = `${slugify(body.title)}-${crypto.randomUUID().slice(0, 6)}`;
  const shareToken = randomToken(24);
  const tokenHash = await sha256(shareToken);
  const ownerShareTokenCiphertext = await encryptJson({ shareToken });
  const displayName =
    input.user.user_metadata.display_name ?? input.user.email.split("@")[0] ?? body.senderName;

  await sql`
    insert into profiles (id, display_name, username)
    values (${input.user.id}, ${displayName}, ${slugify(displayName) || "burner-sender"})
    on conflict (id) do update set display_name = excluded.display_name
  `;
  const burners = await sql`
    insert into burners (sender_id, slug, title, sender_name, note, cover_image_url, reveal_mode, total_tracks)
    values (${input.user.id}, ${slug}, ${body.title}, ${body.senderName}, ${body.note}, ${body.coverImageUrl}, ${body.revealMode}, ${body.tracks.length})
    returning id, slug
  `;
  const burner = burners[0] as { id: string; slug: string };

  for (let index = 0; index < body.tracks.length; index += 1) {
    await sql`
      insert into burner_tracks (burner_id, position, provider, encrypted_payload)
      values (${burner.id}, ${index + 1}, ${body.tracks[index].provider}, ${await encryptJson({
        position: index + 1,
        track: body.tracks[index],
      })})
    `;
  }

  let shareLink: { short_code: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shortCode = createShortCode();
    try {
      const rows = await sql`
        insert into burner_share_links (burner_id, slug, short_code, owner_share_token_ciphertext, token_hash)
        values (${burner.id}, ${slug}, ${shortCode}, ${ownerShareTokenCiphertext}, ${tokenHash})
        returning slug, short_code
      `;
      shareLink = rows[0] as { short_code: string; slug: string };
      break;
    } catch (error) {
      if (!(error as Error).message.includes("duplicate key")) throw error;
    }
  }
  if (!shareLink) throw new Error("Could not create share link");
  const shareBaseUrl = getShareBaseUrl(input.request);
  return {
    burnerId: burner.id,
    slug,
    shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${shareLink.slug}?token=${shareToken}`,
    shortCode: shareLink.short_code,
  };
}

export async function exchangeShareAccess(input: {
  slug: string;
  token: string;
  clientFingerprint?: string;
}) {
  const tokenHash = await sha256(input.token);
  const shareRows = await sql`
    select * from burner_share_links
    where slug = ${input.slug} and token_hash = ${tokenHash} and revoked_at is null
    limit 1
  `;
  const shareLink = shareRows[0] as ShareLinkRow | undefined;
  if (!shareLink) throw new Error("Share link not found");
  if (shareLink.expires_at && new Date(shareLink.expires_at).getTime() < Date.now()) {
    throw new Error("Share link expired");
  }

  const burnerRows = await sql`select * from burners where id = ${shareLink.burner_id} limit 1`;
  const burner = burnerRows[0] as BurnerRow | undefined;
  if (!burner || burner.is_revoked) throw new Error("Burner unavailable");

  const sessionToken = randomToken(24);
  const sessionTokenHash = await sha256(sessionToken);
  const fingerprint = input.clientFingerprint || "unknown-recipient";
  const existingRows = await sql`
    select * from burner_recipient_sessions
    where share_link_id = ${shareLink.id} and client_fingerprint = ${fingerprint}
    limit 1
  `;
  let recipientSession = existingRows[0] as RecipientSessionRow | undefined;
  if (recipientSession) {
    await sql`
      update burner_recipient_sessions set session_token_hash = ${sessionTokenHash}
      where id = ${recipientSession.id}
    `;
  } else {
    const rows = await sql`
      insert into burner_recipient_sessions (burner_id, share_link_id, client_fingerprint, session_token_hash)
      values (${burner.id}, ${shareLink.id}, ${fingerprint}, ${sessionTokenHash})
      returning id, current_position, completed_positions
    `;
    recipientSession = rows[0] as RecipientSessionRow;
  }

  const completedPositions = [...(recipientSession.completed_positions ?? [])].sort((left, right) => left - right);
  const firstTrack = await getRevealedTrack(burner.id, 1);
  const revealedTracks = await Promise.all(completedPositions.map((position) => getRevealedTrack(burner.id, position)));
  await sql`update burner_share_links set open_count = ${shareLink.open_count + 1} where id = ${shareLink.id}`;

  return {
    sessionToken,
    recipientSessionId: recipientSession.id,
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
      currentRevealedIndex: completedPositions.at(-1) ?? 0,
    },
    firstTrack,
    revealedTracks,
    nextLockedPosition:
      completedPositions.length >= burner.total_tracks
        ? null
        : Math.max(recipientSession.current_position, 1),
  };
}

export async function getRevealedTrack(burnerId: string, position: number) {
  const rows = await sql`
    select encrypted_payload from burner_tracks
    where burner_id = ${burnerId} and position = ${position}
    limit 1
  `;
  const row = rows[0] as { encrypted_payload: string } | undefined;
  if (!row) throw new Error("Track missing");
  return toRevealedTrack(await decryptJson<{ position: number; track: ImportedTrack }>(row.encrypted_payload));
}

export async function createOrGetShareLink(input: {
  burnerId: string;
  mode: "create" | "get";
  request: Request;
  userId: string;
}) {
  const burnerRows = await sql`
    select id, slug from burners where id = ${input.burnerId} and sender_id = ${input.userId} limit 1
  `;
  const burner = burnerRows[0] as { id: string; slug: string } | undefined;
  if (!burner) throw new Error("Burner not found");

  if (input.mode === "get") {
    const rows = await sql`
      select id, slug, short_code, created_at, expires_at, owner_share_token_ciphertext
      from burner_share_links
      where burner_id = ${burner.id} and revoked_at is null
      order by created_at asc
    `;
    for (const link of rows as ShareLinkRow[]) {
      if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) continue;
      if (!link.owner_share_token_ciphertext) continue;
      const decrypted = await decryptJson<{ shareToken?: string }>(link.owner_share_token_ciphertext);
      if (decrypted.shareToken) {
        return shareLinkResponse(input.request, burner.id, link, decrypted.shareToken);
      }
    }
  }

  const shareToken = randomToken(24);
  const tokenHash = await sha256(shareToken);
  const ownerShareTokenCiphertext = await encryptJson({ shareToken });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const rows = await sql`
        insert into burner_share_links (burner_id, slug, short_code, owner_share_token_ciphertext, token_hash)
        values (${burner.id}, ${createShareSlug(burner.slug)}, ${createShortCode()}, ${ownerShareTokenCiphertext}, ${tokenHash})
        returning slug, short_code
      `;
      return shareLinkResponse(input.request, burner.id, rows[0] as ShareLinkRow, shareToken);
    } catch (error) {
      if (!(error as Error).message.includes("duplicate key")) throw error;
    }
  }
  throw new Error("Could not create share link");
}

function shareLinkResponse(
  request: Request,
  burnerId: string,
  shareLink: Pick<ShareLinkRow, "short_code" | "slug">,
  shareToken: string,
) {
  const shareBaseUrl = getShareBaseUrl(request);
  return {
    burnerId,
    shortCode: shareLink.short_code,
    slug: shareLink.slug,
    shareUrl: `${shareBaseUrl.replace(/\/$/, "")}/b/${shareLink.slug}?token=${shareToken}`,
  };
}
