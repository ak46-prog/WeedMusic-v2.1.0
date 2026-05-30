'use client';

import { useState, lazy, Suspense } from 'react';
import Image from 'next/image';
import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusicStore, type Track } from '@/lib/store';

// Lazy-load 3D scene to avoid blocking INP
const HeroScene3D = lazy(() =>
  import('@/components/3d/scene-3d').then((mod) => ({ default: mod.HeroScene3D }))
);

export function HeroBanner() {
  const { setView } = useMusicStore();
  const [show3D, setShow3D] = useState(false);

  // Activate 3D after mount via setTimeout(0) macrotask — INP-safe
  useState(() => {
    setTimeout(() => setShow3D(true), 0);
  });

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
    <section className="relative w-full overflow-hidden hero-3d-container" style={{ height: 'clamp(350px, 45vh, 700px)' }}>
      {/* Background Image — Cinematic Drift */}
      <Image
        src="/weedmusic-banner.png"
        alt="WeedMusic Banner"
        fill
        className="premium-hero-media-v2"
        priority
      />

      {/* 3D Scene Overlay */}
      {show3D && (
        <Suspense fallback={null}>
          <HeroScene3D />
        </Suspense>
      )}

      {/* Ambient Shroud Gradient Overlay */}
      <div className="hero-ambient-shroud-3d" />

      {/* Side gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-8" style={{ paddingInline: 'var(--fluid-padding)' }}>
        <div className="max-w-2xl hero-3d-content">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3" style={{ fontSize: 'var(--font-size-heading)' }}>
            Welcome to <span className="gradient-text-3d">WeedMusic</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-6 max-w-lg">
            Stream unlimited music ad-free. YouTube, Radio, Kids &amp; more platforms.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white gap-2 h-12 px-6 rounded-2xl shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="size-5 fill-current" />
              Play Now
            </Button>
            <Button
              onClick={() => setView('explore')}
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 rounded-2xl border-purple-500/50 text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all hover:scale-105 active:scale-95"
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
