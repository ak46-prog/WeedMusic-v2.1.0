'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Baby, Play, Shield, ArrowLeft, Shuffle, Dices, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

const categories = [
  { id: 'nursery', name: 'Nursery Rhymes', emoji: '🎵', query: 'nursery rhymes for kids' },
  { id: 'lullabies', name: 'Lullabies', emoji: '🌙', query: 'lullabies for babies' },
  { id: 'action', name: 'Action Songs', emoji: '💃', query: 'action songs for kids' },
  { id: 'animal', name: 'Animal Songs', emoji: '🐾', query: 'animal songs for children' },
  { id: 'learning', name: 'ABC & Learning', emoji: '📚', query: 'ABC learning songs for kids' },
  { id: 'fun', name: 'Fun & Play', emoji: '🎈', query: 'fun play songs for kids' },
];

/** Convert YouTube thumbnail URLs to higher quality kids-friendly versions */
const getKidsThumbnail = (url: string) => {
  if (!url) return '/zmusic-logo.png';
  // Convert to higher quality thumbnail
  return url
    .replace('/default.jpg', '/mqdefault.jpg')
    .replace('/sddefault.jpg', '/mqdefault.jpg')
    .replace('/hqdefault.jpg', '/mqdefault.jpg')
    .replace('/maxresdefault.jpg', '/mqdefault.jpg');
};

/* ── Floating Bubbles Background ─────────────────────────────── */
function FloatingBubbles() {
  const bubbles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      size: Math.random() * 40 + 14,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 10 + 12,
      hue: Math.floor(Math.random() * 60 + 100), // green-ish range
      opacity: Math.random() * 0.18 + 0.08,
    }))
  ).current;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: `-${b.size}px`,
            background: `hsla(${b.hue}, 70%, 60%, ${b.opacity})`,
            animation: `bubble-float ${b.duration}s ${b.delay}s infinite ease-in`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes bubble-float {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) scale(0.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/* ── 3D Frame Card ───────────────────────────────────────────── */
function FrameCard({
  track,
  tracks,
  isPlaying,
  onPlay,
}: {
  track: Track;
  tracks: Track[];
  isPlaying: boolean;
  onPlay: (tracks: Track[], index: number) => void;
}) {
  const index = tracks.indexOf(track);

  return (
    <button
      onClick={() => onPlay(tracks, index)}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 ease-out
        hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-green-400/30
        active:scale-[0.98] active:translate-y-0
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 min-h-[180px]"
    >
      {/* Gradient border wrapper */}
      <div className="p-[2px] rounded-2xl bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 h-full">
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={getKidsThumbnail(track.thumbnail)}
              alt={track.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />

            {/* Hover overlay with play */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="size-14 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/40 transition-transform duration-300 group-hover:scale-110">
                <Play className="size-7 text-white fill-white ml-0.5" />
              </div>
            </div>

            {/* SAFE Badge */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500/90 text-white border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm shadow-sm font-bold tracking-wider">
                <Shield className="size-3 mr-0.5" />
                SAFE
              </Badge>
            </div>

            {/* Now-playing indicator */}
            {isPlaying && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-green-500/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                <Music className="size-3 text-white animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wide">PLAYING</span>
              </div>
            )}

            {/* Duration pill */}
            {track.duration > 0 && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                {formatDuration(track.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <p className="text-[15px] font-semibold truncate leading-tight">{track.title}</p>
            <p className="text-sm text-muted-foreground truncate mt-1">{track.artist}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Main Kids Mode Component ────────────────────────────────── */
export function KidsMode() {
  const { setView, playQueue, currentTrack, isPlaying } = useMusicStore();
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCat = categories.find((c) => c.id === activeCategory)!;

  const fetchCategory = useCallback(async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/music/kids?category=${cat.id}&q=${encodeURIComponent(cat.query)}`);
      const data = await res.json();
      setTracks(data.items || []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategory(activeCategory);
  }, [activeCategory, fetchCategory]);

  const handlePlayAll = () => {
    if (tracks.length > 0) playQueue(tracks, 0);
  };

  const handleRandomPick = () => {
    if (tracks.length === 0) return;
    const idx = Math.floor(Math.random() * tracks.length);
    playQueue(tracks, idx);
  };

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  const isTrackPlaying = (track: Track) =>
    currentTrack?.videoId === track.videoId && isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-yellow-50 to-pink-50 dark:from-green-950 dark:via-yellow-950 dark:to-pink-950 relative">
      {/* Floating Bubbles */}
      <FloatingBubbles />

      {/* ── Sticky Header ──────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-green-950/90 backdrop-blur-lg border-b-4 border-green-400 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-400/30">
              <Baby className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-green-700 dark:text-green-300">Kids Mode</h1>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Shield className="size-3" />
                Safe content only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white border-0 shadow-sm shadow-green-400/30">
              🧒 Kid Safe
            </Badge>
            <Button
              onClick={() => setView('home')}
              variant="outline"
              size="sm"
              className="border-green-400 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/40"
            >
              <ArrowLeft className="size-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ──────────────────────────────────── */}
      <div className="sticky top-[73px] z-30 bg-white/80 dark:bg-green-950/80 backdrop-blur-lg border-b border-green-200 dark:border-green-800">
        <div
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none"
          role="tablist"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200
                ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-400/30 scale-105'
                    : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 hover:scale-105'
                }`}
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Area ───────────────────────────────────── */}
      <div className="relative z-10 px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
            <span className="text-2xl">{activeCat.emoji}</span>
            {activeCat.name}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handlePlayAll}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-md shadow-green-400/20"
            >
              <Play className="size-4 mr-1 fill-current" />
              Play All
            </Button>
            <Button
              onClick={handleRandomPick}
              variant="outline"
              className="border-green-400 text-green-700 dark:text-green-300 rounded-full hover:bg-green-50 dark:hover:bg-green-900/40"
            >
              <Dices className="size-4 mr-1" />
              Random Pick
            </Button>
            <Button
              onClick={handleShuffleAll}
              variant="outline"
              className="border-green-400 text-green-700 dark:text-green-300 rounded-full hover:bg-green-50 dark:hover:bg-green-900/40"
            >
              <Shuffle className="size-4 mr-1" />
              Shuffle All
            </Button>
          </div>
        </div>

        {/* Loading Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
              <Music className="size-10 text-green-400" />
            </div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">No songs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try selecting a different category
            </p>
          </div>
        ) : (
          /* Track Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {tracks.map((track) => (
              <FrameCard
                key={track.videoId}
                track={track}
                tracks={tracks}
                isPlaying={isTrackPlaying(track)}
                onPlay={playQueue}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hide scrollbar for tabs */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
