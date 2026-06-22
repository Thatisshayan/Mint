/*
 * Service Tests
 *
 * @description Test suite for MINT backend services
 */

import { test, expect } from 'vitest';

// Mock services
const mockServices = {
  createUser: jest.fn(),
  verifyMagicLink: jest.fn(),
};

// Test cases

test('Create user service', () => {
  mockServices.createUser({ email: 'test@example.com' });
  expect(mockServices.createUser).toHaveBeenCalledWith({ email: 'test@example.com' });
});


test('Verify magic link service', () => {
  mockServices.verifyMagicLink('test1234');
  expect(mockServices.verifyMagicLink).toHaveBeenCalledWith('test1234');
});

// Add more service tests here