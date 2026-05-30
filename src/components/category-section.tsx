'use client';

import { Music, Mic2, Guitar, Headphones, Radio, Disc3, Flower2, Globe2 } from 'lucide-react';
import { useMusicStore } from '@/lib/store';

const categories = [
  { id: 'pop', label: 'Pop', icon: Mic2, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
  { id: 'rock', label: 'Rock', icon: Guitar, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  { id: 'hip-hop', label: 'Hip Hop', icon: Music, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { id: 'electronic', label: 'Electronic', icon: Headphones, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
  { id: 'rnb', label: 'R&B', icon: Radio, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  { id: 'jazz', label: 'Jazz', icon: Disc3, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  { id: 'bollywood', label: 'Bollywood', icon: Flower2, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
  { id: 'world', label: 'World', icon: Globe2, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
];

export function CategorySection() {
  const handleCategoryClick = (categoryId: string) => {
    useMusicStore.setState({
      searchQuery: `${categoryId} music`,
      view: 'search',
    });
  };

  return (
    <section className="px-4 md:px-6 py-6">
      <h2 className="text-xl font-bold mb-4">Browse Categories</h2>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all hover:scale-105 hover:shadow-md ${cat.color}`}
          >
            <cat.icon className="size-6" />
            <span className="text-xs font-medium">{cat.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
