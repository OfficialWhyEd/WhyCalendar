import { motion } from 'framer-motion'

// Safe helper to invoke Tauri native window methods only if in Tauri
const safeAction = (name: 'close' | 'minimize' | 'toggleMaximize') => {
  return async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        if (name === 'close') await win.close()
        else if (name === 'minimize') await win.minimize()
        else if (name === 'toggleMaximize') await win.toggleMaximize()
      } catch (err) {
        console.warn('Failed to call Tauri window command', err)
      }
    } else {
      console.log(`[Browser Mock] Native window action: ${name}`)
    }
  }
}

export default function WindowControls() {
  const controls = [
    { action: safeAction('close'), color: '#ff5f57' },
    { action: safeAction('minimize'), color: '#febc2e' },
    { action: safeAction('toggleMaximize'), color: '#28c840' },
  ]

  return (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {controls.map((ctrl, i) => (
        <motion.button
          key={i}
          onClick={(e) => { e.stopPropagation(); ctrl.action() }}
          whileHover={{ scale: 1.2, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0.5 }}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: ctrl.color,
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

