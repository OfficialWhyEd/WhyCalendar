import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DayData } from '../types/index'
import type { GCalEvent } from '../core/google/calendar'
import { getBriefAnswers } from '../core/storage/local'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
const NEUE = "'NeuePower', 'Chakra Petch', monospace"

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    if (diff === 0) return
    const startTime = Date.now()
    const raf = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const cur = Math.round(start + diff * eased)
      setValue(cur)
      if (t < 1) requestAnimationFrame(raf)
      else prevRef.current = target
    }
    requestAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}

function useLiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ── Ring ──────────────────────────────────────────────────────────────────────
function DayRing({ progress, now }: { progress: number; now: Date }) {
  const S = 140, stroke = 7, r = (S - stroke) / 2
  const circ = 2 * Math.PI * r
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const tipAngle = (progress / 100) * 2 * Math.PI - Math.PI / 2
  const tipX = S / 2 + r * Math.cos(tipAngle)
  const tipY = S / 2 + r * Math.sin(tipAngle)

  return (
    <div style={{ position: 'relative', width: S, height: S, flexShrink: 0 }}>
      {/* Outer breathing glow */}
      <motion.div
        animate={{ opacity: [0.04, 0.14, 0.04], scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.3) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <svg width={S} height={S} style={{ display: 'block' }}>
        {/* Track */}
        <circle cx={S/2} cy={S/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}
          transform={`rotate(-90 ${S/2} ${S/2})`}
        />
        {/* Glow fill arc */}
        <motion.circle cx={S/2} cy={S/2} r={r} fill="none"
          stroke="rgba(0,229,255,0.12)" strokeWidth={stroke + 6}
          strokeDasharray={String(circ)}
          animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform={`rotate(-90 ${S/2} ${S/2})`}
        />
        {/* Main arc */}
        <motion.circle cx={S/2} cy={S/2} r={r} fill="none"
          stroke="#00E5FF" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={String(circ)}
          animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${S/2} ${S/2})`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.9))' }}
        />
        {/* Tip spark */}
        {progress > 0.5 && (
          <motion.circle cx={tipX} cy={tipY} r={5}
            fill="#00E5FF"
            animate={{ r: [4, 6, 4], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,1))' }}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <span style={{ fontFamily: NEUE, fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1,
          letterSpacing: '-0.02em' }}>
          {hh}:{mm}
        </span>
        <motion.span animate={{ opacity: [0.35, 0.75, 0.35] }} transition={{ duration: 1, repeat: Infinity }}
          style={{ fontFamily: NEUE, fontSize: 12, color: '#00E5FF', letterSpacing: '0.05em', marginTop: 2 }}>
          {ss}
        </motion.span>
        <span style={{ fontFamily: SF, fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
          {progress.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ── Griglia oraria (riempie lo spazio vuoto) ──────────────────────────────────
function HourGrid({ events, now, isToday }: { events: GCalEvent[]; now: Date; isToday: boolean }) {
  const gridRef = useRef<HTMLDivElement>(null)
  const START_H = 7, END_H = 23
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const currentH = now.getHours() + now.getMinutes() / 60

  // Scroll to current hour
  useEffect(() => {
    if (!isToday || !gridRef.current) return
    const currentRow = gridRef.current.querySelector('[data-current="true"]') as HTMLElement
    if (currentRow) currentRow.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [isToday])

  return (
    <div ref={gridRef} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {hours.map((h, idx) => {
        const isCurrent = isToday && currentH >= h && currentH < h + 1
        const isPast = isToday && currentH >= h + 1
        const isMainHour = h % 3 === 0
        const rowEvents = events.filter(e =>
          !e.isAllDay &&
          (e.start.getHours() === h ||
           (e.start.getHours() < h && e.end.getHours() > h))
        )
        const subProgress = isCurrent ? (currentH - h) : 0

        return (
          <motion.div
            key={h}
            data-current={isCurrent ? 'true' : undefined}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: isPast ? 0.28 : 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.018, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex', alignItems: 'stretch', minHeight: isCurrent ? 34 : 28, gap: 8,
              background: isCurrent ? 'rgba(0,229,255,0.04)' : 'transparent',
              borderRadius: 5, padding: '1px 4px',
              borderBottom: isMainHour ? '1px solid rgba(255,255,255,0.04)' : 'none',
              position: 'relative', overflow: 'visible',
            }}>
            {/* Sub-hour progress strip (current hour only) */}
            {isCurrent && (
              <motion.div
                animate={{ width: `${subProgress * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
                style={{
                  position: 'absolute', left: 38, top: 0, bottom: 0,
                  background: 'rgba(0,229,255,0.06)', borderRadius: 4,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Hour label */}
            <div style={{ width: 30, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontFamily: NEUE,
                fontSize: isCurrent ? 13 : isMainHour ? 11 : 10,
                color: isCurrent ? '#00E5FF' : isMainHour ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)',
                fontWeight: isCurrent ? 700 : 400,
                letterSpacing: '0.02em',
                textShadow: isCurrent ? '0 0 12px rgba(0,229,255,0.6)' : 'none',
              }}>{h}</span>
            </div>

            {/* Line + events */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', gap: 4 }}>
              {/* Horizontal rule */}
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '50%',
                height: isCurrent ? 2 : 1,
                background: isCurrent
                  ? 'rgba(0,229,255,0.45)'
                  : isMainHour ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                borderRadius: 1,
                transform: 'translateY(-50%)',
                boxShadow: isCurrent ? '0 0 6px rgba(0,229,255,0.3)' : 'none',
              }} />

              {/* NOW dot indicator */}
              {isCurrent && (
                <motion.div
                  animate={{ opacity: [1, 0.1, 1], scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    left: `${(subProgress * 100).toFixed(1)}%`,
                    top: '50%', transform: 'translate(-50%, -50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#00E5FF',
                    boxShadow: '0 0 12px rgba(0,229,255,1)',
                    zIndex: 2,
                  }}
                />
              )}

              {/* Events */}
              <div style={{ position: 'relative', display: 'flex', gap: 4, zIndex: 1, paddingLeft: 12 }}>
                {rowEvents.map(ev => {
                  const isNow = ev.start <= now && ev.end > now
                  return (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, x: -6, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', borderRadius: 5,
                        background: `${ev.color}18`,
                        border: `1px solid ${ev.color}${isNow ? '70' : '28'}`,
                        boxShadow: isNow ? `0 0 12px ${ev.color}35` : 'none',
                      }}>
                      {isNow && (
                        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                          style={{ width: 5, height: 5, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                      )}
                      <span style={{ fontFamily: SF, fontSize: 11, color: isNow ? ev.color : `${ev.color}CC`,
                        fontWeight: isNow ? 600 : 400, whiteSpace: 'nowrap',
                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Next event ─────────────────────────────────────────────────────────────────
function NextEventCard({ event }: { event: GCalEvent }) {
  const [label, setLabel] = useState('')
  const [urgent, setUrgent] = useState(false)
  useEffect(() => {
    function upd() {
      const diff = event.start.getTime() - Date.now()
      if (diff <= 0) { setLabel('In corso'); setUrgent(true); return }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
      setUrgent(diff < 15 * 60000)
      setLabel(h > 0 ? `${h}h ${m}m` : m === 0 ? 'adesso!' : `${m} min`)
    }
    upd(); const id = setInterval(upd, 20000); return () => clearInterval(id)
  }, [event.start])
  const sh = String(event.start.getHours()).padStart(2,'0')
  const sm = String(event.start.getMinutes()).padStart(2,'0')
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: `${event.color}10`, border: `1px solid ${event.color}35`,
      borderLeft: `3px solid ${event.color}`,
      borderRadius: 9,
    }}>
      <motion.div animate={{ opacity: urgent ? [1, 0.1, 1] : [0.6, 1, 0.6] }}
        transition={{ duration: urgent ? 0.7 : 2.5, repeat: Infinity }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: event.color,
          boxShadow: `0 0 8px ${event.color}`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
        <div style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sh}:{sm}</div>
      </div>
      <div style={{ fontFamily: NEUE, fontSize: 14, fontWeight: 700,
        color: urgent ? '#FF5555' : event.color, flexShrink: 0 }}>
        {label}
      </div>
    </div>
  )
}

// ── Free slot widget ──────────────────────────────────────────────────────────
function FreeSlotWidget({ events, now }: { events: GCalEvent[]; now: Date }) {
  const freeSlots: { start: Date; end: Date; mins: number }[] = []
  const sorted = [...events].filter(e => !e.isAllDay && e.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  let cursor = now
  const endOfDay = new Date(now)
  endOfDay.setHours(22, 0, 0, 0)

  for (const ev of sorted) {
    if (ev.start > cursor) {
      const mins = Math.floor((ev.start.getTime() - cursor.getTime()) / 60000)
      if (mins >= 45) freeSlots.push({ start: new Date(cursor), end: new Date(ev.start), mins })
    }
    if (ev.end > cursor) cursor = new Date(ev.end)
  }
  // Trailing slot
  const trailing = Math.floor((endOfDay.getTime() - cursor.getTime()) / 60000)
  if (trailing >= 45) freeSlots.push({ start: new Date(cursor), end: endOfDay, mins: trailing })

  if (freeSlots.length === 0) return null
  const slot = freeSlots[0]
  const sh = String(slot.start.getHours()).padStart(2, '0')
  const sm = String(slot.start.getMinutes()).padStart(2, '0')
  const eh = String(slot.end.getHours()).padStart(2, '0')
  const em = String(slot.end.getMinutes()).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        flexShrink: 0, padding: '9px 13px',
        background: 'rgba(74,222,128,0.05)',
        border: '1px solid rgba(74,222,128,0.15)',
        borderLeft: '3px solid rgba(74,222,128,0.5)',
        borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SF, fontSize: 10, fontWeight: 700,
          color: '#4ADE80', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
          Slot libero
        </div>
        <div style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {sh}:{sm} → {eh}:{em} · {slot.mins}min
        </div>
      </div>
      <motion.div
        whileHover={{ scale: 1.05, background: 'rgba(74,222,128,0.25)' }}
        whileTap={{ scale: 0.96 }}
        style={{
          padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
          background: 'rgba(74,222,128,0.12)',
          border: '1px solid rgba(74,222,128,0.3)',
          fontFamily: SF, fontSize: 10, fontWeight: 700,
          color: '#4ADE80', whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        Focus ⚡
      </motion.div>
    </motion.div>
  )
}

// ── Widget AI proattivo ────────────────────────────────────────────────────────
function getAISuggestions(h: number, cr: number, events: GCalEvent[], taskCount: number): string[] {
  const tips: string[] = []
  const now = new Date()

  // Trova prossimo slot libero (>= 30 min)
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
  let freeStart = new Date()
  for (const ev of sorted) {
    const gapMins = (ev.start.getTime() - freeStart.getTime()) / 60000
    if (gapMins >= 45) {
      const fH = freeStart.getHours(), fM = String(freeStart.getMinutes()).padStart(2,'0')
      tips.push(`Slot libero ${fH}:${fM} — ${Math.floor(gapMins)}min di lavoro profondo`)
      break
    }
    freeStart = new Date(ev.end)
  }

  if (h >= 14 && h < 15) tips.push('Calo post-pranzo fisiologico — 10 min di pausa ricaricano il 25% della concentrazione')
  if (h >= 9 && h < 12 && cr === 0 && taskCount > 0) tips.push('Mattina ad alto potenziale — inizia con il task più difficile ora')
  if (cr >= 75) tips.push(`${Math.round(cr)}% completato — sei nella top percentuale di produttività oggi`)
  if (h >= 17 && taskCount === 0) tips.push('Nessun task programmato — considera di pianificare domani ora')
  if (events.length === 0 && h < 20) tips.push('Giornata libera — blocca del tempo su Calendar per focus o progetti personali')

  // Default
  if (tips.length === 0) {
    const defaults = [
      'Regola dei 2 minuti: se ci vuole < 2 min, fallo subito',
      'Il cervello è al massimo nelle prime 2h della giornata lavorativa',
      'Ogni 90 min di focus, 15-20 min di pausa — ciclo ultradian',
    ]
    tips.push(defaults[now.getMinutes() % defaults.length])
  }

  return tips.slice(0, 2)
}

function AIWidget({ suggestions }: { suggestions: string[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % suggestions.length), 25000)
    return () => clearInterval(id)
  }, [suggestions.length])
  if (suggestions.length === 0) return null
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontFamily: SF, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Suggerimenti AI</div>
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '9px 13px',
            background: 'rgba(167,139,250,0.06)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderLeft: '3px solid rgba(167,139,250,0.6)',
            borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
          <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>✦</span>
          <span style={{ fontFamily: SF, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            {suggestions[idx]}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Insight ────────────────────────────────────────────────────────────────────
function getInsight(h: number, cr: number, next: GCalEvent | null): string {
  if (h < 8) return 'Mattino presto — pianifica la giornata mentre la mente è fresca'
  if (h < 10) return cr > 0 ? 'Ottimo inizio! Mantieni il ritmo' : 'Inizia con il task più importante'
  if (h < 13) {
    if (next) {
      const m = Math.floor((next.start.getTime() - Date.now()) / 60000)
      if (m > 0 && m < 30) return `"${next.title}" tra ${m} min — preparati`
    }
    return cr > 40 ? 'Produttività alta — approfitta della mattinata' : 'Ultimo sprint prima di pranzo'
  }
  if (h < 15) return 'Post-pranzo: orario di calo, affronta task meccanici'
  if (h < 18) return cr > 60 ? 'Ottimo ritmo pomeridiano!' : 'Push finale — chiudi le priorità'
  if (h < 21) return cr > 70 ? `Brava giornata — ${Math.round(cr)}% completato!` : 'Chiudi le priorità principali'
  return 'Sera — rilassa e pianifica domani'
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DayDetail({ day, calendarEvents = [] }: { day: DayData; calendarEvents?: GCalEvent[] }) {
  const now = useLiveClock()
  const progress = useMemo(() => {
    const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
    return (s / 86400) * 100
  }, [now])
  const rH = Math.floor((24 * 60 - now.getHours() * 60 - now.getMinutes()) / 60)
  const rM = (24 * 60 - now.getHours() * 60 - now.getMinutes()) % 60
  const timedEvents = calendarEvents.filter(e => !e.isAllDay)
  const nextEvent = useMemo(() => {
    if (!day.isToday) return null
    return timedEvents.filter(e => e.end > now).sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
  }, [timedEvents, now, day.isToday])
  const completedTasks = day.tasks.filter(t => t.status === 'completed').length
  const completionRate = day.tasks.length > 0 ? (completedTasks / day.tasks.length) * 100 : 0
  const animatedRate = useCountUp(Math.round(completionRate))
  const insight = getInsight(now.getHours(), completionRate, nextEvent)
  const aiSuggestions = useMemo(
    () => getAISuggestions(now.getHours(), completionRate, timedEvents, day.tasks.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.getHours(), completionRate, timedEvents.length, day.tasks.length]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: NEUE, fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1,
            letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {day.dayName}
          </div>
          <div style={{ fontFamily: SF, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {String(day.dayNumber).padStart(2,'0')} {day.monthName} {day.year}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: SF, fontSize: 10, fontWeight: 700,
          color: day.isToday ? '#00E5FF' : day.isPast ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.4)',
          background: day.isToday ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${day.isToday ? 'rgba(0,229,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 20, padding: '5px 12px', letterSpacing: '0.08em',
        }}>
          {day.isToday && (
            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E5FF' }} />
          )}
          {day.isToday ? 'OGGI' : day.isPast ? 'PASSATO' : `+${Math.ceil((new Date(day.date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)}G`}
        </div>
      </div>

      {/* ── Riepilogo giorno passato ── */}
      {day.isPast && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '14px 16px', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
          {/* Big completion circle */}
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}/>
              <motion.circle cx={32} cy={32} r={26} fill="none"
                stroke={completionRate >= 75 ? '#4ADE80' : completionRate >= 40 ? '#00E5FF' : 'rgba(255,255,255,0.2)'}
                strokeWidth={5} strokeLinecap="round"
                strokeDasharray={String(2 * Math.PI * 26)}
                initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - completionRate / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: NEUE, fontSize: 13, fontWeight: 700,
                color: completionRate >= 75 ? '#4ADE80' : 'rgba(255,255,255,0.6)' }}>
                {Math.round(completionRate)}%
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              {completionRate >= 80 ? '🌟 Ottima giornata' :
               completionRate >= 50 ? '✓ Buona giornata' :
               completedTasks === 0 ? '○ Nessun task' : '~ In progress'}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {completedTasks}/{day.tasks.length} task
              </span>
              <span style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {timedEvents.length} eventi
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Preview giorno futuro ── */}
      {!day.isToday && !day.isPast && timedEvents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)',
            borderLeft: '3px solid rgba(167,139,250,0.4)',
            borderRadius: 10, padding: '12px 14px', flexShrink: 0,
          }}>
          <div style={{ fontFamily: SF, fontSize: 9, fontWeight: 700,
            color: 'rgba(167,139,250,0.7)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 8 }}>
            In programma
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {timedEvents.slice(0, 3).map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                <span style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.5)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(ev.start.getHours()).padStart(2,'0')}:{String(ev.start.getMinutes()).padStart(2,'0')} {ev.title}
                </span>
              </div>
            ))}
            {timedEvents.length > 3 && (
              <span style={{ fontFamily: SF, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                +{timedEvents.length - 3} altri
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Pannello live (oggi) ── */}
      {day.isToday && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px', flexShrink: 0,
          }}>
          {/* Ring + tempo rimasto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <DayRing progress={progress} now={now} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SF, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Tempo rimasto
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 14 }}>
                <span style={{ fontFamily: NEUE, fontSize: 44, fontWeight: 700, color: '#fff',
                  lineHeight: 1, letterSpacing: '-0.03em' }}>{rH}</span>
                <span style={{ fontFamily: SF, fontSize: 14, color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>h</span>
                <span style={{ fontFamily: NEUE, fontSize: 44, fontWeight: 700, color: '#fff',
                  lineHeight: 1, letterSpacing: '-0.03em' }}>{String(rM).padStart(2,'0')}</span>
                <span style={{ fontFamily: SF, fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>m</span>
              </div>
              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'TASK', value: `${completedTasks}/${day.tasks.length}`, color: completionRate >= 75 ? '#4ADE80' : '#00E5FF' },
                  { label: 'FATTI', value: `${animatedRate}%`, color: completionRate >= 75 ? '#4ADE80' : 'rgba(255,255,255,0.4)' },
                  { label: 'EVENTI', value: String(timedEvents.length), color: '#A78BFA' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 7, padding: '6px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: NEUE, fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontFamily: SF, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2,
                      letterSpacing: '0.08em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barra segmentata */}
          <div style={{ marginTop: 14, display: 'flex', gap: 2, height: 5 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: 2,
                background: i < Math.floor((progress / 100) * 24)
                  ? `rgba(0,229,255,${0.25 + (i / 24) * 0.75})`
                  : 'rgba(255,255,255,0.04)',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {[0, 6, 12, 18, 24].map(h => (
              <span key={h} style={{ fontFamily: SF, fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>{h}</span>
            ))}
          </div>

          {/* Insight */}
          <AnimatePresence mode="wait">
            <motion.div key={insight}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                marginTop: 10, padding: '8px 12px',
                background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)',
                borderRadius: 7, display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{ fontSize: 8, color: '#00E5FF', flexShrink: 0, marginTop: 2 }}>●</motion.span>
              <span style={{ fontFamily: SF, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {insight}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Energy bar (da Morning Brief) ── */}
      {day.isToday && (() => {
        const brief = getBriefAnswers(day.date)
        const energyNum = typeof brief?.energy === 'number' ? brief.energy : 0
        if (energyNum < 1 || energyNum > 10) return null
        const energyColor = energyNum >= 8 ? '#4ADE80' : energyNum >= 5 ? '#00E5FF' : '#F87171'
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: SF, fontSize: 9, fontWeight: 700,
              color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em',
              textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Energia
            </span>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${energyNum * 10}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', borderRadius: 2, background: energyColor,
                  boxShadow: `0 0 8px ${energyColor}80` }}
              />
            </div>
            <span style={{ fontFamily: NEUE, fontSize: 12, fontWeight: 700,
              color: energyColor, minWidth: 18, textAlign: 'right' }}>
              {energyNum}
            </span>
          </motion.div>
        )
      })()}

      {/* ── Prossimo evento ── */}
      <AnimatePresence>
        {nextEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: SF, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Prossimo</div>
            <NextEventCard event={nextEvent} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task ── */}
      {day.tasks.length > 0 && (
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: SF, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)',
              textTransform: 'uppercase', letterSpacing: '0.12em' }}>Task</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 60, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div animate={{ width: `${completionRate}%` }} transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
                  style={{ height: '100%', borderRadius: 2, background: completionRate >= 75 ? '#4ADE80' : '#00E5FF' }} />
              </div>
              <motion.span
                key={`${completedTasks}-${day.tasks.length}`}
                initial={{ scale: 1.4, color: '#00E5FF' }}
                animate={{ scale: 1, color: 'rgba(255,255,255,0.25)' }}
                transition={{ duration: 0.5 }}
                style={{ fontFamily: NEUE, fontSize: 10 }}>
                {completedTasks}/{day.tasks.length}
              </motion.span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AnimatePresence>
              {[...day.tasks].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(task => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 7, overflow: 'hidden',
                    background: task.status === 'completed' ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${task.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <motion.div
                    animate={{
                      background: task.status === 'completed' ? '#4ADE80' : 'rgba(255,255,255,0.06)',
                      scale: task.status === 'completed' ? [1, 1.4, 1] : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    style={{
                      width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                      border: task.status !== 'completed' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {task.status === 'completed' && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                        style={{ fontSize: 8, color: '#000', fontWeight: 700 }}>✓</motion.span>
                    )}
                  </motion.div>
                  {/* Testo con strikethrough animato */}
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <span style={{ fontFamily: SF, fontSize: 12,
                      color: task.status === 'completed' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)',
                    }}>
                      {task.title}
                    </span>
                    {task.status === 'completed' && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          position: 'absolute', left: 0, right: 0,
                          top: '50%', height: 1,
                          background: 'rgba(74,222,128,0.6)',
                          transformOrigin: 'left',
                        }}
                      />
                    )}
                  </div>
                  {task.startTime && (
                    <span style={{ fontFamily: NEUE, fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                      {task.startTime}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Free slot widget ── */}
      {day.isToday && <FreeSlotWidget events={timedEvents} now={now} />}

      {/* ── Widget AI suggerimenti ── */}
      {day.isToday && <AIWidget suggestions={aiSuggestions} />}

      {/* ── Griglia ore ── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: SF, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          Orario
        </div>
        <HourGrid events={timedEvents} now={now} isToday={day.isToday} />
      </div>

    </div>
  )
}
