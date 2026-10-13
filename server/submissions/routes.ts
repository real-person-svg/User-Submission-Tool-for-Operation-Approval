import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';

import type {
  SubmissionDetail,
  SubmissionInput,
  SubmissionListResult,
  SubmissionQuery,
} from '../../shared/submissions.js';

import { listReviewLogs } from '../review-logs/repository.js';

import {
  createSubmission,
  findSubmission,
  listSubmissions,
} from './repository.js';

import {
  submissionIdParamsSchema,
  submissionInputSchema,
  submissionQuerySchema,
} from './schemas.js';

import {
  submissionInputError,
  submissionQueryError,
} from './validation.js';

// 投稿列表路由配置，用于校验查询参数。
const listRouteOptions = {
  schema: {
    querystring: submissionQuerySchema,
  },
};

// 创建投稿路由配置，用于校验请求体。
const createRouteOptions = {
  schema: {
    body: submissionInputSchema,
  },
};

// 投稿详情路由配置，用于校验路径参数。
const detailRouteOptions = {
  schema: {
    params: submissionIdParamsSchema,
  },
};

// 注册投稿列表、创建投稿和投稿详情相关路由。
export function registerSubmissionRoutes(app: FastifyInstance, db: DatabaseSync) {
  // 查询符合筛选条件的投稿列表。
  app.get<{
    Querystring: SubmissionQuery;
  }>(
    '/api/submissions',
    listRouteOptions,
    async (request, reply): Promise<SubmissionListResult | undefined> => {
      const query = request.query;
      // Schema 校验字段类型后，再检查日期真实性和起止顺序。
      const message = submissionQueryError(query);

      if (message) {
        const body = {
          message,
        };

        return reply.code(400).send(body);
      }

      const result = listSubmissions(db, query);

      return result;
    },
  );

  // 校验并创建一条新的投稿记录。
  app.post<{
    Body: SubmissionInput;
  }>('/api/submissions', createRouteOptions, async (request, reply) => {
    const input = request.body;
    const message = submissionInputError(input);

    if (message) {
      const body = {
        message,
      };

      return reply.code(400).send(body);
    }

    const id = createSubmission(db, input);
    const body = {
      id,
      status: 'pending',
    };

    return reply.code(201).send(body);
  });

  // 查询指定投稿及其历史审核日志。
  app.get<{
    Params: {
      id: number;
    };
  }>(
    '/api/submissions/:id',
    detailRouteOptions,
    async (request, reply): Promise<SubmissionDetail | undefined> => {
      const id = request.params.id;
      const submission = findSubmission(db, id);

      if (!submission) {
        const body = {
          message: '投稿不存在。',
        };

        return reply.code(404).send(body);
      }

      // 详情接口同时返回正文和历史日志，供抽屉一次加载。
      const logQuery = {
        submissionId: id,
      };
      const logs = listReviewLogs(db, logQuery);
      const detail = {
        submission,
        logs,
      };

      return detail;
    },
  );
}
