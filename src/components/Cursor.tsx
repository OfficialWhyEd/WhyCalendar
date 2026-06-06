import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function Cursor() {
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  const springConfig = { damping: 15, stiffness: 150, mass: 0.3 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  const [clicked, setClicked] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!visible) setVisible(true)
    }

    const onMouseDown = () => setClicked(true)
    const onMouseUp = () => setClicked(false)

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a') ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('clickable'))
      ) {
        setHovered(true)
      } else {
        setHovered(false)
      }
    }

    const onMouseLeave = () => setVisible(false)
    const onMouseEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [mouseX, mouseY, visible])

  if (!visible) return null

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
      animate={{
        scale: clicked ? 0.75 : hovered ? 1.25 : 1,
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 12 }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center Dot */}
        <circle cx="16" cy="16" r="1.5" fill="#00E5FF" style={{ filter: 'url(#cursor-glow)' }} />

        {/* Crosshair segments */}
        {/* Top */}
        <line
          x1="16" y1="5"
          x2="16" y2="11"
          stroke="#00E5FF" strokeWidth="1"
          style={{ filter: 'url(#cursor-glow)' }}
        />
        {/* Bottom */}
        <line
          x1="16" y1="21"
          x2="16" y2="27"
          stroke="#00E5FF" strokeWidth="1"
          style={{ filter: 'url(#cursor-glow)' }}
        />
        {/* Left */}
        <line
          x1="5" y1="16"
          x2="11" y2="16"
          stroke="#00E5FF" strokeWidth="1"
          style={{ filter: 'url(#cursor-glow)' }}
        />
        {/* Right */}
        <line
          x1="21" y1="16"
          x2="27" y2="16"
          stroke="#00E5FF" strokeWidth="1"
          style={{ filter: 'url(#cursor-glow)' }}
        />

        {/* Rotating indicator box on hover */}
        {hovered && (
          <motion.rect
            x="3" y="3"
            width="26" height="26"
            rx="2" fill="none"
            stroke="#00E5FF" strokeWidth="0.8"
            opacity="0.45"
            initial={{ rotate: 0 }}
            animate={{ rotate: 90 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ originX: '16px', originY: '16px', filter: 'url(#cursor-glow)' }}
          />
        )}
      </svg>
    </motion.div>
  )
}
