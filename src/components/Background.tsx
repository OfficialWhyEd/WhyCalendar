import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Stable random particles (seeded by index so no flicker on re-render)
function useParticles(count: number) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: ((i * 137.5) % 100),
    y: ((i * 97.3) % 100),
    size: 1 + (i % 3),
    duration: 8 + (i % 7) * 2,
    delay: (i % 9) * 0.7,
    opacity: 0.04 + (i % 5) * 0.02,
  })), [count])
}

export default function Background() {
  const particles = useParticles(18)

  return (
    <>
      {/* Fixed background */}
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 0 }} />

      {/* Gradient mesh — subtle, breathing */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>

        {/* Top-left cold glow */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], x: [0, 14, 0], y: [0, 8, 0], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-25%', left: '-12%',
            width: '60%', height: '60%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.18) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Center subtle vignette bloom */}
        <motion.div
          animate={{ opacity: [0.02, 0.05, 0.02], scale: [1, 1.03, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', top: '20%', left: '25%',
            width: '50%', height: '50%',
            background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Bottom-right warm accent */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], x: [0, -12, 0], y: [0, -14, 0], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          style={{
            position: 'absolute', bottom: '-22%', right: '-12%',
            width: '65%', height: '65%',
            background: 'radial-gradient(circle, rgba(255,100,40,0.1) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Top-right purple whisper */}
        <motion.div
          animate={{ opacity: [0.02, 0.06, 0.02], scale: [1, 1.05, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 9 }}
          style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: '35%', height: '45%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Scan line — very subtle horizontal streak */}
        <motion.div
          animate={{ y: ['-2%', '102%'], opacity: [0, 0.015, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear', delay: 5 }}
          style={{
            position: 'absolute', left: 0, right: 0,
            height: 120,
            background: 'linear-gradient(to bottom, transparent, rgba(0,229,255,0.04), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating micro particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            animate={{
              y: [`${p.y}%`, `${p.y - 8}%`, `${p.y}%`],
              opacity: [0, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: i % 3 === 0 ? '#00E5FF' : i % 3 === 1 ? '#A78BFA' : '#4ADE80',
              boxShadow: `0 0 ${p.size * 3}px currentColor`,
            }}
          />
        ))}
      </div>
    </>
  )
}
