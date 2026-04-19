interface YouTubePlayerOptions {
  autoplay?: 0 | 1;
  controls?: 0 | 1;
  enablejsapi?: 0 | 1;
  origin?: string;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
}

interface YouTubePlayerEvent {
  data?: number;
  target: YouTubePlayer;
}

interface YouTubePlayer {
  cueVideoById(videoId: string): void;
  destroy(): void;
  getPlayerState(): number;
  loadVideoById(videoId: string): void;
  pauseVideo(): void;
  playVideo(): void;
}

interface YouTubeGlobal {
  Player: new (
    element: HTMLElement,
    options: {
      height?: string;
      width?: string;
      videoId?: string;
      playerVars?: YouTubePlayerOptions;
      events?: {
        onReady?: (event: YouTubePlayerEvent) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
}

interface Window {
  YT?: YouTubeGlobal;
  onYouTubeIframeAPIReady?: () => void;
}
