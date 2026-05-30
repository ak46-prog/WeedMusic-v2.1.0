'use client';

import { useEffect, useState, useCallback } from 'react';
import { SmartThumbnail } from '@/components/music-icon-fallback';
import { Baby, Play, Shield, ArrowLeft, RefreshCw, Music, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

// Kids rhyme categories with search queries
const KIDS_CATEGORIES = [
  { id: 'nursery', label: 'Nursery Rhymes', emoji: '🎵', query: 'nursery rhymes kids' },
  { id: 'lullaby', label: 'Lullabies', emoji: '🌙', query: 'lullaby songs kids sleep' },
  { id: 'action', label: 'Action Songs', emoji: '🕺', query: 'action songs kids dance' },
  { id: 'animal', label: 'Animal Songs', emoji: '🦁', query: 'animal songs kids' },
  { id: 'abc', label: 'ABC & Numbers', emoji: '🔤', query: 'abc numbers songs kids learning' },
  { id: 'fun', label: 'Fun & Play', emoji: '🎉', query: 'fun kids songs play' },
];

export function KidsMode() {
  const { setView, playQueue, playTrack } = useMusicStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('nursery');
  const [shuffleAnim, setShuffleAnim] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const fetchKidsContent = useCallback(async (category?: string) => {
    setLoading(true);
    setShuffleAnim(true);
    try {
      const cat = KIDS_CATEGORIES.find(c => c.id === (category || activeCategory));
      const query = cat?.query || 'nursery rhymes kids';
      const res = await fetch(`/api/music/kids?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      // Shuffle the results for random feel
      const shuffled = [...(data.items || [])].sort(() => Math.random() - 0.5);
      setTracks(shuffled);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
      setTimeout(() => setShuffleAnim(false), 600);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchKidsContent();
  }, [activeCategory]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setCurrentPlaying(null);
  };

  const handleShuffle = () => {
    fetchKidsContent(activeCategory);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  };

  // Macrotask offloading for play handlers
  const handlePlayTrack = useCallback((track: Track, index: number) => {
    setTimeout(() => {
      setCurrentPlaying(track.videoId);
      playQueue(tracks, index);
    }, 0);
  }, [playQueue, tracks]);

  const handleRandomRhyme = useCallback(() => {
    if (tracks.length === 0) return;
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      const track = tracks[randomIdx];
      setCurrentPlaying(track.videoId);
      playTrack(track);
    }, 0);
  }, [tracks, playTrack]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Kids Mode Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-green-50/95 via-yellow-50/95 to-pink-50/95 dark:from-green-950/95 dark:via-yellow-950/95 dark:to-pink-950/95 backdrop-blur-xl border-b-4 border-green-400/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Baby className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-500 dark:from-green-300 dark:to-green-400 bg-clip-text text-transparent">
                Kids Mode
              </h1>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Shield className="size-3" />
                Safe content only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm shadow-green-500/25">
              <Star className="size-3 mr-1" />
              Kid Safe
            </Badge>
            <Button
              onClick={() => setView('home')}
              variant="outline"
              size="sm"
              className="border-green-400/50 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/30"
            >
              <ArrowLeft className="size-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {KIDS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`category-chip kids-category-chip ${activeCategory === cat.id ? 'active' : ''}`}
              style={activeCategory !== cat.id ? {
                background: 'oklch(0.97 0.05 140 / 0.4)',
                color: 'oklch(0.3 0.05 140)',
                borderColor: 'oklch(0.9 0.05 140)',
              } : {}}
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
              <Music className="size-5" />
              {KIDS_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Songs for Kids'}
            </h2>
            <Sparkles className="size-5 text-yellow-500" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRandomRhyme}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-2xl shadow-lg shadow-pink-500/25"
              size="sm"
            >
              <Sparkles className="size-4 mr-1" />
              Random
            </Button>
            <Button
              onClick={handleShuffle}
              variant="outline"
              size="sm"
              className="border-green-400/50 text-green-700 dark:text-green-300 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/30"
            >
              <RefreshCw className={`size-4 mr-1 ${shuffleAnim ? 'animate-spin' : ''}`} />
              Shuffle
            </Button>
            <Button
              onClick={handlePlayAll}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg shadow-green-500/25"
              size="sm"
            >
              <Play className="size-4 mr-1 fill-current" />
              Play All
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-list">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="premium-track-card">
                <div className="skeleton-shimmer aspect-square w-full rounded-lg" />
                <div className="p-3">
                  <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
                  <div className="skeleton-shimmer h-3 w-1/2 mt-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Track Cards Grid — Enterprise Premium Track Card */
          <div className="enterprise-track-matrix stagger-list">
            {tracks.map((track, index) => {
              const isPlaying = currentPlaying === track.videoId;
              return (
                <div
                  key={track.videoId}
                  onClick={() => handlePlayTrack(track, index)}
                  data-track-id={track.videoId}
                  data-index={index}
                  data-source="kids"
                  className={`kids-track-card group ${isPlaying ? 'is-playing' : ''} ${shuffleAnim ? 'animate-slide-up' : ''}`}
                >
                  {/* SAFE Ribbon */}
                  <div className="absolute top-2 left-0 z-5 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold tracking-wide rounded-r" style={{ fontSize: '0.6rem' }}>SAFE</div>

                  {/* Thumbnail */}
                  <div className="card-media-wrapper">
                    <SmartThumbnail
                      src={track.thumbnail}
                      alt={track.title}
                      videoId={track.videoId}
                      className={`object-cover w-full h-full card-thumb transition-transform duration-500 group-hover:scale-110 ${isPlaying ? 'scale-105' : ''}`}
                      size="full"
                    />

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="size-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        {isPlaying ? (
                          <div className="flex gap-[3px] items-end h-4">
                            <span className="eq-bar w-[3px] rounded-full bg-white h-full" />
                            <span className="eq-bar w-[3px] rounded-full bg-white h-2" />
                            <span className="eq-bar w-[3px] rounded-full bg-white h-3" />
                            <span className="eq-bar w-[3px] rounded-full bg-white h-2.5" />
                          </div>
                        ) : (
                          <Play className="size-6 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {track.duration > 0 && (
                      <div className="absolute bottom-2 right-2 badge-solid text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {formatDuration(track.duration)}
                      </div>
                    )}

                    {/* Now Playing Glow */}
                    {isPlaying && (
                      <div className="absolute inset-0 border-2 border-green-400 rounded-lg pointer-events-none animate-playing-pulse" />
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="p-0">
                    <p className={`text-sm font-semibold truncate ${isPlaying ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                      <span className="truncate">{track.artist}</span>
                    </p>
                    {isPlaying && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex gap-[2px] items-end h-3">
                          <span className="eq-bar w-[2px] rounded-full bg-green-500 h-full" />
                          <span className="eq-bar w-[2px] rounded-full bg-green-500 h-1.5" />
                          <span className="eq-bar w-[2px] rounded-full bg-green-500 h-2" />
                        </div>
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Now Playing</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Music className="size-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">No songs found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try another category or shuffle for new songs!</p>
            <Button
              onClick={handleShuffle}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl"
            >
              <RefreshCw className="size-4 mr-1" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
