/**
 * Tiny plain-text bullet-list helpers. Nesting is 2 spaces per level, and each level gets its own bullet
 * glyph so levels stay visually distinct. Everything stays plain text. Pure, so it is easy to test.
 */
export interface Edit { text: string; start: number; end: number }

export const GLYPHS = ['●', '○', '■', '◆']
const MARK = /^(\s*)([-*•●○■◆]) /
const STEP = 2
const MAX_LEAD = (GLYPHS.length - 1) * STEP

const glyphFor = (lead: string) => GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(lead.length / STEP))]!
export const newBullet = (lead = '') => lead + glyphFor(lead) + ' '

/** Re-applies the glyph that belongs to this line's indent level. Non-bullet lines are untouched. */
function relevel(line: string): string {
  const m = line.match(MARK)
  return m ? m[1]! + glyphFor(m[1]!) + line.slice(m[1]!.length + 1) : line
}

/** True when the text has no real content, only bullets and whitespace. */
export const isBlank = (text: string) => text.split('\n').every((l) => !l.replace(/^\s*[-*•●○■◆]?\s*/, ''))

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

/** Tab: nest the selected lines one level deeper (up to the last glyph level). */
export const indent = (text: string, s: number, e: number) =>
  mapLines(text, s, e, (l, n) => {
    if (n > 1 && !l.trim()) return l
    if (l.match(/^ */)![0].length >= MAX_LEAD) return l
    return relevel('  ' + l)
  })

/** Shift+Tab: nest the selected lines one level shallower. */
export const outdent = (text: string, s: number, e: number) =>
  mapLines(text, s, e, (l) => relevel(l.replace(/^( {1,2}|\t)/, '')))

function currentLine(text: string, pos: number) {
  const from = text.lastIndexOf('\n', pos - 1) + 1
  const nl = text.indexOf('\n', pos)
  const to = nl === -1 ? text.length : nl
  return { from, to, line: text.slice(from, to) }
}

/** Enter: always continue with a bullet at the same level. Enter on an empty bullet steps out a level (or ends the list). */
export function continueList(text: string, pos: number): Edit | null {
  const { from, to, line } = currentLine(text, pos)
  const m = line.match(MARK)
  const lead = line.match(/^ */)![0]
  if (m && pos - from < m[0].length) return null // cursor is in front of / inside the marker
  if (m && !line.slice(m[0].length).trim()) {
    if (lead) {
      const next = relevel(line.slice(Math.min(STEP, lead.length)))
      return { text: text.slice(0, from) + next + text.slice(to), start: from + next.length, end: from + next.length }
    }
    return { text: text.slice(0, from) + text.slice(to), start: from, end: from }
  }
  const ins = '\n' + newBullet(lead)
  return { text: text.slice(0, pos) + ins + text.slice(pos), start: pos + ins.length, end: pos + ins.length }
}

/** Backspace right after a bullet: step out a level, or drop the bullet at the top level. */
export function backspaceBullet(text: string, pos: number): Edit | null {
  const { from, to, line } = currentLine(text, pos)
  const m = line.match(MARK)
  if (!m || pos !== from + m[0].length) return null
  const lead = m[1]!
  if (lead) {
    const cut = Math.min(STEP, lead.length)
    const next = relevel(line.slice(cut))
    return { text: text.slice(0, from) + next + text.slice(to), start: pos - cut, end: pos - cut }
  }
  return { text: text.slice(0, from) + line.slice(m[0].length) + text.slice(to), start: from, end: from }
}
