<script lang="ts">
  import { isDailyScene } from "$lib/config/daily-scene-blacklist";
  import { getLiveAutoHideInDailyScenes } from "$lib/live-daily-scene-setting";
  import { setOverlayWindowVisible } from "$lib/overlay-window-visibility.svelte";
  import { liveSceneStore } from "$lib/stores/live-topics.svelte";

  let previousSceneId: number | null | undefined = undefined;
  let previousAutoHide: boolean | undefined = undefined;

  // Scene transitions establish the default live-meter visibility. We do not
  // react to the window's own visibility state, so a manual toggle remains in
  // effect until the user changes this setting or enters another scene.
  $effect(() => {
    const sceneId = liveSceneStore.data?.sceneId ?? null;
    const autoHide = getLiveAutoHideInDailyScenes();
    const sceneChanged = sceneId !== previousSceneId;
    const settingChanged = autoHide !== previousAutoHide;

    previousSceneId = sceneId;
    previousAutoHide = autoHide;

    if ((!sceneChanged && !settingChanged) || sceneId === null) return;

    void setOverlayWindowVisible(
      "live",
      !autoHide || !isDailyScene(sceneId),
    );
  });
</script>
