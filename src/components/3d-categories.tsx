'use client';

import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Music, Guitar, Mic2, Radio, Mic, Drum, Film, Globe } from 'lucide-react';
import { useMusicStore } from '@/lib/store';

// Lazy-load 3D scene for category cards
const CategoryScene3D = lazy(() =>
  import('@/components/3d/scene-3d').then((mod) => ({ default: mod.CategoryScene3D }))
);

const CATEGORIES = [
  { id: 'pop', label: 'Pop', icon: Music, color: '#a293ff', shape: 'torus' as const, query: 'pop hits 2025', desc: 'Top charts & viral hits' },
  { id: 'rock', label: 'Rock', icon: Guitar, color: '#f97316', shape: 'icosahedron' as const, query: 'rock music 2025', desc: 'Guitar riffs & anthems' },
  { id: 'hiphop', label: 'Hip Hop', icon: Mic2, color: '#ef4444', shape: 'octahedron' as const, query: 'hip hop hits 2025', desc: 'Beats, bars & flow' },
  { id: 'electronic', label: 'Electronic', icon: Radio, color: '#00f0ff', shape: 'torusKnot' as const, query: 'electronic music 2025', desc: 'EDM, house & techno' },
  { id: 'rnb', label: 'R&B', icon: Mic, color: '#c084fc', shape: 'dodecahedron' as const, query: 'r&b music 2025', desc: 'Smooth grooves & soul' },
  { id: 'jazz', label: 'Jazz', icon: Drum, color: '#eab308', shape: 'torus' as const, query: 'jazz music 2025', desc: 'Swing, blues & improv' },
  { id: 'bollywood', label: 'Bollywood', icon: Film, color: '#f43f5e', shape: 'icosahedron' as const, query: 'bollywood hits 2025', desc: 'Desi beats & melodies' },
  { id: 'world', label: 'World', icon: Globe, color: '#22c55e', shape: 'octahedron' as const, query: 'world music 2025', desc: 'Global rhythms & sounds' },
];

export function Category3DSection() {
  const [show3D, setShow3D] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const setState = useMusicStore.setState;

  // Activate 3D after mount — INP-safe macrotask
  useState(() => {
    setTimeout(() => setShow3D(true), 0);
  });

  const handleCategoryClick = (query: string) => {
    setState({ searchQuery: query, view: 'search' });
  };

  return (
    <section className="px-4 md:px-6 py-8">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="size-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center"
          >
            <Music className="size-3.5 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-gradient-3d">Browse Categories</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/40 via-cyan-500/20 to-transparent" />
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, index) => {
          const Icon = cat.icon;
          const isHovered = hoveredId === cat.id;

          return (
            <motion.button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.query)}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{
                scale: 1.06,
                rotateY: 8,
                z: 20,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                perspective: 800,
                transformStyle: 'preserve-3d',
              }}
              className="category-3d-card-v2 group"
            >
              {/* 3D Shape Background */}
              <div className="category-3d-shape">
                {show3D && (
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: `${cat.color}30` }}
                      />
                    </div>
                  }>
                    <CategoryScene3D color={cat.color} shape={cat.shape} />
                  </Suspense>
                )}
              </div>

              {/* Card Content */}
              <div className="category-3d-content-v2">
                <motion.div
                  animate={isHovered ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="size-6 mb-1.5" style={{ color: cat.color }} />
                </motion.div>
                <span className="font-bold text-sm">{cat.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{cat.desc}</span>
              </div>

              {/* Glow effect on hover */}
              <motion.div
                className="category-3d-glow-v2"
                animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: `radial-gradient(circle, ${cat.color}25 0%, transparent 70%)` }}
              />

              {/* Bottom gradient line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-60"
                style={{ background: `linear-gradient(to right, ${cat.color}, transparent)` }}
              />
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
