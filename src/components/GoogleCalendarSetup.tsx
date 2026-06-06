import { useState } from 'react'
import { motion } from 'framer-motion'
import { DEFAULT_CONFIG, type GCalConfig } from '../core/google/auth'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

interface Props {
  onConnect: (config: GCalConfig) => Promise<void>
  loading: boolean
  error: string | null
}

export default function GoogleCalendarSetup({ onConnect, loading, error }: Props) {
  const [clientId] = useState(DEFAULT_CONFIG.clientId)
  const [clientSecret] = useState(DEFAULT_CONFIG.clientSecret)

  function handleConnect() {
    if (!loading) onConnect({ clientId, clientSecret })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(2,2,2,0.92)',
        backdropFilter: 'blur(24px)',
        zIndex: 5000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 420,
          background: 'rgba(14,14,16,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '36px 36px 28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="#00E5FF" strokeWidth="1.5"/>
              <path d="M3 9h18" stroke="#00E5FF" strokeWidth="1.5"/>
              <path d="M8 2v4M16 2v4" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: SF, fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
            Connetti Google Calendar
          </h2>
          <p style={{ fontFamily: SF, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            Il browser si aprirà per autorizzare l'accesso.<br/>
            Accedi con <strong style={{ color: 'rgba(255,255,255,0.7)' }}>edoardello@gmail.com</strong>
          </p>
        </div>

        {/* Credentials pill — read-only, shows they're pre-configured */}
        <div style={{
          background: 'rgba(0,229,255,0.05)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0,
            boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
          <div>
            <div style={{ fontFamily: SF, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
              Credenziali configurate
            </div>
            <div style={{ fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
              {clientId}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontFamily: SF, fontSize: 13, color: '#EF4444', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Connect button */}
        <motion.button
          onClick={handleConnect}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 40px rgba(0,229,255,0.25)' } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(0,229,255,0.13)',
            border: `1px solid ${loading ? 'rgba(255,255,255,0.1)' : 'rgba(0,229,255,0.5)'}`,
            color: loading ? 'rgba(255,255,255,0.3)' : '#00E5FF',
            fontFamily: SF, fontSize: 15, fontWeight: 700,
            letterSpacing: '-0.01em',
            padding: '16px',
            borderRadius: 10, cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%' }}
              />
              Connessione in corso...
            </>
          ) : (
            <>Autorizza con Google →</>
          )}
        </motion.button>

        <p style={{
          fontFamily: SF, fontSize: 11, color: 'rgba(255,255,255,0.22)',
          textAlign: 'center', marginTop: 14, lineHeight: 1.6,
        }}>
          Le credenziali sono salvate solo localmente sul tuo Mac.
        </p>
      </motion.div>
    </motion.div>
  )
}
