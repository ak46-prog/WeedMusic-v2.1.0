'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Heart,
  Clock,
  ListMusic,
  Plus,
  Trash2,
  Bookmark,
  Sparkles,
  Play,
  Eye,
  Shuffle,
  Search,
  Headphones,
  X,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

interface Playlist {
  id: string;
  name: string;
  description: string;
  items: { track: Track; position: number }[];
  createdAt: string;
}

function formatViews(views?: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return `${views}`;
}

export function LibraryView() {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingFav, setLoadingFav] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [loadingPlay, setLoadingPlay] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('playlists');
  const [removingAllFav, setRemovingAllFav] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const { playQueue, currentTrack, isPlaying } = useMusicStore();

  useEffect(() => {
    fetchFavorites();
    fetchHistory();
    fetchPlaylists();
  }, []);

  const fetchFavorites = async () => {
    setLoadingFav(true);
    try {
      const res = await fetch('/api/music/favorites');
      const data = await res.json();
      setFavorites(data.items || []);
    } catch {
      setFavorites([]);
    } finally {
      setLoadingFav(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHist(true);
    try {
      const res = await fetch('/api/music/history');
      const data = await res.json();
      setHistory(data.items || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  };

  const fetchPlaylists = async () => {
    setLoadingPlay(true);
    try {
      const res = await fetch('/api/music/playlists');
      const data = await res.json();
      setPlaylists(data.playlists || []);
    } catch {
      setPlaylists([]);
    } finally {
      setLoadingPlay(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await fetch('/api/music/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
      fetchPlaylists();
    } catch {
      // silently fail
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      await fetch(`/api/music/playlists/${id}`, { method: 'DELETE' });
      if (expandedPlaylist === id) setExpandedPlaylist(null);
      fetchPlaylists();
    } catch {
      // silently fail
    }
  };

  const playAll = (tracks: Track[]) => {
    if (tracks.length > 0) {
      playQueue(tracks, 0);
    }
  };

  const shufflePlay = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  const handleRemoveAllFavorites = async () => {
    setRemovingAllFav(true);
    try {
      // Delete each favorite using the existing API
      await Promise.all(
        favorites.map((track) =>
          fetch(`/api/music/favorites?videoId=${track.videoId}`, { method: 'DELETE' }).catch(() => {})
        )
      );
      setFavorites([]);
    } catch {
      // silently fail
    } finally {
      setRemovingAllFav(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      // Clear history locally (API doesn't have bulk delete)
      setHistory([]);
    } catch {
      // silently fail
    } finally {
      setClearingHistory(false);
    }
  };

  const navigateToSearch = () => {
    useMusicStore.getState().setView('search');
  };

  const favCount = favorites.length;
  const histCount = history.length;
  const totalViews = history.reduce((sum, t) => sum + (t.views || 0), 0);

  // Calculate total listening time from history
  const totalListeningSeconds = history.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalListeningTime = formatDuration(totalListeningSeconds);

  // Recently played: first 4 from history
  const recentlyPlayed = history.slice(0, 4);

  // Episodes for Later placeholder (empty state always shown for now)
  const episodesForLater: Track[] = [];

  const quickAccessItems = [
    {
      label: 'Liked Music',
      icon: Heart,
      count: favCount,
      countLabel: favCount === 1 ? 'song' : 'songs',
      bgClass: 'bg-gradient-to-br from-orange-500 to-orange-600',
      iconClass: 'text-white',
      textClass: 'text-white',
      onClick: () => setActiveTab('favorites'),
      views: null,
    },
    {
      label: 'Recently Played',
      icon: Clock,
      count: histCount,
      countLabel: histCount === 1 ? 'track' : 'tracks',
      bgClass: 'bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700',
      iconClass: 'text-slate-200',
      textClass: 'text-white',
      onClick: () => setActiveTab('history'),
      views: totalViews,
    },
    {
      label: 'Episodes for Later',
      icon: Bookmark,
      count: 0,
      countLabel: 'Coming soon',
      bgClass: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      iconClass: 'text-emerald-100',
      textClass: 'text-white',
      onClick: () => {},
      views: null,
    },
    {
      label: 'Auto Playlist',
      icon: Sparkles,
      count: 0,
      countLabel: 'Coming soon',
      bgClass: 'bg-gradient-to-br from-violet-600 to-violet-700',
      iconClass: 'text-violet-100',
      textClass: 'text-white',
      onClick: () => {},
      views: null,
    },
  ];

  return (
    <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
      {/* Library Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {favCount + histCount} items • {formatViews(totalViews)} total plays
            {totalListeningSeconds > 0 && (
              <>
                <span className="text-muted-foreground/40"> • </span>
                <Headphones className="inline size-3 text-muted-foreground/60 mr-0.5" />
                {totalListeningTime} listened
              </>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowCreatePlaylist(!showCreatePlaylist)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shadow-sm"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New playlist</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Recently Played Section - Large Cards */}
      {!loadingHist && recentlyPlayed.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="size-5 text-orange-500" />
              Recently Played
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('history')}
              className="text-xs text-orange-500 hover:text-orange-600 h-7 px-2"
            >
              View all
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentlyPlayed.map((track, idx) => {
              const isCurrent = currentTrack?.videoId === track.videoId;
              return (
                <button
                  key={`${track.videoId}-${idx}`}
                  onClick={() => useMusicStore.getState().playTrack(track)}
                  className={`card-hover glass-card group rounded-xl overflow-hidden text-left transition-all ${
                    isCurrent ? 'ring-2 ring-orange-500' : ''
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Image
                      src={track.thumbnail || '/weedmusic-logo.png'}
                      alt={track.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <Play className="size-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Playing indicator */}
                    {isCurrent && isPlaying && (
                      <div className="absolute top-2 right-2 flex gap-[2px] items-end h-3 bg-black/50 rounded-full px-1.5 py-1">
                        <span className="w-[2px] bg-orange-400 rounded-full animate-eq1 h-3" />
                        <span className="w-[2px] bg-orange-400 rounded-full animate-eq2 h-2" />
                        <span className="w-[2px] bg-orange-400 rounded-full animate-eq3 h-2.5" />
                      </div>
                    )}
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {formatDuration(track.duration)}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-orange-500' : ''}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Episodes for Later Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bookmark className="size-5 text-emerald-500" />
            Episodes for Later
          </h2>
        </div>
        {episodesForLater.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {episodesForLater.map((track, idx) => (
              <button
                key={`${track.videoId}-${idx}`}
                onClick={() => useMusicStore.getState().playTrack(track)}
                className="card-hover glass-card group rounded-xl overflow-hidden text-left transition-all"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={track.thumbnail || '/weedmusic-logo.png'}
                    alt={track.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
              <Bookmark className="size-7 text-emerald-400 dark:text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-foreground">Save podcasts and episodes here</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Bookmark your favorite episodes to listen later
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToSearch}
              className="mt-3 gap-1.5 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <Search className="size-3.5" />
              Find podcasts
            </Button>
          </div>
        )}
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {quickAccessItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${item.bgClass} rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] group card-hover`}
            >
              <Icon className={`size-6 ${item.iconClass} mb-3 group-hover:scale-110 transition-transform`} />
              <p className={`text-sm font-semibold ${item.textClass} truncate`}>{item.label}</p>
              <p className={`text-xs ${item.textClass} opacity-70 mt-0.5 flex items-center gap-1`}>
                {item.count > 0 ? `${item.count} ${item.countLabel}` : item.countLabel}
                {item.views != null && item.views > 0 && (
                  <>
                    <span className="opacity-40">•</span>
                    <Eye className="size-3 opacity-60" />
                    {formatViews(item.views)}
                  </>
                )}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto mb-6 bg-transparent border-b rounded-none p-0 h-auto gap-0">
          <TabsTrigger
            value="playlists"
            className="relative px-4 py-2.5 rounded-none text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            <ListMusic className="size-4 mr-1.5" />
            Playlists
            {playlists.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {playlists.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="relative px-4 py-2.5 rounded-none text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heart className="size-4 mr-1.5" />
            Favorites
            {favCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {favCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="relative px-4 py-2.5 rounded-none text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="size-4 mr-1.5" />
            History
            {histCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {histCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="mt-0">
          {showCreatePlaylist && (
            <div className="mb-6 p-4 rounded-xl border border-dashed border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <p className="text-sm font-medium mb-3 text-orange-700 dark:text-orange-400">Create new playlist</p>
              <div className="flex gap-2">
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Give your playlist a name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createPlaylist();
                    if (e.key === 'Escape') {
                      setShowCreatePlaylist(false);
                      setNewPlaylistName('');
                    }
                  }}
                  className="h-10 flex-1 bg-white dark:bg-background"
                  autoFocus
                />
                <Button
                  onClick={createPlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setShowCreatePlaylist(false);
                    setNewPlaylistName('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loadingPlay ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 mt-3" />
                  <Skeleton className="h-3 w-1/2 mt-1.5" />
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ListMusic className="size-10 opacity-40" />
              </div>
              <p className="text-lg font-semibold">No playlists yet</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">Create a playlist to organize your music and listen anytime</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
                <Button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                >
                  <Plus className="size-4" />
                  Create your first playlist
                </Button>
                <Button
                  variant="outline"
                  onClick={navigateToSearch}
                  className="gap-1.5"
                >
                  <Search className="size-4" />
                  Find songs to add
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {playlists.map((playlist) => {
                const trackCount = playlist.items?.length || 0;
                const isExpanded = expandedPlaylist === playlist.id;
                const firstThumb = playlist.items?.[0]?.track?.thumbnail;

                return (
                  <div key={playlist.id} className="col-span-2 sm:col-span-1">
                    <div
                      className={`card-lift group rounded-xl overflow-hidden border bg-card shadow-sm cursor-pointer ${
                        isExpanded ? 'ring-2 ring-orange-500' : ''
                      }`}
                      onClick={() => setExpandedPlaylist(isExpanded ? null : playlist.id)}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/20">
                        {firstThumb ? (
                          <img src={firstThumb} alt={playlist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ListMusic className="size-12 text-orange-400 dark:text-orange-600 opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                          <Badge className="bg-black/60 text-white border-0 text-[11px] backdrop-blur-sm">
                            {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (trackCount > 0) playAll(playlist.items.map((i) => i.track));
                            }}
                            className="size-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                          >
                            <Play className="size-4 text-white fill-white ml-0.5" />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlaylist(playlist.id);
                            }}
                            className="size-8 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center backdrop-blur-sm transition-colors"
                          >
                            <Trash2 className="size-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          Playlist • {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                          {trackCount > 0 && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <Eye className="size-3 text-muted-foreground/60" />
                              <span className="view-badge">{formatViews(trackCount * 1200)}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {isExpanded && trackCount > 0 && (
                      <div className="mt-2 rounded-xl border bg-card/50 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-accent/30">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Tracks
                          </p>
                          <Button
                            onClick={() => playAll(playlist.items.map((i) => i.track))}
                            size="sm"
                            className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1"
                          >
                            <Play className="size-3 fill-white" />
                            Play all
                          </Button>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                          {playlist.items.map((item, idx) => (
                            <TrackCard key={`${item.track.videoId}-${idx}`} track={item.track} variant="list" />
                          ))}
                        </div>
                      </div>
                    )}

                    {isExpanded && trackCount === 0 && (
                      <div className="mt-2 rounded-xl border bg-card/50 overflow-hidden p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-2">This playlist is empty</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToSearch();
                          }}
                          className="text-xs gap-1"
                        >
                          <Search className="size-3" />
                          Add songs from search
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="mt-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                <Heart className="size-5 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Liked Music</h2>
                {favCount > 0 && (
                  <p className="text-xs text-muted-foreground">{favCount} {favCount === 1 ? 'song' : 'songs'}</p>
                )}
              </div>
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => shufflePlay(favorites)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shadow-sm"
                >
                  <Shuffle className="size-3.5" />
                  <span className="hidden sm:inline">Shuffle</span>
                </Button>
                <Button
                  onClick={() => playAll(favorites)}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shadow-sm"
                >
                  <Play className="size-3.5 fill-white" />
                  Play All
                </Button>
                <Button
                  onClick={handleRemoveAllFavorites}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={removingAllFav}
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">{removingAllFav ? 'Removing...' : 'Remove all'}</span>
                </Button>
              </div>
            )}
          </div>

          {loadingFav ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-12 rounded shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Heart className="size-10 opacity-40" />
              </div>
              <p className="text-lg font-semibold">No liked music yet</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">Tap the heart icon on any song to save it here</p>
              <Button
                variant="outline"
                onClick={navigateToSearch}
                className="mt-4 gap-1.5"
              >
                <Search className="size-4" />
                Discover music
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 max-h-[65vh] overflow-y-auto pr-1 stagger-list">
              {favorites.map((track, idx) => (
                <TrackCard key={`${track.videoId}-${idx}`} track={track} variant="list" />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 flex items-center justify-center shadow-sm">
                <Clock className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Recently Played</h2>
                {histCount > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {histCount} {histCount === 1 ? 'track' : 'tracks'}
                    {totalListeningSeconds > 0 && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <Headphones className="size-3 text-muted-foreground/60" />
                        {totalListeningTime} listened
                      </>
                    )}
                    {totalViews > 0 && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <Eye className="size-3 text-muted-foreground/60" />
                        {formatViews(totalViews)} plays
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => playAll(history)}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 shadow-sm"
                >
                  <Play className="size-3.5 fill-white" />
                  Play All
                </Button>
                <Button
                  onClick={handleClearHistory}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={clearingHistory}
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">{clearingHistory ? 'Clearing...' : 'Clear history'}</span>
                </Button>
              </div>
            )}
          </div>

          {loadingHist ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-12 rounded shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="size-10 opacity-40" />
              </div>
              <p className="text-lg font-semibold">No listening history</p>
              <p className="text-sm mt-1 max-w-xs mx-auto">Play some music and it will show up here</p>
              <Button
                variant="outline"
                onClick={navigateToSearch}
                className="mt-4 gap-1.5"
              >
                <Search className="size-4" />
                Start listening
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5 max-h-[65vh] overflow-y-auto pr-1 stagger-list">
              {history.map((track, idx) => (
                <TrackCard key={`${track.videoId}-${idx}`} track={track} variant="list" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
