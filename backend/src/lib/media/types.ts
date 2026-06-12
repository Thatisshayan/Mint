export interface Provider {
  generateImage(params: {
    prompt: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg?: number;
    seed?: number;
    model?: string;
  }): Promise<Buffer>;
}
