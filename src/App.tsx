import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Background from './components/Background'
import Clock from './components/Clock'
import DayStream from './components/DayStream'
import DayDetail from './components/DayDetail'
import ChatInterface from './components/ChatInterface'
import Timeline from './components/Timeline'
import StandbyMode from './components/StandbyMode'
import GoogleCalendarSetup from './components/GoogleCalendarSetup'
import PomodoroWidget from './components/PomodoroWidget'
import EventParticles from './components/EventParticles'
import { useDayNavigation } from './hooks/useDayNavigation'
import { useChat } from './hooks/useChat'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import { ensureDefaultConfig } from './core/google/auth'
import { saveBriefAnswers } from './core/storage/local'
import { formatDate } from './utils/date'

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'

export default function App() {
  const [standby, setStandby] = useState(false)
  const [showCalSetup, setShowCalSetup] = useState(false)
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [eventCreated, setEventCreated] = useState(false)

  // Salva le credenziali di default all'avvio se non già presenti
  useEffect(() => { ensureDefaultConfig() }, [])

  const { selectedDate, dayData, weekDays, goToDate } = useDayNavigation()
  const { connected, loading: calLoading, error: calError, connect, disconnect, eventsFor, weekEvents, createEvent: _createEvent, deleteEvent, refresh } = useGoogleCalendar()
  const createEvent = async (...args: Parameters<typeof _createEvent>) => {
    const result = await _createEvent(...args)
    setEventCreated(true)
    return result
  }
  const { messages, isTyping, inputValue, setInputValue, sendMessage, handleKeyPress, messagesEndRef } = useChat({
    connected,
    weekEvents,
    onCreateEvent: createEvent,
    onDeleteEvent: deleteEvent,
  })

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg-primary)' }}>
      <Background />

      {/* Title bar */}
      <div
        data-tauri-drag-region
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 44,
          zIndex: 9999, display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingLeft: 80, paddingRight: 16, gap: 8,
        }}
      >
        {/* Google Calendar */}
        <motion.button
          onClick={() => connected ? disconnect() : setShowCalSetup(true)}
          whileHover={{ opacity: 1, scale: 1.02 }}
          style={{
            background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(255,200,0,0.06)',
            border: `1px solid ${connected ? 'rgba(34,197,94,0.4)' : 'rgba(255,200,0,0.25)'}`,
            borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85, transition: 'all 0.2s',
          }}
        >
          {connected ? (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
                boxShadow: '0 0 8px rgba(34,197,94,0.9)' }}
            />
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFC107' }} />
          )}
          <span style={{ fontFamily: SF, fontSize: 12, fontWeight: 600,
            color: connected ? '#22C55E' : '#FFC107' }}>
            {connected ? 'Google Calendar' : 'Autorizza Calendar'}
          </span>
        </motion.button>

        {/* Standby */}
        <motion.button
          onClick={() => setStandby(true)}
          whileHover={{ opacity: 1 }}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, opacity: 0.45, transition: 'opacity 0.2s',
          }}
        >
          <span style={{ fontFamily: SF, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Standby</span>
          <span style={{ fontSize: 9, opacity: 0.5 }}>◐</span>
        </motion.button>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {standby && <StandbyMode onExit={() => setStandby(false)} eventsFor={eventsFor} />}
      </AnimatePresence>

      {showCalSetup && (
        <GoogleCalendarSetup
          onConnect={async (cfg) => {
            await connect(cfg)
            setShowCalSetup(false)
          }}
          loading={calLoading}
          error={calError}
        />
      )}

      {/* Main layout */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'row',
        height: '100vh', paddingTop: 44,
      }}>
        {/* LEFT: Clock sidebar full-height */}
        <div style={{
          width: 160, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <Clock />
        </div>

        {/* RIGHT: tutto il resto impilato */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* DayStream strip */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
            <DayStream
              days={weekDays}
              selectedDate={selectedDate}
              onSelect={goToDate}
              eventsFor={eventsFor}
            />
          </div>

          {/* DayDetail + Chat */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: '55%', borderRight: '1px solid var(--border)', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={dayData.date}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ padding: '18px 22px', minHeight: '100%' }}
                >
                  <DayDetail day={dayData} calendarEvents={eventsFor(selectedDate)} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div style={{ width: '45%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Pomodoro toggle button */}
              <div style={{ flexShrink: 0, padding: '8px 14px 0',
                borderBottom: showPomodoro ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <motion.button
                  onClick={() => setShowPomodoro(p => !p)}
                  whileHover={{ opacity: 1 }}
                  style={{
                    background: showPomodoro ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${showPomodoro ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 4, padding: '5px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: showPomodoro ? 1 : 0.6, transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 11 }}>🍅</span>
                  <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 600,
                    color: showPomodoro ? '#00E5FF' : 'rgba(255,255,255,0.5)' }}>
                    Pomodoro
                  </span>
                  <motion.span
                    animate={{ rotate: showPomodoro ? 180 : 0 }}
                    style={{ fontFamily: SF, fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}
                  >▾</motion.span>
                </motion.button>
              </div>

              {/* Pomodoro widget */}
              <AnimatePresence>
                {showPomodoro && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden', flexShrink: 0, padding: '10px 14px' }}
                  >
                    <PomodoroWidget />
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatInterface
                  messages={messages}
                  isTyping={isTyping}
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  onSend={sendMessage}
                  onKeyPress={handleKeyPress}
                  messagesEndRef={messagesEndRef}
                  onBriefComplete={(answers) => {
                    const typed = answers as { focus?: string; blocker?: string; energy?: string; commit?: string }
                    saveBriefAnswers(formatDate(new Date()), {
                      focus: typed.focus ?? '',
                      blocker: typed.blocker ?? '',
                      energy: parseInt(typed.energy ?? '0') || 0,
                      commit: typed.commit ?? '',
                    })
                    if (connected) refresh().catch(() => {})
                  }}
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <Timeline eventsFor={eventsFor} connected={connected} />
        </div>
      </div>


      {/* Event creation particles */}
      <EventParticles active={eventCreated} onComplete={() => setEventCreated(false)} />

      <div className="noise-overlay" />
    </div>
  )
}
