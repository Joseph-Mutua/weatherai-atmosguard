export const errorSchema = {
  $id: 'https://weather-ai.co/schemas/error-response.json',
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string', minLength: 1 },
    code: { type: 'string', minLength: 1 },
  },
} as const;
