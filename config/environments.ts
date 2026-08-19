export const DEFAULT_WEATHER_AI_BASE_URL = 'https://api.weather-ai.co';
export const DEFAULT_REFERENCE_WEATHER_BASE_URL = 'https://api.open-meteo.com';

export type WeatherAiPlan = 'free' | 'pro' | 'scale';

function readPlan(value: string | undefined): WeatherAiPlan {
  const plan = value?.toLowerCase() ?? 'free';
  if (plan === 'free' || plan === 'pro' || plan === 'scale') return plan;
  throw new Error(`Unsupported WEATHER_AI_PLAN "${value}". Expected free, pro, or scale.`);
}

export const environment = {
  weatherAiBaseUrl: process.env.WEATHER_AI_BASE_URL ?? DEFAULT_WEATHER_AI_BASE_URL,
  referenceWeatherBaseUrl:
    process.env.REFERENCE_WEATHER_BASE_URL ?? DEFAULT_REFERENCE_WEATHER_BASE_URL,
  plan: readPlan(process.env.WEATHER_AI_PLAN),
} as const;

export function requireWeatherAiApiKey(): string {
  const apiKey = process.env.WEATHER_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'WEATHER_AI_API_KEY is required. Copy .env.example to .env and provide a valid key.',
    );
  }
  return apiKey;
}
