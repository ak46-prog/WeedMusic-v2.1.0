'use client';

import { useState, useCallback } from 'react';
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
// Animated equalizer bars — GPU-only scaleY via .eq-bar class
// ---------------------------------------------------------------------------

function EqualizerBars() {
  return (
    <div className="flex gap-[3px] items-end h-4">
      <span className="eq-bar w-[3px] rounded-full bg-orange-500 h-full" />
      <span className="eq-bar w-[3px] rounded-full bg-orange-500 h-2" />
      <span className="eq-bar w-[3px] rounded-full bg-orange-500 h-3" />
      <span className="eq-bar w-[3px] rounded-full bg-orange-500 h-2.5" />
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
// Playlist data type
// ---------------------------------------------------------------------------

interface Playlist {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// TrackCard — Enterprise GPU-only, data-* attributes, macrotask offloading
// ---------------------------------------------------------------------------

interface TrackCardProps {
  track: Track;
  variant?: 'grid' | 'list' | 'artist-list';
  index?: number;
  onPlay?: () => void;
  source?: string;
}

export function TrackCard({ track, variant = 'grid', index, onPlay, source = 'unknown' }: TrackCardProps) {
  const { playTrack, addToQueue, currentTrack, isPlaying, currentTime, duration: storeDuration } = useMusicStore();
  const [isFav, setIsFav] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  const views = getViews(track);
  const viewsLabel = formatViews(views);

  // Calculate listen progress for the duration progress bar
  const listenProgress = isCurrentTrack && storeDuration > 0
    ? Math.min((currentTime / storeDuration) * 100, 100)
    : 0;

  // ---- Shared handlers ----

  // Macrotask offloading — decouples play from click event for INP
  const handlePlay = useCallback(() => {
    setTimeout(() => {
      if (onPlay) onPlay();
      else playTrack(track);
    }, 0);
  }, [onPlay, playTrack, track]);

  const handleFavorite = useCallback(async () => {
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
  }, [isFav, track]);

  const handleAddToQueue = useCallback(() => {
    addToQueue(track);
  }, [addToQueue, track]);

  const handleOpenPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/music/playlists');
      const data = await res.json();
      setPlaylists((data.playlists || []).map((p: Record<string, unknown>) => ({ id: p.id as string, name: p.name as string })));
    } catch {
      setPlaylists([]);
    }
  }, []);

  const handleAddToPlaylist = useCallback(async (playlistId: string) => {
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
  }, [track]);

  // ---- Badge component (uses stream-badge CSS) ----

  const TierBadge = ({ className = '' }: { className?: string }) =>
    track.isPaid ? (
      <span className={`stream-badge stream-badge--premium ${className}`}>
        PREMIUM
      </span>
    ) : (
      <span className={`stream-badge stream-badge--free ${className}`}>
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
        onClick={handlePlay}
        data-track-id={track.videoId}
        data-index={index}
        data-source={source}
        className={`group flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
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
            src={track.thumbnail || '/weedmusic-logo.png'}
            alt={track.title}
            fill
            className="object-cover card-thumb"
            unoptimized
          />
        </div>

        {/* Title + Artist • Views */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
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
        onClick={handlePlay}
        data-track-id={track.videoId}
        data-index={index}
        data-source={source}
        className={`track-row group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all relative ${
          isCurrentTrack
            ? 'bg-orange-50 dark:bg-orange-950/20 border-l-2 border-orange-500'
            : ''
        }`}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src={track.thumbnail || '/weedmusic-logo.png'}
            alt={track.title}
            fill
            className="object-cover card-thumb"
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
                className={`text-sm font-medium truncate ${
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
  // GRID VARIANT — Enterprise Premium Track Card (GPU-only hover)
  // =======================================================================

  return (
    <div
      onClick={handlePlay}
      data-track-id={track.videoId}
      data-index={index}
      data-source={source}
      className={`premium-track-card group relative cursor-pointer ${
        isCurrentTrack ? 'is-playing' : ''
      }`}
    >
      {/* Thumbnail with card-media-wrapper */}
      <div className="card-media-wrapper">
        <Image
          src={track.thumbnail || '/weedmusic-logo.png'}
          alt={track.title}
          fill
          className="object-cover card-thumb transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />

        {/* Play button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Play className="size-5 text-white fill-white ml-0.5" />
          </div>
        </button>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 badge-solid text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {formatDuration(track.duration)}
        </div>

        {/* FREE/PREMIUM badge */}
        <div className="absolute top-2 left-2">
          <TierBadge />
        </div>

        {/* View count badge */}
        <div className="absolute bottom-2 left-2 badge-solid text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 view-badge">
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
            className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
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
            className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
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
                  className="size-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
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
      <div className="p-0">
        <p className={`text-sm font-medium truncate ${
          isCurrentTrack ? 'text-orange-500' : ''
        }`}>
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
  );
}
