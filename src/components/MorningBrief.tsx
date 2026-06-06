import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Question {
  id: string
  text: string
  placeholder: string
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'focus',
    text: 'Qual è la cosa più importante che deve succedere oggi?',
    placeholder: 'La priorità assoluta...',
  },
  {
    id: 'blocker',
    text: "C'è qualcosa che potrebbe bloccarti? Come la eviti?",
    placeholder: 'Ostacolo e piano B...',
  },
  {
    id: 'energy',
    text: "A che livello sei oggi? Fisico e mentale.",
    placeholder: '1-10, o descrivilo...',
  },
  {
    id: 'commit',
    text: 'A fine giornata, cosa ti dirà che oggi è andata bene?',
    placeholder: 'Il metro di successo...',
  },
]

interface QuestionCardProps {
  question: Question
  index: number
  answer: string
  onAnswer: (id: string, value: string) => void
  completed: boolean
}

function QuestionCard({ question, index, answer, onAnswer, completed }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.18 + 0.2,
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 0,
        padding: '28px 32px',
        borderLeft: `2px solid ${completed ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'border-color 0.4s',
      }}
    >
      {/* Question number */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        letterSpacing: '0.4em',
        color: 'rgba(0,212,255,0.6)',
        marginBottom: 12,
        textTransform: 'uppercase',
      }}>
        {`0${index + 1}`}
      </div>

      {/* Question text */}
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 16,
        fontWeight: 300,
        color: '#e0e0e0',
        marginBottom: 20,
        lineHeight: 1.7,
        margin: '0 0 20px',
      }}>
        {question.text}
      </p>

      {/* Answer textarea */}
      <textarea
        value={answer}
        onChange={(e) => onAnswer(question.id, e.target.value)}
        placeholder={question.placeholder}
        rows={2}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          padding: '8px 0',
          color: '#f0f0f0',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.6,
          resize: 'none',
          outline: 'none',
          transition: 'border-color 0.25s',
          boxSizing: 'border-box',
          cursor: 'text',
        }}
        onFocus={(e) => {
          e.target.style.borderBottomColor = 'rgba(0,212,255,0.45)'
        }}
        onBlur={(e) => {
          e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)'
        }}
      />
    </motion.div>
  )
}

interface MorningBriefProps {
  onComplete?: (answers: Record<string, string>) => void
}

export default function MorningBrief({ onComplete }: MorningBriefProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const allAnswered = DEFAULT_QUESTIONS.every((q) => (answers[q.id] ?? '').trim().length > 0)

  const handleSubmit = () => {
    if (!allAnswered) return
    setSubmitted(true)
    onComplete?.(answers)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          letterSpacing: '0.45em',
          color: 'rgba(0,212,255,0.5)',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Morning Brief
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#f0f0f0',
          lineHeight: 1.1,
        }}>
          BRIEF DEL GIORNO
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="questions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              overflowY: 'auto',
              flex: 1,
              paddingRight: 4,
            }}
          >
            {DEFAULT_QUESTIONS.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                answer={answers[q.id] ?? ''}
                onAnswer={handleAnswer}
                completed={(answers[q.id] ?? '').trim().length > 0}
              />
            ))}

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: DEFAULT_QUESTIONS.length * 0.18 + 0.6 }}
              style={{ paddingTop: 4, paddingBottom: 32 }}
            >
              <motion.button
                onClick={handleSubmit}
                disabled={!allAnswered}
                whileHover={allAnswered ? { x: 6 } : {}}
                whileTap={allAnswered ? { scale: 0.97 } : {}}
                style={{
                  background: allAnswered ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                  border: `1px solid ${allAnswered ? 'rgba(0, 212, 255, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: allAnswered ? '#00d4ff' : '#333',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  padding: '14px 28px',
                  borderRadius: 0,
                  cursor: allAnswered ? 'pointer' : 'default',
                  transition: 'all 0.25s',
                  textTransform: 'uppercase',
                  boxShadow: allAnswered ? '0 0 24px rgba(0,212,255,0.12)' : 'none',
                }}
              >
                AVVIA LA GIORNATA →
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flex: 1,
              gap: 16,
            }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: 1,
                width: '100%',
                background: 'linear-gradient(90deg, #00d4ff, transparent)',
                boxShadow: '0 0 12px rgba(0,212,255,0.5)',
                transformOrigin: 'left',
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                letterSpacing: '0.2em',
                color: '#00d4ff',
                textShadow: '0 0 30px rgba(0,212,255,0.4)',
              }}
            >
              SISTEMA AVVIATO
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                fontWeight: 300,
                color: '#555',
                lineHeight: 1.6,
              }}
            >
              Il piano del giorno è in elaborazione
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
