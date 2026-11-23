const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787'

export interface Link { name: string; token: string }

async function call<T>(path: string, password = '', init: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-password': password },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Error ${res.status}`)
  return body as T
}

export const api = {
  login: (pw: string) => call<{ names: string[]; admin: boolean }>('/api/login', pw),
  lists: (pw: string) => call<{ lists: Record<string, string> }>('/api/lists', pw),
  saveList: (pw: string, name: string, text: string) =>
    call('/api/lists/' + encodeURIComponent(name), pw, { method: 'PUT', body: JSON.stringify({ text }) }),
  links: (pw: string) => call<{ links: Link[] | null }>('/api/admin/links', pw),
  draw: (pw: string) => call<{ links: Link[] }>('/api/admin/draw', pw, { method: 'POST' }),
  gift: (token: string) => call<{ recipient: string; list: string }>('/api/gift/' + token),
}

/** Full URL of a recipient's private page. */
export const giftUrl = (token: string) =>
  `${location.origin}${location.pathname}#/gift/${token}`
