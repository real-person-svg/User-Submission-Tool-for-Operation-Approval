import { positiveIdSchema } from '../http/schemas.js';

const reviewItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'version'],
  properties: {
    id: positiveIdSchema,
    version: positiveIdSchema,
  },
};

export const reviewInputSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'operatorId',
    'items',
    'action',
  ],
  properties: {
    operatorId: positiveIdSchema,
    action: {
      type: 'string',
      enum: ['approve', 'reject'],
    },
    reason: {
      type: 'string',
      maxLength: 1000,
    },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      items: reviewItemSchema,
    },
  },
};
