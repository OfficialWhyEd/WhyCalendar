import { useState } from 'react'
import { motion } from 'framer-motion'
import { saveAnthropicKey, getAnthropicKey, clearAnthropicKey } from '../core/ai/claude'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

interface Props {
  onClose: () => void
}

export default function AISetup({ onClose }: Props) {
  const existing = getAnthropicKey()
  const [key, setKey] = useState(existing ?? '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!key.trim()) return
    saveAnthropicKey(key.trim())
    setSaved(true)
    setTimeout(onClose, 800)
  }

  const handleDisconnect = () => {
    clearAnthropicKey()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(3,3,3,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 5000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 460,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 36,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: existing ? '#A855F7' : 'rgba(255,255,255,0.2)',
              boxShadow: existing ? '0 0 10px rgba(168,85,247,0.6)' : 'none',
            }} />
            <span style={{ fontFamily: SF, fontSize: 16, fontWeight: 600, color: '#fff' }}>
              Anthropic AI
            </span>
          </div>
          <p style={{ fontFamily: SF, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
            Inserisci la tua API key di Anthropic per attivare la chat AI. La chiave viene salvata solo localmente sul tuo Mac.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: SF, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>
            API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${key ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              padding: '11px 14px',
              color: '#fff',
              fontFamily: SF,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)' }}
            onBlur={e => { e.target.style.borderColor = key ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.1)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            onClick={handleSave}
            disabled={!key.trim()}
            whileHover={key.trim() ? { scale: 1.01 } : {}}
            whileTap={key.trim() ? { scale: 0.98 } : {}}
            style={{
              flex: 1,
              background: saved ? 'rgba(34,197,94,0.15)' : key.trim() ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${saved ? 'rgba(34,197,94,0.4)' : key.trim() ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: saved ? '#22C55E' : key.trim() ? '#A855F7' : 'rgba(255,255,255,0.2)',
              fontFamily: SF, fontSize: 14, fontWeight: 600,
              padding: '12px', borderRadius: 8,
              cursor: key.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ Salvata' : 'Salva e attiva'}
          </motion.button>

          {existing && (
            <motion.button
              onClick={handleDisconnect}
              whileHover={{ opacity: 1 }}
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.7)',
                fontFamily: SF, fontSize: 13, fontWeight: 500,
                padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                opacity: 0.8, transition: 'opacity 0.2s',
              }}
            >
              Rimuovi
            </motion.button>
          )}
        </div>

        <p style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Puoi trovare la tua API key su console.anthropic.com
        </p>
      </motion.div>
    </motion.div>
  )
}
