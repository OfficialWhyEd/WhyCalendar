import { motion, AnimatePresence } from 'framer-motion'

const DEMO_SUGGESTIONS = [
  {
    id: '1',
    type: 'schedule' as const,
    text: 'Hai 3 slot liberi domani mattina. Vuoi pianificare qualcosa?',
    priority: 'medium' as const,
    createdAt: new Date().toISOString(),
    dismissed: false,
  },
  {
    id: '2',
    type: 'reminder' as const,
    text: 'Il task "MEMORY.md" è indietro da 3 giorni. Vuoi farlo oggi?',
    priority: 'high' as const,
    createdAt: new Date().toISOString(),
    dismissed: false,
  },
  {
    id: '3',
    type: 'pattern' as const,
    text: 'Di solito alle 11:00 fai le email. Vuoi programmarlo?',
    priority: 'low' as const,
    createdAt: new Date().toISOString(),
    dismissed: false,
  },
]

export default function SuggestionPanel() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Suggerimenti
        </h2>
      </div>

      {/* Suggestions */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <AnimatePresence>
          {DEMO_SUGGESTIONS.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: s.priority === 'high' ? 'rgba(255,122,51,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${s.priority === 'high' ? 'rgba(255,122,51,0.25)' : 'var(--border)'}`,
                borderRadius: 0,
                padding: '14px 16px',
                position: 'relative',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                paddingRight: 24,
              }}>
                {s.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
