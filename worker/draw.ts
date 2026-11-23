function randomInt(n: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / n) * n
  do crypto.getRandomValues(buf)
  while (buf[0]! >= limit)
  return buf[0]! % n
}

/** Random giver -> recipient pairing where nobody is paired with themselves. */
export function draw(names: string[]): Map<string, string> {
  if (names.length < 2) throw new Error('Need at least 2 people')
  const targets = [...names]
  for (;;) {
    for (let i = targets.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[targets[i], targets[j]] = [targets[j]!, targets[i]!]
    }
    if (names.every((n, i) => n !== targets[i])) break
  }
  return new Map(names.map((n, i) => [n, targets[i]!]))
}

/** 128 bits of randomness, hex encoded: unguessable. */
export function newToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}
