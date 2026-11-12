import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

vi.mock('@/components/ui', async (importActual) => ({
  ...(await importActual<typeof import('@/components/ui')>()),
  ...(await import('./stubs/room-canvas')),
}));

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView ??= () => {};
}

afterEach(cleanup);
