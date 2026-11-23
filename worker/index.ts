import { draw, newToken } from './draw'

interface KV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}
interface Env {
  SANTA: KV
  NAMES: string
  FAMILY_PASSWORD: string
  ADMIN_PASSWORD: string
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,x-password',
  'access-control-allow-methods': 'GET,PUT,POST,OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } })

/** KV layout: list:<name> = text, links = [{name, token}], gift:<token> = recipient name. */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
    const path = new URL(req.url).pathname
    const names = env.NAMES.split(',').map((n) => n.trim()).filter(Boolean)
    const pw = req.headers.get('x-password') ?? ''
    const isAdmin = pw !== '' && pw === env.ADMIN_PASSWORD
    const isFamily = isAdmin || (pw !== '' && pw === env.FAMILY_PASSWORD)

    // Gift links are authorised by the unguessable token alone.
    const gift = path.match(/^\/api\/gift\/([0-9a-f]{32})$/)
    if (gift) {
      const recipient = await env.SANTA.get(`gift:${gift[1]}`)
      if (!recipient) return json({ error: 'Unknown link' }, 404)
      return json({ recipient, list: (await env.SANTA.get(`list:${recipient}`)) ?? '' })
    }

    if (!isFamily) return json({ error: 'Wrong password' }, 401)
    if (path === '/api/login') return json({ names, admin: isAdmin })

    if (path === '/api/lists' && req.method === 'GET') {
      const lists: Record<string, string> = {}
      for (const n of names) lists[n] = (await env.SANTA.get(`list:${n}`)) ?? ''
      return json({ lists })
    }

    const put = path.match(/^\/api\/lists\/(.+)$/)
    if (put && req.method === 'PUT') {
      const name = decodeURIComponent(put[1]!)
      if (!names.includes(name)) return json({ error: 'Unknown name' }, 400)
      const body = (await req.json().catch(() => null)) as { text?: unknown } | null
      if (typeof body?.text !== 'string' || body.text.length > 5000) return json({ error: 'Bad list' }, 400)
      await env.SANTA.put(`list:${name}`, body.text)
      return json({ ok: true })
    }

    if (!isAdmin) return json({ error: 'Not found' }, 404)

    // The admin only ever gets giver -> token. Which recipient a token maps to stays server side.
    if (path === '/api/admin/links' && req.method === 'GET') {
      return json({ links: JSON.parse((await env.SANTA.get('links')) ?? 'null') })
    }
    if (path === '/api/admin/draw' && req.method === 'POST') {
      const missing: string[] = []
      for (const n of names) if (!((await env.SANTA.get(`list:${n}`)) ?? '').trim()) missing.push(n)
      if (missing.length) return json({ error: `Missing lists: ${missing.join(', ')}` }, 400)

      const old = JSON.parse((await env.SANTA.get('links')) ?? '[]') as { token: string }[]
      for (const o of old) await env.SANTA.delete(`gift:${o.token}`)

      const links = []
      for (const [giver, recipient] of draw(names)) {
        const token = newToken()
        await env.SANTA.put(`gift:${token}`, recipient)
        links.push({ name: giver, token })
      }
      await env.SANTA.put('links', JSON.stringify(links))
      return json({ links })
    }
    return json({ error: 'Not found' }, 404)
  },
}
