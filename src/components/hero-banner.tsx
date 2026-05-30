'use client';

import Image from 'next/image';
import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicStore, type Track } from '@/lib/store';

// Grass blade configs for bottom decoration
const GRASS_COLORS = [
  'oklch(0.55 0.17 140)',
  'oklch(0.5 0.2 140)',
  'oklch(0.6 0.15 140)',
  'oklch(0.45 0.2 140)',
  'oklch(0.5 0.18 130)',
];

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
        alt="WeedMusic Banner"
        fill
        className="object-cover"
        priority
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Weed pattern overlay */}
      <div className="absolute inset-0 weed-bg-pattern opacity-30" />

      {/* Floating weed leaves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="weed-particle absolute bottom-8" style={{ left: '15%', animationDelay: '0s' }}>🌿</div>
        <div className="weed-particle absolute bottom-12" style={{ left: '35%', animationDelay: '1.5s' }}>🍃</div>
        <div className="weed-particle absolute bottom-6" style={{ left: '55%', animationDelay: '3s' }}>🌿</div>
        <div className="weed-particle absolute bottom-10" style={{ left: '75%', animationDelay: '4.5s' }}>🍃</div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3">
            Welcome to <span className="bg-gradient-to-r from-green-500 via-orange-500 to-green-500 bg-clip-text text-transparent">WeedMusic</span>
            <span className="weed-leaf text-3xl md:text-5xl">🌿</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-6 max-w-lg">
            Stream unlimited music ad-free. YouTube, Radio, Kids & more platforms.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 h-12 px-6 rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="size-5 fill-current" />
              Play Now
            </Button>
            <Button
              onClick={() => setView('explore')}
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 rounded-2xl border-orange-500/50 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all hover:scale-105 active:scale-95"
            >
              <Shuffle className="size-5" />
              Explore
            </Button>
          </div>
        </div>
      </div>

      {/* Grass blades at bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="grass-blade"
            style={{
              left: `${(i / 30) * 100 + Math.random() * 3}%`,
              height: `${8 + Math.random() * 15}px`,
              background: GRASS_COLORS[i % GRASS_COLORS.length],
              animationDelay: `${Math.random() * -4}s`,
              width: `${3 + Math.random() * 4}px`,
              bottom: 0,
              position: 'absolute',
              borderRadius: '2px 2px 0 0',
              transformOrigin: 'bottom center',
            }}
          />
        ))}
      </div>
    </section>
  );
}
