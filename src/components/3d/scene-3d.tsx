'use client';

/**
 * STRIPPED 3D Scene — All heavy animations removed.
 * HeroScene3D: Removed ~100+ infinite Framer Motion animations
 *   (particles, orbit rings, EQ ring with 16 bars, star field with 25 dots,
 *    glow orbs, 3D rotating shapes, 6 floating decoratives, 6 sparkle dots per card)
 * CategoryScene3D: Removed per-card rotating shapes + sparkle animations
 * ThumbnailScene3D: Removed rotating shape animation
 *
 * These components now render nothing — zero GPU cost, zero layout cost.
 * The hero banner, trending section, and category section still work
 * with simple CSS transitions and Framer Motion slide/fade only.
 */

/** No-op hero scene — renders nothing, zero cost */
export function HeroScene3D() {
  return null;
}

/** No-op category scene — renders nothing, zero cost */
export function CategoryScene3D() {
  return null;
}

/** No-op thumbnail scene — renders nothing, zero cost */
export function ThumbnailScene3D() {
  return null;
}
