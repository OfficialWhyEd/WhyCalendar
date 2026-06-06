import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addDays, getDayData } from '../utils/date'
import type { GCalEvent } from '../core/google/calendar'

interface TimelineEvent {
  id: string
  title: string
  startHour: number
  endHour: number
  color: string
}

interface DayCol {
  offset: number
  date: Date
  dayName: string
  dayNum: number
  isToday: boolean
  isPast: boolean
}

function buildCols(): DayCol[] {
  const today = new Date()
  return [-2, -1, 0, 1, 2].map(offset => {
    const date = addDays(today, offset)
    const data = getDayData(date)
    return { offset, date, dayName: data.dayName, dayNum: data.dayNumber, isToday: offset === 0, isPast: offset < 0 }
  })
}

function gcalToTimeline(events: GCalEvent[]): TimelineEvent[] {
  return events.filter(e => !e.isAllDay).map(e => ({
    id: e.id,
    title: e.title,
    startHour: e.start.getHours() + e.start.getMinutes() / 60,
    endHour: e.end.getHours() + e.end.getMinutes() / 60,
    color: e.color,
  }))
}

const pct = (h: number) => `${(h / 24) * 100}%`
const fmtH = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`

const HOUR_TICKS = [6, 9, 12, 15, 18, 21]
const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

interface TooltipData { col: DayCol; events: TimelineEvent[]; x: number; y: number }

interface TimelineProps {
  eventsFor?: (date: Date) => GCalEvent[]
  connected?: boolean
}

export default function Timeline({ eventsFor }: TimelineProps) {
  const [currentHour, setCurrentHour] = useState(0)
  const [cols] = useState<DayCol[]>(buildCols)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  useEffect(() => {
    const upd = () => {
      const n = new Date()
      setCurrentHour(n.getHours() + n.getMinutes() / 60)
    }
    upd()
    const id = setInterval(upd, 20000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      height: 190,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(6,6,8,0.98)',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Ambient glow behind today */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        left: '40%', width: '20%',
        background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {cols.map((col, i) => {
        const events = eventsFor ? gcalToTimeline(eventsFor(col.date)) : []
        const flex = col.isToday ? 2.2 : 1

        return (
          <motion.div
            key={col.offset}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setTooltip({ col, events, x: r.left + r.width / 2, y: r.top })
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{
              flex,
              display: 'flex',
              flexDirection: 'column',
              padding: col.isToday ? '14px 14px 10px' : '14px 8px 10px',
              borderRight: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: col.isToday ? 'rgba(0,229,255,0.03)' : 'transparent',
              position: 'relative',
              cursor: 'default',
              opacity: col.isPast ? 0.38 : col.isToday ? 1 : 0.65,
              transition: 'opacity 0.2s',
            }}
            whileHover={{ opacity: 1 }}
          >
            {/* Left border accent for today */}
            {col.isToday && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: 'linear-gradient(to bottom, transparent, #00E5FF, transparent)',
                opacity: 0.6,
              }} />
            )}

            {/* Day header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, flexShrink: 0 }}>
              <span style={{
                fontFamily: "'NeuePower', 'Chakra Petch', monospace",
                fontSize: col.isToday ? 11 : 9,
                letterSpacing: '0.18em',
                color: col.isToday ? '#00E5FF' : 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
              }}>
                {col.dayName.substring(0, 3)}
              </span>
              <span style={{
                fontFamily: "'NeuePower', 'Chakra Petch', monospace",
                fontSize: col.isToday ? 28 : 20,
                fontWeight: 700,
                lineHeight: 1,
                color: col.isToday ? '#fff' : 'rgba(255,255,255,0.6)',
                textShadow: col.isToday ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
                transition: 'font-size 0.2s',
              }}>
                {col.dayNum}
              </span>
              {col.isToday && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    fontFamily: "'NeuePower', 'Chakra Petch', monospace",
                    fontSize: 8, letterSpacing: '0.22em',
                    color: '#00E5FF', marginLeft: 2,
                  }}
                >
                  OGGI
                </motion.span>
              )}
            </div>

            {/* 24h track */}
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

              {/* Track background */}
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: '50%', height: col.isToday ? 3 : 2,
                transform: 'translateY(-50%)',
                background: col.isToday
                  ? 'linear-gradient(to right, rgba(0,229,255,0.08), rgba(0,229,255,0.18), rgba(0,229,255,0.08))'
                  : 'rgba(255,255,255,0.07)',
                borderRadius: 2,
              }} />

              {/* Hour ticks */}
              {HOUR_TICKS.map(h => (
                <div key={h} style={{
                  position: 'absolute',
                  left: pct(h),
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 1,
                  height: col.isToday ? 10 : 6,
                  background: col.isToday ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.1)',
                }} />
              ))}

              {/* Hour labels — today only */}
              {col.isToday && [6, 12, 18].map(h => (
                <div key={h} style={{
                  position: 'absolute',
                  left: pct(h),
                  bottom: 0,
                  transform: 'translateX(-50%)',
                  fontFamily: "'NeuePower', 'Chakra Petch', monospace",
                  fontSize: 8,
                  color: 'rgba(0,229,255,0.35)',
                  letterSpacing: '0.05em',
                  userSelect: 'none',
                }}>
                  {h}
                </div>
              ))}

              {/* Events */}
              {events.map(ev => {
                const left = (ev.startHour / 24) * 100
                const width = Math.max(((ev.endHour - ev.startHour) / 24) * 100, col.isToday ? 2 : 1.2)
                const duration = ev.endHour - ev.startHour
                return (
                  <div
                    key={ev.id}
                    title={`${ev.title} ${fmtH(ev.startHour)}–${fmtH(ev.endHour)}`}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top: col.isToday ? '20%' : '25%',
                      height: col.isToday ? '60%' : '50%',
                      background: `${ev.color}22`,
                      borderTop: `2px solid ${ev.color}`,
                      borderRadius: '0 0 2px 2px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {col.isToday && duration >= 1 && (
                      <span style={{
                        fontFamily: SF,
                        fontSize: 9,
                        color: ev.color,
                        paddingLeft: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        opacity: 0.9,
                      }}>
                        {ev.title}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Current time needle — today only */}
              {col.isToday && (
                <div style={{
                  position: 'absolute',
                  left: pct(currentHour),
                  top: '-18%',
                  bottom: '2%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                }}>
                  {/* Needle line */}
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      left: '50%', top: 0, bottom: 0,
                      width: 2, transform: 'translateX(-50%)',
                      background: 'linear-gradient(to bottom, transparent 0%, #00E5FF 20%, #00E5FF 80%, transparent 100%)',
                      boxShadow: '0 0 8px rgba(0,229,255,0.6)',
                      borderRadius: 1,
                    }}
                  />
                  {/* Pulsing dot */}
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: '40%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: '#00E5FF',
                      boxShadow: '0 0 12px rgba(0,229,255,1)',
                    }}
                  />
                  {/* Outer ring */}
                  <motion.div
                    animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: '40%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8, height: 8,
                      borderRadius: '50%',
                      border: '1px solid rgba(0,229,255,0.6)',
                    }}
                  />
                  {/* Time label */}
                  <div style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '50%',
                    transform: 'translate(-50%, -100%)',
                    fontFamily: "'NeuePower', 'Chakra Petch', monospace",
                    fontSize: 8,
                    color: '#00E5FF',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    textShadow: '0 0 8px rgba(0,229,255,0.8)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '1px 4px',
                    borderRadius: 3,
                  }}>
                    {fmtH(currentHour)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Hover tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              bottom: `calc(100vh - ${tooltip.y}px + 10px)`,
              left: tooltip.x,
              transform: 'translateX(-50%)',
              background: '#0e0e12',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '12px 16px',
              pointerEvents: 'none',
              zIndex: 400,
              boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
              minWidth: 180,
              maxWidth: 260,
            }}
          >
            <div style={{
              fontFamily: "'NeuePower', 'Chakra Petch', monospace",
              fontSize: 9, letterSpacing: '0.2em',
              color: tooltip.col.isToday ? '#00E5FF' : 'rgba(255,255,255,0.3)',
              marginBottom: 10, textTransform: 'uppercase',
            }}>
              {tooltip.col.dayName} {tooltip.col.dayNum}
              {tooltip.col.isToday ? ' · OGGI' : tooltip.col.isPast ? ' · PASSATO' : ''}
            </div>

            {tooltip.events.length === 0 ? (
              <div style={{ fontFamily: SF, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                Nessun evento
              </div>
            ) : tooltip.events.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SF, fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                    {ev.title}
                  </div>
                  <div style={{ fontFamily: "'NeuePower', 'Chakra Petch', monospace", fontSize: 9, color: ev.color, opacity: 0.7, letterSpacing: '0.05em' }}>
                    {fmtH(ev.startHour)} – {fmtH(ev.endHour)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
