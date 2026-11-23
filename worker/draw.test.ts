import { describe, expect, it } from 'vitest'
import { draw, newToken } from './draw'

describe('draw', () => {
  it('gives everyone exactly one other person', () => {
    for (let run = 0; run < 200; run++) {
      const names = ['a', 'b', 'c', 'd', 'e']
      const m = draw(names)
      expect([...m.values()].sort()).toEqual(names)
      for (const [g, r] of m) expect(g).not.toBe(r)
    }
  })
  it('works for two people', () => {
    expect(draw(['a', 'b'])).toEqual(new Map([['a', 'b'], ['b', 'a']]))
  })
  it('makes distinct tokens', () => {
    expect(newToken()).not.toBe(newToken())
    expect(newToken()).toMatch(/^[0-9a-f]{32}$/)
  })
})
