import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const QUESTIONS = [
  { id: 'focus',   emoji: '🎯', label: 'FOCUS',   text: "Cosa deve succedere oggi a tutti i costi?",         placeholder: "La priorità assoluta..." },
  { id: 'blocker', emoji: '⚡', label: 'BLOCCHI',  text: "C'è qualcosa che potrebbe bloccarti?",              placeholder: "Ostacolo + piano B..." },
  { id: 'energy',  emoji: '🔋', label: 'ENERGIA',  text: "A che livello sei oggi? (1-10)",                    placeholder: "Fisico e mentale..." },
  { id: 'commit',  emoji: '✓',  label: 'SUCCESSO', text: "A fine giornata, cosa ti dirà che è andata bene?",  placeholder: "Il metro di successo..." },
]

interface MorningBriefPanelProps {
  onComplete: (answers: Record<string, string>) => void
}

export default function MorningBriefPanel({ onComplete }: MorningBriefPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [active, setActive] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const allAnswered = QUESTIONS.every(q => (answers[q.id] ?? '').trim().length > 0)

  const handleSubmit = () => {
    if (!allAnswered) return
    setSubmitted(true)
    setTimeout(() => onComplete(answers), 600)
  }

  if (submitted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: '16px 16px 0' }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
      }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--cyan)',
            boxShadow: '0 0 8px var(--cyan-glow)',
          }}
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.3em',
          color: 'var(--cyan)',
          textTransform: 'uppercase',
        }}>
          Brief del giorno
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
        }}>
          {Object.keys(answers).filter(k => answers[k]?.trim()).length}/{QUESTIONS.length}
        </span>
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {QUESTIONS.map((q, i) => {
          const answered = (answers[q.id] ?? '').trim().length > 0
          const isActive = active === q.id

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: isActive
                  ? 'rgba(0,229,255,0.06)'
                  : answered
                  ? 'rgba(0,229,255,0.03)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${
                  isActive ? 'rgba(0,229,255,0.4)' :
                  answered ? 'rgba(0,229,255,0.2)' :
                  'var(--border)'
                }`,
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Question header — click to expand */}
              <div
                onClick={() => setActive(isActive ? null : q.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 14, opacity: answered ? 1 : 0.5 }}>
                  {answered ? '✓' : q.emoji}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10,
                  letterSpacing: '0.25em',
                  color: answered ? 'var(--cyan)' : 'var(--text-dim)',
                  textTransform: 'uppercase',
                  minWidth: 60,
                }}>
                  {q.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13,
                  color: answered ? 'var(--text-secondary)' : 'var(--text-primary)',
                  flex: 1,
                  opacity: answered ? 0.7 : 1,
                }}>
                  {answered ? answers[q.id] : q.text}
                </span>
                <motion.span
                  animate={{ rotate: isActive ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: 'var(--text-muted)', fontSize: 10 }}
                >
                  ▼
                </motion.span>
              </div>

              {/* Expanded textarea */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                      <p style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        padding: '10px 0 8px',
                        lineHeight: 1.5,
                      }}>
                        {q.text}
                      </p>
                      <textarea
                        autoFocus
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            const next = QUESTIONS[i + 1]
                            setActive(next ? next.id : null)
                          }
                        }}
                        placeholder={q.placeholder}
                        rows={2}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(0,229,255,0.3)',
                          padding: '6px 0',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: 14,
                          lineHeight: 1.6,
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 9,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.2em',
                        marginTop: 6,
                      }}>
                        ENTER → prossima domanda
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Submit */}
      <motion.div
        animate={{ opacity: allAnswered ? 1 : 0.3 }}
        style={{ padding: '12px 0 8px' }}
      >
        <motion.button
          onClick={handleSubmit}
          disabled={!allAnswered}
          whileHover={allAnswered ? { x: 4 } : {}}
          whileTap={allAnswered ? { scale: 0.97 } : {}}
          style={{
            width: '100%',
            background: allAnswered ? 'rgba(0,229,255,0.08)' : 'transparent',
            border: `1px solid ${allAnswered ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
            color: allAnswered ? 'var(--cyan)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: '0.3em',
            padding: '12px',
            borderRadius: 4,
            cursor: allAnswered ? 'pointer' : 'default',
            textTransform: 'uppercase',
            boxShadow: allAnswered ? '0 0 20px rgba(0,229,255,0.1)' : 'none',
            transition: 'all 0.25s',
          }}
        >
          Avvia la giornata →
        </motion.button>
      </motion.div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 0' }} />
    </motion.div>
  )
}
