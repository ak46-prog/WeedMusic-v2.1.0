'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Headphones, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicStore } from '@/lib/store';

/**
 * YouTube IFrame Player — The MOST reliable fallback
 *
 * This uses YouTube's official IFrame Player API which:
 * - Is 100% reliable (it's YouTube's own player)
 * - Handles all streaming, buffering, and playback internally
 * - Works on all browsers and devices
 * - No CORS issues (YouTube serves it)
 * - No demuxer errors (YouTube handles encoding)
 *
 * Used as a fallback when the server-side proxy method fails.
 * Can also be the primary player for video content.
 */

// YouTube IFrame API types
interface YTPlayer {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
}

interface YTEvent {
  data: number;
  target: YTPlayer;
}

// Player states
const YT_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

// Load the YouTube IFrame API script once
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      resolve();
    };

    // Fallback timeout
    setTimeout(resolve, 5000);
  });

  return apiLoadPromise;
}

interface YouTubePlayerProps {
  videoId: string;
  audioOnly?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function YouTubePlayer({ videoId, audioOnly = true, onReady, onError, onEnd }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const { isPlaying, togglePlay, volume, setVolume, setCurrentTime, setDuration } = useMusicStore();
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize player
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    let destroyed = false;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (destroyed) return;

      const YT = (window as any).YT;
      if (!YT?.Player) {
        setPlayerError(true);
        onError?.('YouTube API failed to load');
        return;
      }

      // Destroy existing player
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }

      const playerContainer = document.createElement('div');
      playerContainer.id = `yt-player-${videoId}`;
      containerRef.current!.innerHTML = '';
      containerRef.current!.appendChild(playerContainer);

      playerRef.current = new YT.Player(`yt-player-${videoId}`, {
        videoId,
        height: audioOnly ? '1' : '100%',
        width: audioOnly ? '1' : '100%',
        playerVars: {
          autoplay: 1,
          controls: audioOnly ? 0 : 1,
          disablekb: 1,
          fs: audioOnly ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3, // No annotations
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setPlayerReady(true);
            setPlayerError(false);
            // Set initial volume
            playerRef.current?.setVolume(Math.round(volume * 100));
            onReady?.();
          },
          onStateChange: (event: YTEvent) => {
            if (destroyed) return;
            const state = event.data;

            if (state === YT_STATES.PLAYING) {
              // Start time update interval
              const updateInterval = setInterval(() => {
                if (destroyed || !playerRef.current) {
                  clearInterval(updateInterval);
                  return;
                }
                try {
                  const current = playerRef.current.getCurrentTime();
                  const dur = playerRef.current.getDuration();
                  if (isFinite(current)) setCurrentTime(current);
                  if (isFinite(dur) && dur > 0) setDuration(dur);
                } catch { /* ignore */ }
              }, 250);

              // Store interval for cleanup
              (containerRef.current as any).__updateInterval = updateInterval;
            }

            if (state === YT_STATES.PAUSED) {
              const interval = (containerRef.current as any).__updateInterval;
              if (interval) clearInterval(interval);
            }

            if (state === YT_STATES.ENDED) {
              const interval = (containerRef.current as any).__updateInterval;
              if (interval) clearInterval(interval);
              onEnd?.();
            }
          },
          onError: (event: any) => {
            console.error('[YouTubePlayer] Error:', event.data);
            setPlayerError(true);
            onError?.(`YouTube player error: ${event.data}`);
          },
        },
      });
    };

    initPlayer();

    return () => {
      destroyed = true;
      const interval = (containerRef.current as any)?.__updateInterval;
      if (interval) clearInterval(interval);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Sync play/pause
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== YT_STATES.PLAYING && state !== YT_STATES.BUFFERING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === YT_STATES.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch { /* ignore */ }
  }, [isPlaying, playerReady]);

  // Sync volume
  useEffect(() => {
    if (!playerRef.current || !playerReady) return;
    try {
      playerRef.current.setVolume(Math.round(volume * 100));
    } catch { /* ignore */ }
  }, [volume, playerReady]);

  const handleRetry = () => {
    setPlayerError(false);
    // Force re-creation of player by changing key in parent
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    }
    // The useEffect will re-run when the player is null
    window.location.reload();
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative">
      {/* Hidden YouTube iframe for audio-only mode */}
      <div
        ref={containerRef}
        className={audioOnly ? 'absolute w-px h-px overflow-hidden opacity-0 pointer-events-none' : 'w-full h-full'}
        aria-hidden={audioOnly}
      />

      {/* Audio-only controls overlay */}
      {audioOnly && (
        <div className="flex items-center gap-2">
          {playerError ? (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="size-3.5" />
              <span>Playback error</span>
              <Button onClick={handleRetry} variant="ghost" size="sm" className="h-6 text-xs px-2">
                <RefreshCw className="size-3 mr-1" />
                Retry
              </Button>
            </div>
          ) : !playerReady ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="size-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading via YouTube...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Headphones className="size-3.5 text-orange-500" />
              <span className="text-[10px] text-muted-foreground">YouTube Audio</span>
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="icon"
                className="size-5 p-0"
              >
                {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error overlay for video mode */}
      {!audioOnly && playerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
          <AlertCircle className="size-12 text-red-400 mb-3" />
          <p className="font-medium mb-1">Playback failed</p>
          <p className="text-sm text-white/60 mb-3">The video could not be loaded</p>
          <Button onClick={handleRetry} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
