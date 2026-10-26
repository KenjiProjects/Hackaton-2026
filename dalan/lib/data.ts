// SAMPLE data: replace with real Naga terminals, routes, and coordinates
export type StopType = "terminal" | "waiting" | "loading";

export const stops: { id: string; name: string; type: StopType; lat: number; lng: number }[] = [
  { id: "s1", name: "Bus Terminal", type: "terminal", lat: 13.62100, lng:  123.20103 },
  { id: "s2", name: "Sample Waiting Area", type: "waiting", lat: 13.6265, lng: 123.1860 },
  { id: "s3", name: "Sample Loading Zone", type: "loading", lat: 13.6150, lng: 123.2000 },
];

export const routes: { id: string; name: string; color: string; path: [number, number][] }[] = [
  {
    id: "r1",
    name: "Sample Route 1",
    color: "#2563eb",
    path: [[13.62323, 123.18508], [13.62196, 123.1938], [13.61952, 123.19371],[13.62113, 123.21407]],
  },
  {
    id: "r2",
    name: "Sample Route 2",
    color: "#dc2626",
    path: [[13.6218, 123.1948], [13.6180, 123.1980], [13.6150, 123.2000]],
  },
];

// Edit these values to update the distance-based fare calculation.
export const fareCurrency = "PHP";
export const fareRules = {
  baseFare: 15,
  includedDistanceKm: 3,
  additionalFarePerStartedKm: 0.5,
};

// OSRM provides driving-road distances; replace this URL to use another router.
export const routingServiceUrl = "https://router.project-osrm.org";