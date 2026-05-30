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
    <section className="relative w-full overflow-hidden" style={{ height: 'clamp(350px, 40vh, 700px)' }}>
      {/* Background Image — Enterprise Cinematic Drift V2 */}
      <Image
        src="/weedmusic-banner.png"
        alt="WeedMusic Banner"
        fill
        className="premium-hero-media-v2"
        priority
      />

      {/* Ambient Shroud Gradient Overlay */}
      <div className="hero-ambient-shroud" />

      {/* Side gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-8" style={{ paddingInline: 'var(--fluid-padding)' }}>
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3" style={{ fontSize: 'var(--font-size-heading)' }}>
            Welcome to <span className="gradient-text">WeedMusic</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-6 max-w-lg">
            Stream unlimited music ad-free. YouTube, Radio, Kids &amp; more platforms.
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
    </section>
  );
}
