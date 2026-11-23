import { describe, expect, it } from 'vitest'
import { backspaceBullet, continueList, indent, isBlank, outdent } from './editor'

describe('editor', () => {
  it('indenting swaps in the nested glyph, outdenting swaps it back', () => {
    const r = indent('● a\n● b', 0, 7)
    expect(r.text).toBe('  ○ a\n  ○ b')
    expect(outdent(r.text, 0, r.end).text).toBe('● a\n● b')
  })
  it('goes through the levels and stops at the last one', () => {
    let t = '● a'
    for (let i = 0; i < 6; i++) t = indent(t, 0, 0).text
    expect(t).toBe('      ◆ a')
  })
  it('normalises typed dashes when nesting', () => {
    expect(indent('- a', 0, 0).text).toBe('  ○ a')
  })
  it('outdent leaves top-level lines alone', () => {
    expect(outdent('● a', 0, 0).text).toBe('● a')
  })
  it('continues a bullet on Enter at the same level', () => {
    const r = continueList('  ○ hi', 6)!
    expect(r.text).toBe('  ○ hi\n  ○ ')
    expect(r.start).toBe(r.text.length)
  })
  it('Enter on a plain line starts a bullet', () => {
    expect(continueList('hello', 5)!.text).toBe('hello\n● ')
  })
  it('Enter on an empty nested bullet steps out; at top level it ends the list', () => {
    expect(continueList('● a\n  ○ ', 8)!.text).toBe('● a\n● ')
    expect(continueList('● a\n● ', 6)!.text).toBe('● a\n')
  })
  it('Backspace after a bullet steps out, then removes it', () => {
    expect(backspaceBullet('  ○ a', 4)!.text).toBe('● a')
    expect(backspaceBullet('● a', 2)!.text).toBe('a')
    expect(backspaceBullet('● a', 3)).toBeNull()
  })
  it('knows when a list is only bullets', () => {
    expect(isBlank('● ')).toBe(true)
    expect(isBlank('● \n  ○ ')).toBe(true)
    expect(isBlank('● socks')).toBe(false)
  })
})
