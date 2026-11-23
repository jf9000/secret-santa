import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { api } from '../api'
import { backspaceBullet, continueList, indent, isBlank, newBullet, outdent, type Edit } from '../lib/editor'
import { card } from '../ui'

const DELAY = 800

/** One person's list, saved automatically shortly after typing stops. Text is only ever rendered by React as text. */
export default function Lists({ password, name }: { password: string; name: string }) {
  const [text, setText] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const saved = useRef('') // last text known to be on the server
  const latest = useRef('') // what's in the box right now
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inflight = useRef(false)
  const area = useRef<HTMLTextAreaElement>(null)
  const sel = useRef<[number, number] | null>(null) // selection to restore after an edit re-renders

  useEffect(() => {
    api.lists(password)
      .then((r) => {
        const t = r.lists[name] ?? ''
        saved.current = latest.current = t
        setText(t)
      })
      .catch((e) => setStatus(e.message))
  }, [password, name])

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    if (inflight.current) { timer.current = setTimeout(flush, 300); return } // one save at a time, in order
    const t = isBlank(latest.current) ? '' : latest.current // a lone default bullet isn't a list
    if (t === saved.current) return
    inflight.current = true
    setStatus('Saving…')
    try {
      await api.saveList(password, name, t)
      saved.current = t
      setStatus(latest.current === t || (!t && isBlank(latest.current)) ? 'Saved ✓' : 'Saving…')
    } catch (e) {
      setStatus(`Not saved: ${(e as Error).message}`)
    }
    inflight.current = false
  }, [password, name])

  // Save anything still pending when leaving the page.
  useEffect(() => () => { flush() }, [flush])

  function onChange(v: string) {
    setText(v)
    latest.current = v
    setStatus('')
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, DELAY)
  }

  useLayoutEffect(() => {
    if (sel.current && area.current) area.current.setSelectionRange(...sel.current)
    sel.current = null
  })

  function apply(fn: (t: string, s: number, e: number) => Edit | null) {
    const a = area.current
    if (!a) return false
    const r = fn(a.value, a.selectionStart, a.selectionEnd)
    if (!r) return false
    sel.current = [r.start, r.end]
    onChange(r.text)
    return true
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      apply(e.shiftKey ? outdent : indent)
    } else if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (apply((t, s, en) => (s === en ? backspaceBullet(t, s) : null))) e.preventDefault()
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (apply((t, s, en) => (s === en ? continueList(t, s) : null))) e.preventDefault()
    }
  }

  if (text === null) return <p className="text-mut">{status || 'Loading…'}</p>
  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center">
        <h2 className="text-lg font-semibold flex-1">{name}'s list</h2>
        <span className="text-mut text-sm">{status}</span>
      </div>
      <textarea
        ref={area}
        className="w-full min-h-64 bg-card border border-bd rounded-lg p-2"
        placeholder="● Gift ideas, sizes, favorite things, links…  (Tab to nest)"
        maxLength={5000}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (!latest.current) { sel.current = [2, 2]; onChange(newBullet()) } }}
        onBlur={flush}
      />
    </div>
  )
}
