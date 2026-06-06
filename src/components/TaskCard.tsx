import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { Task } from '../types/index'
import { updateTask } from '../core/storage/local'

interface TaskCardProps {
  task: Task
  onComplete?: (id: string) => void
}

const priorityColors = {
  high: 'var(--warm)',
  medium: 'var(--cyan)',
  low: 'var(--text-dim)',
}

const tagClassMap: Record<string, string> = {
  dev: 'tag-dev',
  meeting: 'tag-meeting',
  comm: 'tag-comm',
  meta: 'tag-meta',
  personal: 'tag-personal',
  deadline: 'tag-deadline',
}

export default function TaskCard({ task, onComplete }: TaskCardProps) {
  const [hovered, setHovered] = useState(false)
  const isCompleted = task.status === 'completed'

  const handleToggle = () => {
    const newStatus = isCompleted ? 'pending' : 'completed'
    updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    })
    onComplete?.(task.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isCompleted ? 0.45 : 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleToggle}
      style={{
        background: hovered && !isCompleted ? 'rgba(255,255,255,0.02)' : 'transparent',
        border: '1px solid',
        borderColor: isCompleted ? 'rgba(255,255,255,0.04)' : hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        borderRadius: 4,
        padding: '16px 20px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Priority bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: priorityColors[task.priority],
        boxShadow: task.priority === 'high' ? '0 0 8px var(--warm-glow)' : 'none',
        opacity: isCompleted ? 0.3 : 1,
      }} />

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 8 }}>
        {/* Checkbox */}
        <motion.div
          animate={isCompleted ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: 22,
            height: 22,
            border: `2px solid ${isCompleted ? 'var(--cyan)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: isCompleted ? 'rgba(0,229,255,0.1)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                width="12"
                height="12"
                viewBox="0 0 12 12"
              >
                <path
                  d="M2 6L5 9L10 3"
                  stroke="var(--cyan)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Title */}
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 16,
          color: isCompleted ? 'var(--text-dim)' : 'var(--text-primary)',
          flex: 1,
          position: 'relative',
          transition: 'color 0.2s',
        }}>
          {task.title}

          {/* Strikethrough */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: 1,
                  background: 'var(--text-dim)',
                  transformOrigin: 'left',
                }}
              />
            )}
          </AnimatePresence>
        </span>

        {/* Time */}
        {task.startTime && (
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            color: 'var(--text-secondary)',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}>
            {task.startTime}
          </span>
        )}

        {/* Tag */}
        {task.tags.length > 0 && (
          <span className={`tag ${tagClassMap[task.tags[0].toLowerCase()] || 'tag-dev'}`}>
            {task.tags[0]}
          </span>
        )}
      </div>
    </motion.div>
  )
}
