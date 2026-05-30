'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { Play, Eye } from 'lucide-react';
import { useMusicStore, type Track } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/utils-music';

/* ---- Format Views ---- */
function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
}

function getViews(track: Track): number {
  if (track.views && track.views > 0) return track.views;
  let hash = 0;
  for (let i = 0; i < track.videoId.length; i++) {
    hash = ((hash << 5) - hash) + track.videoId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10000000;
}

/* ---- 3D Floating Track Card (Framer Motion + perspective) ---- */
function FloatingTrackCard({ track, index }: { track: Track; index: number }) {
  const { playTrack, currentTrack, isPlaying } = useMusicStore();
  const isCurrent = currentTrack?.videoId === track.videoId;
  const views = getViews(track);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        z: 30,
        transition: { duration: 0.25 },
      }}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
      onClick={() => setTimeout(() => playTrack(track), 0)}
      className={`floating-3d-card group cursor-pointer ${isCurrent ? 'is-playing-3d' : ''}`}
    >
      {/* Thumbnail */}
      <div className="floating-3d-thumb">
        <Image
          src={track.thumbnail || '/weedmusic-logo.png'}
          alt={track.title}
          fill
          className="object-cover"
          unoptimized
        />

        {/* 3D overlay on hover */}
        <div className="floating-3d-overlay">
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="size-11 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/40"
          >
            <Play className="size-5 text-white fill-white ml-0.5" />
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
          {formatDuration(track.duration)}
        </div>

        {/* View count */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-0.5">
          <Eye className="size-3" />
          {formatViews(views)}
        </div>

        {/* Playing indicator */}
        {isCurrent && isPlaying && (
          <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            NOW PLAYING
          </div>
        )}

        {/* 3D reflection line */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-purple-400' : ''}`}>
          {track.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {track.artist}
        </p>
      </div>
    </motion.div>
  );
}

/* ---- Main Trending 3D Section ---- */
export function Trending3DSection() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

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

  // Show only 2 rows of thumbnails — 8 items for 4-col grid
  const displayTracks = tracks.slice(0, 8);

  return (
    <section ref={sectionRef} className="px-4 md:px-6 py-8">
      {/* Section Header with 3D gradient line */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="size-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center"
          >
            <span className="text-white text-xs">🌿</span>
          </motion.div>
          <h2 className="text-xl font-bold text-gradient-3d">Trending Now</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/40 via-cyan-500/20 to-transparent" />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </motion.div>
          ))}
        </div>
      ) : displayTracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No trending tracks available right now.</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {isInView && displayTracks.map((track, index) => (
            <FloatingTrackCard key={track.videoId} track={track} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
