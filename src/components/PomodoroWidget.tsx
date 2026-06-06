import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
const NEUE = "'NeuePower', 'Chakra Petch', monospace"

type Phase = 'focus' | 'short' | 'long'

const PHASES: Record<Phase, { label: string; duration: number; color: string; glow: string }> = {
  focus: { label: 'FOCUS',   duration: 25 * 60, color: '#00E5FF', glow: 'rgba(0,229,255,0.4)' },
  short: { label: 'PAUSA',   duration: 5 * 60,  color: '#4ADE80', glow: 'rgba(74,222,128,0.4)' },
  long:  { label: 'RIPOSO',  duration: 15 * 60, color: '#A78BFA', glow: 'rgba(167,139,250,0.4)' },
}

const SEQUENCE: Phase[] = ['focus', 'short', 'focus', 'short', 'focus', 'short', 'focus', 'long']

export default function PomodoroWidget() {
  const [phase, setPhase] = useState<Phase>('focus')
  const [seqIdx, setSeqIdx] = useState(0)
  const [remaining, setRemaining] = useState(PHASES.focus.duration)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [pulse, setPulse] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cfg = PHASES[phase]

  const advance = useCallback(() => {
    const next = (seqIdx + 1) % SEQUENCE.length
    const nextPhase = SEQUENCE[next]
    setSeqIdx(next)
    setPhase(nextPhase)
    setRemaining(PHASES[nextPhase].duration)
    setRunning(false)
    if (nextPhase === 'focus') setSessions(s => s + 1)
    setPulse(true)
    setTimeout(() => setPulse(false), 800)
  }, [seqIdx])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { advance(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, advance])

  const toggle = () => setRunning(r => !r)
  const reset = () => {
    setRunning(false)
    setRemaining(PHASES[phase].duration)
  }
  const skip = () => advance()

  const total = PHASES[phase].duration
  const progress = 1 - remaining / total
  const S = 120, stroke = 8, r = (S - stroke) / 2
  const circ = 2 * Math.PI * r
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.4 }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${cfg.color}25`,
        borderRadius: 4,
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: SF, fontSize: 9, fontWeight: 700,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Pomodoro
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {SEQUENCE.slice(0, 8).map((p, i) => (
            <div key={i} style={{
              width: p === 'long' ? 8 : 5,
              height: 5,
              borderRadius: 2,
              background: i < seqIdx ? PHASES[p].color :
                         i === seqIdx ? PHASES[p].color :
                         'rgba(255,255,255,0.1)',
              opacity: i < seqIdx ? 0.4 : i === seqIdx ? 1 : 0.25,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Phase tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(Object.keys(PHASES) as Phase[]).map(p => (
          <button key={p}
            onClick={() => { setPhase(p); setRemaining(PHASES[p].duration); setRunning(false) }}
            style={{
              flex: 1, padding: '4px 0', borderRadius: 4, cursor: 'pointer',
              background: phase === p ? `${PHASES[p].color}18` : 'transparent',
              border: `1px solid ${phase === p ? PHASES[p].color + '50' : 'rgba(255,255,255,0.06)'}`,
              fontFamily: SF, fontSize: 9, fontWeight: 700,
              color: phase === p ? PHASES[p].color : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
            }}
          >
            {PHASES[p].label}
          </button>
        ))}
      </div>

      {/* Ring + Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Circular timer */}
        <div style={{ position: 'relative', width: S, height: S, flexShrink: 0 }}>
          <svg width={S} height={S} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
            {/* Track */}
            <circle cx={S/2} cy={S/2} r={r} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
            {/* Glow ring */}
            <motion.circle cx={S/2} cy={S/2} r={r} fill="none"
              stroke={cfg.color} strokeWidth={stroke + 4}
              strokeDasharray={String(circ)}
              animate={{ strokeDashoffset: circ * (1 - progress), opacity: running ? 0.12 : 0.06 }}
              transition={{ duration: 0.5 }}
            />
            {/* Main progress arc */}
            <motion.circle cx={S/2} cy={S/2} r={r} fill="none"
              stroke={cfg.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={String(circ)}
              animate={{ strokeDashoffset: circ * (1 - progress) }}
              transition={{ duration: 0.5, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 6px ${cfg.glow})` }}
            />
            {/* Tip dot */}
            {progress > 0.01 && (
              <motion.circle
                cx={S/2 + r * Math.sin(2 * Math.PI * progress)}
                cy={S/2 - r * Math.cos(2 * Math.PI * progress)}
                r={stroke / 2 + 1}
                fill={cfg.color}
                animate={{ opacity: running ? 1 : 0.5 }}
                style={{ filter: `drop-shadow(0 0 8px ${cfg.color})` }}
              />
            )}
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={`${mm}${ss}`}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  fontFamily: NEUE, fontSize: 22, fontWeight: 700,
                  color: '#fff', letterSpacing: '-0.02em', lineHeight: 1,
                }}
              >
                {mm}:{ss}
              </motion.span>
            </AnimatePresence>
            <motion.span
              animate={{ color: running ? cfg.color : 'rgba(255,255,255,0.3)' }}
              style={{ fontFamily: SF, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {cfg.label}
            </motion.span>
          </div>

          {/* Breathing pulse when running */}
          {running && (
            <motion.div
              animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                background: `radial-gradient(circle, ${cfg.color} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Right side: controls + session counter */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Session dots */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Array.from({ length: Math.max(sessions, 4) }, (_, i) => (
              <motion.div key={i}
                animate={{
                  background: i < sessions ? cfg.color : 'rgba(255,255,255,0.08)',
                  scale: i === sessions - 1 ? [1, 1.4, 1] : 1,
                }}
                transition={{ duration: 0.4 }}
                style={{ width: 8, height: 8, borderRadius: 2,
                  boxShadow: i < sessions ? `0 0 6px ${cfg.color}80` : 'none',
                }}
              />
            ))}
          </div>

          <div style={{ fontFamily: SF, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
            {sessions > 0 ? `${sessions} sessioni oggi` : 'Inizia a lavorare'}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            {/* Play/Pause */}
            <motion.button
              onClick={toggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1, height: 32, borderRadius: 4, cursor: 'pointer',
                background: running ? `${cfg.color}18` : cfg.color,
                border: `1px solid ${running ? cfg.color + '50' : 'transparent'}`,
                fontFamily: SF, fontSize: 13, fontWeight: 700,
                color: running ? cfg.color : '#000',
                transition: 'all 0.2s',
              }}
            >
              {running ? '⏸' : '▶'}
            </motion.button>

            {/* Reset */}
            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 32, height: 32, borderRadius: 4, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.4)',
              }}
            >
              ↺
            </motion.button>

            {/* Skip */}
            <motion.button
              onClick={skip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 32, height: 32, borderRadius: 4, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.4)',
              }}
            >
              ⏭
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
