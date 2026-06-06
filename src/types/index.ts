export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskType = 'dev' | 'meeting' | 'comm' | 'meta' | 'personal' | 'deadline'
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

export interface Task {
  id: string
  title: string
  date: string
  startTime: string
  endTime?: string
  priority: TaskPriority
  type: TaskType
  status: TaskStatus
  tags: string[]
  notes?: string
  imageUrl?: string
  googleCalendarId?: string
  createdAt: string
  completedAt?: string
}

export interface DayData {
  date: string
  dayName: string
  dayNumber: number
  monthName: string
  monthNumber: number
  year: number
  tasks: Task[]
  briefAnswers?: BriefAnswers
  energyLevel?: number
  dailyNote?: string
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  completionRate: number
}

export interface BriefAnswers {
  focus: string
  blocker: string
  energy: number
  commit: string
  mood?: string
}

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  timestamp: string
  isTyping?: boolean
}

export interface ParsedTask {
  title: string
  date?: string
  startTime?: string
  endTime?: string
  type?: TaskType
  tags?: string[]
  priority?: TaskPriority
  rawInput: string
}

export interface StoredImage {
  id: string
  url: string
  fileName: string
  uploadedAt: string
  linkedTaskId?: string
  linkedDate?: string
  ocrText?: string
  tags: string[]
}

export interface Suggestion {
  id: string
  type: 'schedule' | 'reminder' | 'insight' | 'motivation' | 'pattern'
  text: string
  action?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  dismissed: boolean
}

export type DailyQuestionPhase = 'morning' | 'midday' | 'evening' | 'weekly'

export interface DailyQuestion {
  id: string
  phase: DailyQuestionPhase
  text: string
  placeholder: string
  type: 'text' | 'number' | 'scale' | 'choice'
  options?: string[]
}

export interface WeeklyReviewData {
  weekStart: string
  weekEnd: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  energyAverage: number
  energyByDay: Record<string, number>
  tasksByCategory: Record<string, { total: number; completed: number }>
  insights: string[]
  suggestions: string[]
}
