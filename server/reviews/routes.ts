import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { ReviewInput, ReviewResult } from '../../shared/reviews.js';
import { reviewInputSchema } from './schemas.js';
import { reviewSubmissions } from './service.js';
import { reviewInputError } from './validation.js';

const routeOptions = {
  schema: {
    body: reviewInputSchema,
  },
};

// 注册评审模块的路由接口。
export function registerReviewRoutes(app: FastifyInstance, db: DatabaseSync) {
  // 处理创建评审请求：先校验参数，再执行评审逻辑并返回结果。
  app.post<{
    Body: ReviewInput;
  }>('/api/reviews', routeOptions, async (request, reply): Promise<ReviewResult | undefined> => {
    const input = request.body;
    const message = reviewInputError(db, input);

    if (message) {
      const body = {
        message,
      };

      return reply.code(400).send(body);
    }

    const result = reviewSubmissions(db, input);

    return result;
  });
}
