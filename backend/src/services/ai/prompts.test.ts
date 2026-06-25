import { describe, it, expect } from 'vitest';
import {
  scriptPrompt,
  captionPrompt,
  thumbnailPrompt,
  hookPrompt,
  scenarioPrompt,
  getPromptWithVariation,
  recordRating,
  getPromptStats,
} from './prompts';

describe('Prompt builders', () => {
  const input = { topic: 'AI tools', tone: 'educational' as const };

  it('scriptPrompt returns a string with topic', () => {
    const result = scriptPrompt(input);
    expect(result).toContain('AI tools');
    expect(result).toContain('60-second');
  });

  it('captionPrompt returns a string with topic', () => {
    const result = captionPrompt(input);
    expect(result).toContain('AI tools');
    expect(result).toContain('Instagram');
  });

  it('thumbnailPrompt returns a string with topic', () => {
    const result = thumbnailPrompt(input);
    expect(result).toContain('AI tools');
    expect(result).toContain('thumbnail');
  });

  it('hookPrompt returns a string with topic', () => {
    const result = hookPrompt(input);
    expect(result).toContain('AI tools');
    expect(result).toContain('5');
  });

  it('scenarioPrompt returns a string with topic', () => {
    const result = scenarioPrompt(input);
    expect(result).toContain('AI tools');
    expect(result).toContain('3-scene');
  });

  it('uses default tone when not provided', () => {
    const result = scriptPrompt({ topic: 'test' });
    expect(result).toContain('educational');
  });
});

describe('A/B Testing', () => {
  it('getPromptWithVariation returns prompt and variationId', () => {
    const result = getPromptWithVariation('script', { topic: 'test', tone: 'casual' });
    expect(result.prompt).toBeDefined();
    expect(result.variationId).toBeDefined();
    expect(typeof result.prompt).toBe('string');
    expect(typeof result.variationId).toBe('string');
  });

  it('returns fallback for unknown type', () => {
    const result = getPromptWithVariation('unknown_type', { topic: 'test' });
    expect(result.prompt).toBeDefined();
    expect(result.variationId).toBe('default');
  });

  it('recordRating does not throw', () => {
    expect(() => recordRating('script', 'script-v1', 5)).not.toThrow();
  });

  it('getPromptStats returns object', () => {
    const stats = getPromptStats();
    expect(typeof stats).toBe('object');
  });
});
