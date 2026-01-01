import React, { useMemo } from 'react';

// Simple pseudo-random number generator for consistent particle placement
const mulberry32 = (seed: number) => {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const AnimatedBackground: React.FC = () => {
  const particles = useMemo(() => {
    const random = mulberry32(12345); // Use a fixed seed
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${random() * 100}%`,
      animationDuration: `${10 + random() * 15}s`, // 10s to 25s
      animationDelay: `${random() * -15}s`, // Start at various points in the animation
      size: `${1 + random() * 2}px`, // 1px to 3px
    }));
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Grid */}
      <div className="absolute bottom-0 left-0 right-0 h-[300%] w-[200%] ml-[-50%] grid-background opacity-30"></div>
      
      {/* Particles */}
      <div className="absolute inset-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-cyan-400/50 particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;