import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts: the tests are pure functions and need no plugins,
// and vitest 3 ships its own Vite whose plugin types differ from the app's Vite 8.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['worker/**/*.test.ts'],
  },
})
