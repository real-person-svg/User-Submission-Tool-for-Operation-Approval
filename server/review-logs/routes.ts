import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { ReviewLog, ReviewLogQuery } from '../../shared/review-logs.js';
import { positiveIdSchema } from '../http/schemas.js';
import { listReviewLogs } from './repository.js';

const reviewLogQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    submissionId: positiveIdSchema,
    operatorId: positiveIdSchema,
  },
};

const routeOptions = {
  schema: {
    querystring: reviewLogQuerySchema,
  },
};

export function registerReviewLogRoutes(app: FastifyInstance, db: DatabaseSync) {
  app.get<{
    Querystring: ReviewLogQuery;
  }>('/api/review-logs', routeOptions, async (request): Promise<ReviewLog[]> => {
    const query = request.query;
    const logs = listReviewLogs(db, query);

    return logs;
  });
}
