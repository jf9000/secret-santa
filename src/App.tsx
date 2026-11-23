import { useEffect, useState } from 'react'
import { api } from './api'
import Admin from './screens/Admin'
import Gift from './screens/Gift'
import Lists from './screens/Lists'
import Names from './screens/Names'

interface Session { password: string; names: string[]; admin: boolean }
const KEY = 'secret-santa-session'

import { card } from './ui'

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const r = await api.login(pw.trim())
      onLogin({ password: pw.trim(), ...r })
    } catch (e) {
      setErr((e as Error).message)
    }
    setBusy(false)
  }
  return (
    <form onSubmit={submit} className={`${card} space-y-3`}>
      <p className="text-mut">Enter the family password.</p>
      <input className="w-full" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <p className="text-bad">{err}</p>}
      <button className="primary w-full" disabled={busy || !pw.trim()}>Enter</button>
    </form>
  )
}


type View = { kind: 'names' } | { kind: 'list'; name: string } | { kind: 'admin' }

export default function App() {
  const hash = useHash()
  const [session, setSession] = useState<Session | null>(null)
  const [view, setView] = useState<View>({ kind: 'names' })
  const [restoring, setRestoring] = useState(!!localStorage.getItem(KEY))

  // Re-validate a remembered password on load (also picks up name changes).
  useEffect(() => {
    const pw = localStorage.getItem(KEY)
    if (!pw) return
    api.login(pw)
      .then((r) => setSession({ password: pw, ...r }))
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setRestoring(false))
  }, [])

  const gift = hash.match(/^#\/gift\/([0-9a-f]{32})$/)
  const home = !!session && !gift && view.kind === 'names'
  let body
  if (gift) body = <Gift token={gift[1]!} />
  else if (restoring) body = <p className="text-mut">Loading…</p>
  else if (!session)
    body = <Login onLogin={(s) => { localStorage.setItem(KEY, s.password); setSession(s) }} />
  else if (view.kind === 'list') body = <Lists key={view.name} password={session.password} name={view.name} />
  else if (view.kind === 'admin' && session.admin) body = <Admin password={session.password} />
  else body = <Names password={session.password} names={session.names} admin={session.admin} onAdmin={() => setView({ kind: 'admin' })} onPick={(name) => setView({ kind: 'list', name })} />

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <header className="flex items-center gap-2">
        {session && !gift && !home && <button className="shrink-0" onClick={() => setView({ kind: 'names' })}>← Back</button>}
        <h1 className="text-lg sm:text-xl font-bold flex-1 min-w-0">🎅 Family Secret Santa</h1>
      </header>
      {body}
    </div>
  )
}
