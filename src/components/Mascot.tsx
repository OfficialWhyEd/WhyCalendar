import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// ─── ΩRA: a living clock-being ───────────────────────────────────────────────
// The three orbital rings ARE the real clock hands:
//   outer ring  → seconds (completes in 60s)
//   middle ring → minutes (completes in 60min)
//   inner ring  → hours   (completes in 12h)
// The central eye blinks, breathes, occasionally looks around.
// It IS your day — made visible.

interface MascotProps {
  size?: number
}

function useSmoothClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 80)
    return () => clearInterval(id)
  }, [])
  const s = t.getSeconds() + t.getMilliseconds() / 1000
  const m = t.getMinutes() + s / 60
  const h = (t.getHours() % 12) + m / 60
  return {
    secondAngle: (s / 60) * 360,
    minuteAngle: (m / 60) * 360,
    hourAngle: (h / 12) * 360,
    hour24: t.getHours(),
  }
}

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// Day-progress color: cool cyan at dawn → warm orange at dusk → deep violet at night
function hourColor(h: number): string {
  if (h < 6) return '#5B8BFF'
  if (h < 10) return '#00E5FF'
  if (h < 14) return '#00FFD1'
  if (h < 18) return '#00E5FF'
  if (h < 21) return '#FF9A33'
  return '#A855F7'
}

export default function Mascot({ size = 260 }: MascotProps) {
  const { secondAngle, minuteAngle, hourAngle, hour24 } = useSmoothClock()
  const [blink, setBlink] = useState(false)
  const [eyeShift, setEyeShift] = useState({ x: 0, y: 0 })
  const [moodScale, setMoodScale] = useState(1)
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const eyeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Organic blinking — intervals feel alive, not mechanical
  useEffect(() => {
    function scheduleBlink() {
      blinkTimer.current = setTimeout(() => {
        setBlink(true)
        setTimeout(() => {
          setBlink(false)
          // Occasionally double-blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setBlink(true)
              setTimeout(() => { setBlink(false); scheduleBlink() }, 100)
            }, 200)
          } else {
            scheduleBlink()
          }
        }, 110)
      }, 1800 + Math.random() * 3500)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimer.current)
  }, [])

  // Subtle eye drift — awareness
  useEffect(() => {
    function scheduleEye() {
      eyeTimer.current = setTimeout(() => {
        setEyeShift({
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 3.5,
        })
        scheduleEye()
      }, 2500 + Math.random() * 3000)
    }
    scheduleEye()
    return () => clearTimeout(eyeTimer.current)
  }, [])

  // Breathe deeper at night
  useEffect(() => {
    setMoodScale(hour24 >= 22 || hour24 < 6 ? 0.96 : 1)
  }, [hour24])

  const C = size / 2
  const R1 = size * 0.43  // seconds
  const R2 = size * 0.305 // minutes
  const R3 = size * 0.175 // hours
  const RE = size * 0.11  // eye socket radius

  const sDot = pointOnCircle(C, C, R1, secondAngle)
  const mDot = pointOnCircle(C, C, R2, minuteAngle)
  const hDot = pointOnCircle(C, C, R3, hourAngle)

  const accent = hourColor(hour24)

  // Thin tick marks on the outer ring (every 5s = every 30°)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30
    const inner = pointOnCircle(C, C, R1 - 6, a)
    const outer = pointOnCircle(C, C, R1 + 2, a)
    return { inner, outer, major: i % 3 === 0 }
  })

  return (
    <motion.svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      animate={{ scale: [moodScale, moodScale * 1.013, moodScale] }}
      transition={{ duration: 3.8 + (hour24 >= 22 ? 1.5 : 0), repeat: Infinity, ease: 'easeInOut' }}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Soft glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-soft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Core gradient */}
        <radialGradient id="core" cx="45%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#0d1d2e" />
          <stop offset="60%" stopColor="#06090f" />
          <stop offset="100%" stopColor="#020306" />
        </radialGradient>
        {/* Ambient outer glow behind entire mascot */}
        <radialGradient id="ambient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.07" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient field */}
      <circle cx={C} cy={C} r={R1 + 20} fill="url(#ambient)" />

      {/* ── Outer ring: SECONDS ── */}
      {/* Track */}
      <circle cx={C} cy={C} r={R1} fill="none"
        stroke={`${accent}18`} strokeWidth={1} />
      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i}
          x1={t.inner.x} y1={t.inner.y}
          x2={t.outer.x} y2={t.outer.y}
          stroke={t.major ? `${accent}40` : `${accent}18`}
          strokeWidth={t.major ? 1.5 : 0.8} />
      ))}
      {/* Swept arc — shows elapsed seconds */}
      <motion.circle
        cx={C} cy={C} r={R1}
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        strokeOpacity={0.25}
        strokeDasharray={`${(secondAngle / 360) * 2 * Math.PI * R1} ${2 * Math.PI * R1}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${C} ${C})`}
        style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
      />
      {/* Second dot */}
      <circle cx={sDot.x} cy={sDot.y} r={3.5}
        fill={accent} filter="url(#glow)"
        style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />

      {/* ── Middle ring: MINUTES ── */}
      <circle cx={C} cy={C} r={R2} fill="none"
        stroke={`${accent}10`} strokeWidth={1} />
      {/* Swept arc */}
      <motion.circle
        cx={C} cy={C} r={R2}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeOpacity={0.18}
        strokeDasharray={`${(minuteAngle / 360) * 2 * Math.PI * R2} ${2 * Math.PI * R2}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${C} ${C})`}
      />
      {/* Minute dot */}
      <circle cx={mDot.x} cy={mDot.y} r={5}
        fill={accent} opacity={0.65} filter="url(#glow-soft)" />

      {/* ── Inner ring: HOURS ── */}
      <circle cx={C} cy={C} r={R3} fill="none"
        stroke={`${accent}12`} strokeWidth={1} />
      {/* Hour dot — larger, acts as the "third eye" */}
      <circle cx={hDot.x} cy={hDot.y} r={7}
        fill="rgba(255,255,255,0.18)" filter="url(#glow-soft)" />
      <circle cx={hDot.x} cy={hDot.y} r={3.5}
        fill="#fff" opacity={0.7} />

      {/* ── Core body ── */}
      <circle cx={C} cy={C} r={RE + 4} fill="url(#core)" />
      {/* Subtle inner ring on core */}
      <circle cx={C} cy={C} r={RE + 1} fill="none"
        stroke={`${accent}22`} strokeWidth={0.8} />

      {/* ── EYES ── */}
      {/* Eye sockets */}
      {[-1, 1].map((side) => {
        const ex = C + side * RE * 0.42 + eyeShift.x
        const ey = C - RE * 0.18 + eyeShift.y
        return (
          <g key={side}>
            {/* Iris ring */}
            <circle cx={ex} cy={ey} r={RE * 0.36}
              fill="none" stroke={`${accent}35`} strokeWidth={1} />
            {/* Pupil */}
            <motion.circle
              cx={ex} cy={ey}
              r={blink ? 0.5 : RE * 0.22}
              fill={accent}
              opacity={blink ? 0 : 0.9}
              filter="url(#glow)"
              animate={{ r: blink ? 0.5 : RE * 0.22 }}
              transition={{ duration: 0.08 }}
            />
            {/* Specular reflection */}
            {!blink && (
              <circle
                cx={ex + RE * 0.08} cy={ey - RE * 0.1}
                r={1.5} fill="white" opacity={0.6} />
            )}
            {/* Blink lid */}
            {blink && (
              <ellipse cx={ex} cy={ey}
                rx={RE * 0.36} ry={RE * 0.36}
                fill="#060912" />
            )}
          </g>
        )
      })}

      {/* Subtle "mouth" arc — mood indicator */}
      <path
        d={hour24 >= 6 && hour24 < 22
          ? `M ${C - RE * 0.32} ${C + RE * 0.35} Q ${C} ${C + RE * 0.58} ${C + RE * 0.32} ${C + RE * 0.35}`
          : `M ${C - RE * 0.28} ${C + RE * 0.48} Q ${C} ${C + RE * 0.36} ${C + RE * 0.28} ${C + RE * 0.48}`
        }
        fill="none"
        stroke={`${accent}40`}
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* ── Orbiting micro-particles ── */}
      {[0, 120, 240].map((baseAngle, i) => {
        const angle = baseAngle + secondAngle * 0.15
        const p = pointOnCircle(C, C, R1 + 12, angle)
        return (
          <motion.circle
            key={i}
            cx={p.x} cy={p.y} r={1.5}
            fill={accent}
            opacity={0.2}
            animate={{ opacity: [0.12, 0.35, 0.12] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
          />
        )
      })}
    </motion.svg>
  )
}
