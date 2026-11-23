import { useEffect, useState } from 'react'
import { api, giftUrl, type Link } from '../api'
import { card } from '../ui'

export default function Admin({ password }: { password: string }) {
  const [links, setLinks] = useState<Link[] | null>(null)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.links(password).then((r) => setLinks(r.links)).catch((e) => setMsg(e.message)) }, [password])

  async function draw() {
    if (links && !confirm('This replaces all existing links with a brand new draw. Continue?')) return
    setBusy(true)
    setMsg('')
    try {
      setLinks((await api.draw(password)).links)
      setCopied('')
    } catch (e) {
      setMsg((e as Error).message)
    }
    setBusy(false)
  }

  const copy = (id: string, text: string) =>
    navigator.clipboard.writeText(text).then(() => setCopied(id), () => setMsg('Could not copy'))

  return (
    <div className={`${card} space-y-3`}>
      <button className="primary w-full" onClick={draw} disabled={busy}>
        {links ? 'Redraw everyone' : 'Draw names'}
      </button>
      {msg && <p className="text-bad">{msg}</p>}
      {links && (
        <>
          <p className="text-mut text-sm">
            Send each person their own link. Don't open them — that's how you stay surprised too.
          </p>
          <button className="w-full" onClick={() => copy('all', links.map((l) => `${l.name}: ${giftUrl(l.token)}`).join('\n'))}>
            {copied === 'all' ? 'Copied ✓' : 'Copy all links'}
          </button>
          {links.map((l) => (
            <div key={l.token} className="flex items-center gap-2">
              <span className="flex-1">{l.name}</span>
              <button className="min-h-11" onClick={() => copy(l.token, giftUrl(l.token))}>
                {copied === l.token ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
