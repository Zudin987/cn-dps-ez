import { isDailyScene } from "$lib/config/daily-scene-blacklist";

export type LiveDailySceneVisibilityMemory = {
  sceneId: number | undefined;
  autoHide: boolean | undefined;
};

export type LiveDailySceneVisibilityDecision = {
  memory: LiveDailySceneVisibilityMemory;
  /** null means this update must not change the Live window visibility. */
  shouldShow: boolean | null;
};

/**
 * Resolve the scene-driven Live window update without treating a temporary
 * loss of scene telemetry as a real scene transition.
 *
 * This is important for manual overrides: if the user shows Live while
 * auto-hide is enabled in a daily scene, a null/refresh frame must not make
 * that same scene look "new" and immediately hide the window again. The
 * override is replaced only by a real scene-id change or a setting change.
 */
export function resolveLiveDailySceneVisibilityUpdate(
  memory: LiveDailySceneVisibilityMemory,
  sceneId: number | null,
  autoHide: boolean,
): LiveDailySceneVisibilityDecision {
  // Keep the last known scene/settings through transport gaps. If the setting
  // changes during the gap, leaving memory untouched makes that change apply
  // as soon as a real scene snapshot is available again.
  if (sceneId === null) {
    return { memory, shouldShow: null };
  }

  const sceneChanged = sceneId !== memory.sceneId;
  const settingChanged = autoHide !== memory.autoHide;
  const nextMemory = { sceneId, autoHide };

  if (!sceneChanged && !settingChanged) {
    return { memory: nextMemory, shouldShow: null };
  }

  return {
    memory: nextMemory,
    shouldShow: !autoHide || !isDailyScene(sceneId),
  };
}
