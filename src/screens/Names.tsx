import { useEffect, useState } from 'react'
import { api } from '../api'
import { card } from '../ui'

export default function Names({ password, names, admin, onPick, onAdmin }: {
  password: string; names: string[]; admin: boolean; onPick: (n: string) => void; onAdmin: () => void
}) {
  const [lists, setLists] = useState<Record<string, string>>({})
  useEffect(() => { api.lists(password).then((r) => setLists(r.lists)).catch(() => {}) }, [password])
  const done = names.filter((n) => lists[n]?.trim()).length

  return (
    <div className={`${card} space-y-3`}>
      <p className="text-mut">Pick a name to see or edit their list. ({done} of {names.length} lists are in)</p>
      {names.map((n) => (
        <button key={n} className="w-full" onClick={() => onPick(n)}>
          {n}{lists[n]?.trim() ? ' ✓' : ''}
        </button>
      ))}
      {admin && <button className="w-full border-dashed" onClick={onAdmin}>🔒 Admin</button>}
    </div>
  )
}
