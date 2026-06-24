export interface TextGenOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenResult {
  output: string;
  model: string;
  provider: string;
}

export interface ImageGenOptions {
  prompt: string;
  filename?: string;
  workflow?: Record<string, unknown>;
}

export interface ImageGenResult {
  url: string;
  provider: string;
}

export interface AIProvider {
  generateText(options: TextGenOptions): Promise<TextGenResult>;
}
