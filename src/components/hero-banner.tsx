'use client';

import Image from 'next/image';
import { Play, Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useMusicStore, type Track } from '@/lib/store';
import { HeroScene3D } from '@/components/3d/scene-3d';

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
    <section className="relative w-full overflow-hidden hero-3d-container" style={{ height: 'clamp(350px, 45vh, 700px)' }}>
      {/* Background Image — Cinematic Drift */}
      <Image
        src="/weedmusic-banner.png"
        alt="WeedMusic Banner"
        fill
        className="premium-hero-media"
        priority
      />

      {/* 3D Scene Overlay — lightweight Framer Motion + CSS (NO WebGL) */}
      <HeroScene3D />

      {/* Ambient Shroud Gradient Overlay */}
      <div className="hero-ambient-shroud" />

      {/* Part 3: Theme-aware banner gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to right, var(--background) 30%, var(--banner-overlay, rgba(162,147,255,0.12)) 70%, transparent 100%), linear-gradient(135deg, var(--banner-gradient-start, #a293ff)20, var(--banner-gradient-end, #00f0ff)20)`,
        }}
      />

      {/* Content with Framer Motion entrance (inspired by 3d-portfolio hero) */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-8" style={{ paddingInline: 'var(--fluid-padding)' }}>
        <div className="max-w-2xl hero-3d-content">
          <motion.h1
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-2 flex items-center gap-3"
            style={{ fontSize: 'var(--font-size-heading)' }}
          >
            Welcome to <span style={{ color: 'var(--banner-gradient-start, #a293ff)' }}>WeedMusic</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground text-sm md:text-lg mb-6 max-w-lg"
          >
            Stream unlimited music ad-free. YouTube, Radio, Kids &amp; more platforms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-3"
          >
            <Button
              onClick={() => setTimeout(() => handlePlayNow(), 0)}
              size="lg"
              className="text-white gap-2 h-12 px-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(to right, var(--banner-gradient-start, #a293ff), var(--banner-gradient-end, #00f0ff))`,
                boxShadow: `0 8px 24px -4px var(--banner-gradient-start, #a293ff)40`,
              }}
            >
              <Play className="size-5 fill-current" />
              Play Now
            </Button>
            <Button
              onClick={() => setView('explore')}
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{
                borderColor: 'var(--banner-gradient-start, #a293ff)50',
                color: 'var(--banner-gradient-start, #a293ff)',
              }}
            >
              <Shuffle className="size-5" />
              Explore
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
