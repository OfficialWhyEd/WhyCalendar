/**
 * coreFiles.ts — Lettura/scrittura dei file core di WhyCalendar.
 *
 * Ambiente attuale: browser (Vite dev server)
 * Prossimo step: Tauri → usare @tauri-apps/api/fs
 *
 * Per ora i file vengono serviti da /core/ come assets statici (GET).
 * La scrittura è stub — in Tauri useremo fs.writeTextFile.
 */

const CORE_BASE = '/core'

/**
 * Legge un file dalla cartella /core.
 * In Tauri: sostituire con `readTextFile(path)` dall'API Tauri.
 */
export async function readCoreFile(name: string): Promise<string> {
  // Tauri version (future):
  // const { readTextFile } = await import('@tauri-apps/api/fs')
  // return readTextFile(`${await appDir()}core/${name}`)

  const res = await fetch(`${CORE_BASE}/${name}`)
  if (!res.ok) {
    throw new Error(`Cannot read core file: ${name} (${res.status})`)
  }
  return res.text()
}

/**
 * Scrive un file nella cartella /core.
 * In Tauri: sostituire con `writeTextFile(path, content)`.
 */
export async function writeCoreFile(name: string, content: string): Promise<void> {
  // Tauri version (future):
  // const { writeTextFile } = await import('@tauri-apps/api/fs')
  // return writeTextFile(`${await appDir()}core/${name}`, content)

  // In browser non possiamo scrivere sul filesystem — log per ora.
  console.log(`[coreFiles] writeCoreFile("${name}") — stub in browser mode`)
  console.log(content)
}

/**
 * Aggiunge una riga al HEARTBEAT.md.
 * Formato: [HH:MM] AZIONE: descrizione
 */
export async function appendToHeartbeat(entry: string): Promise<void> {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const line = `[${hh}:${mm}] ${entry}`

  let existing = ''
  try {
    existing = await readCoreFile('HEARTBEAT.md')
  } catch {
    existing = '# Heartbeat — Log Giornaliero\n\n'
  }

  const updated = existing + '\n' + line
  await writeCoreFile('HEARTBEAT.md', updated)
}

/**
 * Legge lo stato corrente dal CONTEXT.md.
 */
export async function readContext(): Promise<Record<string, string>> {
  try {
    const content = await readCoreFile('CONTEXT.md')
    return { raw: content }
  } catch {
    return { raw: '' }
  }
}

/**
 * Legge le regole utente da USER_INSTRUCTIONS.md.
 */
export async function readUserInstructions(): Promise<string> {
  try {
    return await readCoreFile('USER_INSTRUCTIONS.md')
  } catch {
    return ''
  }
}

/**
 * Legge la "soul" del sistema da SOUL.md.
 */
export async function readSoul(): Promise<string> {
  try {
    return await readCoreFile('SOUL.md')
  } catch {
    return ''
  }
}
