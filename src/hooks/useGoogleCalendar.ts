import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  isConnected, startOAuthFlow, clearTokens,
  getConfig, saveConfig, type GCalConfig
} from '../core/google/auth'
import {
  fetchWeekEvents, eventsForDate, createGCalEvent, deleteGCalEvent, type GCalEvent
} from '../core/google/calendar'
import {
  getLocalCalEvents, addLocalCalEvent, removeLocalCalEvent, type StoredCalEvent
} from '../core/storage/local'

export interface CreateEventParams {
  title: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:MM
  endTime: string    // HH:MM
  description?: string
}

function storedToGCal(e: StoredCalEvent): GCalEvent {
  return {
    id: e.id,
    title: e.title,
    start: new Date(e.startISO),
    end: new Date(e.endISO),
    color: e.color,
    calendarId: e.calendarId,
    description: e.description,
    isAllDay: e.isAllDay,
  }
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface CalendarState {
  connected: boolean
  loading: boolean
  error: string | null
  weekEvents: GCalEvent[]
  connect: (config: GCalConfig) => Promise<void>
  disconnect: () => void
  refresh: () => Promise<void>
  eventsFor: (date: Date) => GCalEvent[]
  createEvent: (params: CreateEventParams) => Promise<GCalEvent | null>
  deleteEvent: (eventId: string) => Promise<boolean>
  config: GCalConfig | null
}

export function useGoogleCalendar(): CalendarState {
  const [connected, setConnected] = useState(isConnected())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([])
  const [localEvents, setLocalEvents] = useState<GCalEvent[]>(() =>
    getLocalCalEvents().map(storedToGCal)
  )
  const [config] = useState<GCalConfig | null>(getConfig())

  const weekEvents = useMemo(
    () => [...gcalEvents, ...localEvents].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [gcalEvents, localEvents]
  )

  const refresh = useCallback(async () => {
    if (!isConnected()) return
    setLoading(true)
    setError(null)
    try {
      const events = await fetchWeekEvents()
      setGcalEvents(events)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (connected) refresh()
  }, [connected, refresh])

  const connect = async (cfg: GCalConfig) => {
    setLoading(true)
    setError(null)
    try {
      saveConfig(cfg)
      await startOAuthFlow(cfg)
      setConnected(true)
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    clearTokens()
    setConnected(false)
    setGcalEvents([])
  }

  const eventsFor = useCallback(
    (date: Date) => eventsForDate(weekEvents, date),
    [weekEvents]
  )

  const createEvent = useCallback(async (params: CreateEventParams): Promise<GCalEvent | null> => {
    const startISO = `${params.date}T${params.startTime}:00`
    const endISO = `${params.date}T${params.endTime || addOneHour(params.startTime)}:00`

    if (isConnected()) {
      const id = await createGCalEvent({
        title: params.title,
        startISO,
        endISO,
        description: params.description,
      })
      if (!id) return null
      await refresh()
      return null // evento sarà visibile dopo refresh
    }

    // Salva localmente se GCal non connesso
    const localEv: StoredCalEvent = {
      id: `local_${Date.now()}`,
      title: params.title,
      startISO,
      endISO,
      color: '#00E5FF',
      calendarId: 'local',
      description: params.description,
      isAllDay: false,
      createdAt: new Date().toISOString(),
    }
    addLocalCalEvent(localEv)
    const gEv = storedToGCal(localEv)
    setLocalEvents(prev => [...prev, gEv].sort((a, b) => a.start.getTime() - b.start.getTime()))
    return gEv
  }, [refresh])

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (eventId.startsWith('local_')) {
      removeLocalCalEvent(eventId)
      setLocalEvents(prev => prev.filter(e => e.id !== eventId))
      return true
    }

    if (!isConnected()) return false

    const ev = weekEvents.find(e => e.id === eventId)
    const ok = await deleteGCalEvent(eventId, ev?.calendarId ?? 'primary')
    if (ok) {
      setGcalEvents(prev => prev.filter(e => e.id !== eventId))
    }
    return ok
  }, [weekEvents])

  return {
    connected, loading, error, weekEvents,
    connect, disconnect, refresh,
    eventsFor, createEvent, deleteEvent, config,
  }
}
