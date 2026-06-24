export interface PromptInput {
  topic: string;
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining';
  platform?: string;
}

export function scriptPrompt(input: PromptInput): string {
  const tone = input.tone || 'educational';
  return [
    `You are a YouTube scriptwriter for a faceless channel.`,
    `Topic: "${input.topic}".`,
    `Tone: ${tone}.`,
    `Write a 60-second short script with:`,
    `1. A strong hook (first 3 seconds)`,
    `2. Main content (3 key points)`,
    `3. Call to action`,
    `Use simple language. No markdown. No AI self-reference.`,
  ].join('\n');
}

export function captionPrompt(input: PromptInput): string {
  const tone = input.tone || 'casual';
  return [
    `Write an Instagram caption for a reel about: "${input.topic}".`,
    `Tone: ${tone}.`,
    `Keep it under 200 characters.`,
    `Include 3-5 relevant hashtags.`,
    `No AI self-reference.`,
  ].join('\n');
}

export function thumbnailPrompt(input: PromptInput): string {
  return [
    `Generate a thumbnail prompt for a video about: "${input.topic}".`,
    `Describe: subject, background, colors, text overlay, composition.`,
    `Style: high contrast, bold text, no human faces, minimalist.`,
    `Format: detailed visual description suitable for image generation AI.`,
  ].join('\n');
}

export function hookPrompt(input: PromptInput): string {
  return [
    `Topic: "${input.topic}".`,
    `Generate 5 different opening hooks for a short-form video.`,
    `Each hook should be 1 sentence, attention-grabbing, curiosity-driven.`,
    `Tone: ${input.tone || 'educational'}.`,
    `Number them 1-5. No AI self-reference.`,
  ].join('\n');
}

export function scenarioPrompt(input: PromptInput): string {
  return [
    `Topic: "${input.topic}".`,
    `Create a 3-scene video breakdown for a faceless short.`,
    `Each scene: shot description + on-screen text + voiceover line.`,
    `Total target: 30-60 seconds.`,
    `Tone: ${input.tone || 'educational'}.`,
    `Format: Scene 1: ..., Scene 2: ..., Scene 3: ...`,
  ].join('\n');
}
