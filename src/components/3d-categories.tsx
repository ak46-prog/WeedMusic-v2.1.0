'use client';

import { useState, lazy, Suspense } from 'react';
import { Music, Guitar, Mic2, Radio, Mic, Drum, Film, Globe } from 'lucide-react';
import { useMusicStore } from '@/lib/store';

// Lazy-load 3D scene for category cards
const CategoryScene3D = lazy(() =>
  import('@/components/3d/scene-3d').then((mod) => ({ default: mod.CategoryScene3D }))
);

const CATEGORIES = [
  { id: 'pop', label: 'Pop', icon: Music, color: '#a293ff', shape: 'torus' as const, query: 'pop hits 2025' },
  { id: 'rock', label: 'Rock', icon: Guitar, color: '#f97316', shape: 'icosahedron' as const, query: 'rock music 2025' },
  { id: 'hiphop', label: 'Hip Hop', icon: Mic2, color: '#ef4444', shape: 'octahedron' as const, query: 'hip hop hits 2025' },
  { id: 'electronic', label: 'Electronic', icon: Radio, color: '#00f0ff', shape: 'torusKnot' as const, query: 'electronic music 2025' },
  { id: 'rnb', label: 'R&B', icon: Mic, color: '#c084fc', shape: 'dodecahedron' as const, query: 'r&b music 2025' },
  { id: 'jazz', label: 'Jazz', icon: Drum, color: '#eab308', shape: 'torus' as const, query: 'jazz music 2025' },
  { id: 'bollywood', label: 'Bollywood', icon: Film, color: '#f43f5e', shape: 'icosahedron' as const, query: 'bollywood hits 2025' },
  { id: 'world', label: 'World', icon: Globe, color: '#22c55e', shape: 'octahedron' as const, query: 'world music 2025' },
];

export function Category3DSection() {
  const [show3D, setShow3D] = useState(false);
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
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gradient-3d">Browse Categories</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.query)}
              className="category-3d-card group"
              style={{
                animationDelay: `${index * 60}ms`,
                '--cat-color': cat.color,
              } as React.CSSProperties}
            >
              {/* 3D Shape Background */}
              <div className="category-3d-shape">
                {show3D && (
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: `${cat.color}30` }} />
                    </div>
                  }>
                    <CategoryScene3D color={cat.color} shape={cat.shape} />
                  </Suspense>
                )}
              </div>

              {/* Card Content */}
              <div className="category-3d-content">
                <Icon className="size-6 mb-1 transition-transform duration-200 group-hover:scale-110" style={{ color: cat.color }} />
                <span className="font-semibold text-sm">{cat.label}</span>
              </div>

              {/* Glow effect on hover */}
              <div className="category-3d-glow" style={{ background: `radial-gradient(circle, ${cat.color}20 0%, transparent 70%)` }} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
