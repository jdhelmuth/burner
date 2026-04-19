import type { RevealedTrack } from "@burner/core";

const RECIPIENT_FINGERPRINT_KEY = "burner:web:recipient-fingerprint";

export interface PersistedReceiverState {
  activeTrackPosition: number;
  revealedTracks: RevealedTrack[];
  nextLockedPosition: number | null;
  startedPositions: number[];
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getOrCreateRecipientFingerprint() {
  if (!canUseStorage()) {
    return "server-recipient";
  }

  const existing = window.localStorage.getItem(RECIPIENT_FINGERPRINT_KEY);
  if (existing) {
    return existing;
  }

  const created =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `recipient-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(RECIPIENT_FINGERPRINT_KEY, created);
  return created;
}

export function getReceiverStateKey(burnerId: string) {
  return `burner:web:receiver:${burnerId}`;
}

export function readReceiverState(burnerId: string) {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(getReceiverStateKey(burnerId));
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PersistedReceiverState;
  } catch {
    return null;
  }
}

export function writeReceiverState(burnerId: string, state: PersistedReceiverState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(getReceiverStateKey(burnerId), JSON.stringify(state));
}
