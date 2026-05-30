'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { TrackCard } from '@/components/track-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMusicStore, type Track } from '@/lib/store';

export function TrendingSection() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/music/trending');
      const data = await res.json();
      setTracks(data.items || []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="text-lg">🌿</span>
          <TrendingUp className="size-5 text-orange-500" />
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-500 hover:text-orange-600 gap-1"
          onClick={() => useMusicStore.setState({ searchQuery: 'trending music 2024', view: 'search' })}
        >
          See all
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No trending tracks available right now.</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          {tracks.map((track) => (
            <TrackCard key={track.videoId} track={track} variant="grid" />
          ))}
        </div>
      )}
    </section>
  );
}
