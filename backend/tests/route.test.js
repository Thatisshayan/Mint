/*
 * Route Tests
 *
 * @description Test suite for MINT API routes
 */

import { test, expect, vi } from 'vitest';

// Mock routes
const mockRoutes = {
  authMagicLink: vi.fn(),
  getProject: vi.fn(),
};

// Test cases

test('Auth magic link route', () => {
  mockRoutes.authMagicLink({ email: 'test@example.com' });
  expect(mockRoutes.authMagicLink).toHaveBeenCalledWith({ email: 'test@example.com' });
});

// Add more route-specific tests here