'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Play, Pause, SkipBack, SkipForward, Heart, Video,
  Car, ListMusic, Shuffle, Repeat, Repeat1, Volume2, VolumeX, AlertCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicStore, type Track } from '@/lib/store';
import { formatTime } from '@/lib/utils-music';
import { QueueDrawer } from '@/components/queue-drawer';

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    currentTime,
    duration,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
    streamUrl,
    setShowVideoPlayer,
    carAudioMode,
    bufferProgress,
    isLoading,
    autoPlay,
    toggleAutoPlay,
  } = useMusicStore();

  const [isFav, setIsFav] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // Seek bar state
  const [seekHoverTime, setSeekHoverTime] = useState<number | null>(null);
  const [seekHoverX, setSeekHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Track audio loading state
  useEffect(() => {
    const audio = document.querySelector('audio');
    if (!audio) return;

    const handleWaiting = () => setAudioLoading(true);
    const handleCanPlay = () => {
      setAudioLoading(false);
      setAudioError(false);
    };
    const handlePlaying = () => {
      setAudioLoading(false);
      setAudioError(false);
    };
    const handleError = () => {
      setAudioLoading(false);
      setAudioError(true);
    };
    const handleLoadStart = () => setAudioLoading(true);

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [currentTrack?.videoId]);

  // Check if current track is favorited
  useEffect(() => {
    if (!currentTrack) return;
    fetch(`/api/music/favorites`)
      .then(res => res.json())
      .then(data => {
        const items: Track[] = data.items || [];
        setIsFav(items.some((t: Track) => t.videoId === currentTrack.videoId));
      })
      .catch(() => {});
  }, [currentTrack?.videoId]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  const handleFavorite = async () => {
    if (!currentTrack) return;
    try {
      if (isFav) {
        await fetch(`/api/music/favorites?videoId=${currentTrack.videoId}`, { method: 'DELETE' });
        setIsFav(false);
      } else {
        await fetch('/api/music/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentTrack),
        });
        setIsFav(true);
      }
    } catch {
      // silently fail
    }
  };

  const handleVideoPlay = () => {
    if (!currentTrack) return;
    setShowVideoPlayer(true);
  };

  const handleArtistClick = () => {
    if (!currentTrack) return;
    useMusicStore.getState().openArtistView(currentTrack.artist);
  };

  // Retry playback on error
  const handleRetry = () => {
    if (!currentTrack) return;
    setAudioError(false);
    setAudioLoading(true);
    const store = useMusicStore.getState();
    const track = store.currentTrack;
    store.playTrack(track!);
  };

  /* ====================================================================
     SEEK BAR HANDLERS
     ==================================================================== */

  const seekToTime = useCallback((time: number) => {
    const seekFn = (window as any).__weedmusicSeek;
    if (seekFn) {
      seekFn(time);
    } else {
      const audio = document.querySelector('audio');
      if (audio) audio.currentTime = time;
    }
    useMusicStore.getState().setCurrentTime(time);
  }, []);

  const handleSeekMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    if (duration && isFinite(duration)) {
      const seekTime = percent * duration;
      setIsDragging(true);
      setDragTime(seekTime);
      seekToTime(seekTime);
    }
  }, [duration, seekToTime]);

  const handleSeekHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setSeekHoverX(x);
    if (duration && isFinite(duration)) {
      setSeekHoverTime(percent * duration);
    }
  }, [duration]);

  // Handle drag movement
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      if (duration && isFinite(duration)) {
        const seekTime = percent * duration;
        setDragTime(seekTime);
        setSeekHoverX(x);
        setSeekHoverTime(seekTime);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      if (duration && isFinite(duration)) {
        const seekTime = percent * duration;
        seekToTime(seekTime);
      }
      setIsDragging(false);
      setSeekHoverTime(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, seekToTime]);

  // Touch support for seek bar
  const handleSeekTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    if (duration && isFinite(duration)) {
      const seekTime = percent * duration;
      setIsDragging(true);
      setDragTime(seekTime);
      seekToTime(seekTime);
    }
  }, [duration, seekToTime]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      if (duration && isFinite(duration)) {
        const seekTime = percent * duration;
        setDragTime(seekTime);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging && duration && isFinite(duration)) {
        seekToTime(dragTime);
      }
      setIsDragging(false);
      setSeekHoverTime(null);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, duration, dragTime, seekToTime]);

  const displayTime = isDragging ? dragTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const showLoading = isLoading || audioLoading;

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 player-3d player-fullscreen">
        <div className="flex items-center justify-center h-20 text-muted-foreground text-sm gap-2">
          <span className="weed-leaf">🌿</span>
          <p>Select a song to start playing</p>
          <span className="weed-leaf">🌿</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 player-3d player-fullscreen">
        {/* Weed grass decoration strip at very top of player */}
        <div className="relative h-2 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="grass-blade"
              style={{
                left: `${(i / 20) * 100 + Math.random() * 4}%`,
                height: `${6 + Math.random() * 8}px`,
                background: `oklch(${0.45 + Math.random() * 0.15} ${0.15 + Math.random() * 0.05} 140)`,
                animationDelay: `${Math.random() * -4}s`,
                width: `${3 + Math.random() * 3}px`,
                bottom: 0,
                position: 'absolute',
                borderRadius: '2px 2px 0 0',
                transformOrigin: 'bottom center',
              }}
            />
          ))}
        </div>

        {/* Progress/Seek Bar — 3D enhanced */}
        <div
          ref={progressRef}
          className="relative h-1.5 hover:h-3 cursor-pointer group transition-all duration-150 w-full"
          onMouseDown={handleSeekMouseDown}
          onMouseMove={handleSeekHover}
          onMouseLeave={() => { if (!isDragging) setSeekHoverTime(null); }}
          onTouchStart={handleSeekTouchStart}
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-muted/60 rounded-full" />

          {/* Buffer progress */}
          <div
            className="absolute h-full bg-muted-foreground/20 transition-all duration-300 rounded-full"
            style={{ width: `${bufferProgress * 100}%` }}
          />

          {/* Played progress — gradient glow */}
          <div
            className="absolute h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-[width] duration-100 rounded-full"
            style={{
              width: `${progressPercent}%`,
              boxShadow: '0 0 8px oklch(0.65 0.2 55 / 0.5)',
            }}
          />

          {/* Seek thumb — 3D styled */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none ring-2 ring-white dark:ring-gray-900"
            style={{
              left: `calc(${progressPercent}% - 8px)`,
              boxShadow: '0 2px 8px oklch(0.65 0.2 55 / 0.5), 0 0 0 2px white',
            }}
          />

          {/* Hover position indicator line */}
          {seekHoverTime !== null && !isDragging && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none"
              style={{ left: `${seekHoverX}px` }}
            />
          )}

          {/* Hover time preview tooltip */}
          {seekHoverTime !== null && (
            <div
              className="absolute -top-9 bg-black/85 text-white text-[11px] px-2 py-1 rounded-lg transform -translate-x-1/2 pointer-events-none z-10 font-medium tabular-nums shadow-xl border border-white/10"
              style={{ left: `${seekHoverX}px` }}
            >
              {formatTime(seekHoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 md:px-6 md:gap-4 h-[76px]">
          {/* Track Info — 3D Album Art */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-80">
            {/* 3D Thumbnail */}
            <div className="player-thumb-3d size-14 shrink-0">
              <Image
                src={currentTrack.thumbnail || '/weedmusic-logo.png'}
                alt={currentTrack.title}
                fill
                className="object-cover rounded-xl"
                unoptimized
              />
              {showLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <Loader2 className="size-4 text-orange-500 animate-spin" />
                </div>
              )}
              {audioError && (
                <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center rounded-xl">
                  <AlertCircle className="size-4 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
              <button
                onClick={handleArtistClick}
                className="text-xs text-muted-foreground truncate hover:text-orange-500 transition-colors text-left"
              >
                {currentTrack.artist}
              </button>
            </div>
            {/* Weed leaf decoration next to title */}
            <span className="weed-leaf hidden md:inline text-green-500/30 text-sm">🌿</span>
          </div>

          {/* Controls — 3D styled */}
          <div className="flex items-center justify-center gap-1 md:gap-2 flex-1">
            <Button
              onClick={toggleShuffle}
              variant="ghost"
              size="icon"
              className={`hidden md:flex size-9 ctrl-btn-3d ${shuffle ? 'active' : 'text-muted-foreground'}`}
            >
              <Shuffle className="size-4" />
            </Button>

            <Button
              onClick={prevTrack}
              variant="ghost"
              size="icon"
              className="size-10 ctrl-btn-3d text-foreground"
            >
              <SkipBack className="size-5" />
            </Button>

            {audioError ? (
              <Button
                onClick={handleRetry}
                className="size-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
                title="Retry playback"
              >
                <AlertCircle className="size-5" />
              </Button>
            ) : (
              <Button
                onClick={togglePlay}
                className="play-btn-3d-player size-12 text-white flex items-center justify-center"
              >
                {isPlaying && !showLoading ? (
                  <Pause className="size-5" />
                ) : showLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Play className="size-5 ml-0.5" />
                )}
              </Button>
            )}

            <Button
              onClick={nextTrack}
              variant="ghost"
              size="icon"
              className="size-10 ctrl-btn-3d text-foreground"
            >
              <SkipForward className="size-5" />
            </Button>

            <Button
              onClick={toggleRepeat}
              variant="ghost"
              size="icon"
              className={`hidden md:flex size-9 ctrl-btn-3d ${repeat !== 'none' ? 'active' : 'text-muted-foreground'}`}
            >
              {repeat === 'one' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </Button>
          </div>

          {/* Time & Volume & Actions */}
          <div className="hidden md:flex items-center gap-3 w-80 justify-end">
            {/* Auto-play toggle */}
            <Button
              onClick={toggleAutoPlay}
              variant="ghost"
              size="sm"
              className={`h-7 text-[10px] px-2 font-semibold tracking-wide rounded-full ${autoPlay ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground'}`}
              title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
            >
              {autoPlay ? 'AUTO' : 'MANUAL'}
            </Button>

            <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums font-mono">
              {formatTime(isDragging ? dragTime : currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center gap-1 w-24">
              <Button
                onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                variant="ghost"
                size="icon"
                className="size-7 ctrl-btn-3d"
              >
                {volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-16"
              />
            </div>

            <Button
              onClick={handleFavorite}
              variant="ghost"
              size="icon"
              className={`size-9 ctrl-btn-3d ${isFav ? 'active' : 'text-muted-foreground'}`}
            >
              <Heart className={`size-4 ${isFav ? 'fill-orange-500' : ''}`} />
            </Button>

            <Button
              onClick={handleVideoPlay}
              variant="ghost"
              size="icon"
              className="size-9 ctrl-btn-3d text-muted-foreground"
            >
              <Video className="size-4" />
            </Button>

            <Button
              onClick={() => useMusicStore.getState().setView('car')}
              variant="ghost"
              size="icon"
              className="size-9 ctrl-btn-3d text-muted-foreground"
            >
              <Car className="size-4" />
            </Button>

            <Button
              onClick={() => setShowQueue(true)}
              variant="ghost"
              size="icon"
              className="size-9 ctrl-btn-3d text-muted-foreground"
            >
              <ListMusic className="size-4" />
            </Button>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 md:hidden shrink-0">
            <Button
              onClick={handleFavorite}
              variant="ghost"
              size="icon"
              className={`size-9 ctrl-btn-3d ${isFav ? 'active' : 'text-muted-foreground'}`}
            >
              <Heart className={`size-4 ${isFav ? 'fill-orange-500' : ''}`} />
            </Button>
            <Button
              onClick={handleVideoPlay}
              variant="ghost"
              size="icon"
              className="size-9 ctrl-btn-3d text-muted-foreground"
            >
              <Video className="size-4" />
            </Button>
            <Button
              onClick={() => setShowQueue(true)}
              variant="ghost"
              size="icon"
              className="size-9 ctrl-btn-3d text-muted-foreground"
            >
              <ListMusic className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <QueueDrawer open={showQueue} onOpenChange={setShowQueue} />
    </>
  );
}
