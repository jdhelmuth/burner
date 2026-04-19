import { describe, expect, it } from "vitest";

import { createBurnerShell, buildSecretTrackPayload } from "./burners";
import { applyUnlock, createInitialRevealState, evaluateUnlock, getMinimumRevealSeconds } from "./unlock-engine";
import type { BurnerDraft, ListenSession } from "./types";

const draft: BurnerDraft = {
  title: "Late Night Burner",
  senderName: "Nina",
  revealMode: "verified-or-timed",
  tracks: [
    {
      provider: "spotify",
      providerTrackId: "track-1",
      title: "First Track",
      artist: "The Starts",
    },
    {
      provider: "spotify",
      providerTrackId: "track-2",
      title: "Second Track",
      artist: "The Starts",
    },
  ],
};

describe("unlock engine", () => {
  it("reveals only the first track initially", () => {
    const burner = createBurnerShell({ id: "burner-1", slug: "abc123", draft });
    const state = createInitialRevealState(burner, buildSecretTrackPayload(draft.tracks));

    expect(state.revealedTracks).toHaveLength(1);
    expect(state.nextLockedPosition).toBe(2);
  });

  it("unlocks as soon as playback starts", () => {
    const burner = createBurnerShell({ id: "burner-1", slug: "abc123", draft });
    const state = createInitialRevealState(burner, buildSecretTrackPayload(draft.tracks));
    const session: ListenSession = {
      burnerId: burner.id,
      position: 1,
      provider: "spotify",
      startedAt: new Date().toISOString(),
      elapsedSeconds: 1,
      observedCompletion: false,
    };

    const decision = evaluateUnlock({
      burner,
      state,
      session,
      totalTrackCount: draft.tracks.length,
    });

    expect(decision.status).toBe("unlocked");
    expect(decision.reason).toBe("playback-started");
  });

  it("still advances reveal state correctly after playback starts", () => {
    const burner = createBurnerShell({ id: "burner-1", slug: "abc123", draft });
    const secrets = buildSecretTrackPayload(draft.tracks);
    const state = createInitialRevealState(burner, secrets);
    const session: ListenSession = {
      burnerId: burner.id,
      position: 1,
      provider: "spotify",
      startedAt: new Date().toISOString(),
      elapsedSeconds: getMinimumRevealSeconds(),
      observedCompletion: false,
    };

    const decision = evaluateUnlock({
      burner,
      state,
      session,
      totalTrackCount: draft.tracks.length,
    });
    const nextState = applyUnlock({
      state,
      secrets,
      unlockedPosition: session.position,
      totalTrackCount: draft.tracks.length,
    });

    expect(decision.status).toBe("unlocked");
    expect(decision.reason).toBe("playback-started");
    expect(nextState.revealedTracks).toHaveLength(2);
    expect(nextState.completedPositions).toEqual([1]);
  });
});
