import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView ??= () => {};
}

afterEach(cleanup);
