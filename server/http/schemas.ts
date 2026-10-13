export const positiveIdSchema = {
  type: 'integer',
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
};

export function requiredTextSchema(maxLength: number) {
  const schema = {
    type: 'string',
    minLength: 1,
    maxLength,
  };

  return schema;
}
