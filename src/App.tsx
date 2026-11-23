import { useEffect, useState } from 'react'
import { api } from './api'
import Admin from './screens/Admin'
import Gift from './screens/Gift'
import Lists from './screens/Lists'

interface Session { password: string; names: string[]; admin: boolean }
const KEY = 'secret-santa-session'
const NAME_KEY = 'secret-santa-name'

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

export default function App() {
  const hash = useHash()
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [page, setPage] = useState<'lists' | 'admin'>('lists')
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
  let body
  if (gift) body = <Gift token={gift[1]!} />
  else if (restoring) body = <p className="text-mut">Loading…</p>
  else if (!session)
    body = <Login onLogin={(s) => { localStorage.setItem(KEY, s.password); setSession(s) }} />
  else if (!name || !session.names.includes(name))
    body = (
      <div className={`${card} space-y-3`}>
        <p className="text-mut">Who are you?</p>
        {session.names.map((n) => (
          <button key={n} className="w-full" onClick={() => { localStorage.setItem(NAME_KEY, n); setName(n) }}>
            {n}
          </button>
        ))}
      </div>
    )
  else if (page === 'admin' && session.admin) body = <Admin password={session.password} />
  else body = <Lists password={session.password} names={session.names} me={name} />

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <header className="flex items-center gap-2">
        <h1 className="text-xl font-bold flex-1">🎅 Family Secret Santa</h1>
        {session && !gift && name && (
          <>
            {session.admin && (
              <button onClick={() => setPage(page === 'admin' ? 'lists' : 'admin')}>
                {page === 'admin' ? 'Lists' : 'Admin'}
              </button>
            )}
            <button onClick={() => { localStorage.removeItem(NAME_KEY); setName(''); setPage('lists') }}>
              {name} ✕
            </button>
          </>
        )}
      </header>
      {body}
    </div>
  )
}
