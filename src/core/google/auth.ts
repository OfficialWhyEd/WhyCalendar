import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'

const OAUTH_PORT = 9782
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}`
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

const TOKEN_KEY = 'gc_tokens'
const CONFIG_KEY = 'gc_config'

const DEFAULT_CONFIG: GCalConfig = {
  clientId: '364209167064-ag3u2k28nedm4t96le30uq149mujnki5.apps.googleusercontent.com',
  clientSecret: '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',
}

export function ensureDefaultConfig(): GCalConfig {
  const existing = getConfig()
  if (!existing) {
    saveConfig(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }
  return existing
}

export { DEFAULT_CONFIG }

export interface GCalConfig {
  clientId: string
  clientSecret: string
}

export interface GCalTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export function getConfig(): GCalConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveConfig(cfg: GCalConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

export function getTokens(): GCalTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveTokens(t: GCalTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t))
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isConnected(): boolean {
  const tokens = getTokens()
  return !!tokens
}

async function generatePKCE() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return { verifier, challenge }
}

export async function startOAuthFlow(config: GCalConfig): Promise<void> {
  const { verifier, challenge } = await generatePKCE()
  sessionStorage.setItem('pkce_verifier', verifier)

  const state = crypto.randomUUID()
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

  // Avvia server locale per ricevere il callback
  const codePromise = invoke<string>('wait_for_oauth_callback', { port: OAUTH_PORT })

  // Apre il browser
  await open(authUrl)

  // Aspetta il codice
  const code = await codePromise

  // Scambia il codice per i token
  await exchangeCode(code, config)
}

async function exchangeCode(code: string, config: GCalConfig): Promise<void> {
  const verifier = sessionStorage.getItem('pkce_verifier') ?? ''

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange fallito: ${err}`)
  }

  const data = await res.json()
  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  })
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens) return null

  // Token ancora valido (con 5min di margine)
  if (tokens.expiresAt - Date.now() > 5 * 60 * 1000) {
    return tokens.accessToken
  }

  // Refresh
  if (!tokens.refreshToken) {
    clearTokens()
    return null
  }

  const config = getConfig()
  if (!config) return null

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) {
      clearTokens()
      return null
    }

    const data = await res.json()
    saveTokens({
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    })

    return data.access_token
  } catch {
    return null
  }
}
