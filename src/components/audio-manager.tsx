'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMusicStore } from '@/lib/store';

/**
 * AudioManager — Ultra-Fast Hybrid Audio Playback
 *
 * STRATEGY: Parallel loading for FASTEST playback (1-3 sec target)
 * 1. YouTube IFrame starts IMMEDIATELY (loadVideoById, not cueVideoById)
 * 2. Proxy audio fetch runs in parallel with 2.5s timeout
 * 3. If proxy audio works first, switch to it (better seeking)
 * 4. If proxy fails, YouTube IFrame is already playing
 *
 * VideoPlayer coordination:
 * - Exposes __weedmusicStopAll() for VideoPlayer to pause everything
 * - Exposes __weedmusicResumeAll(time) for VideoPlayer to hand back control
 * - When VideoPlayer takes over, this manager fully stops
 */

type PlaybackMode = 'audio' | 'youtube';

export function AudioManager() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);

  const playbackModeRef = useRef<PlaybackMode>('youtube');
  const [ytReady, setYtReady] = useState(false);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const lastVideoIdRef = useRef<string>('');
  const switchingRef = useRef(false);
  const activeVideoIdRef = useRef<string>('');
  const isLoadingRef = useRef(false);
  const ytIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const trackChangeIdRef = useRef(0);
  const preloadCacheRef = useRef<Map<string, { url: string; mime: string }>>(new Map());
  const videoPlayerActiveRef = useRef(false);
  const isPlayingRef = useRef(false);

  /* ====================================================================
    PRELOAD YouTube IFrame API on mount
    ==================================================================== */

  useEffect(() => {
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript && !(window as any).YT?.Player) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  /* ====================================================================
    MEDIA SESSION API
    ==================================================================== */

  const updateMediaSession = useCallback((track: any) => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown',
        artwork: track.thumbnail
          ? [
              { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
              { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
              { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
              { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });
      navigator.mediaSession.setActionHandler('play', () => useMusicStore.getState().togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => useMusicStore.getState().togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => useMusicStore.getState().prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => useMusicStore.getState().nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        const audio = audioRef.current;
        const yt = ytPlayerRef.current;
        if (audio && playbackModeRef.current === 'audio' && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
        } else if (yt && playbackModeRef.current === 'youtube' && details.seekTime !== undefined) {
          try { yt.seekTo(details.seekTime, true); } catch { /* */ }
        }
      });
      // Android Auto / CarPlay seek handlers
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const audio = audioRef.current;
        const yt = ytPlayerRef.current;
        const offset = details.seekOffset || 10;
        if (playbackModeRef.current === 'audio' && audio) {
          audio.currentTime = Math.max(0, audio.currentTime - offset);
        } else if (playbackModeRef.current === 'youtube' && yt) {
          try { yt.seekTo(Math.max(0, (yt.getCurrentTime() || 0) - offset), true); } catch { /* */ }
        }
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const audio = audioRef.current;
        const yt = ytPlayerRef.current;
        const offset = details.seekOffset || 10;
        if (playbackModeRef.current === 'audio' && audio) {
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + offset);
        } else if (playbackModeRef.current === 'youtube' && yt) {
          try { yt.seekTo((yt.getCurrentTime() || 0) + offset, true); } catch { /* */ }
        }
      });
      // Playback state for Android Auto / CarPlay
      try {
        navigator.mediaSession.playbackState = isPlayingRef.current ? 'playing' : 'paused';
      } catch { /* */ }
    } catch { /* */ }
  }, []);

  /* ====================================================================
    CLEAR YOUTUBE TIME INTERVAL HELPER
    ==================================================================== */

  const clearYtInterval = useCallback(() => {
    if (ytIntervalRef.current) {
      clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = undefined;
    }
  }, []);

  /* ====================================================================
    HANDLE TRACK END — Auto-play next in queue
    ==================================================================== */

  const handleTrackEnd = useCallback(() => {
    const { repeat, queue, autoPlay } = useMusicStore.getState();
    if (repeat === 'one') {
      const audio = audioRef.current;
      const yt = ytPlayerRef.current;
      if (audio && playbackModeRef.current === 'audio') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (yt && playbackModeRef.current === 'youtube') {
        try { yt.seekTo(0, true); yt.playVideo(); } catch { /* */ }
      }
    } else if (autoPlay) {
      useMusicStore.getState().nextTrack();
    } else {
      useMusicStore.getState().setIsLoading(false);
    }
  }, []);

  /* ====================================================================
    YOUTUBE IFRAME PLAYER — Optimized for fastest start
    ==================================================================== */

  const createOrLoadYT = useCallback((videoId: string, changeId: number) => {
    const buildPlayer = (vid: string) => {
      const YTApi = (window as any).YT;
      if (!ytContainerRef.current || !YTApi?.Player) {
        setTimeout(() => {
          if (changeId === trackChangeIdRef.current) buildPlayer(vid);
        }, 100);
        return;
      }

      if (ytPlayerRef.current) {
        try {
          // Use loadVideoById for IMMEDIATE playback (no cue delay)
          ytPlayerRef.current.loadVideoById({
            videoId: vid,
            startSeconds: 0,
            suggestedQuality: 'small', // Start small for fast buffer, then upgrade
          });
          return;
        } catch {
          try { ytPlayerRef.current.destroy(); } catch { /* */ }
          ytPlayerRef.current = null;
        }
      }

      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${vid}`;
      ytContainerRef.current.innerHTML = '';
      ytContainerRef.current.appendChild(playerDiv);

      ytPlayerRef.current = new YTApi.Player(`yt-player-${vid}`, {
        videoId: vid,
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (changeId !== trackChangeIdRef.current) return;
            setYtReady(true);
            switchingRef.current = false;
            const vol = useMusicStore.getState().volume;
            ytPlayerRef.current?.setVolume(Math.round(vol * 100));

            // Start with small quality for fast buffer, then upgrade quickly
            try {
              ytPlayerRef.current?.setPlaybackQuality('small');
              // Upgrade quality after 1.5 seconds for better audio
              setTimeout(() => {
                try { ytPlayerRef.current?.setPlaybackQuality('medium'); } catch { /* */ }
              }, 1500);
            } catch { /* */ }

            if (playbackModeRef.current === 'youtube' && useMusicStore.getState().isPlaying) {
              ytPlayerRef.current?.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (changeId !== trackChangeIdRef.current) return;
            // Skip updates if VideoPlayer has taken over
            if (videoPlayerActiveRef.current) return;
            if (event.data === 1) {
              // Playing
              useMusicStore.getState().setIsLoading(false);
              clearYtInterval();
              ytIntervalRef.current = setInterval(() => {
                try {
                  const t = ytPlayerRef.current?.getCurrentTime();
                  const d = ytPlayerRef.current?.getDuration();
                  if (isFinite(t)) useMusicStore.getState().setCurrentTime(t);
                  if (isFinite(d) && d > 0) useMusicStore.getState().setDuration(d);
                  const buffered = ytPlayerRef.current?.getVideoLoadedFraction?.();
                  if (buffered !== undefined && buffered > 0) {
                    useMusicStore.getState().setBufferProgress(buffered);
                  }
                } catch {
                  clearYtInterval();
                }
              }, 250);
            } else if (event.data === 2) {
              clearYtInterval();
            } else if (event.data === 3) {
              useMusicStore.getState().setIsLoading(true);
            } else if (event.data === 0) {
              clearYtInterval();
              handleTrackEnd();
            }
          },
          onError: () => {
            switchingRef.current = false;
            isLoadingRef.current = false;
            useMusicStore.getState().setIsLoading(false);
          },
        },
      });
    };

    buildPlayer(videoId);
  }, [clearYtInterval, handleTrackEnd]);

  /* ====================================================================
    TRY DIRECT AUDIO — Fast 2.5-second proxy fetch
    ==================================================================== */

  const tryDirectAudio = useCallback(async (videoId: string, changeId: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // Check preload cache first for INSTANT playback
      const cached = preloadCacheRef.current.get(videoId);
      let data: any = null;

      if (cached) {
        data = { directUrl: cached.url, mimeType: cached.mime };
        preloadCacheRef.current.delete(videoId);
      } else {
        // 5-second timeout — proxy uses Promise.any for fast resolution
        const res = await fetch(
          `/api/music/proxy?id=${encodeURIComponent(videoId)}`,
          { signal: AbortSignal.timeout(5000) },
        );

        if (changeId !== trackChangeIdRef.current) return;
        if (!res.ok) return;

        data = await res.json();
        if (!data.directUrl) return;
      }

      if (changeId !== trackChangeIdRef.current) return;
      // Skip if VideoPlayer has taken over
      if (videoPlayerActiveRef.current) return;

      // Switch to audio mode
      playbackModeRef.current = 'audio';
      activeVideoIdRef.current = videoId;

      // Pause YouTube player
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.pauseVideo(); } catch { /* */ }
        clearYtInterval();
      }

      audio.innerHTML = '';
      const source = document.createElement('source');
      source.src = data.directUrl;
      source.type = data.mimeType || 'audio/mp4';
      audio.appendChild(source);
      audio.volume = useMusicStore.getState().volume;
      audio.load();

      try {
        await audio.play();
        isLoadingRef.current = false;
        useMusicStore.getState().setIsLoading(false);
        console.log(`[audio] ✅ Direct audio playing: ${videoId}`);
      } catch (playErr) {
        // Direct audio play failed — try Invidious fallback URLs
        console.log(`[audio] Direct play failed, trying Invidious fallbacks for ${videoId}`);
        try {
          const fallbackRes = await fetch(
            `/api/music/proxy?id=${encodeURIComponent(videoId)}`,
            { signal: AbortSignal.timeout(3000) },
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fallbacks = fallbackData.invidiousFallbacks || [];
            for (const fb of fallbacks) {
              try {
                audio.innerHTML = '';
                const fbSource = document.createElement('source');
                fbSource.src = fb.url;
                fbSource.type = fb.mimeType || 'audio/mp4';
                audio.appendChild(fbSource);
                audio.load();
                await audio.play();
                isLoadingRef.current = false;
                useMusicStore.getState().setIsLoading(false);
                console.log(`[audio] ✅ Invidious fallback playing: ${videoId}`);
                return;
              } catch {
                continue;
              }
            }
          }
        } catch {
          // Fallbacks exhausted
        }
        // All fallbacks failed — switch back to YouTube
        playbackModeRef.current = 'youtube';
        audio.innerHTML = '';
        if (ytPlayerRef.current) {
          try { ytPlayerRef.current.playVideo(); } catch { /* */ }
        }
        console.log(`[audio] Falling back to YouTube IFrame for ${videoId}`);
      }
    } catch {
      // Proxy failed — YouTube IFrame continues playing
    }
  }, [clearYtInterval]);

  /* ====================================================================
    PRELOAD NEXT TRACKS — Aggressive pre-fetching
    ==================================================================== */

  useEffect(() => {
    const { queue, queueIndex, shuffle } = useMusicStore.getState();
    if (queue.length === 0) return;

    // Preload next 3 tracks
    const tracksToPreload: string[] = [];
    for (let offset = 1; offset <= 3; offset++) {
      let nextIdx: number;
      if (shuffle) {
        nextIdx = Math.floor(Math.random() * queue.length);
      } else {
        nextIdx = queueIndex + offset;
        if (nextIdx >= queue.length) nextIdx = nextIdx % queue.length;
      }

      const nextTrack = queue[nextIdx];
      if (nextTrack && !preloadCacheRef.current.has(nextTrack.videoId)) {
        tracksToPreload.push(nextTrack.videoId);
      }
    }

    // Pre-fetch audio URLs for the next tracks
    tracksToPreload.forEach((preloadId, i) => {
      setTimeout(() => {
        fetch(`/api/music/proxy?id=${encodeURIComponent(preloadId)}`, {
          signal: AbortSignal.timeout(5000),
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.directUrl) {
              preloadCacheRef.current.set(preloadId, {
                url: data.directUrl,
                mime: data.mimeType || 'audio/mp4',
              });
              // Limit cache size to 8 entries
              if (preloadCacheRef.current.size > 8) {
                const firstKey = preloadCacheRef.current.keys().next().value;
                if (firstKey) preloadCacheRef.current.delete(firstKey);
              }
            }
          })
          .catch(() => {});
      }, i * 300); // Stagger by 300ms
    });
  }, [currentTrack?.videoId]);

  /* ====================================================================
    GLOBAL FUNCTIONS — Exposed for MusicPlayer and VideoPlayer
    ==================================================================== */

  useEffect(() => {
    (window as any).__weedmusicSeek = (time: number) => {
      const audio = audioRef.current;
      const yt = ytPlayerRef.current;
      if (playbackModeRef.current === 'audio' && audio) {
        audio.currentTime = time;
      } else if (playbackModeRef.current === 'youtube' && yt) {
        try { yt.seekTo(time, true); } catch { /* */ }
      }
    };
    (window as any).__seek = (time: number) => {
      const audio = audioRef.current;
      const yt = ytPlayerRef.current;
      if (playbackModeRef.current === 'audio' && audio) {
        audio.currentTime = time;
      } else if (playbackModeRef.current === 'youtube' && yt) {
        try { yt.seekTo(time, true); } catch { /* */ }
      }
    };
    (window as any).__weedmusicGetMode = () => playbackModeRef.current;
    (window as any).__weedmusicGetYtPlayer = () => ytPlayerRef.current;

    // STOP ALL playback — called by VideoPlayer when it takes over
    (window as any).__weedmusicStopAll = () => {
      videoPlayerActiveRef.current = true;
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.muted = true;
      }
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.pauseVideo(); } catch { /* */ }
      }
      clearYtInterval();
    };

    // RESUME ALL playback — called by VideoPlayer when it closes
    (window as any).__weedmusicResumeAll = (time?: number) => {
      videoPlayerActiveRef.current = false;
      const audio = audioRef.current;
      if (audio) {
        audio.muted = false;
      }

      const seekTime = time ?? useMusicStore.getState().currentTime;
      const shouldPlay = useMusicStore.getState().isPlaying;

      if (playbackModeRef.current === 'audio' && audio) {
        if (isFinite(seekTime) && seekTime > 0) audio.currentTime = seekTime;
        if (shouldPlay) audio.play().catch(() => {});
      } else if (playbackModeRef.current === 'youtube' && ytPlayerRef.current) {
        try {
          if (isFinite(seekTime) && seekTime > 0) ytPlayerRef.current.seekTo(seekTime, true);
          if (shouldPlay) ytPlayerRef.current.playVideo();
        } catch { /* */ }
      }
    };

    return () => {
      delete (window as any).__weedmusicSeek;
      delete (window as any).__seek;
      delete (window as any).__weedmusicGetMode;
      delete (window as any).__weedmusicGetYtPlayer;
      delete (window as any).__weedmusicStopAll;
      delete (window as any).__weedmusicResumeAll;
    };
  }, [clearYtInterval]);

  /* ====================================================================
    PLAYBACK TRIGGER — When track changes (INSTANT SWITCH)
    ==================================================================== */

  useEffect(() => {
    if (!currentTrack) return;
    const videoId = currentTrack.videoId;

    const changeId = ++trackChangeIdRef.current;

    lastVideoIdRef.current = videoId;
    switchingRef.current = false;
    isLoadingRef.current = true;

    // Immediately stop existing audio
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.innerHTML = '';
      audio.currentTime = 0;
    }
    clearYtInterval();

    // Reset state for instant visual feedback
    useMusicStore.getState().setCurrentTime(0);
    useMusicStore.getState().setBufferProgress(0);

    // Update MediaSession
    updateMediaSession(currentTrack);

    // If VideoPlayer is active, don't start audio — VideoPlayer handles it
    if (videoPlayerActiveRef.current) return;

    // PARALLEL STRATEGY: Start YouTube AND proxy simultaneously
    playbackModeRef.current = 'youtube';
    activeVideoIdRef.current = videoId;
    createOrLoadYT(videoId, changeId);
    tryDirectAudio(videoId, changeId);
  }, [currentTrack?.videoId]);

  // Play/pause sync + MediaSession playback state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    // Update MediaSession playback state for Android Auto / CarPlay
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch { /* */ }
    }

    if (!currentTrack) return;
    if (videoPlayerActiveRef.current) return;
    const audio = audioRef.current;

    if (playbackModeRef.current === 'audio' && audio?.src) {
      if (isPlaying) audio.play().catch(() => {});
      else audio.pause();
    } else if (playbackModeRef.current === 'youtube' && ytPlayerRef.current && ytReady) {
      try {
        if (isPlaying) ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      } catch { /* */ }
    }
  }, [isPlaying, ytReady, currentTrack]);

  // Volume sync
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && playbackModeRef.current === 'audio') audio.volume = volume;
    if (playbackModeRef.current === 'youtube' && ytPlayerRef.current && ytReady) {
      try { ytPlayerRef.current.setVolume(Math.round(volume * 100)); } catch { /* */ }
    }
  }, [volume, ytReady]);

  /* ====================================================================
    AUDIO EVENT LISTENERS (for direct audio mode)
    ==================================================================== */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (playbackModeRef.current === 'audio' && !videoPlayerActiveRef.current) {
        useMusicStore.getState().setCurrentTime(audio.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      if (playbackModeRef.current === 'audio' && audio.duration && isFinite(audio.duration)) {
        useMusicStore.getState().setDuration(audio.duration);
      }
    };
    const handleProgress = () => {
      if (playbackModeRef.current === 'audio' && audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const dur = audio.duration || 0;
        if (dur > 0) {
          useMusicStore.getState().setBufferProgress(bufferedEnd / dur);
        }
      }
    };
    const handleCanPlay = () => {
      isLoadingRef.current = false;
      useMusicStore.getState().setIsLoading(false);
    };
    const handleEnded = () => {
      if (playbackModeRef.current !== 'audio') return;
      handleTrackEnd();
    };
    const handlePlaying = () => {
      if (playbackModeRef.current === 'audio' && !videoPlayerActiveRef.current) {
        useMusicStore.getState().setStreamUrl(audio.currentSrc);
        switchingRef.current = false;
        isLoadingRef.current = false;
        useMusicStore.getState().setIsLoading(false);
      }
    };
    const handleError = () => {
      if (playbackModeRef.current !== 'audio') return;
      playbackModeRef.current = 'youtube';
      audio.innerHTML = '';
      const track = useMusicStore.getState().currentTrack;
      if (track) {
        const changeId = trackChangeIdRef.current;
        createOrLoadYT(track.videoId, changeId);
      }
    };
    const handleWaiting = () => {
      isLoadingRef.current = true;
      useMusicStore.getState().setIsLoading(true);
    };
    const handleStalled = () => {
      if (playbackModeRef.current === 'audio' && !audio.paused) {
        const currentPos = audio.currentTime;
        audio.pause();
        setTimeout(() => {
          audio.currentTime = currentPos;
          audio.play().catch(() => {});
        }, 100);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [createOrLoadYT, handleTrackEnd]);

  /* ====================================================================
    HISTORY RECORDING
    ==================================================================== */

  useEffect(() => {
    if (!currentTrack) return;
    fetch('/api/music/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentTrack),
    }).catch(() => {});
  }, [currentTrack?.videoId]);

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      >
        <div
          ref={ytContainerRef}
          style={{
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        />
      </div>
    </>
  );
}
