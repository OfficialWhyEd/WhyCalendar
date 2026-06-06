import type { Task, StoredImage, BriefAnswers, Suggestion } from '../../types/index'

const STORAGE_KEYS = {
  tasks: 'whycalendar_tasks',
  images: 'whycalendar_images',
  answers: 'whycalendar_answers',
  suggestions: 'whycalendar_suggestions',
  settings: 'whycalendar_settings',
  localEvents: 'whycalendar_local_events',
}

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn(`Failed to save to localStorage: ${key}`)
  }
}

// ─── TASKS ────────────────────────────────────────────────
export function getTasks(): Task[] {
  return get(STORAGE_KEYS.tasks, [])
}

export function saveTasks(tasks: Task[]): void {
  set(STORAGE_KEYS.tasks, tasks)
}

export function addTask(task: Task): void {
  const tasks = getTasks()
  tasks.push(task)
  saveTasks(tasks)
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates }
    saveTasks(tasks)
  }
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter(t => t.id !== id)
  saveTasks(tasks)
}

export function getTasksByDate(date: string): Task[] {
  return getTasks().filter(t => t.date === date)
}

export function getTasksByWeek(startDate: string, endDate: string): Task[] {
  return getTasks().filter(t => t.date >= startDate && t.date <= endDate)
}

// ─── IMAGES ───────────────────────────────────────────────
export function getImages(): StoredImage[] {
  return get(STORAGE_KEYS.images, [])
}

export function saveImages(images: StoredImage[]): void {
  set(STORAGE_KEYS.images, images)
}

export function addImage(image: StoredImage): void {
  const images = getImages()
  images.push(image)
  saveImages(images)
}

// ─── BRIEF ANSWERS ────────────────────────────────────────
export function getBriefAnswers(date: string): BriefAnswers | null {
  const all = get<Record<string, BriefAnswers>>(STORAGE_KEYS.answers, {})
  return all[date] || null
}

export function saveBriefAnswers(date: string, answers: BriefAnswers): void {
  const all = get<Record<string, BriefAnswers>>(STORAGE_KEYS.answers, {})
  all[date] = answers
  set(STORAGE_KEYS.answers, all)
}

// ─── SUGGESTIONS ──────────────────────────────────────────
export function getSuggestions(): Suggestion[] {
  return get(STORAGE_KEYS.suggestions, [])
}

export function saveSuggestions(suggestions: Suggestion[]): void {
  set(STORAGE_KEYS.suggestions, suggestions)
}

export function addSuggestion(suggestion: Suggestion): void {
  const suggestions = getSuggestions()
  suggestions.unshift(suggestion)
  saveSuggestions(suggestions)
}

export function dismissSuggestion(id: string): void {
  const suggestions = getSuggestions().map(s =>
    s.id === id ? { ...s, dismissed: true } : s
  )
  saveSuggestions(suggestions)
}

// ─── LOCAL CALENDAR EVENTS (fallback senza GCal) ──────────
export interface StoredCalEvent {
  id: string
  title: string
  startISO: string
  endISO: string
  color: string
  calendarId: string
  description?: string
  isAllDay: boolean
  createdAt: string
}

export function getLocalCalEvents(): StoredCalEvent[] {
  return get(STORAGE_KEYS.localEvents, [])
}

export function addLocalCalEvent(event: StoredCalEvent): void {
  const events = getLocalCalEvents()
  events.push(event)
  set(STORAGE_KEYS.localEvents, events)
}

export function removeLocalCalEvent(id: string): void {
  const events = getLocalCalEvents().filter(e => e.id !== id)
  set(STORAGE_KEYS.localEvents, events)
}

// ─── SETTINGS ─────────────────────────────────────────────
export function getSettings(): Record<string, unknown> {
  return get(STORAGE_KEYS.settings, {})
}

export function saveSettings(settings: Record<string, unknown>): void {
  set(STORAGE_KEYS.settings, settings)
}
