import fastify from 'fastify';

export async function projectsRoutes(fastify: any) {
  fastify.get('/projects', async () => ({ items: [] }));
  fastify.post('/projects', async (request: any, reply: any) => {
    const body = request.body as { title?: string; description?: string };
    return {
      id: 'local-' + Date.now(),
      title: body.title || 'Untitled',
      description: body.description || '',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}

export async function researchRoutes(fastify: any) {
  fastify.get('/research', async () => ({ items: [] }));
  fastify.post('/research', async (request: any, reply: any) => {
    const body = request.body as { query?: string };
    return {
      id: 'local-' + Date.now(),
      query: body.query || '',
      summary: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}

export async function studioRoutes(fastify: any) {
  fastify.post('/studio/generate', async (request: any, reply: any) => {
    const body = request.body as { prompt?: string; model?: string };
    return {
      id: 'local-' + Date.now(),
      content: 'Local generation placeholder. Connect Ollama next.',
      platform: body.model || 'ollama',
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  });
}

export async function libraryRoutes(fastify: any) {
  fastify.get('/library', async () => ({ items: [] }));
}

export async function publishRoutes(fastify: any) {
  fastify.post('/publish', async (request: any, reply: any) => {
    const body = request.body as { postId?: string; platform?: string };
    return {
      success: true,
      postId: body.postId || 'local-' + Date.now(),
      platform: body.platform || 'generic',
      status: 'queued',
    };
  });
}
