export function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube playback is only available in the browser."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise<YouTubeGlobal>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-youtube-player-sdk="true"]');
    const script = existingScript ?? document.createElement("script");

    if (!existingScript) {
      script.async = true;
      script.src = "https://www.youtube.com/iframe_api";
      script.dataset.youtubePlayerSdk = "true";
      script.addEventListener("error", () => reject(new Error("YouTube player SDK could not load.")), { once: true });
      document.body.appendChild(script);
    }

    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();

      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      reject(new Error("YouTube player SDK loaded without a usable player."));
    };
  });
}
