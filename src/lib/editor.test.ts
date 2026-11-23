import { describe, expect, it } from 'vitest'
import { continueList, indent, outdent, toggleBullet } from './editor'

describe('editor', () => {
  it('indents and outdents the selected lines', () => {
    const r = indent('a\nb\nc', 0, 3)
    expect(r.text).toBe('  a\n  b\nc')
    expect(outdent(r.text, 0, r.end).text).toBe('a\nb\nc')
  })
  it('outdent leaves unindented lines alone', () => {
    expect(outdent('a', 0, 0).text).toBe('a')
  })
  it('toggles bullets on and off', () => {
    const on = toggleBullet('a\n  b', 0, 5)
    expect(on.text).toBe('• a\n  • b')
    expect(toggleBullet(on.text, 0, on.end).text).toBe('a\n  b')
  })
  it('continues a bullet on Enter and keeps indent', () => {
    const r = continueList('  - hi', 6)!
    expect(r.text).toBe('  - hi\n  - ')
    expect(r.start).toBe(r.text.length)
  })
  it('ends the list on Enter at an empty bullet', () => {
    expect(continueList('• a\n• ', 6)!.text).toBe('• a\n')
  })
  it('does nothing special on plain lines', () => {
    expect(continueList('hello', 5)).toBeNull()
  })
})
