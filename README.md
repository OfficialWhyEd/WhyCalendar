<p align="center">
  <img src="assets/banner.png" alt="WhyCalendar" width="100%"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri&logoColor=white" />
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Google_Calendar-OAuth-4285F4?style=flat-square&logo=googlecalendar&logoColor=white" />
  <img src="https://img.shields.io/badge/macOS-Monterey+-000000?style=flat-square&logo=apple&logoColor=white" />
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" />
</p>

<br/>

> Assistente personale AI per la gestione del calendario. App nativa macOS con Google Calendar integrato, AI chat contestuale, timer e promemoria intelligenti.

---

## Come funziona

```
Google Calendar API → WhyCalendar → AI (Claude Code CLI)
        ↑                                     ↓
   OAuth 2.0                        Suggerimenti · Recap · Task
```

| Feature | Descrizione |
|---------|-------------|
| **Calendario AI** | Vista giornaliera/settimanale con chat AI contestuale |
| **Timer intelligente** | Pomodoro + time tracking per ogni evento |
| **Recap giornaliero** | AI sintetizza la giornata e suggerisce priorità |
| **Promemoria** | Notifiche native macOS |

---

<p align="center">
  <img src="assets/screenshot.png" alt="WhyCalendar Dashboard" width="100%"/>
</p>

---

## Features

- **Google Calendar sync** — OAuth 2.0, lettura e scrittura eventi in tempo reale
- **Chat AI integrata** — chiedi all'AI di organizzare la settimana, trovare buchi, creare eventi
- **Timer & focus mode** — time tracking nativo per ogni slot di lavoro
- **Mascotte WhySpidey** — feedback visivo animato sullo stato della giornata
- **App nativa macOS** — Tauri 2, bundle `.app`, menu bar

---

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri 2 (Rust)
- **AI**: Claude Code CLI — nessuna API key Anthropic
- **Calendar**: Google Calendar API v3
- **Auth**: OAuth 2.0 PKCE

---

## Setup

```bash
git clone https://github.com/OfficialWhyEd/WhyCalendar
cd WhyCalendar

npm install
cd src-tauri && cargo build

# Configura Google OAuth
cp .env.example .env   # aggiungi GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET

npm run tauri dev
```

---

## Struttura

```
WhyCalendar/
├── src/
│   ├── components/    # Calendar, Timer, Chat, Mascot
│   ├── core/          # Google Calendar API client
│   ├── hooks/         # useCalendar, useTimer, useAI
│   └── utils/
└── src-tauri/         # Backend Rust + OAuth handler
```

---

<p align="center">Built by <a href="https://github.com/OfficialWhyEd">@whyed</a> · macOS · Tauri 2 · local-first</p>
