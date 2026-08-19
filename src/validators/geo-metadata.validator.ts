const GEO_HEADER_NAMES = ['x-country', 'x-region', 'x-city'] as const;

export interface GeoMetadataObservation {
  readonly exposed: boolean;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
}

export function validateGeoMetadataHeaders(
  headers: Readonly<Record<string, string>>,
): GeoMetadataObservation {
  const values = GEO_HEADER_NAMES.map((name) => headers[name]);
  const exposedCount = values.filter((value) => value !== undefined).length;

  if (exposedCount === 0) return { exposed: false };
  if (exposedCount !== GEO_HEADER_NAMES.length) {
    throw new Error('WeatherAI returned an incomplete geo-metadata header set.');
  }

  const [country, region, city] = values;
  if (country === undefined || region === undefined || city === undefined) {
    throw new Error('Geo-metadata header validation invariant failed.');
  }
  if ([country, region, city].some((value) => value.trim().length === 0)) {
    throw new Error('WeatherAI returned an empty geo-metadata header value.');
  }

  return { exposed: true, country, region, city };
}
