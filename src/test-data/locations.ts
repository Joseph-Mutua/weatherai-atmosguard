export interface Location {
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
}

export const locations = [
  { name: 'Nairobi', latitude: -1.2921, longitude: 36.8219 },
  { name: 'London', latitude: 51.5074, longitude: -0.1278 },
  { name: 'New York', latitude: 40.7128, longitude: -74.006 },
  { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
] as const satisfies readonly Location[];

export const nairobi = locations[0];
