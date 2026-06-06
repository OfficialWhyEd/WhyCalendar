import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDayName, getMonthName } from '../utils/date'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

function SlotDigit({ value, size = 84 }: { value: string; size?: number }) {
  const [prev, setPrev] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value !== prev) {
      setAnimating(true)
      const t = setTimeout(() => {
        setPrev(value)
        setAnimating(false)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [value, prev])

  return (
    <div style={{ position: 'relative', width: size * 0.65, height: size * 1.1, overflow: 'hidden' }}>
      {animating && (
        <motion.span
          key={`exit-${prev}`}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: '-110%', opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 1, 1] }}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: size, fontWeight: 700, color: '#fff', lineHeight: 1,
          }}
        >
          {prev}
        </motion.span>
      )}
      <motion.span
        key={value}
        initial={animating ? { y: '110%', opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: size, fontWeight: 700, color: '#fff',
          textShadow: '0 0 40px rgba(0,229,255,0.12)', lineHeight: 1,
        }}
      >
        {value}
      </motion.span>
    </div>
  )
}

export default function Clock() {
  const [now, setNow] = useState(new Date())
  const [hourFlash, setHourFlash] = useState(false)
  const [minFlash, setMinFlash] = useState(false)
  const prevHH = useRef('')
  const prevMM = useRef('')

  useEffect(() => {
    let raf: number
    const tick = () => { setNow(new Date()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  // Flash effects on change
  useEffect(() => {
    if (prevHH.current && prevHH.current !== hh) {
      setHourFlash(true)
      setTimeout(() => setHourFlash(false), 600)
    }
    prevHH.current = hh
  }, [hh])

  useEffect(() => {
    if (prevMM.current && prevMM.current !== mm) {
      setMinFlash(true)
      setTimeout(() => setMinFlash(false), 300)
    }
    prevMM.current = mm
  }, [mm])

  const secProgress = now.getSeconds() / 60
  const minProgress = (now.getMinutes() + now.getSeconds() / 60) / 60

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', height: '100%',
      padding: '36px 8px 24px',
      gap: 0, overflow: 'hidden',
    }}>
      {/* Hour flash overlay */}
      <AnimatePresence>
        {hourFlash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: 4,
              background: 'radial-gradient(circle at 50% 30%, rgba(0,229,255,0.18) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      {/* HH */}
      <div style={{ display: 'flex', gap: 2, position: 'relative' }}>
        <SlotDigit value={hh[0]} />
        <SlotDigit value={hh[1]} />
        {hourFlash && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1.1 }} animate={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: -8, borderRadius: 4,
              border: '2px solid rgba(0,229,255,0.6)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Divider with minute progress */}
      <div style={{ width: '78%', height: 2, background: 'rgba(255,255,255,0.04)', margin: '4px auto', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${minProgress * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ height: '100%', background: 'rgba(0,229,255,0.5)', borderRadius: 1, boxShadow: '0 0 6px rgba(0,229,255,0.6)' }}
        />
      </div>

      {/* MM */}
      <div style={{ display: 'flex', gap: 2, position: 'relative' }}>
        <SlotDigit value={mm[0]} />
        <SlotDigit value={mm[1]} />
        {minFlash && (
          <motion.div
            initial={{ opacity: 0.5, scale: 1.05 }} animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: -4, borderRadius: 4,
              border: '1px solid rgba(0,229,255,0.4)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Divider with second progress */}
      <div style={{ width: '78%', height: 2, background: 'rgba(255,255,255,0.04)', margin: '4px auto', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${secProgress * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ height: '100%', background: 'rgba(0,229,255,0.25)', borderRadius: 1 }}
        />
      </div>

      {/* Secondi */}
      <motion.div
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: '#fff', letterSpacing: '-0.02em', lineHeight: 1,
        }}
      >
        {ss}
      </motion.div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Data */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginBottom: 4 }}>
        <span style={{
          fontFamily: SF, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', color: 'rgba(0,229,255,0.6)',
          textTransform: 'uppercase',
        }}>
          {getDayName(now, true)}
        </span>
        <motion.span
          key={now.getDate()}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
            color: 'rgba(255,255,255,0.8)', letterSpacing: '-0.01em', lineHeight: 1,
          }}>
          {String(now.getDate()).padStart(2, '0')}
        </motion.span>
        <span style={{
          fontFamily: SF, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', color: 'rgba(0,229,255,0.6)',
          textTransform: 'uppercase',
        }}>
          {getMonthName(now, true)}
        </span>
      </div>
    </div>
  )
}
