import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { validateGeoMetadataHeaders } from '../../src/validators/geo-metadata.validator.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Weather geolocation endpoint @functional', () => {
  test('honors explicit coordinate overrides without depending on runner IP', async ({
    weatherClient,
  }, testInfo) => {
    const result = await test.step('Request weather-geo with deterministic coordinates', () =>
      weatherClient.getWeatherGeo({
        lat: nairobi.latitude,
        lon: nairobi.longitude,
        days: 1,
        ai: false,
        units: 'metric',
      }));

    await test.step('Validate the explicit coordinates and weather response', async () => {
      const weather = await expectSuccessfulWeather(result, {
        latitude: nairobi.latitude,
        longitude: nairobi.longitude,
        days: 1,
        units: 'metric',
        aiDisabled: true,
      });

      expect(weather.daily).toHaveLength(1);
    });

    const metadata =
      await test.step('Validate documented geo metadata headers when exposed', () => {
        const metadata = validateGeoMetadataHeaders(result.response.headers());
        testInfo.annotations.push({
          type: 'geo-metadata-headers',
          description: metadata.exposed ? 'complete header set exposed' : 'header set absent',
        });
        return metadata;
      });

    if (metadata.exposed) {
      await testInfo.attach('geo-metadata-headers.json', {
        body: Buffer.from(JSON.stringify(metadata, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
