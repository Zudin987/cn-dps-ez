import { SETTINGS } from "$lib/settings-store";

export const DEFAULT_LIVE_AUTO_HIDE_IN_DAILY_SCENES = true;

type LiveGeneralWithSceneVisibility = typeof SETTINGS.live.general.state & {
  autoHideInDailyScenes?: boolean;
};

function liveGeneral(): LiveGeneralWithSceneVisibility {
  return SETTINGS.live.general.state as LiveGeneralWithSceneVisibility;
}

export function getLiveAutoHideInDailyScenes(): boolean {
  const general = liveGeneral();
  if (typeof general.autoHideInDailyScenes === "boolean") {
    return general.autoHideInDailyScenes;
  }

  // This field is new. Seed older profiles on first read so the normal live
  // profile mirroring/persistence code starts carrying it automatically.
  general.autoHideInDailyScenes = DEFAULT_LIVE_AUTO_HIDE_IN_DAILY_SCENES;
  return DEFAULT_LIVE_AUTO_HIDE_IN_DAILY_SCENES;
}

export function setLiveAutoHideInDailyScenes(enabled: boolean): void {
  liveGeneral().autoHideInDailyScenes = enabled;
}
