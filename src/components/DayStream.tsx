import { motion } from 'framer-motion'
import { getDayName, getMonthName, isToday, formatDate, parseDate } from '../utils/date'
import { getTasksByDate } from '../core/storage/local'
import type { GCalEvent } from '../core/google/calendar'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
const NEUE = "'NeuePower', 'Chakra Petch', monospace"

interface DayStreamProps {
  days: Date[]
  selectedDate: Date
  onSelect: (date: Date) => void
  eventsFor?: (date: Date) => GCalEvent[]
}

function DayBlock({ date, selected, onClick, calEvents }: {
  date: Date; selected: boolean; onClick: () => void; calEvents?: GCalEvent[]
}) {
  const today = isToday(date)
  const dateStr = formatDate(date)
  const tasks = getTasksByDate(dateStr)
  const completed = tasks.filter(t => t.status === 'completed').length
  const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  const isPast = date < new Date(new Date().toDateString())
  const diff = Math.ceil((parseDate(dateStr).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)

  // Opacity: mai sotto 0.5, così si leggono sempre
  const opacity = selected ? 1
    : today ? 1
    : isPast ? Math.max(0.5, 0.4 + (rate / 100) * 0.45)
    : 0.6

  return (
    <motion.button
      onClick={onClick}
      animate={{ width: selected ? 130 : 72, opacity }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      whileHover={{ opacity: 1, scale: 1.02 }}
      style={{
        background: selected ? 'rgba(0,229,255,0.09)' : today ? 'rgba(0,229,255,0.03)' : 'transparent',
        border: selected
          ? '1px solid rgba(0,229,255,0.5)'
          : today ? '1px solid rgba(0,229,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 4,
        padding: selected ? '12px 16px' : '10px 6px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, position: 'relative', overflow: 'hidden',
        flexShrink: 0,
        boxShadow: selected ? '0 0 20px rgba(0,229,255,0.12)' : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Glow today */}
      {today && (
        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Nome giorno */}
      <span style={{
        fontFamily: SF, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.18em',
        color: selected ? '#00E5FF' : today ? 'rgba(0,229,255,0.7)' : 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase',
      }}>
        {getDayName(date, true)}
      </span>

      {/* Numero giorno — grande */}
      <span style={{
        fontFamily: NEUE, fontSize: selected ? 30 : 22, fontWeight: 700,
        color: selected ? '#fff' : today ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
        lineHeight: 1,
        textShadow: selected ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
        transition: 'font-size 0.2s',
      }}>
        {String(date.getDate()).padStart(2, '0')}
      </span>

      {/* Mese */}
      <span style={{
        fontFamily: SF, fontSize: 9, fontWeight: 600,
        letterSpacing: '0.15em',
        color: selected ? 'rgba(0,229,255,0.7)' : 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
      }}>
        {getMonthName(date, true)}
      </span>

      {/* Badge OGGI / +N */}
      {today && (
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontFamily: SF, fontSize: 8, letterSpacing: '0.25em', color: '#00E5FF', fontWeight: 700 }}
        >
          OGGI
        </motion.span>
      )}
      {!today && !isPast && diff > 0 && (
        <span style={{ fontFamily: SF, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>+{diff}</span>
      )}

      {/* % completamento per giorni passati */}
      {isPast && tasks.length > 0 && (
        <span style={{
          fontFamily: SF, fontSize: 9, fontWeight: 600,
          color: rate >= 75 ? '#4ADE80' : rate >= 50 ? '#00E5FF' : 'rgba(255,255,255,0.4)',
        }}>
          {rate}%
        </span>
      )}

      {/* Dot eventi GCal */}
      {calEvents && calEvents.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 50, marginTop: 2 }}>
          {calEvents.slice(0, 5).map(ev => (
            <div key={ev.id} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: ev.color,
              boxShadow: `0 0 4px ${ev.color}99`,
              opacity: today ? 1 : 0.7,
            }} />
          ))}
          {calEvents.length > 5 && (
            <span style={{ fontFamily: SF, fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>+{calEvents.length - 5}</span>
          )}
        </div>
      )}
    </motion.button>
  )
}

export default function DayStream({ days, selectedDate, onSelect, eventsFor }: DayStreamProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 18px',
      overflowX: 'auto', overflowY: 'hidden',
      height: '100%',
      scrollbarWidth: 'none',
    }}>
      {days.map(day => (
        <DayBlock
          key={formatDate(day)}
          date={day}
          selected={formatDate(day) === formatDate(selectedDate)}
          onClick={() => onSelect(day)}
          calEvents={eventsFor ? eventsFor(day) : undefined}
        />
      ))}
    </div>
  )
}
