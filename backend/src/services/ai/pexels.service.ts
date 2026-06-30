const PEXELS_API = 'https://api.pexels.com';

export interface StockVideoOptions {
  query: string;
  perPage?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface StockVideoResult {
  videos: Array<{ url: string; thumbnail: string; duration: number; width: number; height: number }>;
}

export async function searchStockVideos({ query, perPage = 5, minDuration = 5, maxDuration = 60 }: StockVideoOptions): Promise<StockVideoResult> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    // Return placeholder when no API key configured
    return { videos: [] };
  }

  const url = new URL('/videos/search', PEXELS_API);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('min_duration', String(minDuration));
  url.searchParams.set('max_duration', String(maxDuration));

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    if (res.status === 429) {
      // Surface 429 so the UI can show "Pexels rate-limited" instead of "no results".
      const retryAfter = res.headers.get('retry-after') ?? 'unknown';
      throw new Error(`Pexels rate-limited (retry after ${retryAfter}s)`);
    }
    throw new Error(`Pexels API failed (${res.status})`);
  }

  const data = (await res.json()) as {
    videos?: Array<{
      id: number;
      duration: number;
      width: number;
      height: number;
      image: string;
      video_files?: Array<{ link: string; quality: string; width: number; height: number }>;
    }>;
  };

  return {
    videos: (data.videos || []).map(v => ({
      url: v.video_files?.find(f => f.quality === 'hd')?.link || v.video_files?.[0]?.link || '',
      thumbnail: v.image,
      duration: v.duration,
      width: v.width,
      height: v.height,
    })).filter(v => v.url),
  };
}
