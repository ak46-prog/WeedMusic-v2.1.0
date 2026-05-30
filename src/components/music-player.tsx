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
     SEEK BAR HANDLERS — Enhanced for instant hover-to-seek
     ==================================================================== */

  const seekToTime = useCallback((time: number) => {
    const seekFn = (window as any).__weedmusicSeek;
    if (seekFn) {
      seekFn(time);
    } else {
      // Fallback: directly set audio element
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
      <div className="fixed bottom-0 left-0 right-0 z-40 player-glass-3d">
        <div className="flex items-center justify-center h-20 text-white/70 text-sm">
          <span className="mr-2 text-lg">🌿</span>
          <p>Select a song to start playing</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 player-glass-3d">
        {/* Grass Blade Strip — decorative */}
        <div className="grass-blade-strip" />

        {/* Progress/Seek Bar — Enhanced with 3D glow */}
        <div
          ref={progressRef}
          className="seek-bar-3d relative h-1.5 hover:h-3 cursor-pointer group transition-all duration-150 w-full"
          style={{ '--seek-progress': `${progressPercent}%` } as React.CSSProperties}
          onMouseDown={handleSeekMouseDown}
          onMouseMove={handleSeekHover}
          onMouseLeave={() => { if (!isDragging) setSeekHoverTime(null); }}
          onTouchStart={handleSeekTouchStart}
        >
          {/* Background track */}
          <div className="absolute inset-0 bg-white/10" />

          {/* Buffer progress — visible for both audio and youtube modes */}
          <div
            className="absolute h-full bg-white/15 transition-all duration-300 rounded-r-full"
            style={{ width: `${bufferProgress * 100}%` }}
          />

          {/* Played progress — green to orange gradient */}
          <div
            className="absolute h-full bg-gradient-to-r from-green-500 to-orange-500 transition-[width] duration-100 rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Seek thumb — always visible on hover/drag, larger touch target */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-4 bg-gradient-to-r from-green-500 to-orange-500 rounded-full shadow-lg shadow-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-2 ring-white dark:ring-gray-900"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
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
              className="absolute -top-9 bg-black/85 text-white text-[11px] px-2 py-1 rounded-md transform -translate-x-1/2 pointer-events-none z-10 font-medium tabular-nums shadow-lg"
              style={{ left: `${seekHoverX}px` }}
            >
              {formatTime(seekHoverTime)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:gap-4 h-[72px]">
          {/* Track Info — 3D Album Art */}
          <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-none md:w-72">
            <div className="player-album-3d">
              <div className="album-art-inner relative size-12 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={currentTrack.thumbnail || '/weedmusic-logo.png'}
                  alt={currentTrack.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {showLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-4 text-green-500 animate-spin" />
                  </div>
                )}
                {audioError && (
                  <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                    <AlertCircle className="size-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-white">
                🌿 {currentTrack.title}
              </p>
              <button
                onClick={handleArtistClick}
                className="text-xs text-white/60 truncate hover:text-green-400 transition-colors text-left"
              >
                {currentTrack.artist}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-1 md:gap-2 flex-1">
            <Button
              onClick={toggleShuffle}
              variant="ghost"
              size="icon"
              className={`control-lift hidden md:flex size-8 ${shuffle ? 'text-green-500' : 'text-white/50'}`}
            >
              <Shuffle className="size-4" />
            </Button>

            <Button
              onClick={prevTrack}
              variant="ghost"
              size="icon"
              className="control-lift size-9 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipBack className="size-4" />
            </Button>

            {audioError ? (
              <Button
                onClick={handleRetry}
                className="size-10 rounded-full bg-red-500 hover:bg-red-600 text-white"
                title="Retry playback"
              >
                <AlertCircle className="size-5" />
              </Button>
            ) : (
              <Button
                onClick={togglePlay}
                className="size-10 rounded-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-400 hover:to-orange-400 text-white shadow-lg shadow-green-500/30 transition-shadow hover:shadow-green-500/50"
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
              className="control-lift size-9 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipForward className="size-4" />
            </Button>

            <Button
              onClick={toggleRepeat}
              variant="ghost"
              size="icon"
              className={`control-lift hidden md:flex size-8 ${repeat !== 'none' ? 'text-green-500' : 'text-white/50'}`}
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
              className={`h-7 text-[10px] px-2 font-semibold tracking-wide ${autoPlay ? 'text-green-500' : 'text-white/40'}`}
              title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
            >
              {autoPlay ? 'AUTO' : 'MANUAL'}
            </Button>

            <span className="text-xs text-white/50 whitespace-nowrap tabular-nums">
              {formatTime(isDragging ? dragTime : currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex items-center gap-1 w-24">
              <Button
                onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                variant="ghost"
                size="icon"
                className="size-7 text-white/60 hover:text-green-400"
              >
                {volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-16 [&_[role=slider]]:bg-green-500"
              />
            </div>

            <Button
              onClick={handleFavorite}
              variant="ghost"
              size="icon"
              className={`size-8 ${isFav ? 'text-green-500' : 'text-white/50'}`}
            >
              <Heart className={`size-4 ${isFav ? 'fill-green-500' : ''}`} />
            </Button>

            <Button
              onClick={handleVideoPlay}
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-green-400"
            >
              <Video className="size-4" />
            </Button>

            <Button
              onClick={() => useMusicStore.getState().setView('car')}
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-green-400"
            >
              <Car className="size-4" />
            </Button>

            <Button
              onClick={() => setShowQueue(true)}
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-green-400"
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
              className={`size-8 ${isFav ? 'text-green-500' : 'text-white/50'}`}
            >
              <Heart className={`size-4 ${isFav ? 'fill-green-500' : ''}`} />
            </Button>
            <Button
              onClick={handleVideoPlay}
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-green-400"
            >
              <Video className="size-4" />
            </Button>
            <Button
              onClick={() => setShowQueue(true)}
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-green-400"
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
