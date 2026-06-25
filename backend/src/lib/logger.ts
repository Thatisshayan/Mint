type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const timestamp = formatTimestamp();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

function createLogger(baseContext: Record<string, unknown> = {}): Logger {
  return {
    debug(message: string, context?: Record<string, unknown>) {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', message, { ...baseContext, ...context }));
      }
    },
    info(message: string, context?: Record<string, unknown>) {
      if (shouldLog('info')) {
        console.log(formatMessage('info', message, { ...baseContext, ...context }));
      }
    },
    warn(message: string, context?: Record<string, unknown>) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, { ...baseContext, ...context }));
      }
    },
    error(message: string, context?: Record<string, unknown>) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message, { ...baseContext, ...context }));
      }
    },
    child(context: Record<string, unknown>): Logger {
      return createLogger({ ...baseContext, ...context });
    },
  };
}

export const logger = createLogger();

export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({ requestId, userId });
}
