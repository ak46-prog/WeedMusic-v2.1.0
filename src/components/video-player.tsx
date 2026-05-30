'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Minimize, Maximize, Settings, Play, Pause,
  AlertCircle, RefreshCw, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicStore, type VideoQuality } from '@/lib/store';
import { formatTime } from '@/lib/utils-music';

/* =======================================================================
   YouTube IFrame Player API — Robust loader with polling fallback
   ======================================================================= */

/** Map our VideoQuality values to YouTube IFrame API quality strings */
const QUALITY_MAP: Record<VideoQuality, string> = {
  '1080': 'hd1080',
  '720': 'hd720',
  '480': 'large',
  '360': 'medium',
  '240': 'small',
};

/** Quality options for the selector dropdown */
const QUALITY_OPTIONS: { value: VideoQuality; label: string }[] = [
  { value: '1080', label: '1080p HD' },
  { value: '720', label: '720p' },
  { value: '480', label: '480p' },
  { value: '360', label: '360p' },
  { value: '240', label: '240p (fast)' },
];

// YouTube player states
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;
const YT_ENDED = 0;

/** Load YouTube IFrame API — with polling fallback for race conditions */
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  // Already loaded — instant return
  if ((window as any).YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    // Set the callback BEFORE loading the script
    const prevCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };

    // Load the script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    // POLLING FALLBACK — check every 150ms if YT.Player is available
    // This handles the case where AudioManager already loaded the script
    // but onYouTubeIframeAPIReady was never set
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      if ((window as any).YT?.Player) {
        clearInterval(pollInterval);
        resolve();
      }
      pollCount++;
      if (pollCount > 40) { // 6 seconds max
        clearInterval(pollInterval);
        resolve(); // Don't block forever
      }
    }, 150);
  });

  return apiLoadPromise;
}

/* =======================================================================
   VideoPlayer component — Dual mode: YouTube IFrame + Direct HTML5
   ======================================================================= */

export function VideoPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    setShowVideoPlayer,
    videoQuality,
    setVideoQuality,
  } = useMusicStore();

  /* ---- refs ---- */
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const directVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const destroyedRef = useRef(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(false);

  /* ---- local state ---- */
  const [videoMode, setVideoMode] = useState<'youtube' | 'direct'>('youtube');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<string>('');

  /* ====================================================================
    HELPER: clear time-update interval
    ==================================================================== */
  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  /* ====================================================================
    STOP AudioManager when VideoPlayer mounts
    RESUME AudioManager when VideoPlayer unmounts
    ==================================================================== */
  useEffect(() => {
    mountedRef.current = true;

    // STOP AudioManager completely — not just mute, but PAUSE
    const stopFn = (window as any).__weedmusicStopAll;
    if (stopFn) stopFn();

    return () => {
      mountedRef.current = false;

      // Get current time before closing
      let lastTime = useMusicStore.getState().currentTime;
      if (videoMode === 'youtube' && playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime();
          if (isFinite(t)) lastTime = t;
        } catch { /* */ }
      } else if (videoMode === 'direct' && directVideoRef.current) {
        lastTime = directVideoRef.current.currentTime || 0;
      }

      // RESUME AudioManager from where video left off
      const resumeFn = (window as any).__weedmusicResumeAll;
      if (resumeFn) resumeFn(lastTime);
    };
  }, []);

  /* ====================================================================
    FALLBACK: Switch to direct mode when YouTube IFrame fails
    ==================================================================== */
  const switchToDirectMode = useCallback(async (videoId: string) => {
    console.log('[VideoPlayer] Switching to direct video mode...');
    try {
      const res = await fetch(`/api/music/proxy?id=${encodeURIComponent(videoId)}&type=video`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Proxy returned error');
      const data = await res.json();
      if (data.videoUrl) {
        // Destroy YouTube player
        if (playerRef.current) {
          try { playerRef.current.destroy(); } catch { /* */ }
          playerRef.current = null;
        }
        clearInterval_();

        setVideoUrl(data.videoUrl);
        setVideoMode('direct');
        setPlayerReady(true);
        setPlayerError(false);
        setIsBuffering(true);
        setCurrentQuality(`${data.videoQuality || 720}p`);
        console.log('[VideoPlayer] Direct mode active, videoUrl received');
      } else {
        throw new Error('No videoUrl in response');
      }
    } catch (err) {
      console.error('[VideoPlayer] Direct mode failed:', err);
      setPlayerError(true);
    }
  }, [clearInterval_]);

  /* ====================================================================
    CREATE YouTube IFrame player when track changes
    ==================================================================== */
  useEffect(() => {
    if (!currentTrack || !playerContainerRef.current) return;
    const videoId = currentTrack.videoId;

    // Reset mode for new track
    setVideoMode('youtube');
    setVideoUrl('');
    setPlayerError(false);

    let localDestroyed = false;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (localDestroyed || destroyedRef.current) return;

      const YTApi = (window as any).YT;
      if (!YTApi?.Player) {
        // No YouTube API — try direct mode immediately
        switchToDirectMode(videoId);
        return;
      }

      // Destroy previous player
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }

      // Create fresh container div
      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-video-player-${videoId}-${Date.now()}`;
      playerContainerRef.current!.innerHTML = '';
      playerContainerRef.current!.appendChild(playerDiv);

      setPlayerReady(false);
      setIsBuffering(true);
      setPlayerError(false);

      // Determine starting quality — use 'small' for fastest initial buffer
      const startQuality = 'small';
      const targetQuality = QUALITY_MAP[useMusicStore.getState().videoQuality] || 'large';

      playerRef.current = new YTApi.Player(playerDiv.id, {
        videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,       // we render our own controls
          disablekb: 1,
          fs: 0,             // we handle fullscreen ourselves
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3, // no annotations
          playsinline: 1,
          start: Math.floor(useMusicStore.getState().currentTime) || 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (localDestroyed) return;
            setPlayerReady(true);
            setPlayerError(false);
            setIsBuffering(false);

            // Start with small quality for FASTEST buffer
            try {
              playerRef.current.setPlaybackQuality(startQuality);
              setCurrentQuality(startQuality);
            } catch { /* ignore */ }

            // Sync volume
            try {
              playerRef.current.setVolume(
                Math.round(useMusicStore.getState().volume * 100),
              );
            } catch { /* ignore */ }

            // Respect current play state
            if (useMusicStore.getState().isPlaying) {
              playerRef.current.playVideo();
            } else {
              playerRef.current.pauseVideo();
            }

            // Upgrade quality after 1.5 seconds for better video
            setTimeout(() => {
              if (localDestroyed || !playerRef.current || destroyedRef.current) return;
              try {
                playerRef.current.setPlaybackQuality(targetQuality);
                setCurrentQuality(targetQuality);
              } catch { /* ignore */ }
            }, 1500);
          },
          onStateChange: (event: any) => {
            if (localDestroyed) return;
            if (videoMode !== 'youtube') return;

            const state = event.data;

            if (state === YT_PLAYING) {
              setIsBuffering(false);
              useMusicStore.getState().setIsLoading(false);

              // Update current quality
              try {
                const q = playerRef.current.getPlaybackQuality();
                if (q) setCurrentQuality(q);
              } catch { /* */ }

              // Start time-update interval
              clearInterval_();
              intervalRef.current = setInterval(() => {
                if (localDestroyed || !playerRef.current) {
                  clearInterval_();
                  return;
                }
                try {
                  const t = playerRef.current.getCurrentTime();
                  const d = playerRef.current.getDuration();
                  if (isFinite(t)) useMusicStore.getState().setCurrentTime(t);
                  if (isFinite(d) && d > 0) useMusicStore.getState().setDuration(d);
                } catch {
                  clearInterval_();
                }
              }, 250);
            } else if (state === YT_PAUSED) {
              clearInterval_();
            } else if (state === YT_BUFFERING) {
              setIsBuffering(true);
              useMusicStore.getState().setIsLoading(true);
            } else if (state === YT_ENDED) {
              clearInterval_();
              useMusicStore.getState().nextTrack();
            }
          },
          onError: (event: any) => {
            console.error('[VideoPlayer] YouTube error:', event.data);
            // Error 150/101 = embedded playback restricted → auto-switch to direct mode
            if (event.data === 150 || event.data === 101) {
              console.log('[VideoPlayer] YouTube restricted (error', event.data, '), switching to direct video mode');
              switchToDirectMode(videoId);
            } else {
              // For other errors, try direct mode as well
              switchToDirectMode(videoId);
            }
            setPlayerReady(false);
          },
          onPlaybackQualityChange: (event: any) => {
            if (event.data) setCurrentQuality(event.data);
          },
        },
      });
    };

    initPlayer();

    return () => {
      localDestroyed = true;
      clearInterval_();
    };
  }, [currentTrack?.videoId, clearInterval_, switchToDirectMode]);

  /* ====================================================================
    DIRECT VIDEO MODE — HTML5 <video> element event handlers
    ==================================================================== */
  useEffect(() => {
    const video = directVideoRef.current;
    if (!video || videoMode !== 'direct' || !videoUrl) return;

    const handleTimeUpdate = () => {
      if (videoMode === 'direct') {
        useMusicStore.getState().setCurrentTime(video.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        useMusicStore.getState().setDuration(video.duration);
      }
      setIsBuffering(false);
      setPlayerReady(true);
      useMusicStore.getState().setIsLoading(false);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      useMusicStore.getState().setIsLoading(false);
      if (useMusicStore.getState().isPlaying) {
        video.play().catch(() => {});
      }
    };
    const handlePlaying = () => {
      setIsBuffering(false);
      useMusicStore.getState().setIsLoading(false);
    };
    const handleWaiting = () => {
      setIsBuffering(true);
      useMusicStore.getState().setIsLoading(true);
    };
    const handleEnded = () => {
      useMusicStore.getState().nextTrack();
    };
    const handleError = () => {
      console.error('[VideoPlayer] Direct video playback error');
      setPlayerError(true);
      setPlayerReady(false);
      setIsBuffering(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoMode, videoUrl]);

  /* ====================================================================
    SYNC play / pause with store — YouTube mode
    ==================================================================== */
  useEffect(() => {
    if (videoMode === 'youtube') {
      if (!playerRef.current || !playerReady) return;
      try {
        const state = playerRef.current.getPlayerState();
        if (isPlaying && state !== YT_PLAYING && state !== YT_BUFFERING) {
          playerRef.current.playVideo();
        } else if (!isPlaying && (state === YT_PLAYING || state === YT_BUFFERING)) {
          playerRef.current.pauseVideo();
        }
      } catch { /* ignore */ }
    } else if (videoMode === 'direct') {
      const video = directVideoRef.current;
      if (!video) return;
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, [isPlaying, playerReady, videoMode]);

  /* ====================================================================
    SYNC volume with store
    ==================================================================== */
  useEffect(() => {
    if (videoMode === 'youtube') {
      if (!playerRef.current || !playerReady) return;
      try {
        playerRef.current.setVolume(
          Math.round(useMusicStore.getState().volume * 100),
        );
      } catch { /* ignore */ }
    } else if (videoMode === 'direct') {
      const video = directVideoRef.current;
      if (video) {
        video.volume = useMusicStore.getState().volume;
      }
    }
  }, [useMusicStore.getState().volume, playerReady, videoMode]);

  /* ====================================================================
    FULLSCREEN change listener
    ==================================================================== */
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  /* ====================================================================
    CLEANUP on unmount
    ==================================================================== */
  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      clearInterval_();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, [clearInterval_]);

  /* ====================================================================
    AUTO-HIDE controls after inactivity
    ==================================================================== */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (useMusicStore.getState().isPlaying) setShowControls(false);
    }, 3000);
  }, []);

  /* ====================================================================
    SEEK handler
    ==================================================================== */
  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (!isFinite(time)) return;

    if (videoMode === 'youtube' && playerRef.current && playerReady) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
    } else if (videoMode === 'direct') {
      const video = directVideoRef.current;
      if (video) {
        video.currentTime = time;
        setCurrentTime(time);
      }
    }
  }, [playerReady, setCurrentTime, videoMode]);

  /* ====================================================================
    FULLSCREEN toggle
    ==================================================================== */
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  }, []);

  /* ====================================================================
    QUALITY change
    ==================================================================== */
  const changeQuality = useCallback((quality: VideoQuality) => {
    setVideoQuality(quality);
    setShowQualityMenu(false);
    if (videoMode === 'youtube' && playerRef.current && playerReady) {
      try {
        playerRef.current.setPlaybackQuality(QUALITY_MAP[quality]);
      } catch { /* ignore */ }
    }
    // For direct mode, quality can't be changed after stream URL is set
  }, [playerReady, setVideoQuality, videoMode]);

  /* ====================================================================
    CLICK on video area — toggle play/pause
    ==================================================================== */
  const handleVideoClick = useCallback(() => {
    togglePlay();
  }, [togglePlay]);

  /* ====================================================================
    RETRY on error
    ==================================================================== */
  const handleRetry = useCallback(() => {
    if (!currentTrack) return;
    setPlayerError(false);
    setIsBuffering(true);
    setVideoMode('youtube');
    setVideoUrl('');
    // Destroy current player and re-create
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* */ }
      playerRef.current = null;
    }
    // Re-trigger by re-playing the track
    const track = currentTrack;
    useMusicStore.getState().playTrack(track);
  }, [currentTrack]);

  /* ====================================================================
    CLOSE — minimize video player, hand back to AudioManager
    ==================================================================== */
  const handleClose = useCallback(() => {
    // Get current playback position
    let lastTime = useMusicStore.getState().currentTime;
    if (videoMode === 'youtube' && playerRef.current) {
      try {
        const t = playerRef.current.getCurrentTime();
        if (isFinite(t)) lastTime = t;
      } catch { /* */ }
    } else if (videoMode === 'direct' && directVideoRef.current) {
      lastTime = directVideoRef.current.currentTime || 0;
    }

    // Destroy our YouTube player first
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* */ }
      playerRef.current = null;
    }

    // Now close — the unmount effect will call __weedmusicResumeAll
    setShowVideoPlayer(false);
  }, [setShowVideoPlayer, videoMode]);

  /* ====================================================================
    QUALITY LABEL — Show human-readable quality
    ==================================================================== */
  const getQualityLabel = (q: string): string => {
    switch (q) {
      case 'hd1080': return '1080p';
      case 'hd720': return '720p';
      case 'large': return '480p';
      case 'medium': return '360p';
      case 'small': return '240p';
      case 'tiny': return '144p';
      default: return q || videoQuality + 'p';
    }
  };

  /* ====================================================================
    RENDER
    ==================================================================== */

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* YouTube IFrame container — only visible in youtube mode */}
      {videoMode === 'youtube' && (
        <div
          ref={playerContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />
      )}

      {/* Direct HTML5 video element — only visible in direct mode */}
      {videoMode === 'direct' && videoUrl && (
        <video
          ref={directVideoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          autoPlay
          playsInline
          volume={useMusicStore.getState().volume}
        />
      )}

      {/* Click overlay for play/pause — sits above the video but below controls */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 2 }}
        onClick={handleVideoClick}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading spinner */}
      {(isBuffering || (!playerReady && !playerError)) && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 3 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="size-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/70 text-sm font-medium">
              {playerReady ? 'Buffering...' : 'Loading video player...'}
            </p>
            {videoMode === 'direct' && (
              <p className="text-white/50 text-xs">Direct stream mode</p>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {playerError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/80"
          style={{ zIndex: 3 }}
        >
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <AlertCircle className="size-14 text-red-400" />
            <p className="text-white text-lg font-medium">Video playback failed</p>
            <p className="text-white/60 text-sm max-w-xs">
              This video may be restricted from playback. Try another song or use audio mode.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                onClick={handleRetry}
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                <RefreshCw className="size-4" />
                Retry
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 gap-2"
              >
                Audio Mode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 4 }}
      >
        {/* ---- Top bar ---- */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-safe p-4 pb-16 flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-white text-base font-semibold truncate drop-shadow-lg">
              {currentTrack?.title}
            </p>
            <p className="text-white/70 text-sm truncate drop-shadow">
              {currentTrack?.artist}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Mode indicator */}
            <span className="text-white/40 text-[10px] font-medium bg-white/10 px-1.5 py-0.5 rounded mr-1">
              {videoMode === 'youtube' ? 'YT' : 'DIR'}
            </span>
            {/* Current quality indicator */}
            {currentQuality && (
              <span className="text-orange-400 text-[10px] font-bold bg-orange-400/20 px-1.5 py-0.5 rounded mr-1">
                {getQualityLabel(currentQuality)}
              </span>
            )}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 shrink-0"
              aria-label="Close video player"
            >
              <Minimize className="size-5" />
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 shrink-0"
              aria-label="Close video player"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-safe p-4">
          {/* Seek bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.5}
              onValueChange={handleSeek}
              className="cursor-pointer [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-orange-500 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-orange-500 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-lg"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1.5 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Play / Pause */}
            <div className="flex items-center gap-2">
              <Button
                onClick={togglePlay}
                className="size-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 ml-0.5" />
                )}
              </Button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Quality selector — only for YouTube mode */}
              {videoMode === 'youtube' && (
                <div className="relative">
                  <Button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/20 gap-1 h-8"
                    aria-label="Video quality"
                  >
                    <Settings className="size-4" />
                    <span className="text-xs font-semibold">{videoQuality}p</span>
                    <ChevronUp className={`size-3 transition-transform ${showQualityMenu ? 'rotate-180' : ''}`} />
                  </Button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 py-1 min-w-[140px] shadow-xl">
                      {QUALITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => changeQuality(opt.value)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${
                            videoQuality === opt.value
                              ? 'text-orange-500 font-semibold'
                              : 'text-white/80'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {videoQuality === opt.value && (
                            <span className="text-orange-500 text-xs">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen toggle */}
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/20"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dismiss quality menu on outside click */}
      {showQualityMenu && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 3 }}
          onClick={() => setShowQualityMenu(false)}
        />
      )}
    </div>
  );
}
