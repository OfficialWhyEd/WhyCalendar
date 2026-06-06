const DAY_NAMES = ['DOMENICA', 'LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ', 'SABATO']
const DAY_SHORT = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB']
const MONTH_NAMES = ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO', 'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE']
const MONTH_SHORT = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC']

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getDayName(date: Date, short = false): string {
  return short ? DAY_SHORT[date.getDay()] : DAY_NAMES[date.getDay()]
}

export function getMonthName(date: Date, short = false): string {
  return short ? MONTH_SHORT[date.getMonth()] : MONTH_NAMES[date.getMonth()]
}

export function getDayData(date: Date) {
  return {
    date: formatDate(date),
    dayName: getDayName(date, true),
    dayNumber: date.getDate(),
    monthName: getMonthName(date, true),
    monthNumber: date.getMonth() + 1,
    year: date.getFullYear(),
  }
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getWeekDays(centerDate: Date, range = 3): Date[] {
  const days: Date[] = []
  for (let i = -range; i <= range; i++) {
    days.push(addDays(centerDate, i))
  }
  return days
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay()
  const start = addDays(date, day === 0 ? -6 : 1 - day)
  const end = addDays(start, 6)
  return { start, end }
}

export function formatTime(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function parseRelativeDate(input: string): Date | null {
  const now = new Date()
  const lower = input.toLowerCase().trim()

  if (lower === 'oggi' || lower === 'today') return now
  if (lower === 'domani' || lower === 'tomorrow') return addDays(now, 1)
  if (lower === 'dopodomani') return addDays(now, 2)

  const dayMap: Record<string, number> = {
    'lunedì': 1, 'lunedi': 1, 'lun': 1,
    'martedì': 2, 'martedi': 2, 'mar': 2,
    'mercoledì': 3, 'mercoledi': 3, 'mer': 3,
    'giovedì': 4, 'giovedi': 4, 'gio': 4,
    'venerdì': 5, 'venerdi': 5, 'ven': 5,
    'sabato': 6, 'sab': 6,
    'domenica': 0, 'dom': 0,
  }

  for (const [name, dayOfWeek] of Object.entries(dayMap)) {
    if (lower.startsWith(name)) {
      const target = new Date(now)
      const currentDay = now.getDay()
      let diff = dayOfWeek - currentDay
      if (diff <= 0) diff += 7
      target.setDate(now.getDate() + diff)
      return target
    }
  }

  if (lower.startsWith('fra') || lower.startsWith('tra')) {
    const match = lower.match(/(?:fra|tra)\s+(\d+)\s*(giorni?|ore?)/)
    if (match) {
      const [, num, unit] = match
      const n = parseInt(num)
      if (unit.startsWith('g')) return addDays(now, n)
      if (unit.startsWith('o')) {
        const result = new Date(now)
        result.setHours(result.getHours() + n)
        return result
      }
    }
  }

  if (lower.startsWith('prossim')) {
    if (lower.includes('settiman')) {
      return addDays(now, 7)
    }
  }

  return null
}

export function parseRelativeTime(input: string): { hour: number; minute: number } | null {
  const lower = input.toLowerCase().trim()

  const timeMatch = lower.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    return { hour: parseInt(timeMatch[1]), minute: parseInt(timeMatch[2]) }
  }

  const hourMatch = lower.match(/alle?\s+(\d{1,2})(?:\s*e\s+(\d{2}))?/)
  if (hourMatch) {
    return { hour: parseInt(hourMatch[1]), minute: hourMatch[2] ? parseInt(hourMatch[2]) : 0 }
  }

  if (lower.includes('mattina') || lower.includes('mattino')) return { hour: 9, minute: 0 }
  if (lower.includes('pranzo')) return { hour: 13, minute: 0 }
  if (lower.includes('pomeriggio')) return { hour: 14, minute: 0 }
  if (lower.includes('sera') || lower.includes('serale')) return { hour: 19, minute: 0 }

  return null
}
