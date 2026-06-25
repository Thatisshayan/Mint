export interface PromptInput {
  topic: string;
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining';
  platform?: string;
}

interface PromptVariation {
  id: string;
  weight: number;
  build: (input: PromptInput) => string;
}

// Track which prompt variations are used and rated
const promptUsage: Record<string, Record<string, { used: number; ratings: number[] }>> = {};

function getVariationKey(type: string, variationId: string): string {
  return `${type}:${variationId}`;
}

function recordUsage(type: string, variationId: string) {
  if (!promptUsage[type]) promptUsage[type] = {};
  if (!promptUsage[type][variationId]) promptUsage[type][variationId] = { used: 0, ratings: [] };
  promptUsage[type][variationId].used++;
}

export function recordRating(type: string, variationId: string, rating: number) {
  if (!promptUsage[type]) promptUsage[type] = {};
  if (!promptUsage[type][variationId]) promptUsage[type][variationId] = { used: 0, ratings: [] };
  promptUsage[type][variationId].ratings.push(rating);
}

export function getPromptStats() {
  return promptUsage;
}

function pickVariation(variations: PromptVariation[]): PromptVariation {
  const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  for (const v of variations) {
    random -= v.weight;
    if (random <= 0) return v;
  }
  return variations[variations.length - 1];
}

const scriptVariations: PromptVariation[] = [
  {
    id: 'script-v1',
    weight: 1,
    build: (input) => {
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
    },
  },
  {
    id: 'script-v2',
    weight: 1,
    build: (input) => {
      const tone = input.tone || 'educational';
      return [
        `Act as a viral content creator writing a 60-second YouTube Short script.`,
        `Topic: "${input.topic}"`,
        `Tone: ${tone}`,
        `Structure:`,
        `- Hook: Stop the scroll in 3 seconds with a bold claim or question`,
        `- Body: 3 quick, punchy facts or tips (5-10 seconds each)`,
        `- CTA: Drive engagement (subscribe, comment, share)`,
        `Rules: Conversational tone. No fluff. No "as an AI". Write like you talk.`,
      ].join('\n');
    },
  },
  {
    id: 'script-v3',
    weight: 1,
    build: (input) => {
      const tone = input.tone || 'educational';
      return [
        `Write a faceless YouTube Short script about: "${input.topic}"`,
        `Tone: ${tone}. Duration: 60 seconds.`,
        ``,
        `Format your response as:`,
        `[HOOK] - One gripping line`,
        `[SCENE 1] - First point with visual cue`,
        `[SCENE 2] - Second point with visual cue`,
        `[SCENE 3] - Third point with visual cue`,
        `[CTA] - Call to action`,
        ``,
        `Keep it punchy. Each section should be 1-2 sentences max.`,
      ].join('\n');
    },
  },
];

const captionVariations: PromptVariation[] = [
  {
    id: 'caption-v1',
    weight: 1,
    build: (input) => {
      const tone = input.tone || 'casual';
      return [
        `Write an Instagram caption for a reel about: "${input.topic}".`,
        `Tone: ${tone}.`,
        `Keep it under 200 characters.`,
        `Include 3-5 relevant hashtags.`,
        `No AI self-reference.`,
      ].join('\n');
    },
  },
  {
    id: 'caption-v2',
    weight: 1,
    build: (input) => {
      const tone = input.tone || 'casual';
      return [
        `Instagram reel caption for: "${input.topic}"`,
        `Style: ${tone}, engaging, scroll-stopping`,
        `Rules:`,
        `- Start with a hook line (first line visible before "...more")`,
        `- End with a question to boost comments`,
        `- Add 3-5 hashtags at the end`,
        `- Max 200 characters total`,
        `- No emojis overload (2-3 max)`,
      ].join('\n');
    },
  },
];

const thumbnailVariations: PromptVariation[] = [
  {
    id: 'thumb-v1',
    weight: 1,
    build: (input) => [
      `Generate a thumbnail prompt for a video about: "${input.topic}".`,
      `Describe: subject, background, colors, text overlay, composition.`,
      `Style: high contrast, bold text, no human faces, minimalist.`,
      `Format: detailed visual description suitable for image generation AI.`,
    ].join('\n'),
  },
  {
    id: 'thumb-v2',
    weight: 1,
    build: (input) => [
      `Create an eye-catching YouTube thumbnail description for: "${input.topic}"`,
      `Requirements:`,
      `- Bold, large text (3-5 words max) that creates curiosity`,
      `- High contrast colors (yellow/black, red/white work well)`,
      `- Simple composition - one focal point`,
      `- No faces, no complex scenes`,
      `- Describe it as an image generation prompt`,
    ].join('\n'),
  },
];

const hookVariations: PromptVariation[] = [
  {
    id: 'hook-v1',
    weight: 1,
    build: (input) => [
      `Topic: "${input.topic}".`,
      `Generate 5 different opening hooks for a short-form video.`,
      `Each hook should be 1 sentence, attention-grabbing, curiosity-driven.`,
      `Tone: ${input.tone || 'educational'}.`,
      `Number them 1-5. No AI self-reference.`,
    ].join('\n'),
  },
  {
    id: 'hook-v2',
    weight: 1,
    build: (input) => [
      `Write 5 scroll-stopping hooks for a 60-second video about: "${input.topic}"`,
      `Each hook must:`,
      `- Be under 10 words`,
      `- Create an open loop (curiosity gap)`,
      `- Work as the first 3 seconds of a video`,
      `Tone: ${input.tone || 'educational'}`,
      `Examples of good hooks: "Nobody talks about this...", "I tried X for 30 days..."`,
      `Number 1-5. Be specific to the topic.`,
    ].join('\n'),
  },
];

const scenarioVariations: PromptVariation[] = [
  {
    id: 'scenario-v1',
    weight: 1,
    build: (input) => [
      `Topic: "${input.topic}".`,
      `Create a 3-scene video breakdown for a faceless short.`,
      `Each scene: shot description + on-screen text + voiceover line.`,
      `Total target: 30-60 seconds.`,
      `Tone: ${input.tone || 'educational'}.`,
      `Format: Scene 1: ..., Scene 2: ..., Scene 3: ...`,
    ].join('\n'),
  },
  {
    id: 'scenario-v2',
    weight: 1,
    build: (input) => [
      `Plan a 3-scene faceless YouTube Short about: "${input.topic}"`,
      `For each scene provide:`,
      `1. Visual: What the viewer sees (b-roll, text overlays, graphics)`,
      `2. Audio: Voiceover line (1-2 sentences)`,
      `3. Text: On-screen text/captions`,
      `Target: 30-60 seconds total.`,
      `Tone: ${input.tone || 'educational'}`,
      `Make transitions between scenes feel natural.`,
    ].join('\n'),
  },
];

const variationsByType: Record<string, PromptVariation[]> = {
  script: scriptVariations,
  caption: captionVariations,
  thumbnail: thumbnailVariations,
  hook: hookVariations,
  scenario: scenarioVariations,
};

function buildFromVariations(type: string, input: PromptInput): { prompt: string; variationId: string } {
  const variations = variationsByType[type];
  if (!variations) {
    return { prompt: scriptPrompt(input), variationId: 'default' };
  }
  const chosen = pickVariation(variations);
  recordUsage(type, chosen.id);
  return { prompt: chosen.build(input), variationId: chosen.id };
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

export function getPromptWithVariation(type: string, input: PromptInput): { prompt: string; variationId: string } {
  return buildFromVariations(type, input);
}
