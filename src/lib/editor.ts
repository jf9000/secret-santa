/** Tiny plain-text list editing helpers: bullets and 2-space indentation. Pure, so they're easy to test. */
export interface Edit { text: string; start: number; end: number }

const BULLET = /^(\s*)([-*•]) /
export const INDENT = '  '

/** [from, to) covering every line touched by the selection. */
function lineRange(text: string, s: number, e: number): [number, number] {
  const from = text.lastIndexOf('\n', s - 1) + 1
  const ref = e > s && text[e - 1] === '\n' ? e - 1 : e
  const nl = text.indexOf('\n', ref)
  return [from, nl === -1 ? text.length : nl]
}

function mapLines(text: string, s: number, e: number, fn: (line: string, count: number) => string): Edit {
  const [from, to] = lineRange(text, s, e)
  const lines = text.slice(from, to).split('\n')
  const out = lines.map((l) => fn(l, lines.length))
  const joined = out.join('\n')
  const firstDelta = out[0]!.length - lines[0]!.length
  const total = joined.length - (to - from)
  return {
    text: text.slice(0, from) + joined + text.slice(to),
    start: Math.max(from, s + firstDelta),
    end: Math.max(from, e + total),
  }
}

export const indent = (text: string, s: number, e: number) =>
  mapLines(text, s, e, (l, n) => (n > 1 && !l.trim() ? l : INDENT + l))

export const outdent = (text: string, s: number, e: number) =>
  mapLines(text, s, e, (l) => l.replace(/^( {1,2}|\t)/, ''))

/** Turns the selected lines into bullets, or removes the bullets if they all already have one. */
export function toggleBullet(text: string, s: number, e: number): Edit {
  const [from, to] = lineRange(text, s, e)
  const lines = text.slice(from, to).split('\n')
  const targets = lines.length > 1 ? lines.filter((l) => l.trim()) : lines
  const all = targets.length > 0 && targets.every((l) => BULLET.test(l))
  return mapLines(text, s, e, (l, n) => {
    if (all) return l.replace(BULLET, '$1')
    if (BULLET.test(l) || (n > 1 && !l.trim())) return l
    return l.replace(/^(\s*)/, '$1• ')
  })
}

/** Enter key: keep the bullet/indent going on the next line; Enter on an empty bullet ends the list. null = default behaviour. */
export function continueList(text: string, pos: number): Edit | null {
  const from = text.lastIndexOf('\n', pos - 1) + 1
  const nl = text.indexOf('\n', pos)
  const to = nl === -1 ? text.length : nl
  const line = text.slice(from, to)
  const m = line.match(/^(\s*)([-*•] )?/)!
  const lead = m[1]!
  const marker = m[2] ?? ''
  if (!lead && !marker) return null
  if (pos - from < lead.length + marker.length) return null // cursor is inside the indent/marker
  if (marker && !line.slice(lead.length + marker.length).trim()) {
    return { text: text.slice(0, from) + text.slice(to), start: from, end: from }
  }
  const ins = '\n' + lead + marker
  return { text: text.slice(0, pos) + ins + text.slice(pos), start: pos + ins.length, end: pos + ins.length }
}
