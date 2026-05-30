'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
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

// Grass blade colors for decoration
const GRASS_COLORS = [
  'oklch(0.55 0.17 140)',
  'oklch(0.5 0.2 140)',
  'oklch(0.6 0.15 140)',
  'oklch(0.45 0.2 140)',
  'oklch(0.5 0.18 130)',
  'oklch(0.55 0.2 135)',
  'oklch(0.48 0.19 140)',
  'oklch(0.58 0.16 138)',
];

// Bubble positions for background decoration
const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 10 + Math.random() * 30,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 3 + Math.random() * 3,
}));

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

  const handlePlayTrack = (track: Track, index: number) => {
    setCurrentPlaying(track.videoId);
    playQueue(tracks, index);
  };

  const handleRandomRhyme = () => {
    if (tracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * tracks.length);
    const track = tracks[randomIdx];
    setCurrentPlaying(track.videoId);
    playTrack(track);
  };

  return (
    <div className="min-h-screen relative overflow-hidden weed-bg-pattern">
      {/* Background Bubbles */}
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="kids-bubble"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            top: `${b.top}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}

      {/* Grass Patch at Bottom */}
      <div className="grass-patch fixed bottom-0 left-0 right-0 z-10 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="grass-blade"
            style={{
              left: `${(i / 30) * 100 + Math.random() * 3}%`,
              height: `${15 + Math.random() * 25}px`,
              background: GRASS_COLORS[i % GRASS_COLORS.length],
              animationDelay: `${Math.random() * -4}s`,
              width: `${4 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* Grass Patch at Top */}
      <div className="fixed top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: '8px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-green-400/20 to-transparent" />
      </div>

      {/* Kids Mode Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-green-50/95 via-yellow-50/95 to-pink-50/95 dark:from-green-950/95 dark:via-yellow-950/95 dark:to-pink-950/95 backdrop-blur-xl border-b-4 border-green-400/50 grass-border-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25 transform hover:scale-110 transition-transform">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 scale-105'
                  : 'bg-white/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:border-green-400 hover:shadow-md'
              }`}
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
            <Sparkles className="size-5 text-yellow-500 animate-pulse" />
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
              <div key={i} className="kids-frame-card">
                <Skeleton className="aspect-square w-full rounded-[17px]" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/2 mt-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Track Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-list">
            {tracks.map((track, index) => {
              const isPlaying = currentPlaying === track.videoId;
              return (
                <div
                  key={track.videoId}
                  onClick={() => handlePlayTrack(track, index)}
                  className={`kids-frame-card group ${isPlaying ? 'ring-2 ring-green-500 ring-offset-2' : ''} ${shuffleAnim ? 'animate-slide-up' : ''}`}
                >
                  {/* SAFE Ribbon */}
                  <div className="kids-ribbon">SAFE</div>

                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-[17px]">
                    <Image
                      src={track.thumbnail || '/weedmusic-logo.png'}
                      alt={track.title}
                      fill
                      className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isPlaying ? 'scale-105' : ''}`}
                      unoptimized
                    />

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="size-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        {isPlaying ? (
                          <div className="flex gap-[3px] items-end h-4">
                            <span className="w-[3px] rounded-full bg-white animate-eq1 h-full" />
                            <span className="w-[3px] rounded-full bg-white animate-eq2 h-2" />
                            <span className="w-[3px] rounded-full bg-white animate-eq3 h-3" />
                            <span className="w-[3px] rounded-full bg-white animate-eq4 h-2.5" />
                          </div>
                        ) : (
                          <Play className="size-6 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {track.duration > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {formatDuration(track.duration)}
                      </div>
                    )}

                    {/* Now Playing Glow */}
                    {isPlaying && (
                      <div className="absolute inset-0 border-3 border-green-400 rounded-[17px] pointer-events-none animate-playing-pulse" />
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="p-3">
                    <p className={`text-sm font-semibold truncate ${isPlaying ? 'text-green-600 dark:text-green-400' : ''}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                      <span className="truncate">{track.artist}</span>
                    </p>
                    {isPlaying && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex gap-[2px] items-end h-3">
                          <span className="w-[2px] rounded-full bg-green-500 animate-eq1 h-full" />
                          <span className="w-[2px] rounded-full bg-green-500 animate-eq2 h-1.5" />
                          <span className="w-[2px] rounded-full bg-green-500 animate-eq3 h-2" />
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

      {/* Weed Leaf Corner Decorations */}
      <div className="weed-corner-tl text-green-600 dark:text-green-400 text-2xl" style={{ top: '70px' }}>🌿</div>
      <div className="weed-corner-br text-green-600 dark:text-green-400 text-2xl">🍃</div>
    </div>
  );
}
