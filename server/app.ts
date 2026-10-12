import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export async function buildApp() {
  const app = Fastify({ logger: true });
  // 仅用于确认服务正常启动，不包含业务接口。
  app.get('/api/health', async () => ({ status: 'ok', service: 'review-desk' }));

  const clientRoot = resolve('dist/client');
  if (existsSync(clientRoot)) {
    await app.register(fastifyStatic, { root: clientRoot });
  }
  return app;
}
