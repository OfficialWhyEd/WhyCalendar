import { motion } from 'framer-motion'

interface StatusBadgeProps {
  online?: boolean
}

export default function StatusBadge({ online = true }: StatusBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: online ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${online ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
        borderRadius: 20,
      }}
    >
      <motion.div
        animate={online ? { opacity: [1, 0.3, 1] } : { opacity: 0.4 }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: online ? 'var(--cyan)' : 'var(--text-muted)',
          boxShadow: online ? '0 0 6px var(--cyan-glow)' : 'none',
        }}
      />
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.25em',
        color: online ? 'var(--cyan)' : 'var(--text-dim)',
        textTransform: 'uppercase',
      }}>
        {online ? 'ONLINE' : 'OFFLINE'}
      </span>
    </motion.div>
  )
}
