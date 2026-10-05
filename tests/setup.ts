import { vi } from 'vitest'

// Stubs server-only import so server actions can be imported in tests
vi.mock('server-only', () => ({}))
