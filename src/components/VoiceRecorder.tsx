import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
}

export default function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Check for SpeechRecognition support
  useState(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'it-IT'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        onTranscript(transcript)
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }
  })

  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  if (!isSupported) return null

  return (
    <motion.button
      onClick={toggleRecording}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isRecording ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.svg
            key="stop"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            width="14"
            height="14"
            viewBox="0 0 14 14"
          >
            <rect x="3" y="3" width="8" height="8" rx="1" fill="var(--red)" />
          </motion.svg>
        ) : (
          <motion.svg
            key="mic"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            width="14"
            height="14"
            viewBox="0 0 14 14"
          >
            <path
              d="M7 1a2.5 2.5 0 012.5 2.5v3a2.5 2.5 0 01-5 0v-3A2.5 2.5 0 017 1z"
              fill="var(--text-secondary)"
            />
            <path
              d="M4 6.5a3 3 0 006 0M5.5 9.5v1a1.5 1.5 0 003 0v-1"
              stroke="var(--text-secondary)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Recording pulse */}
      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: -4,
            border: '1px solid var(--red)',
            borderRadius: 0,
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  )
}
