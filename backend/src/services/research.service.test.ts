import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./db.js', () => ({
  prisma: {
    researchReport: {
      create: vi.fn(),
    },
    contentProject: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from './db.js';
import { createResearch } from './research.service.js';

describe('createResearch', () => {
  beforeEach(() => {
    vi.mocked(prisma.researchReport.create).mockReset();
  });

  it('persists the caller-supplied source instead of hardcoding "ai"', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', {
      query: 'test query',
      summary: 'test summary',
      source: 'gpt-researcher',
    });

    expect(prisma.researchReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: 'gpt-researcher' }),
      }),
    );
  });

  it('serializes citations as JSON when provided', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', {
      query: 'test query',
      summary: 'test summary',
      source: 'gpt-researcher',
      citations: [{ title: 'Example', url: 'https://example.com' }],
    });

    const call = vi.mocked(prisma.researchReport.create).mock.calls[0][0] as any;
    expect(JSON.parse(call.data.citations)).toEqual([
      { title: 'Example', url: 'https://example.com' },
    ]);
  });

  it('defaults source to "ai" when not supplied, for backward compatibility', async () => {
    vi.mocked(prisma.researchReport.create).mockResolvedValue({ id: 'r1' } as any);

    await createResearch('user-1', { query: 'q', summary: 's' });

    expect(prisma.researchReport.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ source: 'ai' }) }),
    );
  });
});
