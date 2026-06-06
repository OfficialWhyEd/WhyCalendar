# WhyCalendar — Design Brief

> Documento di riferimento completo per designer e AI. Contiene tutto il necessario per lavorare sul prodotto senza perdere il filo: vision, tipografia, colori, motion, componenti, riferimenti, regole. Leggi questo prima di toccare qualsiasi file.

---

## Vision

WhyCalendar non è un'app calendario. È un sistema operativo personale near-future — come se un chief of staff con accesso a tutto il tuo contesto vivesse in un terminale militare di ultima generazione. L'estetica deve comunicare: controllo totale, precisione, intelligenza silenziosa. Non è mai colorato, mai giocoso, mai generico.

**Parola chiave visiva:** _sistema vivo che respira._

---

## Riferimenti visivi (cosa prendere, cosa non prendere)

### Riferimento principale — [marathonthegame.com](https://marathonthegame.com/it-it)
- **Cosa prendere:** tipografia all-caps impact, layout asimmetrico con spazio negativo brutale, layering di testo su immagini/video, senso di peso e scala, framing cinematico delle sezioni
- **NON copiare:** il contesto gaming, i colori specifici, le immagini. Solo il _ritmo visivo_ e il senso di scala tipografica

### Riferimento motion — UI sci-fi / HUD militare
- Ogni elemento dell'interfaccia sembra un sistema attivo, non uno schermo statico
- I dati "arrivano" — non appaiono
- Transizioni mai secche: sempre blur + fade + slide o qualche combinazione

### Riferimento tipografico — display industriale
- Tutto-maiuscolo per label, titoli, status
- Spaziatura lettere ampia (0.2em–0.4em) su testi piccoli
- Contrasto netto tra display bold (Chakra Petch) e body leggero (SF Pro 300)

---

## Tipografia

### Font primario — display, titoli, orologio, logo

```
Font: Chakra Petch
Pesi disponibili: 400 (Regular), 600 (SemiBold), 700 (Bold)
Installato via: @fontsource/chakra-petch
Variabile CSS: var(--font-display)
```

> **Perché Chakra Petch:** geometrico, angolare, stretto — ha gli stessi spigoli vivi e la stessa energia tecnica del T-012 originale. È su Google Fonts (OFL), zero costi.

> **Nota T-012:** se in futuro viene acquistato il T-012 originale (https://payhip.com/b/T7420), mettere i file `.otf` in `/public/fonts/` e decommentare il `@font-face` in `src/styles/fonts.css`. La variabile CSS `--font-display` è già agganciata.

### Font secondario — UI funzionale, body, input

```
Font: SF Pro Display / SF Pro Text (system font macOS)
Fallback: -apple-system, BlinkMacSystemFont, sans-serif
Variabile CSS: var(--font-ui)
```

### Gerarchia tipografica

| Ruolo | Font | Peso | Size | Tracking | Case |
|---|---|---|---|---|---|
| Logo / App name | Chakra Petch | 700 | 24px | 0.3em | ALL CAPS |
| Ora corrente (clock) | Chakra Petch | 700 | 120px | default | — |
| Secondi (clock) | Chakra Petch | 700 | 60px | default | — |
| Data sotto il clock | Chakra Petch | 400 | 18px | 0.3em | ALL CAPS |
| Titoli sezione | Chakra Petch | 700 | 28–36px | 0.15em | ALL CAPS |
| Label badge / status | Chakra Petch | 400 | 10–11px | 0.3em | ALL CAPS |
| Domande Morning Brief | SF Pro | 300 | 15–17px | default | Sentence |
| Body / risposte / note | SF Pro | 400 | 14px | default | Sentence |
| Input testo | SF Pro | 400 | 14px | default | Sentence |
| Numeri progressivi 01/02 | Chakra Petch | 400 | 10px | 0.3em | — |

**Regola assoluta:** Chakra Petch per impatto e identità. SF Pro per leggibilità e funzione. Non mescolare mai nei ruoli sbagliati.

---

## Sistema Colori

```css
/* Sfondi */
--bg-primary:    #080808;   /* sfondo base — quasi nero assoluto */
--bg-secondary:  #0f0f0f;   /* card, pannelli, sidebar */
--bg-elevated:   #161616;   /* hover states, modal, tooltip */

/* Accenti */
--accent-cold:   #00d4ff;   /* ciano elettrico — azioni primarie, indicatori, glow */
--accent-warm:   #ff6b2b;   /* arancio fuoco — alert, priorità alta, warning */
--accent-ghost:  rgba(0,212,255,0.08); /* background sottile su hover cyan */

/* Testo */
--text-primary:  #f0f0f0;   /* testo principale */
--text-secondary:#666666;   /* date, label secondari, placeholder */
--text-muted:    #333333;   /* elementi disabilitati, decorativi */

/* Bordi */
--border:        rgba(255,255,255,0.06); /* bordi default — quasi invisibili */
--border-active: rgba(0,212,255,0.3);   /* bordi su focus/hover */

/* Glow */
--glow-cyan:     0 0 40px rgba(0,212,255,0.15);
--glow-cyan-sm:  0 0 10px rgba(0,212,255,0.3);
--glow-warm:     0 0 20px rgba(255,107,43,0.4);
```

### Regole d'uso colori
- Il ciano `#00d4ff` è la firma del sistema — usarlo con parsimonia. Se è ovunque, perde forza
- L'arancio `#ff6b2b` solo per urgenza reale: deadline, task scaduti, errori critici
- Mai background colorati — solo sfumature di nero. Il colore sta negli accenti e nei glow
- I bordi devono essere quasi invisibili nel default, si accendono solo su hover/focus

---

## Motion Design

### Principio base
Nessun elemento appare o scompare senza ragione fisica. Tutto ha inerzia. Il sistema è vivo.

### Named transitions (usare questi nomi nel codice)

```typescript
const transitions = {
  // Snap — per feedback immediato (click, toggle)
  snap: { type: "spring", stiffness: 500, damping: 30 },

  // Smooth — per entrate di componenti, hover
  smooth: { type: "spring", stiffness: 200, damping: 25 },

  // Slow — per reveal scenografici, page load
  slow: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },

  // Glitch — micro-distorsione su elementi Chakra Petch (non continuativa)
  glitch: { duration: 0.08, ease: "linear" },

  // Data — per numeri che cambiano (clock digits, contatori)
  data: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
}
```

### Effetti obbligatori per componente

**Page load / primo render:**
- Stagger reveal: ogni elemento entra con delay progressivo (0.1s–0.15s tra elementi)
- Clock: slide down + fade, delay 0s
- Status indicator: fade, delay 0.4s
- Morning Brief: slide up + blur dissolve, delay 0.6s
- Timeline: slide up dal basso, delay 0.8s

**Orologio (Clock.tsx):**
- Ogni digit è indipendente
- Cambio digit: vecchio scorre su (translateY -100%), nuovo entra dal basso (translateY 100% → 0)
- Durata: 180ms con ease [0.4,0,0.2,1]
- Separatori `:` pulsano: opacity 1→0.2→1 in loop 1s

**Morning Brief questions:**
- Ogni card: delay staggerato (index × 0.3s + 0.5s base)
- Animazione: `y: 30→0, filter: blur(20px)→blur(0px), opacity: 0→1`
- Titolo: carattere per carattere con delay 40ms/lettera
- Glitch layer sul titolo: opacity 0→0.3→0, repeat ogni 6s
- Submit → completamento: sweep line cyan da sinistra (scaleX 0→1, 0.8s), poi testo "SISTEMA AVVIATO"

**TaskCard:**
- Hover: `translateY(-2px)`, border passa a `--border-active`, box-shadow glow-cyan
- Click/complete: 
  1. Flash bianco (opacity 0→0.6→0, 100ms)
  2. Particle burst: 8 punti cyan che esplodono radialmente (scale 0→1, opacity 1→0, 400ms)
  3. Strikethrough animato: `text-decoration` + `opacity: 0.4`
  4. Border diventa `--accent-cold` pieno

**Background:**
- Gradient mesh: 3 blob semitrasparenti che si muovono lentamente in loop (30s)
- Noise texture: SVG filter `feTurbulence` a 3.5% opacity, statica
- Scan line: linea sottile che attraversa il pannello ogni 8s, durata 2s, opacity 0.03

**Sidebar:**
- Default: 60px width, icone centrate
- Hover expanded: 200px width, spring smooth
- Icon hover: glow cyan, scale 1.1
- Label: slide da sinistra (x: -10 → 0) + fade

**Timeline (bottom bar):**
- Indicatore ora corrente: linea verticale cyan, opacity 1→0.4→1 in loop 2s, glow-cyan-sm
- Evento hover: tooltip slide up + fade, bg-elevated + border-active
- Pill evento: background semi-opaco, border sottile, cornerless (border-radius: 2px)

---

## Layout

### Grid principale

```
┌─────────────────────────────────────────────────────────┐
│  [drag region 40px — data-tauri-drag-region]            │
├──────┬──────────────────────────────────────────────────┤
│      │                                                  │
│  SB  │         CLOCK (centro alto)                     │
│  60px│         status indicator                        │
│      │                                                  │
│      │         MAIN CONTENT                            │
│      │         (MorningBrief | DayPlan | ...)          │
│      │                                                  │
├──────┴──────────────────────────────────────────────────┤
│  TIMELINE BAR (60px — fixed bottom)                    │
└─────────────────────────────────────────────────────────┘
```

### Regole layout
- Finestra: 1280×800 (min 960×600), borderless (`decorations: false`)
- Sidebar fissa a sinistra, 60px collapsed — non occupa spazio logico quando espansa (overlay)
- Area main: `padding-left: 72px` (sidebar + gap), `padding-bottom: 64px` (timeline)
- `padding-top: 40px` per drag region + `padding-top: 48px` per il clock
- Contenuto centrato orizzontalmente con `max-width: 680px` per il content principale
- Spazio negativo: mai riempire tutto. Il vuoto è intenzionale
- Nessun `border-radius > 4px` — corners quasi sharp, mai card "pillola"
- `clip-path` preferito a border-radius per angoli tagliati dove serve effetto militare

---

## Componenti — Specifiche

### WindowControls
- Tre dot macOS (rosso, giallo, verde) posizionati in alto a destra della drag region
- `opacity: 0.4` default, `opacity: 1` su hover del gruppo
- Su hover: label unicode (×, −, +) appaiono
- Usano `getCurrentWindow()` da `@tauri-apps/api/window`

### Background
- Layer 1: `background: #080808` (base)
- Layer 2: gradient mesh — 3 blob con `radial-gradient`, colori `rgba(0,212,255,0.03)` e `rgba(255,107,43,0.02)`, movimento loop `30s ease-in-out infinite`
- Layer 3: noise SVG filter a opacity 3.5%
- Layer 4: scan line ogni 8s
- Tutto `position: fixed, inset: 0, pointer-events: none, z-index: 0`

### Cursor
- Cursore di sistema nascosto: `cursor: none !important` su tutti gli elementi
- Custom: crosshair con 4 segmenti (su, giù, sx, dx) + punto centrale 2×2px
- Colore: `#00d4ff` con `filter: drop-shadow(0 0 4px #00d4ff)`
- Segmenti: 8px lunghezza, 1px spessore, gap centrale 4px
- Segue mouse con `useMotionValue` + `useSpring` (stiffness: 150, damping: 15)
- Il cursore intero scala su click: `scale: 0.8` con spring snap

### Clock
- Size display: `120px` per HH:MM, `60px` per SS
- Separatori `:` in `rgba(0,212,255,0.5)`
- Ogni digit: slot machine verticale (vedi Motion sopra)
- Data: `GIO 15 MAG 2026` — formato `DAY DD MON YYYY` tutto maiuscolo, tracking 0.3em
- Glow leggero sul testo: `text-shadow: 0 0 30px rgba(0,212,255,0.2)`

### MorningBrief
- Container: `max-width: 680px`, centrato, `padding: 0 24px`
- Titolo "BRIEF DEL GIORNO": Chakra Petch 700, 32px, tracking 0.15em
- Numerazione domande: `01`, `02`, `03`, `04` — Chakra Petch 400, 10px, cyan 0.7 opacity
- Card domanda: bg-secondary, border-default, border-radius 4px, padding 20×24px
- Textarea: bg quasi trasparente (`rgba(255,255,255,0.03)`), no outline, focus → border-active + glow-cyan-sm
- Button submit: Chakra Petch, 12px, tracking 0.25em, "AVVIA LA GIORNATA →"
  - Disabled: quasi invisibile (bg/border muted)
  - Active: `rgba(0,212,255,0.1)` bg, border-active, glow-cyan, `whileHover: { x: 4 }`

### DayPlan / TaskCard
- Lista verticale, gap 12px, stagger-in da sinistra (x: -20 → 0)
- Card: bg-secondary, border-default, padding 16×20px, border-radius 4px
- Priority dot: 4px circle, accent-warm per alta, accent-cold per normale
- Checkbox custom: quadrato 16px, border-default, su check → fill accent-cold + scale 1.2 + spring
- Particle burst: 8 `motion.div` posizionati absolute attorno al checkbox, emessi radialmente

### Timeline
- `height: 60px`, `position: fixed, bottom: 0`, `background: rgba(8,8,8,0.85)`, `backdrop-filter: blur(20px)`
- Border top: `1px solid var(--border)`
- Scala 00→24: label ore ogni 3h in Chakra Petch 10px, text-muted
- Evento: pill `height: 28px`, bordo 1px, bg semi-opaco con colore evento, border-radius 2px
- Tooltip su hover: bg-elevated, border-active, SF Pro 12px, shadow-elevated
- Indicatore ora corrente: linea 1px, accent-cold, glow-cyan-sm, pulsante

---

## Asset e File

### Struttura progetto

```
WhyCalendar/
├── src/
│   ├── components/
│   │   ├── Background.tsx      ✅ creato
│   │   ├── Clock.tsx           ✅ creato
│   │   ├── Cursor.tsx          ✅ creato
│   │   ├── DayPlan.tsx         ✅ creato
│   │   ├── MorningBrief.tsx    ✅ creato
│   │   ├── Sidebar.tsx         ✅ creato
│   │   ├── TaskCard.tsx        ✅ creato
│   │   ├── Timeline.tsx        ✅ creato
│   │   └── WindowControls.tsx  ✅ creato
│   ├── core/
│   │   └── coreFiles.ts        ✅ creato
│   ├── styles/
│   │   ├── globals.css         ✅ design system completo
│   │   └── fonts.css           ✅ font-face placeholder T-012
│   ├── App.tsx                 ✅ layout principale
│   └── main.tsx                ✅ entry point + font import
├── core/                       ✅ file persistenti AI
│   ├── MEMORY.md
│   ├── SOUL.md
│   ├── HEARTBEAT.md
│   ├── USER_INSTRUCTIONS.md
│   └── CONTEXT.md
├── src-tauri/                  ✅ app nativa macOS
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── src/
└── DESIGN_BRIEF.md             ← questo file
```

### Font installati
- `@fontsource/chakra-petch` — via npm, pesi 400/600/700
- Importato in `src/main.tsx`
- Variabile CSS: `var(--font-display)` → `'Chakra Petch', 'Share Tech Mono', monospace`

### Icone
- Usare icone SVG inline (no librerie icon-font)
- Stile: line icons, 1.5px stroke, no fill, angoli sharp
- Dimensione standard sidebar: 20×20px

---

## Roadmap di sviluppo

### Fase 1 — Foundation ✅ (completata)
- [x] Vite + React + TypeScript + Framer Motion
- [x] Design system CSS (variabili, keyframes, utility)
- [x] Font Chakra Petch installato
- [x] Tutti i componenti base creati e animati
- [x] Layout principale: sidebar + clock + content + timeline
- [x] File core AI: MEMORY.md, SOUL.md, HEARTBEAT.md, ecc.
- [x] Struttura Tauri per app nativa macOS

### Fase 2 — AI Core (prossima)
- [ ] Integrazione Anthropic API (`claude-sonnet-4-20250514`)
- [ ] Morning Brief dinamico: legge MEMORY.md + genera domande contestuali
- [ ] Aggiornamento automatico MEMORY.md a fine sessione
- [ ] Aggiornamento HEARTBEAT.md con log giornaliero
- [ ] CONTEXT.md: stato sessione persistente

### Fase 3 — Google Calendar
- [ ] OAuth2 PKCE flow (Tauri compatible)
- [ ] Lettura eventi del giorno e dei 2 successivi
- [ ] Visualizzazione in Timeline con eventi reali
- [ ] Scrittura eventi (sync piano del giorno → Calendar)
- [ ] Morning Brief usa eventi reali come contesto

### Fase 4 — Telegram Bot
- [ ] Setup `node-telegram-bot-api`
- [ ] Comandi: /brief, /today, /add, /done, /memo
- [ ] Morning Brief sequenziale via chat
- [ ] Inline keyboards per scelte rapide
- [ ] Stessa AI, tono adattato al mobile

### Fase 5 — Polish finale
- [ ] Icona app custom (design Chakra Petch "W" su nero con glow cyan)
- [ ] Onboarding: prima apertura → SOUL.md + USER_INSTRUCTIONS.md editabili
- [ ] View Memory: visualizzazione e editing MEMORY.md dall'app
- [ ] Settings: API keys, preferenze, font (slot per T-012 quando acquistato)
- [ ] Micro-interazioni finali: scan line, cursor refinement, particle tuning
- [ ] Build per distribuzione: `npm run tauri build` → `.dmg` + `.app`

---

## Comandi utili

```bash
# Dev server browser (solo React/Vite)
cd ~/Documents/WhyCalendar && npm run dev
# → http://localhost:5173

# App nativa Tauri (prima compilazione: 10-15 min)
cd ~/Documents/WhyCalendar && source "$HOME/.cargo/env" && npm run tauri dev

# Build finale .app / .dmg
cd ~/Documents/WhyCalendar && source "$HOME/.cargo/env" && npm run tauri build
```

---

## Cosa NON fare mai

- Nessun `border-radius > 4px` — mai card arrotondate
- Nessun colore di sfondo che non sia una variazione di nero `#080808–#161616`
- Nessun elemento bianco puro — massimo `#f0f0f0`
- Nessuna animazione con `ease: "linear"` eccetto il glitch
- Nessun testo decorativo con SF Pro — SF Pro solo per contenuto funzionale
- Nessun Lorem ipsum — il copy deve sempre avere senso nel contesto di WhyCalendar
- Nessuna icona da librerie (Font Awesome, Heroicons, ecc.) — SVG inline custom
- Nessun `z-index` casuale — usare sempre i layer definiti: bg(0), content(10), overlay(100), cursor(1000), modal(500), noise(9999)

---

*WhyCalendar — built for Edo. Design brief by Claude Code.*
