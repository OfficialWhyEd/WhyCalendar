import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
  completed: number
  total: number
}

export default function ProgressIndicator({ completed, total }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  let barColor = 'var(--warm)'
  if (percentage >= 75) barColor = 'var(--green)'
  else if (percentage >= 50) barColor = 'var(--cyan)'
  else if (percentage >= 25) barColor = 'var(--cyan)'

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          letterSpacing: '0.25em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
        }}>
          Progresso
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: barColor,
          textShadow: percentage >= 50 ? `0 0 12px ${barColor === 'var(--green)' ? 'var(--green-glow)' : 'var(--cyan-glow)'}` : 'none',
        }}>
          {percentage}%
        </span>
      </div>

      {/* Bar */}
      <div style={{
        width: '100%',
        height: 6,
        background: 'rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: barColor,
            boxShadow: percentage >= 50 ? `0 0 16px ${barColor === 'var(--green)' ? 'var(--green-glow)' : 'var(--cyan-glow)'}` : 'none',
          }}
        />
      </div>

      {/* Count */}
      <div style={{
        marginTop: 6,
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
      }}>
        {completed}/{total} completati
      </div>
    </div>
  )
}
