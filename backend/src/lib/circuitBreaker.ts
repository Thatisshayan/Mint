import { logger } from './logger.js';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringPeriodMs: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 3,
  recoveryTimeoutMs: 60000,
  monitoringPeriodMs: 10000,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.options.recoveryTimeoutMs) {
        this.state = 'half-open';
        logger.info(`Circuit breaker "${this.name}" entering half-open state`);
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'open') {
      throw new Error(`Circuit breaker "${this.name}" is open. Service temporarily unavailable.`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker "${this.name}" recovered — closed`);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
      logger.warn(`Circuit breaker "${this.name}" opened after ${this.failureCount} failures`);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, options));
  }
  return circuitBreakers.get(name)!;
}

export function getAllCircuitBreakers() {
  return Array.from(circuitBreakers.values()).map((cb) => cb.getStatus());
}
