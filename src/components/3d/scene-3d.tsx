'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ---- Floating Geometric Shape ---- */
function FloatingShape({
  position,
  geometry,
  color,
  speed = 1,
  scale = 1,
}: {
  position: [number, number, number];
  geometry: 'torus' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torusKnot';
  color: string;
  speed?: number;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed * 0.3;
    meshRef.current.rotation.x = t * 0.4;
    meshRef.current.rotation.y = t * 0.6;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.3;
  });

  const geo = useMemo(() => {
    switch (geometry) {
      case 'torus':
        return <torusGeometry args={[0.6, 0.2, 16, 32]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[0.5, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[0.5, 0]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[0.4, 0]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[0.4, 0.15, 64, 16]} />;
    }
  }, [geometry]);

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geo}
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.65}
        />
      </mesh>
    </Float>
  );
}

/* ---- Particle Field ---- */
function ParticleField({ count = 200 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime * 0.05;
    points.current.rotation.y = t;
    points.current.rotation.x = t * 0.3;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#a293ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ---- Animated Wave Ring ---- */
function WaveRing({ position, color = '#00f0ff' }: { position: [number, number, number]; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.elapsedTime;
    ringRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.15);
    ringRef.current.rotation.x = t * 0.2;
    ringRef.current.rotation.z = t * 0.1;
  });

  return (
    <mesh ref={ringRef} position={position}>
      <torusGeometry args={[1.2, 0.03, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.5}
        roughness={0.1}
        metalness={0.9}
      />
    </mesh>
  );
}

/* ---- Main 3D Scene for Hero Banner ---- */
export function HeroScene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-3, 2, 4]} intensity={0.8} color="#a293ff" />
      <pointLight position={[3, -1, 3]} intensity={0.5} color="#00f0ff" />

      <Stars
        radius={50}
        depth={50}
        count={1500}
        factor={3}
        saturation={0.3}
        fade
        speed={0.5}
      />

      <ParticleField count={300} />

      {/* Floating shapes — purple→cyan gradient theme from 3D-portfolio */}
      <FloatingShape position={[-3.5, 1.2, -1]} geometry="torus" color="#a293ff" speed={1.2} scale={0.9} />
      <FloatingShape position={[3.8, 0.5, -2]} geometry="icosahedron" color="#00f0ff" speed={0.8} scale={0.7} />
      <FloatingShape position={[-2, -1.5, 0]} geometry="octahedron" color="#c084fc" speed={1} scale={0.6} />
      <FloatingShape position={[2.5, -1, -1.5]} geometry="torusKnot" color="#22d3ee" speed={0.6} scale={0.5} />
      <FloatingShape position={[0, 2, -3]} geometry="dodecahedron" color="#a78bfa" speed={0.9} scale={0.45} />

      {/* Wave rings */}
      <WaveRing position={[0, 0, -2]} color="#a293ff" />
      <WaveRing position={[0, 0, -2]} color="#00f0ff" />

      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a0f', 8, 25]} />
    </Canvas>
  );
}

/* ---- Compact 3D Scene for Category Cards ---- */
export function CategoryScene3D({
  color = '#a293ff',
  shape = 'icosahedron',
}: {
  color?: string;
  shape?: 'torus' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torusKnot';
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color={color} />
      <pointLight position={[-1, -1, 2]} intensity={0.3} color="#ffffff" />

      <Float speed={2} rotationIntensity={0.8} floatIntensity={0.5}>
        <FloatingShape position={[0, 0, 0]} geometry={shape} color={color} speed={1.5} scale={1.3} />
      </Float>
    </Canvas>
  );
}
