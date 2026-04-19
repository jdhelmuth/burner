import { revealThroughPosition } from "./burners";
import type {
  BurnerShell,
  BurnerTrackSecret,
  ListenSession,
  RevealState,
  RevealedTrack,
  UnlockDecision,
} from "./types";

const MINIMUM_REVEAL_SECONDS = 0;

export function createInitialRevealState(
  burner: BurnerShell,
  secrets: BurnerTrackSecret[],
): RevealState {
  return {
    burnerId: burner.id,
    revealedTracks: revealThroughPosition(secrets, 1),
    nextLockedPosition: burner.totalTracks > 1 ? 2 : null,
    completedPositions: [],
  };
}

export function evaluateUnlock(params: {
  burner: BurnerShell;
  state: RevealState;
  session: ListenSession;
  totalTrackCount: number;
}): UnlockDecision {
  const expectedPosition = params.state.completedPositions.length + 1;

  if (params.session.position !== expectedPosition) {
    return {
      status: "blocked",
      reason: "invalid-sequence",
      nextPosition: expectedPosition,
    };
  }

  if (params.state.completedPositions.includes(params.session.position)) {
    return {
      status: "blocked",
      reason: "already-unlocked",
      nextPosition: expectedPosition + 1,
    };
  }

  return {
    status: "unlocked",
    reason: "playback-started",
    nextPosition:
      params.session.position < params.totalTrackCount ? params.session.position + 1 : undefined,
  };
}

export function applyUnlock(params: {
  state: RevealState;
  secrets: BurnerTrackSecret[];
  unlockedPosition: number;
  totalTrackCount: number;
}): RevealState {
  const nextVisiblePosition = Math.min(params.unlockedPosition + 1, params.totalTrackCount);
  const alreadyVisible = params.state.revealedTracks.some(
    (track) => track.position === nextVisiblePosition,
  );
  const revealedTracks: RevealedTrack[] = alreadyVisible
    ? params.state.revealedTracks
    : revealThroughPosition(params.secrets, nextVisiblePosition);

  return {
    burnerId: params.state.burnerId,
    revealedTracks,
    completedPositions: [...params.state.completedPositions, params.unlockedPosition],
    nextLockedPosition:
      nextVisiblePosition >= params.totalTrackCount ? null : nextVisiblePosition + 1,
  };
}

export function getMinimumRevealSeconds() {
  return MINIMUM_REVEAL_SECONDS;
}
