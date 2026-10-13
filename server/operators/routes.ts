import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import { listOperators } from './repository.js';

export function registerOperatorRoutes(app: FastifyInstance, db: DatabaseSync) {
  app.get('/api/operators', async () => listOperators(db));
}
