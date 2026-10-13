import { positiveIdSchema, requiredTextSchema } from '../http/schemas.js';

const titleSchema = requiredTextSchema(200);
const authorNameSchema = requiredTextSchema(80);
const categorySchema = requiredTextSchema(80);
const contentSchema = requiredTextSchema(50000);

export const submissionIdParamsSchema = {
  type: 'object',
  properties: {
    id: positiveIdSchema,
  },
  required: ['id'],
};

// 由 Fastify 在进入路由前校验查询参数，并补齐默认筛选和分页值。
export const submissionQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: [
        'pending',
        'approved',
        'rejected',
        'all',
      ],
      default: 'pending',
    },
    keyword: {
      type: 'string',
      maxLength: 200,
      default: '',
    },
    startDate: {
      type: 'string',
      default: '',
    },
    endDate: {
      type: 'string',
      default: '',
    },
    page: {
      ...positiveIdSchema,
      default: 1,
    },
    pageSize: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
    },
  },
};

export const submissionInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'author_name',
    'category',
    'content',
    'submitted_at',
  ],
  properties: {
    title: titleSchema,
    author_name: authorNameSchema,
    category: categorySchema,
    content: contentSchema,
    submitted_at: {
      type: 'string',
      format: 'date-time',
    },
  },
};
