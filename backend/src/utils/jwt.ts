import { timingSafeEqual, createHmac } from 'crypto';

// Validate JWT_SECRET at module load to fail fast in production
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret || 'mint-dev-secret-change-in-production';
})();

export function sign(
  payload: Record<string, unknown>,
  options?: { expiresIn?: string },
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));

  // Build payload with issued-at and expiration
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: options?.expiresIn ? now + parseDuration(options.expiresIn) : now + 86400, // default 24h
  };

  const encodedPayload = base64Url(JSON.stringify(jwtPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64Url(
    createHmac('sha256', JWT_SECRET).update(signingInput).digest(),
  );
  return `${signingInput}.${signature}`;
}

export interface VerifiedToken {
  sub: string;
  email?: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export function verify(token: string): VerifiedToken {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token format');
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64Url(
    createHmac('sha256', JWT_SECRET).update(signingInput).digest(),
  );

  // Timing-safe comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid token signature');
  }

  // Decode and parse payload safely
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64Decode(encodedPayload));
  } catch {
    throw new Error('Invalid token payload encoding');
  }

  // Validate expiration claim (exp)
  if (typeof payload.exp !== 'number') {
    throw new Error('Invalid or missing token expiration (exp)');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }

  // Validate issued-at claim (iat) — tokens from the future are invalid
  if (typeof payload.iat === 'number' && payload.iat > now) {
    throw new Error('Token issued in the future');
  }

  return payload as VerifiedToken;
}

function base64Url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64Decode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    throw new Error('Invalid base64 encoding in token');
  }
}

function parseDuration(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return parseInt(duration, 10);
  }
}
