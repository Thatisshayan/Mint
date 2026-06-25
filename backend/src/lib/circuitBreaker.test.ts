import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from './circuitBreaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker('test', {
      failureThreshold: 3,
      recoveryTimeoutMs: 100,
      monitoringPeriodMs: 50,
    });
  });

  it('starts in closed state', () => {
    expect(cb.getState()).toBe('closed');
  });

  it('opens after failure threshold', async () => {
    const failingFn = async () => {
      throw new Error('fail');
    };

    for (let i = 0; i < 3; i++) {
      await cb.execute(failingFn).catch(() => {});
    }

    expect(cb.getState()).toBe('open');
  });

  it('rejects when open', async () => {
    const failingFn = async () => {
      throw new Error('fail');
    };

    for (let i = 0; i < 3; i++) {
      await cb.execute(failingFn).catch(() => {});
    }

    await expect(cb.execute(async () => 'ok')).rejects.toThrow('open');
  });

  it('transitions to half-open after recovery timeout', async () => {
    const failingFn = async () => {
      throw new Error('fail');
    };

    for (let i = 0; i < 3; i++) {
      await cb.execute(failingFn).catch(() => {});
    }

    // Wait for recovery timeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(cb.getState()).toBe('half-open');
  });

  it('closes after successful calls in half-open', async () => {
    const failingFn = async () => {
      throw new Error('fail');
    };

    for (let i = 0; i < 3; i++) {
      await cb.execute(failingFn).catch(() => {});
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    await cb.execute(async () => 'ok');
    await cb.execute(async () => 'ok');

    expect(cb.getState()).toBe('closed');
  });

  it('returns status', () => {
    const status = cb.getStatus();
    expect(status.name).toBe('test');
    expect(status.state).toBe('closed');
    expect(status.failureCount).toBe(0);
  });
});
