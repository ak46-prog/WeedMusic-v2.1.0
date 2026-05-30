'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Baby, Play, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMusicStore, type Track } from '@/lib/store';
import { formatDuration } from '@/lib/utils-music';

export function KidsMode() {
  const { setView, playQueue } = useMusicStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKidsContent();
  }, []);

  const fetchKidsContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/music/kids');
      const data = await res.json();
      setTracks(data.items || []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playQueue(tracks, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-yellow-50 to-pink-50 dark:from-green-950 dark:via-yellow-950 dark:to-pink-950">
      {/* Kids Mode Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-green-950/90 backdrop-blur border-b-4 border-green-400">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-green-400 flex items-center justify-center">
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
            <Badge className="bg-green-500 text-white border-0">🧒 Kid Safe</Badge>
            <Button
              onClick={() => setView('home')}
              variant="outline"
              size="sm"
              className="border-green-400 text-green-700 dark:text-green-300"
            >
              <ArrowLeft className="size-4 mr-1" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4 mt-2 rounded-full" />
                <Skeleton className="h-3 w-1/2 mt-1 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-700 dark:text-green-300">🎵 Songs for Kids</h2>
              <Button
                onClick={handlePlayAll}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full"
              >
                <Play className="size-4 mr-1 fill-current" />
                Play All
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tracks.map((track) => (
                <button
                  key={track.videoId}
                  onClick={() => playQueue(tracks, tracks.indexOf(track))}
                  className="group rounded-2xl overflow-hidden border-2 border-green-200 dark:border-green-800 bg-white dark:bg-green-900/30 shadow-sm hover:shadow-lg hover:border-green-400 transition-all"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Image
                      src={track.thumbnail || '/zmusic-logo.png'}
                      alt={track.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="size-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <Play className="size-6 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-green-500 text-white border-0 text-[10px] px-1.5">✓ SAFE</Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
