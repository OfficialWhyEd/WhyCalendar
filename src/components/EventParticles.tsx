import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  size: number
  duration: number
  delay: number
}

interface EventParticlesProps {
  active: boolean
  onComplete?: () => void
}

const COLORS = ['#00E5FF', '#4ADE80', '#A78BFA', '#00E5FF', '#FFD700']

function makeParticles(count: number): Particle[] {
  // Start from right side (chat panel ~65% from left), fly to left (DayDetail ~30%)
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: 65 + Math.random() * 20,  // % from left
    startY: 30 + Math.random() * 40,  // % from top
    endX: 10 + Math.random() * 40,    // % from left — arrives at DayDetail
    endY: 15 + Math.random() * 60,    // % from top
    color: COLORS[i % COLORS.length],
    size: 3 + Math.random() * 4,
    duration: 0.6 + Math.random() * 0.6,
    delay: Math.random() * 0.4,
  }))
}

export default function EventParticles({ active, onComplete }: EventParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!active) return
    const p = makeParticles(22)
    setParticles(p)
    setShow(true)
    const maxDuration = Math.max(...p.map(pp => (pp.delay + pp.duration) * 1000))
    const t = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, maxDuration + 200)
    return () => clearTimeout(t)
  }, [active])

  if (!show || particles.length === 0) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500, overflow: 'hidden',
    }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            left: `${p.endX}%`,
            top: `${p.endY}%`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}

      {/* Central flash effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.08, 0], scale: [0.8, 1.2, 1.5] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: '30%', top: '20%',
          width: '40%', height: '60%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
