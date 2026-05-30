'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { SmartThumbnail } from '@/components/music-icon-fallback';
import { ArrowLeft, Share2, Video, MoreHorizontal, Play, Pause, ListMusic, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) {
    return (count / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

function simulateViews(index: number): number {
  const seeds = [4400000, 355000, 3900, 1200000, 89000, 7800000, 45000, 2300000, 12000, 560000, 3400000, 890000, 220000, 67000, 1500000, 420000, 11000, 980000, 5400, 310000];
  return seeds[index % seeds.length];
}

export function ArtistView() {
  const { currentArtist, setCurrentArtist, setView, view, playTrack, playQueue, currentTrack, isPlaying, togglePlay } = useMusicStore();
  const [fetchedTracks, setFetchedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Merge artist tracks with fetched tracks, dedup by videoId
  const artistTracks = currentArtist?.tracks || [];
  const allTracksMap = new Map<string, Track>();

  // Add fetched tracks first
  for (const t of fetchedTracks) {
    allTracksMap.set(t.videoId, t);
  }
  // Override/add with artist tracks (they take priority)
  for (const t of artistTracks) {
    allTracksMap.set(t.videoId, t);
  }

  const allTracks = Array.from(allTracksMap.values());

  const fetchArtistTracks = useCallback(async (artistName: string, existingTrackCount: number) => {
    if (!artistName) return;

    if (existingTrackCount < 5) {
      setLoading(true);
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(artistName)}`);
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setFetchedTracks(
            data.items.map((item: Track, idx: number) => ({
              ...item,
              views: item.views || simulateViews(idx),
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    } else {
      // Use artist tracks with simulated view counts
      const tracks = useMusicStore.getState().currentArtist?.tracks || [];
      setFetchedTracks(
        tracks.map((t, idx) => ({
          ...t,
          views: t.views || simulateViews(idx),
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (!currentArtist?.name) return;
    fetchArtistTracks(currentArtist.name, artistTracks.length);
  }, [currentArtist?.name, fetchArtistTracks, artistTracks.length]);

  const handleBack = () => {
    setCurrentArtist(null);
    setView('home');
  };

  const handlePlayTrack = (track: Track, index: number) => {
    playQueue(allTracks, index);
  };

  const handlePlayAll = () => {
    if (allTracks.length > 0) {
      playQueue(allTracks, 0);
    }
  };

  // Generate placeholder playlists based on artist name
  const playlists = currentArtist?.playlists?.length
    ? currentArtist.playlists
    : generatePlaceholderPlaylists(currentArtist?.name || 'Artist');

  const bannerImage = currentArtist?.banner || currentArtist?.avatar || (artistTracks[0]?.thumbnail) || '';
  const subscriberCount = currentArtist?.subscribers || '383K';

  if (!currentArtist) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
        <p>No artist selected</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Back button - sticky */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 py-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="size-9 shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="text-sm font-medium truncate">{currentArtist.name}</span>
      </div>

      {/* Artist Header / Banner */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden">
        {bannerImage ? (
          <Image
            src={bannerImage}
            alt={currentArtist.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-600 via-amber-600 to-red-700" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Avatar & Name */}
        <div className="absolute bottom-4 left-4 md:left-6 flex items-end gap-4">
          {currentArtist.avatar ? (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-background shadow-lg shrink-0">
              <Image
                src={currentArtist.avatar}
                alt={currentArtist.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 border-4 border-background shadow-lg shrink-0 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold text-white">
                {currentArtist.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="pb-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">
              {currentArtist.name}
            </h1>
            {currentArtist.description && (
              <p className="text-sm text-white/80 line-clamp-1 max-w-md">{currentArtist.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Subscribe & Action Buttons */}
      <div className="px-4 md:px-6 py-4 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setSubscribed(!subscribed)}
          className={`gap-2 font-semibold rounded-full px-6 ${
            subscribed
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          <UserPlus className="size-4" />
          {subscribed ? 'Subscribed' : 'Subscribe'}
          <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0">
            {subscriberCount}
          </Badge>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={handlePlayAll}
        >
          <Play className="size-4 fill-current" />
          Play All
        </Button>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-9 rounded-full">
            <Share2 className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-9 rounded-full">
            <Video className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-9 rounded-full">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Videos/Songs Section */}
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Video className="size-5 text-orange-500" />
            Videos & Songs
          </h2>
          {allTracks.length > 0 && (
            <span className="text-sm text-muted-foreground">{allTracks.length} tracks</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-16 h-10 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))}
          </div>
        ) : allTracks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="size-10 mx-auto mb-3 opacity-30" />
            <p>No tracks found for this artist</p>
          </div>
        ) : (
          <div className="space-y-0.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {allTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.videoId === track.videoId;
              const viewCount = track.views || simulateViews(index);

              return (
                <div
                  key={track.videoId}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-accent group cursor-pointer ${
                    isCurrentTrack
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-l-2 border-orange-500'
                      : ''
                  }`}
                  onClick={() => handlePlayTrack(track, index)}
                >
                  {/* Index / Play indicator */}
                  <div className="w-6 text-center shrink-0">
                    {isCurrentTrack && isPlaying ? (
                      <div className="flex gap-0.5 items-end h-4 justify-center">
                        <div className="w-0.5 bg-orange-500 animate-pulse h-full" />
                        <div className="w-0.5 bg-orange-500 animate-pulse h-2.5" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 bg-orange-500 animate-pulse h-full" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : isCurrentTrack ? (
                      <Pause className="size-3.5 text-orange-500 mx-auto" />
                    ) : (
                      <span className="text-xs text-muted-foreground group-hover:hidden">
                        {index + 1}
                      </span>
                    )}
                    {!isCurrentTrack && (
                      <Play className="size-3.5 text-orange-500 mx-auto hidden group-hover:block" />
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                    <SmartThumbnail
                      src={track.thumbnail}
                      alt={track.title}
                      videoId={track.videoId}
                      className="object-cover w-full h-full"
                      size="mini"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Play className="size-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-medium px-1 py-0 rounded-sm">
                      {formatDuration(track.duration)}
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-orange-500' : ''}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist}
                      {viewCount > 0 && (
                        <>
                          {' \u2022 '}
                          {formatViewCount(viewCount)} views
                        </>
                      )}
                    </p>
                  </div>

                  {/* Currently playing indicator */}
                  {isCurrentTrack && isPlaying && (
                    <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0 border-0 shrink-0">
                      PLAYING
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Playlists Section */}
      <div className="px-4 md:px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ListMusic className="size-5 text-orange-500" />
            Playlists
          </h2>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListMusic className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No playlists available</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="shrink-0 w-40 sm:w-48 group cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                  <Image
                    src={playlist.thumbnail || '/zmusic-logo.png'}
                    alt={playlist.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                  {/* Playlist overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="size-10 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg">
                      <Play className="size-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Track count badge */}
                  {playlist.trackCount > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ListMusic className="size-3" />
                      {playlist.trackCount}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{playlist.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Playlist • {currentArtist.name}
                  {playlist.views && (
                    <>
                      {' \u2022 '}
                      {playlist.views}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artist description (if available) */}
      {currentArtist.description && (
        <div className="px-4 md:px-6 mt-6">
          <div className="p-4 rounded-xl bg-accent/50 border">
            <h3 className="text-sm font-semibold mb-1">About {currentArtist.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {currentArtist.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePlaceholderPlaylists(artistName: string) {
  const playlistNames = [
    'Top Hits',
    'Latest Releases',
    'Fan Favorites',
    'Acoustic Mix',
    'Live Sessions',
    'Deep Cuts',
    'Collaborations',
    'Essential',
  ];

  return playlistNames.slice(0, 6).map((name, i) => ({
    id: `pl-${i}`,
    name: `${name}`,
    thumbnail: '',
    trackCount: Math.floor(Math.random() * 40) + 10,
    views: formatViewCount(simulateViews(i + 3)),
  }));
}
