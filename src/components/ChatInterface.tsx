import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '../types/index'
import MorningBriefPanel from './MorningBriefPanel'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  isTyping: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onBriefComplete?: (answers: Record<string, string>) => void
}

export default function ChatInterface({
  messages, isTyping, inputValue, onInputChange,
  onSend, onKeyPress, messagesEndRef, onBriefComplete,
}: ChatInterfaceProps) {
  const [briefDone, setBriefDone] = useState(false)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'rgba(8,8,10,0.6)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0,
      }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#00E5FF',
            boxShadow: '0 0 8px rgba(0,229,255,0.8)',
          }}
        />
        <span style={{
          fontFamily: SF, fontSize: 12, fontWeight: 500,
          color: briefDone ? 'rgba(255,255,255,0.4)' : '#00E5FF',
          letterSpacing: '0.01em',
        }}>
          {briefDone ? 'Assistente AI' : 'Brief del giorno'}
        </span>
        {!briefDone && (
          <span style={{
            marginLeft: 'auto', fontFamily: SF,
            fontSize: 11, color: 'rgba(255,255,255,0.25)',
          }}>
            Avvia la giornata
          </span>
        )}
      </div>

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence>
          {!briefDone && (
            <MorningBriefPanel onComplete={(answers) => {
              setBriefDone(true)
              onBriefComplete?.(answers)
            }} />
          )}
        </AnimatePresence>

        <div style={{
          flex: 1, padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: msg.role === 'user' ? '9px 14px' : '9px 0',
                  background: msg.role === 'user' ? 'rgba(0,229,255,0.09)' : 'transparent',
                  border: msg.role === 'user' ? '1px solid rgba(0,229,255,0.2)' : 'none',
                  borderRadius: msg.role === 'user' ? '4px 4px 0px 4px' : 0,
                }}>
                  <p style={{
                    fontFamily: SF,
                    fontSize: 13, lineHeight: 1.65,
                    color: msg.role === 'user'
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.65)',
                    whiteSpace: 'pre-wrap', margin: 0,
                    letterSpacing: '-0.01em',
                  }}>
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', gap: 5, padding: '4px 2px' }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                  style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: '#00E5FF',
                  }}
                />
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, flexShrink: 0,
        background: 'rgba(0,0,0,0.2)',
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Scrivi un task o una domanda…"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '10px 14px',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: SF,
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.35)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
        <motion.button
          onClick={onSend}
          whileHover={inputValue.trim() ? { scale: 1.06 } : {}}
          whileTap={inputValue.trim() ? { scale: 0.94 } : {}}
          style={{
            background: inputValue.trim() ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${inputValue.trim() ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
            color: inputValue.trim() ? '#00E5FF' : 'rgba(255,255,255,0.2)',
            fontSize: 16, padding: '10px 16px',
            borderRadius: 4, cursor: inputValue.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center',
          }}
        >
          ↑
        </motion.button>
      </div>
    </div>
  )
}
