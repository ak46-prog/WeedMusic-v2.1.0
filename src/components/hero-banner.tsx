'use client';

import Image from 'next/image';
import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicStore, type Track } from '@/lib/store';

export function HeroBanner() {
  const { setView } = useMusicStore();

  const handlePlayNow = async () => {
    try {
      const res = await fetch('/api/music/trending');
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const tracks: Track[] = data.items.map((item: any) => ({
          videoId: item.videoId,
          title: item.title,
          artist: item.artist,
          thumbnail: item.thumbnail,
          duration: item.duration,
          isPaid: item.isPaid,
        }));
        useMusicStore.getState().playQueue(tracks, 0);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <section className="relative w-full h-[45vh] min-h-[300px] max-h-[440px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/weedmusic-banner.png"
        alt="weedmusic Banner"
        fill
        className="object-cover"
        priority
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
            Welcome to <span className="bg-gradient-to-r from-green-500 via-orange-500 to-green-500 bg-clip-text text-transparent">weedmusic</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-6 max-w-lg">
            Stream unlimited music ad-free. YouTube, Radio, Kids & more platforms.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-12 px-6 rounded-full"
            >
              <Play className="size-5 fill-current" />
              Play Now
            </Button>
            <Button
              onClick={() => setView('explore')}
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 rounded-full border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30"
            >
              <Shuffle className="size-5" />
              Explore
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
