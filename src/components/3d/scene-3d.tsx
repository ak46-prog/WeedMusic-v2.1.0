'use client';

/**
 * Lightweight 3D Scene Components
 * Replaces heavy @react-three/fiber WebGL canvases with
 * Framer Motion + CSS perspective — inspired by 3d-portfolio.
 *
 * Performance wins:
 * - ZERO WebGL contexts (was 9: 1 hero + 8 categories)
 * - GPU-only CSS animations (transform, opacity)
 * - Framer Motion for scroll-triggered entrances
 * - ~200KB bundle reduction (no three/r3f/drei/postprocessing)
 */

import { motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

/* ─── Shared motion config (3d-portfolio style) ─── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Floating Geometric Shape (CSS 3D — NO WebGL) ─── */
function FloatingShape({
  color,
  size = 60,
  className = '',
  animate: customAnimate,
  delay = 0,
  style,
}: {
  color: string;
  size?: number;
  className?: string;
  animate?: 'spin' | 'float' | 'pulse' | 'morph';
  delay?: number;
  style?: React.CSSProperties;
}) {
  const animConfig = {
    spin: { animate: { rotate: 360 }, transition: { duration: 20, repeat: Infinity, ease: 'linear', delay } },
    float: {
      animate: { y: [0, -12, 0], rotate: [0, 5, -5, 0] },
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay },
    },
    pulse: {
      animate: { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] },
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay },
    },
    morph: {
      animate: { borderRadius: ['30%', '50%', '30%', '50%'], scale: [1, 1.05, 1] },
      transition: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay },
    },
  };

  const anim = animConfig[customAnimate || 'float'];

  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity: 0.5,
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        ...style,
      }}
      {...anim}
    />
  );
}

/* ─── Hero Scene 3D (Framer Motion + CSS perspective) ─── */
export function HeroScene3D() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const decoratives = [
    { className: 'absolute top-[8%] -left-8 md:-left-16', color: '#a293ff', size: 90, animate: 'float' as const, delay: 0.3 },
    { className: 'absolute top-[12%] -right-6 md:-right-14', color: '#00f0ff', size: 70, animate: 'spin' as const, delay: 0.5 },
    { className: 'absolute bottom-[15%] -left-10 md:-left-20', color: '#c084fc', size: 80, animate: 'pulse' as const, delay: 0.7 },
    { className: 'absolute bottom-[10%] -right-8 md:-right-16', color: '#22d3ee', size: 100, animate: 'morph' as const, delay: 0.2 },
    { className: 'absolute top-[45%] left-[10%]', color: '#a78bfa', size: 45, animate: 'float' as const, delay: 0.9 },
    { className: 'absolute top-[35%] right-[8%]', color: '#818cf8', size: 55, animate: 'pulse' as const, delay: 0.4 },
  ];

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      {/* Ambient particles — pure CSS circles */}
      <div className="absolute inset-0">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 4),
              height: 2 + (i % 4),
              backgroundColor: i % 2 === 0 ? '#a293ff' : '#00f0ff',
              left: `${5 + (i * 37) % 90}%`,
              top: `${5 + (i * 53) % 90}%`,
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? {
              opacity: [0, 0.4 + (i % 5) * 0.1, 0],
              scale: [0.5, 1, 0.5],
              y: [0, -20 - (i % 3) * 10, 0],
            } : {}}
            transition={{
              duration: 4 + (i % 4),
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Audio visualizer ring — CSS circles + scaleY bars */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ transform: 'translateZ(0)' }}
        >
          {/* Ring outline */}
          <motion.div
            className="rounded-full border-2"
            style={{
              width: 200,
              height: 200,
              borderColor: '#a293ff40',
              willChange: 'transform',
              transform: 'translateZ(0)',
            }}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
            }}
          />

          {/* Center glow orb */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 20,
              height: 20,
              background: 'radial-gradient(circle, #a293ff 0%, #00f0ff80 70%, transparent 100%)',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* EQ bars around the ring */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * 360;
            const radius = 100;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <motion.div
                key={`bar-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 16,
                  backgroundColor: i % 2 === 0 ? '#a293ff' : '#00f0ff',
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'center bottom',
                  willChange: 'transform',
                  transform: `translate(${x - 2}px, ${y - 8}px) translateZ(0) rotate(${angle + 90}deg)`,
                }}
                animate={{
                  scaleY: [0.3, 1, 0.5, 0.8, 0.3],
                }}
                transition={{
                  duration: 1.2 + (i % 3) * 0.3,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Decorative floating shapes — inspired by 3d-portfolio hero */}
      {decoratives.map((d, i) => (
        <motion.div
          key={`dec-${i}`}
          className={d.className}
          initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80 }}
          animate={inView ? { opacity: 0.5, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease: EASE_OUT_EXPO }}
        >
          <FloatingShape
            color={d.color}
            size={d.size}
            animate={d.animate}
            delay={i * 0.2}
            className="rounded-2xl backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${d.color}30, ${d.color}10)`,
              border: `1px solid ${d.color}20`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Category Card 3D Shape (CSS-only, ZERO WebGL) ─── */
export function CategoryScene3D({
  color = '#a293ff',
  shape = 'icosahedron',
}: {
  color?: string;
  shape?: 'torus' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torusKnot';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });

  // Map shape names to CSS border-radius patterns for visual distinction
  const shapeStyles: Record<string, React.CSSProperties> = {
    torus: { borderRadius: '50%', border: `3px solid ${color}60` },
    icosahedron: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' },
    octahedron: { borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%' },
    dodecahedron: { borderRadius: '25% 75% 50% 50% / 50% 25% 75% 50%' },
    torusKnot: { borderRadius: '60% 40% 60% 40% / 40% 60% 40% 60%' },
  };

  return (
    <div
      ref={ref}
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: 500, transformStyle: 'preserve-3d' }}
    >
      {/* Main shape */}
      <motion.div
        style={{
          width: 60,
          height: 60,
          background: `linear-gradient(135deg, ${color}50, ${color}20)`,
          border: `1px solid ${color}30`,
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
          ...shapeStyles[shape],
        }}
        initial={{ opacity: 0, scale: 0.5, rotateX: 20 }}
        animate={inView ? {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          rotateY: [0, 360],
        } : {}}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5, ease: EASE_OUT_EXPO },
          rotateX: { duration: 0.5 },
          rotateY: { duration: 25, repeat: Infinity, ease: 'linear' },
        }}
      />

      {/* Sparkle dots */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * 360;
        const r = 30;
        return (
          <motion.div
            key={`sp-${i}`}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              backgroundColor: color,
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * r}px)`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * r}px)`,
              willChange: 'transform, opacity',
              transform: 'translateZ(0)',
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? {
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5],
            } : {}}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Thumbnail Scene 3D (CSS-only micro 3D effect) ─── */
export function ThumbnailScene3D({
  color = '#a293ff',
}: {
  color?: string;
}) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: 400, transformStyle: 'preserve-3d' }}
    >
      <motion.div
        style={{
          width: 30,
          height: 30,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          background: `linear-gradient(135deg, ${color}40, ${color}15)`,
          border: `1px solid ${color}25`,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
          borderRadius: [
            '30% 70% 70% 30% / 30% 30% 70% 70%',
            '50% 50% 50% 50% / 50% 50% 50% 50%',
            '70% 30% 30% 70% / 70% 70% 30% 30%',
            '30% 70% 70% 30% / 30% 30% 70% 70%',
          ],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          borderRadius: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </div>
  );
}
