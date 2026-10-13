import type { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type {
  SubmissionDetail,
  SubmissionInput,
  SubmissionListResult,
  SubmissionQuery,
} from '../../shared/submissions.js';
import { listReviewLogs } from '../review-logs/repository.js';
import { createSubmission, findSubmission, listSubmissions } from './repository.js';
import {
  submissionIdParamsSchema,
  submissionInputSchema,
  submissionQuerySchema,
} from './schemas.js';
import { submissionInputError, submissionQueryError } from './validation.js';

const listRouteOptions = {
  schema: {
    querystring: submissionQuerySchema,
  },
};
const createRouteOptions = {
  schema: {
    body: submissionInputSchema,
  },
};
const detailRouteOptions = {
  schema: {
    params: submissionIdParamsSchema,
  },
};

export function registerSubmissionRoutes(app: FastifyInstance, db: DatabaseSync) {
  app.get<{
    Querystring: SubmissionQuery;
  }>(
    '/api/submissions',
    listRouteOptions,
    async (request, reply): Promise<SubmissionListResult | undefined> => {
      const query = request.query;
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
