import { describe, expect, it } from "vitest";
import {
  resolveLiveDailySceneVisibilityUpdate,
  type LiveDailySceneVisibilityMemory,
} from "./live-daily-scene-visibility";

const DAILY_SCENE = 12000;
const COMBAT_SCENE = 12011;

function emptyMemory(): LiveDailySceneVisibilityMemory {
  return { sceneId: undefined, autoHide: undefined };
}

describe("resolveLiveDailySceneVisibilityUpdate", () => {
  it("applies auto-hide when a daily scene is first detected", () => {
    const result = resolveLiveDailySceneVisibilityUpdate(
      emptyMemory(),
      DAILY_SCENE,
      true,
    );

    expect(result.shouldShow).toBe(false);
    expect(result.memory).toEqual({ sceneId: DAILY_SCENE, autoHide: true });
  });

  it("preserves a manual Live override across a temporary null scene", () => {
    let result = resolveLiveDailySceneVisibilityUpdate(
      emptyMemory(),
      DAILY_SCENE,
      true,
    );
    let memory = result.memory;

    // The user manually shows Live here. That visibility change happens
    // outside this resolver and must survive telemetry disappearing briefly.
    result = resolveLiveDailySceneVisibilityUpdate(memory, null, true);
    expect(result.shouldShow).toBeNull();
    expect(result.memory).toEqual(memory);
    memory = result.memory;

    // Receiving the same daily scene again is not a scene change, so auto-hide
    // must not overwrite the manual toggle.
    result = resolveLiveDailySceneVisibilityUpdate(memory, DAILY_SCENE, true);
    expect(result.shouldShow).toBeNull();

    // A real scene transition ends the manual override and reapplies the rule.
    result = resolveLiveDailySceneVisibilityUpdate(
      result.memory,
      COMBAT_SCENE,
      true,
    );
    expect(result.shouldShow).toBe(true);
  });

  it("still applies a setting change after a temporary null scene", () => {
    let result = resolveLiveDailySceneVisibilityUpdate(
      emptyMemory(),
      DAILY_SCENE,
      true,
    );

    result = resolveLiveDailySceneVisibilityUpdate(result.memory, null, false);
    expect(result.shouldShow).toBeNull();

    result = resolveLiveDailySceneVisibilityUpdate(
      result.memory,
      DAILY_SCENE,
      false,
    );
    expect(result.shouldShow).toBe(true);
  });
});
