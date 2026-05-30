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
      {/* Background Image - new banner */}
      <Image
        src="/weedmusic-banner-new.png"
        alt="weedmusic Banner"
        fill
        className="object-cover"
        priority
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      {/* Floating weed leaf decorations */}
      <div className="absolute top-8 right-12 text-3xl md:text-4xl opacity-40 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>
        🌿
      </div>
      <div className="absolute top-20 right-36 text-2xl md:text-3xl opacity-30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        🌿
      </div>
      <div className="absolute top-14 right-56 text-xl md:text-2xl opacity-25 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
        🌿
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pb-16">
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

      {/* 3D Parallax Grass overlay at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none grass-3d-container">
        <div className="grass-3d-strip">
          <Image
            src="/grass.png"
            alt=""
            fill
            className="object-cover object-bottom grass-3d-image"
            aria-hidden="true"
            priority
          />
        </div>
      </div>

      {/* 3D Grass CSS Animations */}
      <style jsx>{`
        .grass-3d-container {
          perspective: 600px;
          perspective-origin: 50% 0%;
          height: 120px;
        }
        .grass-3d-strip {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: grass-sway 6s ease-in-out infinite;
        }
        .grass-3d-image {
          animation: grass-flow 8s linear infinite;
        }
        @keyframes grass-sway {
          0%, 100% {
            transform: rotateX(45deg) translateZ(0px) rotateZ(0deg);
          }
          25% {
            transform: rotateX(42deg) translateZ(4px) rotateZ(-0.5deg);
          }
          50% {
            transform: rotateX(45deg) translateZ(0px) rotateZ(0deg);
          }
          75% {
            transform: rotateX(48deg) translateZ(-4px) rotateZ(0.5deg);
          }
        }
        @keyframes grass-flow {
          0% {
            transform: translateX(0) scaleX(1.1);
          }
          50% {
            transform: translateX(-5px) scaleX(1.15);
          }
          100% {
            transform: translateX(0) scaleX(1.1);
          }
        }
      `}</style>
    </section>
  );
}
