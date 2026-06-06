const API_KEY_STORAGE = 'anthropic_api_key'

export function getAnthropicKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE)
}

export function saveAnthropicKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export function clearAnthropicKey() {
  localStorage.removeItem(API_KEY_STORAGE)
}

export async function callClaude(
  userMessages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string
): Promise<string> {
  const key = getAnthropicKey()
  if (!key) throw new Error('NO_KEY')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: userMessages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err?.error?.message ?? 'Errore API')
  }

  const data = await res.json()
  return data.content[0]?.text ?? ''
}
