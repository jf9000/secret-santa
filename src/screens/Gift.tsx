import { useEffect, useState } from 'react'
import { api } from '../api'
import { card } from '../ui'

export default function Gift({ token }: { token: string }) {
  const [data, setData] = useState<{ recipient: string; list: string } | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { api.gift(token).then(setData).catch((e) => setErr(e.message)) }, [token])

  if (err) return <p className="text-bad">{err}</p>
  if (!data) return <p className="text-mut">Loading…</p>
  return (
    <div className={`${card} space-y-3`}>
      <p className="text-mut">You're Secret Santa for</p>
      <p className="text-3xl font-bold">{data.recipient} 🎁</p>
      <p className="text-mut">Their list:</p>
      <p className="whitespace-pre-wrap">{data.list.trim() || 'Nothing on their list yet.'}</p>
    </div>
  )
}
