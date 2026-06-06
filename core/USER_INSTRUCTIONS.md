# WhyCalendar — Istruzioni di Edo (testo originale)

Rileggere SEMPRE prima di toccare qualsiasi file. Aggiornare ad ogni sessione.

---

## Visione generale

"è stato creato per essere superfunzionale grazie all'ai"

"voglio che ci siano delle vere e proprie cose fighe — non voglio che sia un localhost
ma una vera e propria app figa fatta bene come le altre — non vedo perche non posso averla
anche io e forse anche meglio quindi impegnati davvero"

"deve essere intuitivo e davvero efficace"

---

## Icona

"smussa quell'icon come tutte le altre — deve avere i bordi smussati come ogni app macOS"
"devi applicare una maschera all'icona per renderla ottimizzata per macOS"
→ FATTO: squircle Apple HIG 22.37% radius con alpha trasparente negli angoli.

---

## Finestra

"l'app deve essere ottimizzata per macos con bordi smussati e i classici bottoncini colorati
in alto a sinistra per ingrandire chiudere o minimizzare il programma ma proprio la base"
→ FATTO: decorations:true + titleBarStyle:Overlay → traffic light nativi macOS reali.

---

## Morning Brief

"io devo vedere visivamente subito quello che devo fare e le domande prima di ogni giornata
che sono suggerimenti nella chatbox cose così"
→ FATTO: MorningBriefPanel.tsx — cards espandibili visibili SUBITO all'apertura.

---

## Timeline (PRIORITÀ ALTA — ancora da finire)

"la timeline deve essere più visibile e confrontabile con quelle delle giornate
sia precedenti che quelle future"

"io la farei più figa sotto del giorno corrente sempre e ancora più figa sopra —
quella linea deve essere fatta benissimo con un grafico che fa vedere la durata della giornata
in una maniera biomeccanica affascinante"

→ DA FARE: timeline biomeccanica bella, grafico visivo del tempo, Google Calendar integrato.

---

## Modalità Standby

"molto importante un testino toggle dopo tutto solo esclusivamente per la modalità standby
dove mettere in risalto l'orario le notifiche delle cose da fare e la linea —
deve essere tutto logico e intelligente"
→ FATTO: toggle "Standby" in alto a destra, schermata con clock scramble + barra giornata.

---

## Tipografia e stile visivo

"le logiche le proporzioni la sinuosità tutto deve combaciare perfettamente —
stile biomeccanico ispirato a marathon — contrasti perfetti tra font"

"usa QZ Teletype per creare contrasti facendo attenzione alle proporzioni
magari mettendolo nella modalità stand by"

"ricordati di implementare quell'effetto — il numero si carica facendone scorrere tanti
prima di apparire — tipico di film o terminali fighi"
→ FATTO: ScrambleDigit in StandbyMode — 14 frame di caratteri casuali a 32ms poi valore reale.

Font:
- NeuePower-Ultra.ttf → --font-display (titoli, clock, impatto)
- QZ-Teletype.ttf     → --font-mono (standby, numeri tecnici, contrasto)
- Chakra Petch        → fallback

---

## Google Calendar — DA FARE

"poi deve essere collegato a google calendar"
OAuth2 PKCE flow + eventi reali nella Timeline.

---

## AI — DA FARE

useChat.ts ha risposte hardcoded. Serve Anthropic API con contesto da core/MEMORY.md.

---

## Regole di processo

"ogni volta per farmi vedere i cambiamenti devi riapprire l'app"
→ Dopo ogni build: cp in /Applications + open /Applications/WhyCalendar.app

"ALLA FINE DI TUTTO RILEGGI TUTTI I MESSAGGI 2 VOLTE per fare esattamente come dico"

"METTI TUTTO QUELLO CHE TI HO CHIESTO TESTUALMENTE IN UN FILE
dove ti viene semplice ripescare così i miei concetti non si vanificano"
→ Questo file. Aggiornare sempre.

---

## Cose vietate

- Font demo/watermark (Seona-DEMO rimosso)
- Bottoni React finti per close/minimize
- decorations: false
- border-radius: 0 ovunque (sembra finto)
- "sembra finto" — tutto deve sembrare una vera app macOS professionale
