import { getValidAccessToken } from './auth'

export interface GCalEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  calendarId: string
  description?: string
  location?: string
  isAllDay: boolean
}

const COLOR_MAP: Record<string, string> = {
  '1': '#A855F7',  // lavanda → purple
  '2': '#22C55E',  // salvia → green
  '3': '#6B7280',  // uva → gray
  '4': '#EF4444',  // flamingo → red
  '5': '#FF7A33',  // banana → warm
  '6': '#F97316',  // mandarino → orange
  '7': '#00E5FF',  // pavone → cyan
  '8': '#6B7280',  // grafite → gray
  '9': '#3B82F6',  // mirtillo → blue
  '10': '#22C55E', // basilico → green
  '11': '#EF4444', // pomodoro → red
}

function colorFromCalendar(colorId?: string, bgColor?: string): string {
  if (colorId && COLOR_MAP[colorId]) return COLOR_MAP[colorId]
  if (bgColor) return bgColor
  return '#00E5FF'
}

export async function fetchEventsForDateRange(
  startDate: Date,
  endDate: Date
): Promise<GCalEvent[]> {
  const token = await getValidAccessToken()
  if (!token) return []

  try {
    // Prendi tutti i calendari
    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!calRes.ok) return []
    const calData = await calRes.json()
    const calendars = calData.items ?? []

    const allEvents: GCalEvent[] = []

    // Per ogni calendario, prendi gli eventi
    await Promise.all(
      calendars
        .filter((cal: { accessRole: string }) => cal.accessRole !== 'freeBusyReader')
        .map(async (cal: { id: string; backgroundColor?: string }) => {
          const params = new URLSearchParams({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '100',
          })

          const evRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!evRes.ok) return

          const evData = await evRes.json()
          const items = evData.items ?? []

          for (const item of items) {
            if (item.status === 'cancelled') continue

            const isAllDay = !item.start?.dateTime
            const start = isAllDay
              ? new Date(item.start?.date + 'T00:00:00')
              : new Date(item.start?.dateTime)
            const end = isAllDay
              ? new Date(item.end?.date + 'T00:00:00')
              : new Date(item.end?.dateTime)

            allEvents.push({
              id: item.id,
              title: item.summary ?? '(nessun titolo)',
              start,
              end,
              color: colorFromCalendar(item.colorId, cal.backgroundColor),
              calendarId: cal.id,
              description: item.description,
              location: item.location,
              isAllDay,
            })
          }
        })
    )

    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
  } catch (e) {
    console.error('Calendar fetch error:', e)
    return []
  }
}

export async function fetchTodayEvents(): Promise<GCalEvent[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return fetchEventsForDateRange(start, end)
}

export async function fetchWeekEvents(): Promise<GCalEvent[]> {
  const start = new Date()
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() + 14)
  end.setHours(23, 59, 59, 999)
  return fetchEventsForDateRange(start, end)
}

export function eventsForDate(events: GCalEvent[], date: Date): GCalEvent[] {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  return events.filter(e => e.start >= d && e.start < next)
}

export async function createGCalEvent(params: {
  title: string
  startISO: string
  endISO: string
  description?: string
  calendarId?: string
}): Promise<string | null> {
  const token = await getValidAccessToken()
  if (!token) return null

  const calId = params.calendarId ?? 'primary'
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: params.title,
        description: params.description,
        start: { dateTime: params.startISO, timeZone: tz },
        end: { dateTime: params.endISO, timeZone: tz },
      }),
    }
  )

  if (!res.ok) { console.error('createGCalEvent error', await res.text()); return null }
  const data = await res.json()
  return data.id ?? null
}

export async function deleteGCalEvent(eventId: string, calendarId = 'primary'): Promise<boolean> {
  const token = await getValidAccessToken()
  if (!token) return false

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  )
  return res.status === 204
}
