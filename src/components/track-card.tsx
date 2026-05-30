'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Heart, ListPlus, ListMusic, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
}

/** Get view count - prefer real data from API, fallback to deterministic hash */
function getViews(track: Track): number {
  if (track.views && track.views > 0) return track.views;
  // Deterministic fallback based on videoId
  let hash = 0;
  for (let i = 0; i < track.videoId.length; i++) {
    hash = ((hash << 5) - hash) + track.videoId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000000;
}

// ---------------------------------------------------------------------------
// Animated equalizer bars (used in list & artist-list variants)
// ---------------------------------------------------------------------------

function EqualizerBars() {
  return (
    <div className="flex gap-[3px] items-end h-4">
      <span className="w-[3px] rounded-full bg-orange-500 animate-eq1 h-full" />
      <span className="w-[3px] rounded-full bg-orange-500 animate-eq2 h-2" />
      <span className="w-[3px] rounded-full bg-orange-500 animate-eq3 h-3" />
      <span className="w-[3px] rounded-full bg-orange-500 animate-eq4 h-2.5" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waveform variant equalizer (uses .waveform-bar CSS class)
// ---------------------------------------------------------------------------

function WaveformBars({ paused = false }: { paused?: boolean }) {
  return (
    <div className="flex gap-[3px] items-end h-4">
      <span className={`waveform-bar ${paused ? 'paused' : ''}`} />
      <span className={`waveform-bar ${paused ? 'paused' : ''}`} />
      <span className={`waveform-bar ${paused ? 'paused' : ''}`} />
      <span className={`waveform-bar ${paused ? 'paused' : ''}`} />
      <span className={`waveform-bar ${paused ? 'paused' : ''}`} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ripple hook
// ---------------------------------------------------------------------------

function useRipple() {
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x - 10}px`;
    ripple.style.top = `${y - 10}px`;

    container.appendChild(ripple);

    // Clean up after animation
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, []);

  return { containerRef, createRipple };
}

// ---------------------------------------------------------------------------
// Playlist data type
// ---------------------------------------------------------------------------

interface Playlist {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// TrackCard
// ---------------------------------------------------------------------------

interface TrackCardProps {
  track: Track;
  variant?: 'grid' | 'list' | 'artist-list';
  index?: number;
  onPlay?: () => void;
}

export function TrackCard({ track, variant = 'grid', index, onPlay }: TrackCardProps) {
  const { playTrack, addToQueue, currentTrack, isPlaying, currentTime, duration: storeDuration } = useMusicStore();
  const [isFav, setIsFav] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const { containerRef, createRipple } = useRipple();

  // 3D tilt state for grid variant
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  const views = getViews(track);
  const viewsLabel = formatViews(views);

  // Calculate listen progress for the duration progress bar
  const listenProgress = isCurrentTrack && storeDuration > 0
    ? Math.min((currentTime / storeDuration) * 100, 100)
    : 0;

  // ---- Shared handlers ----

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      playTrack(track);
    }
  };

  const handleFavorite = async () => {
    setIsFavLoading(true);
    try {
      if (isFav) {
        await fetch(`/api/music/favorites?videoId=${track.videoId}`, { method: 'DELETE' });
        setIsFav(false);
      } else {
        await fetch('/api/music/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(track),
        });
        setIsFav(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsFavLoading(false);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(track);
  };

  const handleOpenPlaylists = async () => {
    try {
      const res = await fetch('/api/music/playlists');
      const data = await res.json();
      setPlaylists((data.playlists || []).map((p: Record<string, unknown>) => ({ id: p.id as string, name: p.name as string })));
    } catch {
      setPlaylists([]);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await fetch(`/api/music/playlists/${playlistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
      setPlaylistOpen(false);
    } catch {
      // silently fail
    }
  };

  // ---- 3D Tilt handler for grid variant ----
  const handle3DMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8; // Max 8 degrees
    const rotateY = ((x - centerX) / centerX) * 8;
    setTiltStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
    });
  }, []);

  const handle3DLeave = useCallback(() => {
    setTiltStyle({
      transform: 'rotateX(0deg) rotateY(0deg) scale(1)',
    });
  }, []);

  // ---- Badge component (uses stream-badge CSS) ----

  const TierBadge = ({ className = '' }: { className?: string }) =>
    track.isPaid ? (
      <span
        className={`stream-badge stream-badge--premium ${className}`}
      >
        PREMIUM
      </span>
    ) : (
      <span
        className={`stream-badge stream-badge--free ${className}`}
      >
        FREE
      </span>
    );

  // ---- Playlist popover (reused) ----

  const PlaylistPopover = ({ align }: { align: 'end' | 'start' }) => (
    <Popover open={playlistOpen} onOpenChange={setPlaylistOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPlaylists();
          }}
          className="size-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
        >
          <ListMusic className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align={align}>
        <p className="text-sm font-medium px-2 py-1 mb-1">Add to playlist</p>
        {playlists.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-2">
            No playlists yet. Create one in Library.
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
              >
                <ListMusic className="size-3.5 text-orange-500" />
                {pl.name}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  // =======================================================================
  // ARTIST-LIST VARIANT
  // =======================================================================

  if (variant === 'artist-list') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => {
          createRipple(e);
          handlePlay();
        }}
        className={`ripple-container group flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
          isCurrentTrack
            ? 'bg-orange-50 dark:bg-orange-950/20'
            : 'hover:bg-accent/50'
        }`}
      >
        {/* Index / Play icon */}
        <div className="w-6 text-center shrink-0">
          {isCurrentTrack && isPlaying ? (
            <WaveformBars paused={!isPlaying} />
          ) : (
            <>
              <span className="text-sm text-muted-foreground group-hover:hidden tabular-nums">
                {index !== undefined ? index + 1 : '•'}
              </span>
              <Play className="size-4 text-foreground hidden group-hover:block mx-auto" />
            </>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative shrink-0 w-10 h-10 rounded overflow-hidden">
          <Image
            src={track.thumbnail ? track.thumbnail.replace('/default.jpg', '/mqdefault.jpg') : '/weedmusic-logo.png'}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Title + Artist • Views */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[15px] font-medium truncate ${
              isCurrentTrack ? 'text-orange-500' : ''
            }`}
          >
            {track.title}
          </p>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                useMusicStore.getState().openArtistView(track.artist);
              }}
              className="hover:text-orange-500 transition-colors"
            >
              {track.artist}
            </button>
            <span className="text-muted-foreground/40">•</span>
            <Eye className="size-3 text-muted-foreground/60 shrink-0" />
            <span className="view-badge">{viewsLabel} views</span>
          </p>
        </div>

        {/* Duration */}
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatDuration(track.duration)}
        </span>
      </div>
    );
  }

  // =======================================================================
  // LIST VARIANT
  // =======================================================================

  if (variant === 'list') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => {
          createRipple(e);
          handlePlay();
        }}
        className={`ripple-container track-row group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all relative ${
          isCurrentTrack
            ? 'bg-orange-50 dark:bg-orange-950/20 border-l-2 border-orange-500'
            : ''
        }`}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src={track.thumbnail ? track.thumbnail.replace('/default.jpg', '/mqdefault.jpg') : '/weedmusic-logo.png'}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="size-4 text-white fill-white ml-0.5" />
          </button>
          {isCurrentTrack && isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <WaveformBars paused={!isPlaying} />
            </div>
          )}
        </div>

        {/* Title + Artist • Views + Badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[15px] font-medium truncate ${
                  isCurrentTrack ? 'text-orange-500' : ''
                }`}
              >
                {track.title}
              </p>
              <TierBadge />
            </div>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  useMusicStore.getState().openArtistView(track.artist);
                }}
                className="hover:text-orange-500 transition-colors"
              >
                {track.artist}
              </button>
              <span className="text-muted-foreground/40">•</span>
              <Eye className="size-3 text-muted-foreground/60 shrink-0" />
              <span className="view-badge">{viewsLabel} views</span>
            </p>
          </div>
        </div>

        {/* Duration */}
        <span className="text-xs text-muted-foreground tabular-nums shrink-0 mr-1">
          {formatDuration(track.duration)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite();
            }}
            disabled={isFavLoading}
            className="size-8"
          >
            <Heart
              className={`size-4 ${
                isFav ? 'fill-orange-500 text-orange-500' : 'text-muted-foreground'
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToQueue();
            }}
            className="size-8"
          >
            <ListPlus className="size-4 text-muted-foreground" />
          </Button>
          <div onClick={(e) => e.stopPropagation()}>
            <PlaylistPopover align="end" />
          </div>
        </div>

        {/* Duration progress bar at bottom */}
        {isCurrentTrack && listenProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted/50 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-orange-500 progress-glow transition-[width] duration-300 ease-linear rounded-b-lg"
              style={{ width: `${listenProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // =======================================================================
  // GRID VARIANT — 3D CSS DESIGN
  // =======================================================================

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        createRipple(e);
        handlePlay();
      }}
      onMouseMove={handle3DMove}
      onMouseLeave={handle3DLeave}
      className={`card-3d group relative rounded-xl overflow-visible cursor-pointer ${
        isCurrentTrack ? 'ring-2 ring-orange-500 rounded-xl' : ''
      }`}
    >
      {/* 3D Depth Shadow */}
      <div className="card-3d-shadow" />

      {/* Card Inner — receives 3D transforms */}
      <div
        className="card-3d-inner rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm"
        style={tiltStyle}
      >
        {/* Thumbnail with 3D depth */}
        <div className="thumb-3d relative aspect-square w-full overflow-hidden">
          <Image
            src={track.thumbnail ? track.thumbnail.replace('/default.jpg', '/mqdefault.jpg') : '/weedmusic-logo.png'}
            alt={track.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
          />

          {/* 3D Shine/Reflection sweep on hover */}
          <div className="thumb-3d-shine" />

          {/* Play button overlay with 3D depth */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="play-btn-3d absolute inset-0 bg-black/30 flex items-center justify-center"
          >
            <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 pulse-glow">
              <Play className="size-5 text-white fill-white ml-0.5" />
            </div>
          </button>

          {/* Duration badge with 3D float */}
          <div className="badge-3d absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
            {formatDuration(track.duration)}
          </div>

          {/* FREE/PREMIUM badge with 3D float */}
          <div className="badge-3d absolute top-2 left-2">
            <TierBadge />
          </div>

          {/* View count badge with 3D float */}
          <div className="badge-3d absolute bottom-2 left-2 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 view-badge backdrop-blur-sm">
            <Eye className="size-3" />
            {viewsLabel}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite();
              }}
              className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
              disabled={isFavLoading}
            >
              <Heart
                className={`size-3.5 ${
                  isFav ? 'fill-orange-500 text-orange-500' : 'text-white'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToQueue();
              }}
              className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <ListPlus className="size-3.5 text-white" />
            </button>
            <div onClick={(e) => e.stopPropagation()}>
              <Popover open={playlistOpen} onOpenChange={setPlaylistOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPlaylists();
                    }}
                    className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm"
                  >
                    <ListMusic className="size-3.5 text-white" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <p className="text-xs font-medium px-2 py-1 mb-1">Add to playlist</p>
                  {playlists.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground px-2 py-1">
                      No playlists yet
                    </p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id)}
                          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          <ListMusic className="size-3 text-orange-500" />
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p
            className={`text-[15px] font-medium truncate ${
              isCurrentTrack ? 'text-orange-500' : ''
            }`}
          >
            {track.title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
            {track.artist}
            <span className="text-muted-foreground/40">•</span>
            <Eye className="size-3 text-muted-foreground/60 shrink-0" />
            <span className="view-badge">{viewsLabel} views</span>
          </p>
        </div>
      </div>
    </div>
  );
}
