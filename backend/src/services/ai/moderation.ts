export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  confidence: number;
}

const HARMFUL_PATTERNS = [
  /\b(hate\s+speech|racial\s+slur|ethnic\s+slur)\b/i,
  /\b(kill\s+yourself|kys|suicide\s+method)\b/i,
  /\b(explicit\s+sexual|pornographic|nsfw)\b/i,
  /\b(terrorism|terrorist|bomb\s+making)\b/i,
  /\b(doxxing|dox\s+someone|personal\s+address)\b/i,
  /\b(scam|phishing|steal\s+password)\b/i,
];

const BLOCKED_WORDS = [
  'nigger', 'faggot', 'kike', 'spic', 'chink',
  'retard', 'retarded',
];

export function moderateContent(text: string): ModerationResult {
  const lower = text.toLowerCase();

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: `Content matches harmful pattern: ${pattern.source}`,
        confidence: 0.9,
      };
    }
  }

  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return {
        flagged: true,
        reason: `Content contains blocked term`,
        confidence: 0.95,
      };
    }
  }

  return { flagged: false, confidence: 0.8 };
}

export function getModerationWarning(result: ModerationResult): string | null {
  if (!result.flagged) return null;
  return `Content moderation warning: ${result.reason || 'Content may be inappropriate'}. Generation was blocked.`;
}
