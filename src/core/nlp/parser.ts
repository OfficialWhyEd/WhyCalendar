import type { ParsedTask, TaskType, TaskPriority } from '../../types/index'

const TYPE_KEYWORDS: Record<string, TaskType> = {
  'call': 'meeting', 'meeting': 'meeting', 'riunione': 'meeting', 'appuntamento': 'meeting',
  'dev': 'dev', 'sviluppo': 'dev', 'codice': 'dev', 'code': 'dev', 'review': 'dev',
  'email': 'comm', 'mail': 'comm', 'rispondere': 'comm', 'comunicare': 'comm',
  'meta': 'meta', 'memory': 'meta', 'nota': 'meta', 'documentare': 'meta',
  'deadline': 'deadline', 'scadenza': 'deadline', 'consegnare': 'deadline',
}

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  'urgente': 'high', 'importante': 'high', 'priorità': 'high', 'priorita': 'high', 'high': 'high',
  'medium': 'medium', 'medio': 'medium', 'normale': 'medium',
  'low': 'low', 'basso': 'low', 'bassa': 'low', 'quando posso': 'low',
}

export function parseMessage(input: string): ParsedTask {
  const lower = input.toLowerCase().trim()
  let title = input
  let date: string | undefined
  let startTime: string | undefined
  let endTime: string | undefined
  let type: TaskType | undefined
  let tags: string[] = []
  let priority: TaskPriority | undefined

  // Extract type keywords
  for (const [keyword, taskType] of Object.entries(TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      type = taskType
      tags.push(taskType.toUpperCase())
    }
  }

  // Extract priority keywords
  for (const [keyword, prio] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      priority = prio
    }
  }

  // Extract time patterns: "alle 14", "alle 14:30"
  const timeMatch = lower.match(/alle?\s+(\d{1,2})(?::(\d{2}))?/)
  if (timeMatch) {
    const h = parseInt(timeMatch[1])
    const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0
    startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    endTime = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // Extract date patterns
  const dateMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const year = new Date().getFullYear()
    const d = new Date(year, month - 1, day)
    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Relative date keywords
  if (!date) {
    if (lower.includes('domani')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
    } else if (lower.includes('oggi')) {
      const today = new Date()
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    } else if (lower.includes('dopodomani')) {
      const d = new Date()
      d.setDate(d.getDate() + 2)
      date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
  }

  // Day of week
  const dayNames = ['domenica', 'lunedì', 'lunedi', 'martedì', 'martedi', 'mercoledì', 'mercoledi', 'giovedì', 'giovedi', 'venerdì', 'venerdi', 'sabato']
  const dayMap = [0, 1, 2, 3, 4, 5, 6]
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i]) && !date) {
      const today = new Date()
      const targetDay = dayMap[i]
      const diff = targetDay - today.getDay()
      const target = new Date(today)
      target.setDate(today.getDate() + (diff <= 0 ? diff + 7 : diff))
      date = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
    }
  }

  // Clean title: remove date/time keywords
  title = title
    .replace(/alle?\s+\d{1,2}(?::\d{2})?/gi, '')
    .replace(/\b\d{1,2}[\/\-]\d{1,2}\b/g, '')
    .replace(/\b(oggi|domani|dopodomani)\b/gi, '')
    .replace(/\b(urgente|importante|priorità|priorita)\b/gi, '')
    .trim()

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  // Default priority
  if (!priority) {
    priority = type === 'meeting' ? 'medium' : 'medium'
  }

  // Default type
  if (!type) {
    type = 'personal'
    tags.push('PERSONAL')
  }

  return {
    title: title || 'Task senza titolo',
    date,
    startTime,
    endTime,
    type,
    tags,
    priority,
    rawInput: input,
  }
}

export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
}
