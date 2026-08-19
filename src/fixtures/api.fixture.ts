import { test as base, expect } from '@playwright/test';

import { WeatherClient } from '../clients/weather.client.js';
import { requireWeatherAiApiKey } from '../../config/environments.js';

interface ApiFixtures {
  readonly weatherClient: WeatherClient;
}

export const test = base.extend<ApiFixtures>({
  weatherClient: async ({ request }, use) => {
    const weatherClient = new WeatherClient(request, requireWeatherAiApiKey());
    await use(weatherClient);
  },
});

export { expect };
