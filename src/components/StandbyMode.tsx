import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getDayName, getMonthName } from '../utils/date'
import type { GCalEvent } from '../core/google/calendar'
import WhySpidey from './WhySpidey'

const CHARS = '0123456789'

function ScrambleDigit({ value, size = 120 }: { value: string; size?: number }) {
  const [display, setDisplay] = useState(value)
  const [scrambling, setScrambling] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    prevRef.current = value
    setScrambling(true)
    let count = 0
    const id = setInterval(() => {
      if (count < 10) {
        setDisplay(CHARS[Math.floor(Math.random() * CHARS.length)])
        count++
      } else {
        setDisplay(value)
        setScrambling(false)
        clearInterval(id)
      }
    }, 30)
    return () => clearInterval(id)
  }, [value])

  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize: size, fontWeight: 900, lineHeight: 1,
      color: scrambling ? 'rgba(0,229,255,0.5)' : '#ffffff',
      textShadow: scrambling ? '0 0 32px rgba(0,229,255,0.9)' : '0 0 40px rgba(255,255,255,0.06)',
      transition: 'color 0.06s, text-shadow 0.06s',
      display: 'inline-block', minWidth: '0.58em', textAlign: 'center',
    }}>
      {display}
    </span>
  )
}

interface StandbyModeProps {
  onExit: () => void
  eventsFor?: (date: Date) => GCalEvent[]
}

export default function StandbyMode({ onExit, eventsFor }: StandbyModeProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const dayName = getDayName(now, false).toUpperCase()
  const dayNum = String(now.getDate()).padStart(2, '0')
  const month = getMonthName(now, false).toUpperCase()
  const progress = ((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100

  const todayEvents = eventsFor
    ? eventsFor(now)
        .filter(e => e.start.getHours() + e.start.getMinutes() / 60 > now.getHours() + now.getMinutes() / 60)
        .slice(0, 3)
    : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      onClick={onExit}
      style={{
        position: 'fixed', inset: 0,
        background: '#010103',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'none',
        userSelect: 'none',
        gap: 80,
      }}
    >
      {/* Deep radial atmosphere */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 90% 60% at 35% 50%, rgba(0,229,255,0.028) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 75% 50%, rgba(168,85,247,0.018) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />

      {/* Exit hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ delay: 4 }}
        style={{
          position: 'absolute', top: 22, right: 22,
          fontFamily: 'var(--font-mono)', fontSize: 8,
          color: 'rgba(255,255,255,0.5)', letterSpacing: '0.4em',
        }}
      >
        TOCCA PER USCIRE
      </motion.div>


      {/* ── LEFT: Mascot ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
      >
        <WhySpidey eventsFor={eventsFor} />
      </motion.div>

      {/* ── RIGHT: Clock + info ── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
      >
        {/* HH:MM */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <ScrambleDigit value={hh[0]} size={130} />
          <ScrambleDigit value={hh[1]} size={130} />
          <motion.span
            animate={{ opacity: [1, 0.08, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 86, fontWeight: 900,
              color: 'rgba(0,229,255,0.45)',
              lineHeight: 1, padding: '0 4px', paddingTop: 4,
            }}
          >:</motion.span>
          <ScrambleDigit value={mm[0]} size={130} />
          <ScrambleDigit value={mm[1]} size={130} />
        </div>

        {/* Seconds — QZ Teletype */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: -10 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 28,
            color: 'rgba(0,229,255,0.3)', letterSpacing: '0.14em',
          }}>
            {ss}
          </span>
        </div>

        {/* Date */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.5em', color: 'rgba(0,229,255,0.38)',
            marginTop: 20, marginBottom: 32,
          }}
        >
          {dayName} · {dayNum} {month}
        </motion.div>

        {/* Day progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 380 }}
        >
          {/* Time labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            {['00', '06', '12', '18', '24'].map(h => (
              <span key={h} style={{
                fontFamily: 'var(--font-mono)', fontSize: 8,
                color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em',
              }}>{h}</span>
            ))}
          </div>

          {/* Track */}
          <div style={{
            width: '100%', height: 2,
            background: 'rgba(255,255,255,0.05)', borderRadius: 2,
            position: 'relative',
          }}>
            {[6, 12, 18].map(h => (
              <div key={h} style={{
                position: 'absolute', left: `${(h / 24) * 100}%`,
                top: -3, width: 1, height: 8,
                background: 'rgba(255,255,255,0.1)',
                transform: 'translateX(-50%)',
              }} />
            ))}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.6, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, rgba(0,229,255,0.18), #00E5FF)',
                borderRadius: 2,
                boxShadow: '0 0 10px rgba(0,229,255,0.45)',
                position: 'relative',
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.15, 1], scale: [1, 1.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', right: -5, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#00E5FF',
                  boxShadow: '0 0 14px rgba(0,229,255,1)',
                }}
              />
            </motion.div>
          </div>

          <div style={{
            textAlign: 'right', marginTop: 7,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'rgba(0,229,255,0.28)', letterSpacing: '0.28em',
          }}>
            {progress.toFixed(1)}% DELLA GIORNATA
          </div>
        </motion.div>

        {/* Upcoming events */}
        {todayEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ marginTop: 28, width: 380 }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              letterSpacing: '0.45em', color: 'rgba(255,255,255,0.18)',
              marginBottom: 12, textTransform: 'uppercase',
            }}>
              Prossimi
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {todayEvents.map((ev, i) => {
                const h = String(ev.start.getHours()).padStart(2, '0')
                const m = String(ev.start.getMinutes()).padStart(2, '0')
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.08 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: ev.color, minWidth: 42, letterSpacing: '0.05em',
                    }}>
                      {h}:{m}
                    </span>
                    <div style={{
                      width: 2, height: 12, borderRadius: 1,
                      background: ev.color, opacity: 0.45,
                    }} />
                    <span style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontSize: 13, color: 'rgba(255,255,255,0.6)',
                    }}>
                      {ev.title}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
