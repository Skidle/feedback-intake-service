import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // No tests exist yet — the first ones land in the contract phase.
    passWithNoTests: true,
  },
});
