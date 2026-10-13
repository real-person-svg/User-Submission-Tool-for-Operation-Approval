import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { initializeDatabase, openDatabase } from './db.js';
import { registerErrorHandler } from './http/errors.js';
import { registerOperatorRoutes } from './operators/routes.js';
import { registerReviewLogRoutes } from './review-logs/routes.js';
import { registerReviewRoutes } from './reviews/routes.js';
import { registerSubmissionRoutes } from './submissions/routes.js';

interface AppOptions {
  db?: DatabaseSync;
  logger?: boolean;
}

export async function buildApp(options: AppOptions = {}) {
  const logger = options.logger ?? true;

  const app = Fastify({
    logger,
  });

  // 注入的数据库由调用方管理；应用仅关闭自己创建的连接。
  const ownsDatabase = !options.db;
  const db = options.db ?? openDatabase();

  try {
    initializeDatabase(db);
  } catch (error) {
    if (ownsDatabase) db.close();

    throw error;
  }

  app.addHook('onClose', async () => {
    if (ownsDatabase) db.close();
  });

  registerErrorHandler(app);

  app.get('/api/health', async () => {
    const health = {
      status: 'ok',
      service: 'review-desk',
    };

    return health;
  });

  // 各业务路由共用同一连接，审核服务在此连接上管理事务。
  registerOperatorRoutes(app, db);
  registerSubmissionRoutes(app, db);
  registerReviewLogRoutes(app, db);
  registerReviewRoutes(app, db);

  const clientRoot = resolve('dist/client');
  const hasClientBuild = existsSync(clientRoot);

  // 存在前端构建产物时，由同一服务提供页面与 API。
  if (hasClientBuild) {
    const staticOptions = {
      root: clientRoot,
    };

    await app.register(fastifyStatic, staticOptions);
  }

  return app;
}
