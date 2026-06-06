import { useState, useCallback, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { ChatMessage } from '../types/index'
import type { GCalEvent } from '../core/google/calendar'
import type { CreateEventParams } from './useGoogleCalendar'
import { generateMessageId, parseMessage } from '../core/nlp/parser'

interface CalendarAction {
  type: 'message' | 'create_event' | 'delete_event'
  text?: string
  // create_event fields
  title?: string
  date?: string       // YYYY-MM-DD
  startTime?: string  // HH:MM
  endTime?: string    // HH:MM
  description?: string
  // delete_event fields
  eventId?: string
}

export interface ChatOptions {
  connected?: boolean
  weekEvents?: GCalEvent[]
  onCreateEvent?: (params: CreateEventParams) => Promise<GCalEvent | null>
  onDeleteEvent?: (id: string) => Promise<boolean>
}

// ── Prompt builder ─────────────────────────────────────────────────────────────
function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// High-fidelity offline mock parser that acts like Claude Code CLI for browser visual checks
function mockOfflineAI(input: string, events: GCalEvent[]): string {
  const lower = input.toLowerCase().trim()
  const todayISO = new Date().toISOString().slice(0, 10)

  // 1. Delete event mock handler
  if (lower.includes('cancella') || lower.includes('elimina') || lower.includes('rimuovi')) {
    const found = events.find(e => lower.includes(e.title.toLowerCase()))
    if (found) {
      return JSON.stringify({
        type: 'delete_event',
        eventId: found.id,
        title: found.title,
        text: `Ho rimosso l'evento '${found.title}' dal tuo calendario.`
      })
    }
  }

  // 2. Create event / task mock handler
  if (
    lower.includes('crea') ||
    lower.includes('aggiungi') ||
    lower.includes('evento') ||
    lower.includes('task') ||
    lower.includes('programma') ||
    lower.includes('alle') ||
    lower.includes('oggi') ||
    lower.includes('domani')
  ) {
    const parsed = parseMessage(input)
    if (parsed.startTime) {
      return JSON.stringify({
        type: 'create_event',
        title: parsed.title || 'Nuovo Evento',
        date: parsed.date || todayISO,
        startTime: parsed.startTime,
        endTime: parsed.endTime || addOneHour(parsed.startTime),
        description: `Creato via Assistente AI Offline`,
        text: `Ho programmato l'evento '${parsed.title || 'Nuovo Evento'}' per il ${parsed.date || 'oggi'} alle ore ${parsed.startTime}.`
      })
    }
  }

  // 3. Informative responses
  if (lower.includes('ciao') || lower.includes('salve') || lower.includes('buongiorno')) {
    return JSON.stringify({
      type: 'message',
      text: 'Buongiorno Edoardo! Sistemi stabili al 100%. Come posso aiutarti oggi?'
    })
  }

  if (lower.includes('meteo') || lower.includes('tempo')) {
    return JSON.stringify({
      type: 'message',
      text: 'Meteo esterno non disponibile, ma il clima interno biomeccanico è ottimale. WhySpidey sta bene!'
    })
  }

  if (lower.includes('spidey') || lower.includes('ragno')) {
    return JSON.stringify({
      type: 'message',
      text: 'WhySpidey è attivo ed esplora lo schermo. Sta raccogliendo dati sul tuo focus!'
    })
  }

  // 4. Default fallback general conversation
  const responses = [
    `Ricevuto Edoardo. Ho aggiornato lo stream del focus mentale. Dimmi cosa pianificare.`,
    `Tutti i sistemi nominali. Il tuo livello di energia è monitorato. Proseguiamo con i task?`,
    `Stream sincronizzato. Desideri programmare una sessione Pomodoro per questo obiettivo?`,
    `Capito. Registro l'indicazione nel log di sessione.`
  ]
  const randomRes = responses[Math.floor(Math.random() * responses.length)]
  return JSON.stringify({
    type: 'message',
    text: `[Offline AI] ${randomRes}`
  })
}

function fmtDateShort(d: Date) {
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

function buildSystemPrompt(connected: boolean, events: GCalEvent[]): string {
  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const todayFull = now.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const timeStr = fmtTime(now)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Next 14 days events, grouped with IDs
  const in14 = new Date(now); in14.setDate(now.getDate() + 14); in14.setHours(23, 59, 59, 999)
  const upcoming = events.filter(e => e.start >= now && e.start <= in14)
  const eventList = upcoming.length
    ? upcoming.map(e => `  [${e.id}] ${fmtDateShort(e.start)} ${fmtTime(e.start)}–${fmtTime(e.end)} | ${e.title}`).join('\n')
    : '  (nessun evento)'

  return `Sei WhyCalendar AI, assistente personale di Edoardo. Rispondi SOLO in JSON valido.
Oggi: ${todayFull}, ore ${timeStr}. Fuso: ${tz}.
Data ISO oggi: ${todayISO}
Google Calendar: ${connected ? 'CONNESSO ✓' : 'NON CONNESSO — eventi salvati localmente'}

PROSSIMI EVENTI:
${eventList}

SCHEMA RISPOSTA (SOLO JSON, nessun testo fuori):
{"type":"message","text":"..."}
{"type":"create_event","title":"...","date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","text":"..."}
{"type":"delete_event","eventId":"ID_DALL_ELENCO","title":"...","text":"..."}

REGOLE:
- Calcola sempre le date relative da ${todayISO} (oggi)
- "domani" = giorno dopo, "lunedì prossimo" = calcola correttamente
- Durata default: 1 ora se non specificata
- Orari in formato 24h
- "text" è la risposta visibile all'utente (italiano, breve, max 2 frasi)
- Per eliminare, usa ESATTAMENTE l'ID dall'elenco sopra
- Se data/ora non è chiara, usa type:message e chiedi chiarimento
- Non inventare ID evento`
}

// ── JSON extractor ─────────────────────────────────────────────────────────────
function extractAction(raw: string): CalendarAction {
  const cleaned = raw.trim().replace(/^```json\n?|^```\n?|```$/gm, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as CalendarAction
    } catch {}
  }
  return { type: 'message', text: cleaned }
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`
}

// ── Initial greeting ───────────────────────────────────────────────────────────
function buildInitialMessage(): ChatMessage {
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  return {
    id: generateMessageId(),
    role: 'system',
    text: `${greeting}, Edoardo! Posso creare eventi, mostrare il calendario, ricordarti impegni. Cosa vuoi fare?`,
    timestamp: new Date().toISOString(),
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChat(options: ChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([buildInitialMessage()])
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<{ role: string; content: string }[]>([])

  // Keep options in a ref so processMessage always sees fresh values without re-creating
  const optRef = useRef(options)
  useEffect(() => { optRef.current = options }, [options])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const addMessage = useCallback((role: ChatMessage['role'], text: string) => {
    const msg: ChatMessage = {
      id: generateMessageId(),
      role,
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const processMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    addMessage('user', text)
    setInputValue('')
    setIsTyping(true)
    scrollToBottom()

    const { connected = false, weekEvents = [], onCreateEvent, onDeleteEvent } = optRef.current
    let raw = ''
    let isTauriFallback = false

    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

    if (isTauri) {
      try {
        const systemPrompt = buildSystemPrompt(connected, weekEvents)
        const historyText = historyRef.current
          .slice(-8)
          .map(m => `${m.role === 'user' ? 'Edoardo' : 'AI'}: ${m.content}`)
          .join('\n')
        const fullPrompt = `${systemPrompt}\n\n${historyText ? historyText + '\n' : ''}Edoardo: ${text}\nAI:`
        raw = await invoke<string>('ask_claude', { prompt: fullPrompt })
      } catch (e: unknown) {
        console.warn('Tauri invoke ask_claude failed, falling back to browser mode', e)
        isTauriFallback = true
      }
    }

    if (!isTauri || isTauriFallback) {
      // Browser environment fallback
      try {
        const { getAnthropicKey, callClaude } = await import('../core/ai/claude')
        const key = getAnthropicKey()
        const systemPrompt = buildSystemPrompt(connected, weekEvents)
        if (key) {
          try {
            const userMessages = historyRef.current
              .slice(-8)
              .map(m => ({
                role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: m.content,
              }))
            userMessages.push({ role: 'user', content: text })
            raw = await callClaude(userMessages, systemPrompt)
          } catch (err) {
            console.warn('Direct callClaude failed, using offline mock AI', err)
            raw = mockOfflineAI(text, weekEvents)
          }
        } else {
          raw = mockOfflineAI(text, weekEvents)
        }
      } catch (err) {
        console.warn('Browser imports failed, using offline mock AI', err)
        raw = mockOfflineAI(text, weekEvents)
      }
    }

    try {
      const action = extractAction(raw)
      let displayText = action.text ?? raw.trim().slice(0, 300)

      if (action.type === 'create_event' && onCreateEvent && action.title && action.date && action.startTime) {
        const endTime = action.endTime || addOneHour(action.startTime)
        try {
          await onCreateEvent({
            title: action.title,
            date: action.date,
            startTime: action.startTime,
            endTime,
            description: action.description,
          })
        } catch {
          displayText = `Errore nella creazione dell'evento. ${connected ? '' : 'Salvato localmente.'}`
        }
      } else if (action.type === 'delete_event' && onDeleteEvent && action.eventId) {
        const ok = await onDeleteEvent(action.eventId)
        if (!ok) displayText = `Non riesco a trovare o eliminare l'evento.`
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: displayText },
      ]
      addMessage('system', displayText)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      addMessage('system', `Errore AI: ${msg}`)
    } finally {
      setIsTyping(false)
      scrollToBottom()
    }
  }, [addMessage, scrollToBottom])

  const sendMessage = useCallback(() => processMessage(inputValue), [inputValue, processMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  return { messages, isTyping, inputValue, setInputValue, sendMessage, handleKeyPress, messagesEndRef }
}

