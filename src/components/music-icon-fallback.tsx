'use client';

import { useState } from 'react';

/**
 * Music Icon Fallback — inspired by the 3D neumorphic music button design.
 * Shows a beautiful CSS-only music icon when the actual thumbnail fails to load.
 *
 * Features:
 * - Neumorphic 3D button with inset shadows (GPU-only)
 * - Heartbeat animation via CSS keyframes
 * - Color derived from track's videoId for deterministic variety
 * - Zero external dependencies, zero WebGL
 */

// Deterministic color from videoId — maps to a curated palette
function getColorFromId(videoId: string): { base: string; highlight: string; shadow: string; glow: string } {
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = ((hash << 5) - hash) + videoId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

const PALETTE = [
  { base: '#FF2A5F', highlight: '#FF7A9C', shadow: '#B3002D', glow: 'rgba(255,42,95,0.2)' },   // Neon Pink
  { base: '#1DB954', highlight: '#1ED760', shadow: '#106B31', glow: 'rgba(29,185,84,0.2)' },    // Spotify Green
  { base: '#a293ff', highlight: '#c4b5ff', shadow: '#6d5fcc', glow: 'rgba(162,147,255,0.2)' },  // Purple
  { base: '#00f0ff', highlight: '#66f7ff', shadow: '#009daa', glow: 'rgba(0,240,255,0.2)' },    // Cyan
  { base: '#f97316', highlight: '#fb923c', shadow: '#b35c0e', glow: 'rgba(249,115,22,0.2)' },   // Orange
  { base: '#ef4444', highlight: '#f87171', shadow: '#b32d2d', glow: 'rgba(239,68,68,0.2)' },    // Red
  { base: '#eab308', highlight: '#facc15', shadow: '#a77d06', glow: 'rgba(234,179,8,0.2)' },    // Gold
  { base: '#c084fc', highlight: '#d8b4fe', shadow: '#9333ea', glow: 'rgba(192,132,252,0.2)' },  // Violet
];

export function MusicIconFallback({ videoId, size = 'full' }: { videoId: string; size?: 'full' | 'thumb' | 'mini' }) {
  const colors = getColorFromId(videoId);

  const sizeMap = {
    full: { wrapper: 'w-full h-full', btn: 'w-[55%] h-[55%] min-w-[60px] min-h-[60px] max-w-[120px] max-h-[120px]', note: 'text-[2.5rem] md:text-[3.5rem]' },
    thumb: { wrapper: 'w-full h-full', btn: 'w-10 h-10', note: 'text-lg' },
    mini: { wrapper: 'w-10 h-10', btn: 'w-8 h-8', note: 'text-sm' },
  };

  const s = sizeMap[size];

  return (
    <div
      className={`${s.wrapper} flex items-center justify-center music-icon-fallback`}
      style={{ backgroundColor: 'var(--muted, #1a1a2e)' }}
    >
      <div className={`${s.btn} rounded-[28%] flex items-center justify-center music-icon-btn`}
        style={{
          backgroundColor: colors.base,
          boxShadow: `
            8px 8px 16px rgba(0,0,0,0.5),
            0px 0px 12px ${colors.glow},
            inset 4px 4px 10px ${colors.highlight},
            inset -4px -4px 10px ${colors.shadow}
          `,
        }}
      >
        <span
          className={`${s.note} leading-none select-none`}
          style={{
            color: '#FFFFFF',
            textShadow: `2px 2px 6px ${colors.shadow}`,
            marginTop: '2px',
            marginLeft: '2px',
          }}
        >
          ♫
        </span>
      </div>
    </div>
  );
}

/**
 * Smart Thumbnail — tries the real image first, falls back to MusicIconFallback on error.
 * Use this everywhere instead of raw <Image> for track thumbnails.
 */
export function SmartThumbnail({
  src,
  alt,
  videoId,
  className = '',
  size = 'full',
}: {
  src?: string;
  alt: string;
  videoId: string;
  className?: string;
  size?: 'full' | 'thumb' | 'mini';
}) {
  const [hasError, setHasError] = useState(false);

  // No thumbnail src or it's empty → show fallback immediately
  if (!src || src.trim() === '' || src === '/weedmusic-logo.png') {
    return <MusicIconFallback videoId={videoId} size={size} />;
  }

  if (hasError) {
    return <MusicIconFallback videoId={videoId} size={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
