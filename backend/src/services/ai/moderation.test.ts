import { describe, it, expect } from 'vitest';
import { moderateContent, getModerationWarning } from './moderation';

describe('moderateContent', () => {
  it('allows clean content', () => {
    const result = moderateContent('This is a great video about AI tools');
    expect(result.flagged).toBe(false);
  });

  it('flags harmful patterns', () => {
    const result = moderateContent('This contains hate speech content');
    expect(result.flagged).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('flags blocked words', () => {
    const result = moderateContent('This contains a racial slur');
    expect(result.flagged).toBe(true);
  });

  it('returns confidence score', () => {
    const result = moderateContent('Clean content');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('getModerationWarning', () => {
  it('returns null for clean content', () => {
    const result = moderateContent('Clean content');
    const warning = getModerationWarning(result);
    expect(warning).toBeNull();
  });

  it('returns warning for flagged content', () => {
    const result = moderateContent('hate speech content');
    const warning = getModerationWarning(result);
    expect(warning).toBeDefined();
    expect(warning).toContain('warning');
  });
});
