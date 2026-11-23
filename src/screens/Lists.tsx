import { useEffect, useState } from 'react'
import { api } from '../api'
import { card } from '../ui'

export default function Lists({ password, names, me }: { password: string; names: string[]; me: string }) {
  const [lists, setLists] = useState<Record<string, string> | null>(null)
  const [who, setWho] = useState(me)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  const load = () => api.lists(password).then((r) => setLists(r.lists)).catch((e) => setStatus(e.message))
  useEffect(() => { load() }, [])
  // Load the chosen person's list into the editor (only once the lists have arrived).
  useEffect(() => { if (lists) setText(lists[who] ?? '') }, [who, lists === null])

  async function save() {
    setStatus('Saving…')
    try {
      await api.saveList(password, who, text)
      setStatus('Saved ✓')
      load()
    } catch (e) {
      setStatus((e as Error).message)
    }
  }

  if (!lists) return <p className="text-mut">{status || 'Loading…'}</p>
  const done = names.filter((n) => lists[n]?.trim())

  return (
    <div className="space-y-4">
      <div className={`${card} space-y-3`}>
        <select className="w-full" value={who} onChange={(e) => { setWho(e.target.value); setStatus('') }}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n === me ? `${n} (you)` : n}{lists[n]?.trim() ? ' ✓' : ''}
            </option>
          ))}
        </select>
        <textarea
          className="w-full min-h-48 bg-card border border-bd rounded-lg p-2"
          placeholder="One idea per line: gift ideas, sizes, favorite things, links…"
          value={text}
          onChange={(e) => { setText(e.target.value); setStatus('') }}
        />
        <div className="flex items-center gap-3">
          <button className="primary" onClick={save}>Save {who === me ? 'my' : `${who}'s`} list</button>
          <span className="text-mut">{status}</span>
        </div>
      </div>
      <p className="text-mut text-sm">{done.length} of {names.length} lists are in.</p>
    </div>
  )
}
