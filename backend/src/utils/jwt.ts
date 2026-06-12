import crypto from 'crypto';

export function sign(payload: Record<string, unknown>, _options?: { expiresIn?: string }) {
  const secret = process.env.JWT_SECRET ?? 'dev';
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64Url(crypto.createHmac('sha256', secret).update(signingInput).digest());
  return `${signingInput}.${signature}`;
}

export function verify(token: string): { sub: string; email?: string } {
  const secret = process.env.JWT_SECRET ?? 'dev';
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) throw new Error('Invalid token');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64Url(
    crypto.createHmac('sha256', secret).update(signingInput).digest(),
  );
  if (signature !== expectedSignature) throw new Error('Invalid token');
  return JSON.parse(base64Decode(encodedPayload));
}

function base64Url(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64Decode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}
