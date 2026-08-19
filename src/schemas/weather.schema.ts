export const weatherSchema = {
  $id: 'https://weather-ai.co/schemas/weather-response.json',
  type: 'object',
  required: ['lat', 'lon', 'units', 'days', 'current', 'daily', 'hourly', 'ai_summary'],
  properties: {
    lat: { type: 'number', minimum: -90, maximum: 90 },
    lon: { type: 'number', minimum: -180, maximum: 180 },
    units: { enum: ['metric', 'imperial'] },
    days: { type: 'integer', minimum: 1 },
    current: {
      type: 'object',
      required: [
        'time',
        'interval',
        'temperature',
        'windspeed',
        'winddirection',
        'is_day',
        'weathercode',
      ],
      properties: {
        time: { type: 'string', minLength: 1 },
        interval: { type: 'number', minimum: 0 },
        temperature: { type: 'number' },
        windspeed: { type: 'number', minimum: 0 },
        winddirection: { type: 'number' },
        is_day: { type: 'integer', enum: [0, 1] },
        weathercode: { type: 'number' },
        humidity: { type: 'number', minimum: 0, maximum: 100 },
        pressure: { type: 'number', exclusiveMinimum: 0 },
        cloudcover: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
    daily: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['date', 'temp_max', 'temp_min', 'precipitation', 'weathercode'],
        properties: {
          date: { type: 'string', minLength: 1 },
          temp_max: { type: 'number' },
          temp_min: { type: 'number' },
          precipitation: { type: 'number', minimum: 0 },
          weathercode: { type: 'number' },
          precipitation_probability: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
    },
    hourly: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['time', 'temp', 'precipitation', 'weathercode'],
        properties: {
          time: { type: 'string', minLength: 1 },
          temp: { type: 'number' },
          precipitation: { type: 'number', minimum: 0 },
          weathercode: { type: 'number' },
          humidity: { type: 'number', minimum: 0, maximum: 100 },
          windspeed: { type: 'number', minimum: 0 },
          precipitation_probability: { type: 'number', minimum: 0, maximum: 100 },
        },
      },
    },
    // The docs do not guarantee an AI summary shape; it is null when ai=false.
    ai_summary: {},
  },
} as const;

export const usageSchema = {
  $id: 'https://weather-ai.co/schemas/usage-response.json',
  type: 'object',
  required: ['plan', 'used', 'limit', 'remaining', 'unlimited'],
  properties: {
    plan: { type: 'string', minLength: 1 },
    used: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 0 },
    remaining: { type: 'integer', minimum: 0 },
    unlimited: { type: 'boolean' },
  },
} as const;
